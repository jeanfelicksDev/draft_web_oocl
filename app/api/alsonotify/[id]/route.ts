import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();

        const updated = await prisma.alsoNotify.update({
            where: { id },
            data: { 
                name: data.name,
                description: data.description 
            },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error updating alsoNotify:", error);
        return NextResponse.json({ error: "Failed to update alsoNotify" }, { status: 500 });
    }
}


export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.alsoNotify.delete({ where: { id } });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error deleting:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
