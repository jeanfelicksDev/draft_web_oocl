import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const consignees = await prisma.consignee.findMany({
            where: { userId },
            orderBy: { name: "asc" },
        });
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
        const newConsignee = await prisma.consignee.create({
            data: {
                name: data.name,
                address: data.address,
                country: data.country,
                city: data.city,
                phone: data.phone,
                email: data.email,
                vat: data.vat,
                eori: data.eori,
                bin: data.bin,
                usci: data.usci,
                saveStatus: data.saveStatus || "VALIDATED",
                userId,
            },
        });
        return NextResponse.json(newConsignee, { status: 201 });
    } catch (error) {
        console.error("Error creating consignee:", error);
        return NextResponse.json({ error: "Failed to create consignee" }, { status: 500 });
    }
}
