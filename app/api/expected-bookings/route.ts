import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserId } from "@/lib/auth-utils";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        console.log("--- GET Rotation Bookings ---");
        const userId = await findUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const voyageId = searchParams.get("voyageId");
        if (!voyageId) return NextResponse.json({ error: "voyageId is required" }, { status: 400 });

        const bookings = await (prisma as any).rotationBooking.findMany({
            where: { voyageId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(bookings);
    } catch (error: any) {
        console.error("GET Rotation Bookings Error:", error);
        return NextResponse.json({ error: "Failed to fetch bookings", details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        console.log("--- POST Rotation Booking ---");
        const userId = await findUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        console.log("Post Data:", data);

        if (!data.number || !data.voyageId) {
            return NextResponse.json({ error: "Booking number and Voyage are required" }, { status: 400 });
        }

        const newBooking = await (prisma as any).rotationBooking.create({
            data: {
                number: data.number.trim().toUpperCase(),
                voyageId: data.voyageId
            }
        });
        console.log("Booking created:", newBooking.id);
        return NextResponse.json(newBooking, { status: 201 });
    } catch (error: any) {
        console.error("POST Rotation Booking Error:", error);
        return NextResponse.json({ error: "Failed to create booking", details: error.message }, { status: 500 });
    }
}

async function findUserId() {
    return await getUserId();
}
