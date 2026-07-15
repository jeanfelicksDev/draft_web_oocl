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

        const expected = await prisma.expectedBooking.findMany({
            where: { voyageId, userId },
            orderBy: { createdAt: 'desc' }
        });

        // 2. Fetch Client Drafts (BillOfLading)
        const drafts = await prisma.billOfLading.findMany({
            where: { voyageId },
            include: {
                shipper: true,
                consignee: true,
                notify: true,
                alsoNotify: true,
                forwarder: true,
                freightBuyer: true,
                goods: true,
                typeReleased: true,
                vessel: true,
                voyage: true,
                containers: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            expected,
            drafts
        });
    } catch (error: any) {
        console.error("Comparison API Error:", error);
        return NextResponse.json({ error: "Failed to fetch comparison data", details: error.message }, { status: 500 });
    }
}
