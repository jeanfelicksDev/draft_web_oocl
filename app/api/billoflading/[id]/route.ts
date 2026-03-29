import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin as checkAdmin, hasPermission } from "@/lib/auth-utils";


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

        // Validate bookingNumber: exactly 10 digits, no letters
        const bookingNumberValue = data.bookingNumber;
        if (!bookingNumberValue || !/^[0-9]{10}$/.test(bookingNumberValue)) {
            return NextResponse.json(
                { error: "Le numéro de booking doit contenir exactement 10 chiffres (aucune lettre autorisée)." },
                { status: 400 }
            );
        }

        const { containers, ...blRawData } = data;
        const safeContainers = Array.isArray(containers) ? containers : [];

        // Fetch existing BL to check status
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

        // Only owner or admin can update
        const userIsAdmin = await checkAdmin();
        if (!userIsAdmin && existingBL.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // VALID FIELDS for BillOfLading model
        const validFields = [
            'bookingNumber', 'contractNumber', 'saveStatus', 
            'portCountryText', 'portCityText', 'typeReleasedId', 
            'shipperId', 'consigneeId', 'notifyId', 'alsoNotifyId', 
            'forwarderId', 'freightBuyerId', 'goodsId',
            'vesselId', 'voyageId', 'descriptionGoods', 'hsCode'
        ];

        let updateData: any = {
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

        // Filter and add only valid fields
        for (const key of validFields) {
            if (blRawData[key] !== undefined) {
                updateData[key] = blRawData[key] === "" ? null : blRawData[key];
            }
        }

        // CORRECTION LOGIC
        const isTransitioningToValidated = existingBL.saveStatus !== "VALIDATED" && blRawData.saveStatus === "VALIDATED";
        const isCorrection = existingBL.saveStatus === "VALIDATED" && blRawData.saveStatus === "VALIDATED";

        // Increment count if it's a correction
        if (isCorrection) {
            updateData.correctionCount = (Number(existingBL?.correctionCount) || 0) + 1;
        }

        let updatedBL = await prisma.billOfLading.update({
            where: { id },
            data: updateData,
            include: {
                containers: true
            }
        });

        // If it was the FIRST validation, take the baseline snapshot NOW
        if (isTransitioningToValidated || (blRawData.saveStatus === "VALIDATED" && !(existingBL as any).originalData)) {
            const { createBLSnapshot } = await import("@/lib/snapshotUtils");
            const snapshot = await createBLSnapshot(updatedBL.id);
            updatedBL = await prisma.billOfLading.update({
                where: { id: updatedBL.id },
                data: { originalData: snapshot as any },
                include: { containers: true }
            });
        }

        return NextResponse.json(updatedBL);
    } catch (error: any) {
        console.error("DEBUG BL UPDATE ERROR:", error);
        return NextResponse.json({ 
            error: "Failed to update Bill of Lading", 
            details: error.message,
            stack: error.stack
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

        if (!await hasPermission("BL_DELETE")) {
            return NextResponse.json({ error: "Permission refusée : BL_DELETE requis" }, { status: 403 });
        }

        const userIsAdmin = await checkAdmin();

        // Find the BL first to verify ownership
        const bl = await prisma.billOfLading.findUnique({ where: { id } });
        if (!bl) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Only owner or admin can delete
        if (!userIsAdmin && bl.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Containers are deleted automatically via cascade (onDelete: Cascade in schema)
        await prisma.billOfLading.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting Bill of Lading:", error);
        return NextResponse.json({ error: "Failed to delete Bill of Lading" }, { status: 500 });
    }
}

