import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin, hasPermission } from "@/lib/auth-utils";

export async function GET(request: Request) {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userIsAdmin = await isAdmin();

    const { searchParams } = new URL(request.url);
    const bookingNumber = searchParams.get("bookingNumber");
    const filterUserId = searchParams.get("userId");

    if (!bookingNumber) {
        try {
            let whereClause: any = userIsAdmin ? {} : { userId };
            
            // If admin wants to filter by a specific user
            if (userIsAdmin && filterUserId) {
                whereClause = { userId: filterUserId };
            }

            const allBLs = await prisma.billOfLading.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: { user: true }, // Include user info for admin view
                take: 100 // Increased limit
            });
            return NextResponse.json(allBLs);
        } catch (error) {
            return NextResponse.json({ error: "Failed to fetch list" }, { status: 500 });
        }
    }


    try {
        const bl = await prisma.billOfLading.findFirst({
            where: userIsAdmin ? { bookingNumber } : { bookingNumber, userId },
            include: {
                containers: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!bl) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(bl);
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

        // VALID FIELDS for BillOfLading model
        const validFields = [
            'bookingNumber', 'contractNumber', 'saveStatus', 
            'portCountryText', 'portCityText', 'typeReleasedId', 
            'shipperId', 'consigneeId', 'notifyId', 'alsoNotifyId', 
            'forwarderId', 'freightBuyerId', 'goodsId',
            'vesselId', 'voyageId', 'descriptionGoods', 'hsCode'
        ];

        // Convert empty strings to null AND filter out unknown fields
        const blData: any = {};
        for (const key of validFields) {
            if (blRawData[key] !== undefined) {
                blData[key] = blRawData[key] === "" ? null : blRawData[key];
            }
        }

        let newBL = await prisma.billOfLading.create({
            data: {
                ...(blData as any),
                userId,
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
            },
            include: {
                containers: true
            }
        });

        // If validated on creation, snapshot immediately as draft 0
        if (newBL.saveStatus === "VALIDATED") {
            const { createBLSnapshot } = await import("@/lib/snapshotUtils");
            const snapshot = await createBLSnapshot(newBL.id);
            newBL = await prisma.billOfLading.update({
                where: { id: newBL.id },
                data: { originalData: snapshot as any },
                include: { containers: true }
            });
        }

        return NextResponse.json(newBL, { status: 201 });
    } catch (error: any) {
        console.error("Error creating Bill of Lading:", error);
        return NextResponse.json({ 
            error: "Failed to create Bill of Lading", 
            details: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
}
