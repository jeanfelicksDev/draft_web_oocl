import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/auth-utils";

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true }
        });
        const adminId = await getAdminUserId();
        const typesTc = await prisma.typeTc.findMany();
        const packageTypes = await prisma.packageType.findMany();
        const typesReleased = await prisma.typeReleased.findMany();

        const dbUrl = process.env.DATABASE_URL || "NOT SET";
        const maskedDbUrl = dbUrl.replace(/:[^:@\n]+@/, ':****@');

        return NextResponse.json({
            users,
            adminId,
            typesTcCount: typesTc.length,
            typesTc,
            packageTypesCount: packageTypes.length,
            packageTypes,
            typesReleasedCount: typesReleased.length,
            typesReleased,
            databaseUrlUsedByVercel: maskedDbUrl
        });
    } catch (error: any) {
        const dbUrl = process.env.DATABASE_URL || "NOT SET";
        const maskedDbUrl = dbUrl.replace(/:[^:@\n]+@/, ':****@');
        return NextResponse.json({ 
            error: error.message, 
            stack: error.stack,
            databaseUrlUsedByVercel: maskedDbUrl
        }, { status: 500 });
    }
}
