import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const cities = await prisma.city.findMany({
            where: { userId },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(cities);
    } catch (error) {
        console.error("Error fetching cities:", error);
        return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();

        // Find-or-create: return existing record if name already exists for this user
        if (data.name) {
            const existing = await prisma.city.findFirst({
                where: { name: data.name, userId },
            });
            if (existing) return NextResponse.json(existing);
        }

        const newCity = await prisma.city.create({
            data: {
                name: data.name,
                userId,
            },
        });
        return NextResponse.json(newCity, { status: 201 });
    } catch (error) {
        console.error("Error creating city:", error);
        return NextResponse.json({ error: "Failed to create city" }, { status: 500 });
    }
}
