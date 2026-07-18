import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin } from "@/lib/auth-utils";

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userIsAdmin = await isAdmin();

        const currencies = await prisma.currency.findMany({
            where: userIsAdmin ? {} : { userId },
            orderBy: { code: "asc" },
        });
        return NextResponse.json(currencies);
    } catch (error) {
        console.error("Error fetching currencies:", error);
        return NextResponse.json({ error: "Failed to fetch currencies" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        
        const newCurrency = await prisma.currency.create({
            data: {
                code: data.code.toUpperCase(),
                name: data.name.toUpperCase(),
                userId,
            },
        });
        return NextResponse.json(newCurrency, { status: 201 });
    } catch (error: any) {
        console.error("Error creating currency:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "This currency code already exists for your account." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create currency" }, { status: 500 });
    }
}
