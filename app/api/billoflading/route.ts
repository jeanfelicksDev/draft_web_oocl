import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin, hasPermission } from "@/lib/auth-utils";

// Helper: build Prisma relation connect/disconnect object
function connectOrNull(id: string | null | undefined) {
    return id && id !== "" ? { connect: { id } } : undefined;
}

export async function GET(request: Request) {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userIsAdmin = await isAdmin();

    const { searchParams } = new URL(request.url);
    const bookingNumber = searchParams.get("bookingNumber");

    if (!bookingNumber) {
        try {
            const allBLs = await prisma.billOfLading.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: { user: true },
                take: 100
            });
            return NextResponse.json(allBLs);
        } catch (error) {
            return NextResponse.json({ error: "Failed to fetch list" }, { status: 500 });
        }
    }

    try {
        const bl = await prisma.billOfLading.findFirst({
            where: { bookingNumber },
            include: { containers: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!bl) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (userIsAdmin || bl.userId === userId) {
            return NextResponse.json(bl);
        }

        // Safe minimal payload to indicate existence without leaking data
        return NextResponse.json({
            id: bl.id,
            bookingNumber: bl.bookingNumber,
            userId: bl.userId,
            saveStatus: bl.saveStatus,
            isDuplicateOfOtherUser: true
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        if (!await hasPermission("BL_WRITE")) {
            return NextResponse.json({ error: "Permission refusée : BL_WRITE requis" }, { status: 403 });
        }

        const data = await request.json();

        // Validate bookingNumber: exactly 10 digits
        const bookingNumberValue = data.bookingNumber;
        if (!bookingNumberValue || !/^[0-9]{10}$/.test(bookingNumberValue)) {
            return NextResponse.json(
                { error: "Le numéro de booking doit contenir exactement 10 chiffres (aucune lettre autorisée)." },
                { status: 400 }
            );
        }

        // Vérification doublon global : le numéro de booking doit être unique toutes comptes confondus
        const existing = await prisma.billOfLading.findFirst({
            where: { bookingNumber: bookingNumberValue }
        });
        if (existing) {
            return NextResponse.json(
                { error: `Le numéro de booking "${bookingNumberValue}" est déjà utilisé. Chaque numéro de booking doit être unique.` },
                { status: 409 }
            );
        }

        const { containers, ...d } = data;
        const safeContainers = Array.isArray(containers) ? containers : [];

        // Build Prisma create payload using nested connect (works with all Prisma client versions)
        const createData: any = {
            bookingNumber: d.bookingNumber,
            contractNumber: d.contractNumber || "",
            saveStatus: d.saveStatus || "DRAFT",
            portCountryText: d.portCountryText || null,
            portCityText: d.portCityText || null,
            user: { connect: { id: userId } },
            containers: {
                create: safeContainers.map((c: any) => ({
                    containerNum: c.containerNum,
                    typeTc: c.typeTc,
                    sealNum: c.sealNum,
                    count: Number(c.count) || 0,
                    packageType: c.packageType,
                    grossWeight: Number(c.grossWeight) || 0,
                    netWeight: Number(c.netWeight) || 0,
                    volume: Number(c.volume) || 0,
                })),
            }
        };

        // Relations via connect (avoids scalar FK issues with cached Prisma client)
        const typeReleasedConn = connectOrNull(d.typeReleasedId);
        if (typeReleasedConn) createData.typeReleased = typeReleasedConn;

        const shipperConn = connectOrNull(d.shipperId);
        if (shipperConn) createData.shipper = shipperConn;

        const consigneeConn = connectOrNull(d.consigneeId);
        if (consigneeConn) createData.consignee = consigneeConn;

        const notifyConn = connectOrNull(d.notifyId);
        if (notifyConn) createData.notify = notifyConn;

        const alsoNotifyConn = connectOrNull(d.alsoNotifyId);
        if (alsoNotifyConn) createData.alsoNotify = alsoNotifyConn;

        const forwarderConn = connectOrNull(d.forwarderId);
        if (forwarderConn) createData.forwarder = forwarderConn;

        const freightBuyerConn = connectOrNull(d.freightBuyerId);
        if (freightBuyerConn) createData.freightBuyer = freightBuyerConn;

        const goodsConn = connectOrNull(d.goodsId);
        if (goodsConn) createData.goods = goodsConn;

        const vesselConn = connectOrNull(d.vesselId);
        if (vesselConn) createData.vessel = vesselConn;

        const voyageConn = connectOrNull(d.voyageId);
        if (voyageConn) createData.voyage = voyageConn;

        let newBL = await prisma.billOfLading.create({
            data: createData,
            include: { containers: true }
        });

        // If validated on creation, snapshot immediately
        if (newBL.saveStatus === "VALIDATED") {
            const { createBLSnapshot } = await import("@/lib/snapshotUtils");
            const snapshot = await createBLSnapshot(newBL.id);
            newBL = await prisma.billOfLading.update({
                where: { id: newBL.id },
                data: { originalData: JSON.stringify(snapshot) },
                include: { containers: true }
            });
        }

        return NextResponse.json(newBL, { status: 201 });
    } catch (error: any) {
        console.error("Error creating Bill of Lading:", error);
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Un spécimen avec ce numéro de booking existe déjà." },
                { status: 409 }
            );
        }
        return NextResponse.json({
            error: "Failed to create Bill of Lading",
            details: error.message,
        }, { status: 500 });
    }
}
