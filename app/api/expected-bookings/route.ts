import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function GET(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const voyageId = searchParams.get("voyageId");

        if (!voyageId) {
            return NextResponse.json({ error: "voyageId is required" }, { status: 400 });
        }

        const list = await prisma.expectedBooking.findMany({
            where: { voyageId, userId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(list);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch bookings", details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { number, voyageId } = await request.json();
        if (!number || !voyageId) {
            return NextResponse.json({ error: "number and voyageId are required" }, { status: 400 });
        }

        const newItem = await prisma.expectedBooking.create({
            data: {
                number: number.trim().toUpperCase(),
                voyageId,
                userId
            }
        });
        return NextResponse.json(newItem, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to create booking", details: error.message }, { status: 500 });
    }
}
