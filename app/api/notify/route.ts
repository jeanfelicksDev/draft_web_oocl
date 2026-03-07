import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const notifyList = await prisma.notify.findMany({
            where: { userId },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(notifyList);
    } catch (error) {
        console.error("Error fetching notify:", error);
        return NextResponse.json({ error: "Failed to fetch notify" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        const newNotify = await prisma.notify.create({
            data: { ...data, userId },
        });
        return NextResponse.json(newNotify, { status: 201 });
    } catch (error) {
        console.error("Error creating notify:", error);
        return NextResponse.json({ error: "Failed to create notify" }, { status: 500 });
    }
}
