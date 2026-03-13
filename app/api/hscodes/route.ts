import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userIsAdmin = await isAdmin();

        const hscodes = await prisma.hSCode.findMany({
            where: userIsAdmin ? {} : { userId },
            orderBy: { code: "asc" },
        });
        return NextResponse.json(hscodes);
    } catch (error) {
        console.error("Error fetching hscodes:", error);
        return NextResponse.json({ error: "Failed to fetch hscodes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        
        // Use upsert or check for existence if needed, but here we just create
        const newHSCode = await prisma.hSCode.create({
            data: {
                code: data.code,
                description: data.description,
                userId,
            },
        });
        return NextResponse.json(newHSCode, { status: 201 });
    } catch (error: any) {
        console.error("Error creating hscode:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Ce code HS existe déjà pour votre compte." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create hscode" }, { status: 500 });
    }
}
