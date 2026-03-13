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

        // FORCE Raw Query because Prisma Client might be out of sync and stripping fields
        try {
            console.log("Fetching users with raw SQL...");
            const users = await prisma.$queryRaw<any[]>`
                SELECT 
                    id, 
                    email, 
                    name, 
                    "companyName", 
                    role, 
                    "isAuthorized", 
                    "tempPassword", 
                    "mustChangePassword", 
                    "createdAt"
                FROM "User" 
                ORDER BY "createdAt" DESC
            `;
            
            // Ensure fields are correctly interpreted as boolean/string etc
            const sanitizedUsers = users.map(u => ({
                ...u,
                // Postgres might return boolean as true/false, but let's be sure
                isAuthorized: u.isAuthorized === true,
                mustChangePassword: u.mustChangePassword === true,
                createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null
            }));

            console.log("Fetched", sanitizedUsers.length, "users. First one authorized:", sanitizedUsers[0]?.isAuthorized);
            return NextResponse.json(sanitizedUsers);
        } catch (dbError: any) {
            console.error("Prisma queryRaw failed:", dbError.message);
            return NextResponse.json({ error: "Erreur base de données", details: dbError.message }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Admin user list general error:", error);
        return NextResponse.json({ 
            error: "Erreur serveur", 
            details: error.message,
            code: error.code
        }, { status: 500 });
    }
}
