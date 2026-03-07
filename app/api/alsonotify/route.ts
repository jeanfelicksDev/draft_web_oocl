import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const list = await prisma.alsoNotify.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(list);
    } catch (error) {
        console.error("Error fetching alsoNotify:", error);
        return NextResponse.json({ error: "Failed to fetch alsoNotify" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        const newAlsoNotify = await prisma.alsoNotify.create({
            data: { description: data.description, userId },
        });
        return NextResponse.json(newAlsoNotify, { status: 201 });
    } catch (error) {
        console.error("Error creating alsoNotify:", error);
        return NextResponse.json({ error: "Failed to create alsoNotify" }, { status: 500 });
    }
}
