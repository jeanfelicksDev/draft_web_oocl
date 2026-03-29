import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { getAdminUserId } = await import("@/lib/auth-utils");
        const adminId = await getAdminUserId();
        
        // Tout le monde voit la liste officielle (celle de l'admin)
        const vessels = await prisma.vessel.findMany({
            where: { userId: adminId },
            include: { voyages: true },
            orderBy: { name: 'asc' }
        });
        
        return NextResponse.json(vessels);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch vessels" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        const userIsAdmin = await isAdmin();
        
        // SEUL L'ADMIN PEUT CRÉER DES NAVIRES
        if (!userId || !userIsAdmin) {
            return NextResponse.json({ error: "Seul l'administrateur peut créer des navires" }, { status: 403 });
        }

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
