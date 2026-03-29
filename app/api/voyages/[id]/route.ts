import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        const { id } = await params;
        const voyage = await prisma.voyage.update({
            where: { id, userId },
            data: {
                number: data.number,
                etdDate: data.etdDate ? new Date(data.etdDate) : null,
                etaDate: data.etaDate ? new Date(data.etaDate) : null,
                vesselId: data.vesselId
            },
            include: { vessel: true }
        });
        return NextResponse.json(voyage);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update voyage" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await prisma.voyage.delete({
            where: { id, userId }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete voyage" }, { status: 500 });
    }
}
