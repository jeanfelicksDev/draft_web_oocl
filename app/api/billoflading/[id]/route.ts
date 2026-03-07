import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin as checkAdmin } from "@/lib/auth-utils";


export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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

        // Convert empty strings to null
        const blData = Object.fromEntries(
            Object.entries(blRawData).map(([key, value]) => [key, value === "" ? null : value])
        );

        // We update the BL and replace all containers
        const updatedBL = await prisma.billOfLading.update({
            where: { id },
            data: {
                ...(blData as any),
                containers: {
                    deleteMany: {}, // Remove old containers
                    create: safeContainers.map((c: any) => ({
                        containerNum: c.containerNum,
                        typeTc: c.typeTc,
                        sealNum: c.sealNum,
                        count: Number(c.count),
                        packageType: c.packageType,
                        grossWeight: Number(c.grossWeight),
                        netWeight: Number(c.netWeight),
                        volume: Number(c.volume),
                    })),
                }
            },
            include: {
                containers: true
            }
        });

        return NextResponse.json(updatedBL);
    } catch (error) {
        console.error("Error updating Bill of Lading:", error);
        return NextResponse.json({ error: "Failed to update Bill of Lading" }, { status: 500 });
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

