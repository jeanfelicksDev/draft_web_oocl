import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { getSharedPartners, createSharedPartner } from "@/lib/partner-sync";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const notifyList = await getSharedPartners(userId);
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
        const newNotify = await createSharedPartner(data, userId);
        return NextResponse.json(newNotify, { status: 201 });
    } catch (error) {
        console.error("Error creating notify:", error);
        return NextResponse.json({ error: "Failed to create notify" }, { status: 500 });
    }
}
