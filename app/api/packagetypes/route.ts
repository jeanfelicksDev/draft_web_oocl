import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId, isAdmin, getAdminUserId } from '@/lib/auth-utils';

export async function GET(req: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const adminId = await getAdminUserId();
        
        // Liste globale admin
        const items = await prisma.packageType.findMany({
            where: { userId: adminId },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error('Erreur GET PackageType:', error);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const userIsAdmin = await isAdmin();
        
        if (!userId || !userIsAdmin) {
            return NextResponse.json({ error: 'Seul l\'administrateur peut créer des types d\'emballage' }, { status: 403 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
        }

        const item = await prisma.packageType.create({
            data: {
                name,
                userId: userId,
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error: any) {
        console.error('Erreur POST PackageType:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Ce nom existe déjà' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
