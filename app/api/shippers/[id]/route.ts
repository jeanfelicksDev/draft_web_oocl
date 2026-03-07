import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const data = await request.json();

        // Check ownership
        const existing = await prisma.shipper.findFirst({ where: { id, userId } });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const updatedShipper = await prisma.shipper.update({
            where: { id },
            data: {
                name: data.name,
                address: data.address,
                country: data.country,
                city: data.city,
                phone: data.phone,
                email: data.email,
                vat: data.vat || null,
                eori: data.eori || null,
                bin: data.bin || null,
                usci: data.usci || null,
            },
        });

        return NextResponse.json(updatedShipper, { status: 200 });
    } catch (error) {
        console.error("Error updating shipper:", error);
        return NextResponse.json({ error: "Failed to update shipper" }, { status: 500 });
    }
}


export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        // Check ownership
        const existing = await prisma.shipper.findFirst({ where: { id, userId } });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await prisma.shipper.delete({ where: { id } });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error deleting:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
