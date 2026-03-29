import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function GET(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { getAdminUserId } = await import("@/lib/auth-utils");
        const adminId = await getAdminUserId();
        const { searchParams } = new URL(request.url);
        const vesselId = searchParams.get("vesselId");

        const voyages = await prisma.voyage.findMany({
            where: { 
                AND: [
                    {
                        OR: [
                            { userId },
                            { userId: adminId }
                        ]
                    },
                    vesselId ? { vesselId } : {}
                ]
            },
            include: { vessel: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(voyages);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch voyages" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        if (!data.number || !data.vesselId) {
            return NextResponse.json({ error: "Voyage number and Vessel are required" }, { status: 400 });
        }

        const newVoyage = await prisma.voyage.create({
            data: {
                number: data.number,
                etdDate: data.etdDate ? new Date(data.etdDate) : null,
                etaDate: data.etaDate ? new Date(data.etaDate) : null,
                vesselId: data.vesselId,
                userId
            },
            include: { vessel: true }
        });
        return NextResponse.json(newVoyage, { status: 201 });
    } catch (error) {
        console.error("Voyage Create Error:", error);
        return NextResponse.json({ error: "Failed to create voyage" }, { status: 500 });
    }
}
