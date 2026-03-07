import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const list = await prisma.typeReleased.findMany({
            where: { userId },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(list);
    } catch (error) {
        console.error("Error fetching TypeReleased:", error);
        return NextResponse.json({ error: "Failed to fetch TypeReleased" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        const newItem = await prisma.typeReleased.create({
            data: { name: data.name, userId },
        });
        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        console.error("Error creating TypeReleased:", error);
        return NextResponse.json({ error: "Failed to create TypeReleased" }, { status: 500 });
    }
}
