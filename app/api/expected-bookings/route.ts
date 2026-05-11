import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";

export async function GET(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // RotationBooking feature désactivée (table non migrée en production)
        return NextResponse.json([]);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch bookings", details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // RotationBooking feature désactivée (table non migrée en production)
        return NextResponse.json({ message: "Feature temporairement désactivée" }, { status: 503 });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to create booking", details: error.message }, { status: 500 });
    }
}
