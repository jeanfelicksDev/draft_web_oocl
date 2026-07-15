import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { getSharedPartners, createSharedPartner } from "@/lib/partner-sync";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const consignees = await getSharedPartners(userId);
        return NextResponse.json(consignees);
    } catch (error) {
        console.error("Error fetching consignees:", error);
        return NextResponse.json({ error: "Failed to fetch consignees" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        const newConsignee = await createSharedPartner(data, userId);
        return NextResponse.json(newConsignee, { status: 201 });
    } catch (error) {
        console.error("Error creating consignee:", error);
        return NextResponse.json({ error: "Failed to create consignee" }, { status: 500 });
    }
}
