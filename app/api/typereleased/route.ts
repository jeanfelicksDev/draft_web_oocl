import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { getAdminUserId } = await import("@/lib/auth-utils");
        const adminId = await getAdminUserId();

        // Tout le monde voit la liste officielle de l'admin
        const list = await prisma.typeReleased.findMany({
            where: { userId: adminId },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(list);
    } catch (error) {
        console.error("Error fetching TypeReleased:", error);
        return NextResponse.json({ error: "Failed to fetch TypeReleased" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        const userIsAdmin = await isAdmin();
        
        // SEUL L'ADMIN PEUT CRÉER DES TYPES DE RELEASE
        if (!userId || !userIsAdmin) {
            return NextResponse.json({ error: "Seul l'administrateur peut créer des types de release" }, { status: 403 });
        }

        const data = await request.json();
        const newItem = await prisma.typeReleased.create({
            data: { name: data.name, userId },
        });
        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        console.error("Error creating TypeReleased:", error);
        return NextResponse.json({ error: "Failed to create TypeReleased" }, { status: 500 });
    }
}
