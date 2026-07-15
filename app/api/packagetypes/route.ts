import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId, isAdmin, getAdminUserId } from '@/lib/auth-utils';

export async function GET(req: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const adminId = await getAdminUserId();
        
        // Liste globale admin ou créés par l'utilisateur connecté
        const items = await prisma.packageType.findMany({
            where: {
                OR: [
                    { userId: adminId || "" },
                    { userId: userId }
                ]
            },
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
        const name = (body.name || "").trim();

        if (!name) {
            return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
        }

        // Vérification doublon insensible à la casse
        const existing = await (prisma as any).packageType.findFirst({
            where: { userId, name: { equals: name, mode: "insensitive" } },
        });
        if (existing) {
            return NextResponse.json(
                { error: `"${existing.name}" existe déjà. Veuillez choisir un nom différent.` },
                { status: 409 }
            );
        }

        const item = await (prisma as any).packageType.create({
            data: { name, userId },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error: any) {
        console.error('Erreur POST PackageType:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Ce nom existe déjà' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
