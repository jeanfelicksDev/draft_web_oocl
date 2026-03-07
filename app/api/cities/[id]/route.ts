import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const city = await prisma.city.findUnique({ where: { id } });
        if (!city) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(city);
    } catch {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();

        const updated = await prisma.city.update({
            where: { id },
            data: { name: data.name },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error updating city:", error);
        return NextResponse.json({ error: "Failed to update city" }, { status: 500 });
    }
}


export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.city.delete({ where: { id } });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error deleting:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
