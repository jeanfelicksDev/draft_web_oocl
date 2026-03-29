import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const userId = (session.user as any).id;
        const isAdmin = (session.user as any).role === "ADMIN";

        // Fetch vessels with counts of voyages and BLs
        // If admin, show all (or could filter by user, but usually dashboard is aggregate)
        // For simplicity, let's show user's vessels or all if admin
        const vessels = await prisma.vessel.findMany({
            where: isAdmin ? {} : { userId },
            include: {
                _count: {
                    select: {
                        voyages: true,
                        billsOfLading: true,
                    }
                },
                voyages: {
                    orderBy: { etdDate: 'desc' },
                    take: 1, // Latest voyage
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(vessels);
    } catch (error: any) {
        console.error("Dashboard vessels error:", error);
        return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
    }
}
