import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const port = await prisma.port.findUnique({ where: { id } });
        if (!port) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(port);
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

        const updated = await prisma.port.update({
            where: { id },
            data: { name: data.name },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error updating port:", error);
        return NextResponse.json({ error: "Failed to update port" }, { status: 500 });
    }
}


export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.port.delete({ where: { id } });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error deleting:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
