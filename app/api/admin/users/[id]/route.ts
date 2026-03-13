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

        // Delete user using Prisma Client (will handle relations defined with onDelete: Cascade)
        // For relations not defined as Cascade, we manually delete them first.
        // In our schema, Shipper, BillOfLading etc. don't have onDelete: Cascade explicitly set for everyone.
        
        await prisma.shipper.deleteMany({ where: { userId } });
        await prisma.billOfLading.deleteMany({ where: { userId } });
        await prisma.consignee.deleteMany({ where: { userId } });
        await prisma.notify.deleteMany({ where: { userId } });
        await prisma.goods.deleteMany({ where: { userId } });
        
        await prisma.user.delete({
            where: { id: userId }
        });

        console.log("User successfully deleted via Prisma Client");
        return NextResponse.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error: any) {
        console.error("Delete user error:", error);
        return NextResponse.json({ error: "Erreur lors de la suppression", details: error.message }, { status: 500 });
    }
}
