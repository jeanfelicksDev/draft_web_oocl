import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { email, password, name, companyName, phone, role } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "L'utilisateur existe déjà" }, { status: 400 });
        }

        if (role === "ADMIN") {
            const adminExists = await prisma.user.findFirst({
                where: { role: "ADMIN" },
            });

            if (adminExists) {
                return NextResponse.json({ error: "Un compte administrateur existe déjà. Un seul administrateur est autorisé." }, { status: 400 });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                companyName,
                phone,
                role: role || "CLIENT",
            },
        });

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const adminExists = await prisma.user.findFirst({
            where: { role: "ADMIN" },
        });

        return NextResponse.json({ adminExists: !!adminExists });
    } catch (error) {
        return NextResponse.json({ error: "Failed to check admin status" }, { status: 500 });
    }
}
