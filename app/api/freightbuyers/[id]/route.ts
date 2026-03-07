import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();

        const updated = await prisma.freightBuyer.update({
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

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error updating freightBuyer:", error);
        return NextResponse.json({ error: "Failed to update freightBuyer" }, { status: 500 });
    }
}


export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.freightBuyer.delete({ where: { id } });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error deleting:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
