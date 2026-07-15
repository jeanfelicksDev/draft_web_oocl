import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const data = await request.json();
        const name = (data.name || "").trim();

        if (!name) {
            return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
        }

        // Vérification doublon insensible à la casse (exclure l'élément courant)
        const existing = await prisma.typeReleased.findFirst({
            where: {
                userId,
                name: { equals: name, mode: "insensitive" },
                NOT: { id },
            },
        });
        if (existing) {
            return NextResponse.json(
                { error: `"${existing.name}" existe déjà. Veuillez choisir un nom différent.` },
                { status: 409 }
            );
        }

        const updated = await prisma.typeReleased.update({
            where: { id, userId },
            data: { name },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
        console.error("Error updating typeReleased:", error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Élément introuvable ou vous n'en êtes pas le propriétaire" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to update typeReleased" }, { status: 500 });
    }
}


export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        
        // Ensure user owns this item
        await prisma.typeReleased.delete({ 
            where: { id, userId } 
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Élément introuvable ou vous n'en êtes pas le propriétaire" }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
