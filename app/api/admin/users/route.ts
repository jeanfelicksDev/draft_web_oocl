import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        console.log("ADMIN API SESSION:", session?.user?.email, (session?.user as any)?.role);
        
        if (!session || (session.user as any).role !== "ADMIN") {
            const details = `Session: ${!!session}, Role: ${(session?.user as any)?.role}`;
            return NextResponse.json({ error: "Non autorisé", details }, { status: 403 });
        }

        // Fetch users using Prisma Client
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                companyName: true,
                role: true,
                isAuthorized: true,
                tempPassword: true,
                mustChangePassword: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        console.log("Fetched", users.length, "users. First one authorized:", users[0]?.isAuthorized);
        return NextResponse.json(users);
    } catch (error: any) {
        console.error("Admin user list general error:", error);
        return NextResponse.json({ 
            error: "Erreur serveur", 
            details: error.message,
            code: error.code
        }, { status: 500 });
    }
}
