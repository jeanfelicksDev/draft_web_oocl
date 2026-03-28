import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const items = await prisma.packageType.findMany({
            where: { userId: session.user.id },
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
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
        }

        const item = await prisma.packageType.create({
            data: {
                name,
                userId: session.user.id,
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
