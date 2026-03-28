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

        console.log(`DELETING USER ${userId} with recursive dependencies cleaning`);

        // Clean up all related tables to avoid foreign key constraints errors
        await prisma.container.deleteMany({ where: { billOfLading: { userId } } });
        await prisma.billOfLading.deleteMany({ where: { userId } });
        
        await prisma.shipper.deleteMany({ where: { userId } });
        await prisma.consignee.deleteMany({ where: { userId } });
        await prisma.notify.deleteMany({ where: { userId } });
        await prisma.alsoNotify.deleteMany({ where: { userId } });
        await prisma.forwarder.deleteMany({ where: { userId } });
        await prisma.freightBuyer.deleteMany({ where: { userId } });
        await prisma.goods.deleteMany({ where: { userId } });
        await prisma.hSCode.deleteMany({ where: { userId } });
        await prisma.port.deleteMany({ where: { userId } });
        await prisma.city.deleteMany({ where: { userId } });
        
        await (prisma as any).typeReleased.deleteMany({ where: { userId } });
        await (prisma as any).typeTc.deleteMany({ where: { userId } });
        await (prisma as any).packageType.deleteMany({ where: { userId } });

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

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        const { id: userId } = await params;
        const body = await request.json();
        const { role, permissions } = body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                role: role || undefined,
                permissions: permissions !== undefined ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)) : undefined,
            },
            select: {
                id: true,
                email: true,
                role: true,
                permissions: true,
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Erreur lors de la mise à jour", details: error.message }, { status: 500 });
    }
}
