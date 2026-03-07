import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

// POST /api/ports/findorcreate  { name: "France" }
export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { name } = await request.json();
        if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

        // Find existing or create new
        let port = await prisma.port.findFirst({
            where: { name, userId },
        });

        if (!port) {
            port = await prisma.port.create({
                data: { name, userId },
            });
        }

        return NextResponse.json(port);
    } catch (error) {
        console.error("Error in findorcreate port:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
