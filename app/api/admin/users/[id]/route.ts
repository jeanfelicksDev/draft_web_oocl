import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        console.log("DELETE API SESSION:", session?.user?.email, (session?.user as any)?.role);

        if (!session || (session.user as any).role !== "ADMIN") {
            const details = `Session: ${!!session}, Role: ${(session?.user as any)?.role}`;
            return NextResponse.json({ error: "Non autorisé", details }, { status: 403 });
        }

        const { id: userId } = await params;

        // On ne permet pas à l'admin de se supprimer lui-même par erreur ici
        if (userId === (session.user as any).id) {
            return NextResponse.json({ error: "Impossible de supprimer votre propre compte admin" }, { status: 400 });
        }

        console.log(`DELETING USER ${userId} with recursive dependencies cleaning (Raw SQL fallback if needed)`);

        try {
            // First attempt with prisma delete (safest if constraints allow)
            // But we'll do raw SQL first to clean relations anyway if we suspect they cause problems
            
            // Clean specific relations that might exist
            await prisma.$executeRawUnsafe(`DELETE FROM "Shipper" WHERE "userId" = '${userId}'`);
            await prisma.$executeRawUnsafe(`DELETE FROM "BillOfLading" WHERE "userId" = '${userId}'`);
            
            // Delete user
            const result = await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE id = '${userId}'`);
            
            if (result === 0) {
                console.log("No user found with ID", userId);
                return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
            }

            console.log("User successfully deleted via raw SQL");
            return NextResponse.json({ message: "Utilisateur supprimé avec succès" });
        } catch (dbError: any) {
            console.error("Prisma raw delete failed:", dbError.message);
            return NextResponse.json({ error: "Erreur base de données", details: dbError.message }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Delete user error:", error);
        return NextResponse.json({ error: "Erreur lors de la suppression", details: error.message }, { status: 500 });
    }
}
