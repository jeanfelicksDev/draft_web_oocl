import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userIsAdmin = await isAdmin();

        const shippers = await prisma.shipper.findMany({
            where: userIsAdmin ? {} : { userId },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(shippers);
    } catch (error) {
        console.error("Error fetching shippers:", error);
        return NextResponse.json({ error: "Failed to fetch shippers" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        const newShipper = await prisma.shipper.create({
            data: {
                name: data.name,
                address: data.address,
                country: data.country,
                city: data.city,
                phone: data.phone,
                email: data.email,
                vat: data.vat || null,
                eori: data.eori || null,
                bin: data.bin || null,
                usci: data.usci || null,
                userId,
            },
        });
        return NextResponse.json(newShipper, { status: 201 });
    } catch (error) {
        console.error("Error creating shipper:", error);
        return NextResponse.json({ error: "Failed to create shipper" }, { status: 500 });
    }
}
