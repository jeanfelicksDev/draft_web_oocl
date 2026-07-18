import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        const { id } = await params;

        const updated = await prisma.currency.update({
            where: { id },
            data: {
                code: data.code.toUpperCase(),
                name: data.name.toUpperCase(),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating currency:", error);
        return NextResponse.json({ error: "Failed to update currency" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await prisma.currency.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        console.error("Error deleting currency:", error);
        return NextResponse.json({ error: "Failed to delete currency" }, { status: 500 });
    }
}
