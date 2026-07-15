import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { getSharedPartners, createSharedPartner } from "@/lib/partner-sync";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const list = await getSharedPartners(userId);
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
        const newAlsoNotify = await createSharedPartner(data, userId);
        return NextResponse.json(newAlsoNotify, { status: 201 });
    } catch (error) {
        console.error("Error creating alsoNotify:", error);
        return NextResponse.json({ error: "Failed to create alsoNotify" }, { status: 500 });
    }
}
