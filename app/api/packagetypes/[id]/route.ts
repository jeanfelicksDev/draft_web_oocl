import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorisé (Pas de session)' }, { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
        }

        const updated = await (prisma as any).packageType.update({
            where: {
                id: id,
                userId: session.user.id,
            },
            data: {
                name,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Erreur PUT PackageType:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Élément introuvable ou vous n\'en êtes pas le propriétaire (P2025)' }, { status: 404 });
        }
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Ce nom existe déjà pour vous (P2002)' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Erreur Serveur: ' + (error.message || 'Details inconnus') }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await (prisma as any).packageType.delete({
            where: {
                id: id,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Erreur DELETE PackageType:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Élément introuvable ou non autorisé (P2025)' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Erreur Serveur: ' + (error.message || 'Details inconnus') }, { status: 500 });
    }
}
