import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { getAdminUserId } = await import("@/lib/auth-utils");
        const adminId = await getAdminUserId();
        const vessels = await prisma.vessel.findMany({
            where: {
                OR: [
                    { userId },
                    { userId: adminId }
                ]
            },
            include: { voyages: true },
            orderBy: { name: 'asc' }
        });

        // Déduplication par nom (priorité à la première occurrence trouvée)
        const uniqueVessels = Array.from(
            vessels.reduce((map, vessel) => {
                const nameKey = vessel.name.trim().toUpperCase();
                if (!map.has(nameKey)) map.set(nameKey, vessel);
                return map;
            }, new Map()).values()
        );

        return NextResponse.json(uniqueVessels);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch vessels" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        if (!data.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const existing = await prisma.vessel.findFirst({
            where: { name: data.name, userId },
        });
        if (existing) return NextResponse.json(existing);

        const newVessel = await prisma.vessel.create({
            data: { name: data.name, userId },
        });
        return NextResponse.json(newVessel, { status: 201 });
    } catch (error) {
        console.error("Vessel Create Error:", error);
        return NextResponse.json({ error: "Failed to create vessel" }, { status: 500 });
    }
}
