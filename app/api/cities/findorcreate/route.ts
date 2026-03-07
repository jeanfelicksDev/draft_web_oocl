import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

// POST /api/cities/findorcreate  { name: "Marseille" }
export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { name } = await request.json();
        if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

        // Find existing or create new
        let city = await prisma.city.findFirst({
            where: { name, userId },
        });

        if (!city) {
            city = await prisma.city.create({
                data: { name, userId },
            });
        }

        return NextResponse.json(city);
    } catch (error) {
        console.error("Error in findorcreate city:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
