import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        const { id: userId } = await params;

        // On ne peut pas se supprimer soi-même
        if (userId === (session.user as any).id) {
            return NextResponse.json({ error: "Impossible de supprimer votre propre compte" }, { status: 400 });
        }

        console.log(`Starting deep cleanup for user: ${userId}`);

        // Transaction pour tout supprimer proprement et éviter les erreurs de clé étrangère
        await prisma.$transaction([
            // 1. Dépendances de niveau 2 (via d'autres entités)
            prisma.container.deleteMany({ where: { billOfLading: { userId } } }),
            prisma.rotationBooking.deleteMany({ where: { voyage: { userId } } }),
            
            // 2. Dépendances de niveau 1 (directement liées à l'utilisateur)
            prisma.billOfLading.deleteMany({ where: { userId } }),
            prisma.voyage.deleteMany({ where: { userId } }),
            prisma.vessel.deleteMany({ where: { userId } }),
            prisma.shipper.deleteMany({ where: { userId } }),
            prisma.consignee.deleteMany({ where: { userId } }),
            prisma.notify.deleteMany({ where: { userId } }),
            prisma.alsoNotify.deleteMany({ where: { userId } }),
            prisma.forwarder.deleteMany({ where: { userId } }),
            prisma.freightBuyer.deleteMany({ where: { userId } }),
            prisma.goods.deleteMany({ where: { userId } }),
            prisma.hSCode.deleteMany({ where: { userId } }),
            prisma.port.deleteMany({ where: { userId } }),
            prisma.city.deleteMany({ where: { userId } }),
            prisma.typeReleased.deleteMany({ where: { userId } }),
            prisma.typeTc.deleteMany({ where: { userId } }),
            prisma.packageType.deleteMany({ where: { userId } }),
            
            // 3. Enfin supprimer l'utilisateur
            prisma.user.delete({ where: { id: userId } })
        ]);

        console.log(`User ${userId} and all related data deleted successfully.`);
        return NextResponse.json({ message: "Utilisateur et données associés supprimés" });
    } catch (error: any) {
        console.error("Deep delete user error:", error);
        return NextResponse.json({ 
            error: "Erreur lors de la suppression profonde", 
            details: error.message 
        }, { status: 500 });
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
