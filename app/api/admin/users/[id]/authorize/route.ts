import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        console.log("AUTHORIZE API SESSION:", session?.user?.email, (session?.user as any)?.role);

        if (!session || (session.user as any).role !== "ADMIN") {
            const details = `Session: ${!!session}, Role: ${(session?.user as any)?.role}`;
            return NextResponse.json({ error: "Non autorisé", details }, { status: 403 });
        }

        const body = await req.json();
        const isAuthorized = body.isAuthorized;
        const { id: userId } = await params;

        console.log(`TOGGLING AUTH FOR USER ${userId} TO ${isAuthorized}`);

        // Update authorization status using Prisma Client
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isAuthorized: !!isAuthorized } as any,
        });
        return NextResponse.json(updatedUser);
    } catch (error: any) {
        console.error("Admin toggle authorization error:", error);
        return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
    }
}
