import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin, hasPermission } from "@/lib/auth-utils";

/**
 * POST /api/billoflading/split
 * Body: {
 *   originalBlId: string,
 *   splits: Array<{ containers: Container[] }>   // one entry per target BL
 * }
 *
 * Creates N new BLs (suffixed with " (1)", " (2)", …) inheriting all data from
 * the original. The original BL is then deleted.
 */
export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        if (!await hasPermission("BL_WRITE")) {
            return NextResponse.json({ error: "Permission refusée : BL_WRITE requis" }, { status: 403 });
        }

        const body = await request.json();
        const { originalBlId, splits } = body;

        if (!originalBlId || !Array.isArray(splits) || splits.length < 2) {
            return NextResponse.json({ error: "Données invalides. Il faut au moins 2 splits." }, { status: 400 });
        }

        // Fetch original BL
        const original = await prisma.billOfLading.findUnique({
            where: { id: originalBlId },
            include: { containers: true },
        });

        if (!original) {
            return NextResponse.json({ error: "BL source introuvable." }, { status: 404 });
        }

        const userIsAdmin = await isAdmin();
        if (!userIsAdmin && original.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Helper: connect a relation if id is present
        const connectOrNull = (id: string | null | undefined) =>
            id && id !== "" ? { connect: { id } } : undefined;

        const createdBLs: any[] = [];

        // Create each split BL
        for (let i = 0; i < splits.length; i++) {
            const splitIndex = i + 1;
            const splitBookingNumber = `${original.bookingNumber} (${splitIndex})`;
            const splitContainers: any[] = splits[i].containers || [];

            const createData: any = {
                bookingNumber: splitBookingNumber,
                contractNumber: original.contractNumber || "",
                saveStatus: "DRAFT",
                portCountryText: original.portCountryText || null,
                portCityText: original.portCityText || null,
                user: { connect: { id: userId } },
                containers: {
                    create: splitContainers.map((c: any) => ({
                        containerNum: c.containerNum,
                        typeTc: c.typeTc || null,
                        sealNum: c.sealNum || null,
                        count: Number(c.count) || 0,
                        packageType: c.packageType || null,
                        grossWeight: Number(c.grossWeight) || 0,
                        netWeight: Number(c.netWeight) || 0,
                        volume: Number(c.volume) || 0,
                    })),
                },
            };

            // Relations
            const typeReleasedConn = connectOrNull(original.typeReleasedId);
            if (typeReleasedConn) createData.typeReleased = typeReleasedConn;

            const shipperConn = connectOrNull(original.shipperId);
            if (shipperConn) createData.shipper = shipperConn;

            const consigneeConn = connectOrNull(original.consigneeId);
            if (consigneeConn) createData.consignee = consigneeConn;

            const notifyConn = connectOrNull(original.notifyId);
            if (notifyConn) createData.notify = notifyConn;

            const alsoNotifyConn = connectOrNull(original.alsoNotifyId);
            if (alsoNotifyConn) createData.alsoNotify = alsoNotifyConn;

            const forwarderConn = connectOrNull(original.forwarderId);
            if (forwarderConn) createData.forwarder = forwarderConn;

            const freightBuyerConn = connectOrNull(original.freightBuyerId);
            if (freightBuyerConn) createData.freightBuyer = freightBuyerConn;

            const goodsConn = connectOrNull(original.goodsId);
            if (goodsConn) createData.goods = goodsConn;

            const vesselConn = connectOrNull(original.vesselId);
            if (vesselConn) createData.vessel = vesselConn;

            const voyageConn = connectOrNull(original.voyageId);
            if (voyageConn) createData.voyage = voyageConn;

            const newBL = await prisma.billOfLading.create({
                data: createData,
                include: { containers: true },
            });

            createdBLs.push(newBL);
        }

        // Delete the original BL (cascades to its containers)
        await prisma.billOfLading.delete({ where: { id: originalBlId } });

        return NextResponse.json({ success: true, splits: createdBLs }, { status: 201 });
    } catch (error: any) {
        console.error("Error splitting BL:", error);
        return NextResponse.json(
            { error: "Failed to split Bill of Lading", details: error.message },
            { status: 500 }
        );
    }
}
