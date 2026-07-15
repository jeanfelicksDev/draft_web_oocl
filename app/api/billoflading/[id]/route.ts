import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin as checkAdmin, hasPermission } from "@/lib/auth-utils";

// Helper: build Prisma relation connect object
function connectOrNull(id: string | null | undefined) {
    return id && id !== "" ? { connect: { id } } : undefined;
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        if (!await hasPermission("BL_WRITE")) {
            return NextResponse.json({ error: "Permission refusée : BL_WRITE requis" }, { status: 403 });
        }

        const { id } = await params;
        const data = await request.json();

        // Validate bookingNumber
        const bookingNumberValue = data.bookingNumber;
        if (!bookingNumberValue || !/^[0-9]{10}$/.test(bookingNumberValue)) {
            return NextResponse.json(
                { error: "Le numéro de booking doit contenir exactement 10 chiffres (aucune lettre autorisée)." },
                { status: 400 }
            );
        }

        const { containers, ...d } = data;
        const safeContainers = Array.isArray(containers) ? containers : [];

        // Fetch existing BL
        const existingBL = await prisma.billOfLading.findUnique({
            where: { id },
            include: {
                containers: true,
                shipper: true,
                consignee: true,
                notify: true,
                alsoNotify: true,
                forwarder: true,
                freightBuyer: true,
                goods: true,
                typeReleased: true,
            }
        });

        if (!existingBL) {
            return NextResponse.json({ error: "Bill of Lading not found" }, { status: 404 });
        }

        const userIsAdmin = await checkAdmin();
        if (!userIsAdmin && existingBL.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Vérification doublon global sur mise à jour
        const duplicateCheck = await prisma.billOfLading.findFirst({
            where: {
                bookingNumber: bookingNumberValue,
                id: { not: id }
            }
        });
        if (duplicateCheck) {
            return NextResponse.json(
                { error: `Le numéro de booking "${bookingNumberValue}" est déjà utilisé par un autre spécimen. Chaque numéro de booking doit être unique.` },
                { status: 409 }
            );
        }

        // CORRECTION LOGIC
        const isTransitioningToValidated = existingBL.saveStatus !== "VALIDATED" && d.saveStatus === "VALIDATED";
        const isCorrection = existingBL.saveStatus === "VALIDATED" && d.saveStatus === "VALIDATED";

        // Build update payload using nested connect (works with all Prisma client versions)
        const updateData: any = {
            bookingNumber: d.bookingNumber,
            contractNumber: d.contractNumber || "",
            saveStatus: d.saveStatus || existingBL.saveStatus,
            portCountryText: d.portCountryText || null,
            portCityText: d.portCityText || null,
            containers: {
                deleteMany: {},
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

        if (isCorrection) {
            updateData.correctionCount = (Number(existingBL.correctionCount) || 0) + 1;
        }

        // Relations via connect
        const typeReleasedConn = connectOrNull(d.typeReleasedId);
        if (typeReleasedConn) updateData.typeReleased = typeReleasedConn;

        const shipperConn = connectOrNull(d.shipperId);
        if (shipperConn) updateData.shipper = shipperConn;

        const consigneeConn = connectOrNull(d.consigneeId);
        if (consigneeConn) updateData.consignee = consigneeConn;

        const notifyConn = connectOrNull(d.notifyId);
        if (notifyConn) updateData.notify = notifyConn;

        const alsoNotifyConn = connectOrNull(d.alsoNotifyId);
        if (alsoNotifyConn) updateData.alsoNotify = alsoNotifyConn;

        const forwarderConn = connectOrNull(d.forwarderId);
        if (forwarderConn) updateData.forwarder = forwarderConn;

        const freightBuyerConn = connectOrNull(d.freightBuyerId);
        if (freightBuyerConn) updateData.freightBuyer = freightBuyerConn;

        const goodsConn = connectOrNull(d.goodsId);
        if (goodsConn) updateData.goods = goodsConn;

        const vesselConn = connectOrNull(d.vesselId);
        if (vesselConn) updateData.vessel = vesselConn;

        const voyageConn = connectOrNull(d.voyageId);
        if (voyageConn) updateData.voyage = voyageConn;

        let updatedBL = await prisma.billOfLading.update({
            where: { id },
            data: updateData,
            include: { containers: true }
        });

        // If first validation, take baseline snapshot
        if (isTransitioningToValidated || (d.saveStatus === "VALIDATED" && !(existingBL as any).originalData)) {
            const { createBLSnapshot } = await import("@/lib/snapshotUtils");
            const snapshot = await createBLSnapshot(updatedBL.id);
            updatedBL = await prisma.billOfLading.update({
                where: { id: updatedBL.id },
                data: { originalData: JSON.stringify(snapshot) },
                include: { containers: true }
            });
        }

        return NextResponse.json(updatedBL);
    } catch (error: any) {
        console.error("DEBUG BL UPDATE ERROR:", error);
        return NextResponse.json({
            error: "Failed to update Bill of Lading",
            details: error.message,
        }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        if (!await hasPermission("BL_DELETE") && !await hasPermission("BL_WRITE")) {
            return NextResponse.json({ error: "Permission refusée : BL_WRITE ou BL_DELETE requis" }, { status: 403 });
        }

        const userIsAdmin = await checkAdmin();

        const bl = await prisma.billOfLading.findUnique({ where: { id } });
        if (!bl) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (!userIsAdmin && bl.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.billOfLading.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting Bill of Lading:", error);
        return NextResponse.json({ error: "Failed to delete Bill of Lading" }, { status: 500 });
    }
}
