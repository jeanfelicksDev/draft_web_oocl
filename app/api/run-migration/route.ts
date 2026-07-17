import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const DATABASES = [
    {
        name: "draft_oocl",
        url: "postgresql://neondb_owner:npg_KULyzug76ZvT@ep-morning-water-agi3yojo.c-2.eu-central-1.aws.neon.tech/draft_oocl?sslmode=require"
    },
    {
        name: "neondb (Vercel standard)",
        url: "postgresql://neondb_owner:npg_KULyzug76ZvT@ep-morning-water-agi3yojo-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
    }
];

export async function GET() {
    const results: any[] = [];

    for (const db of DATABASES) {
        try {
            console.log(`Starting schema push for database: ${db.name}`);
            
            // 1. Run schema push
            const output = execSync("npx prisma db push --accept-data-loss", {
                env: {
                    ...process.env,
                    DATABASE_URL: db.url
                },
                encoding: "utf-8"
            });

            // 2. Instantiate Prisma client for this DB to seed the admin user
            const prisma = new PrismaClient({
                datasources: {
                    db: {
                        url: db.url
                    }
                }
            });

            const email = "jeanfelicks@gmail.com";
            const password = "admin";
            const hashedPassword = await bcrypt.hash(password, 10);

            let adminUser = await prisma.user.findUnique({
                where: { email }
            });

            if (adminUser) {
                adminUser = await prisma.user.update({
                    where: { id: adminUser.id },
                    data: {
                        password: hashedPassword,
                        role: "ADMIN",
                        isAuthorized: true,
                        mustChangePassword: false
                    }
                });
            } else {
                adminUser = await prisma.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        name: "Jean Felicks",
                        companyName: "OOCL (Admin)",
                        role: "ADMIN",
                        isAuthorized: true,
                        mustChangePassword: false,
                        permissions: "[]"
                    }
                });
            }

            // Seed other defaults if needed
            const userId = adminUser.id;
            
            // Release Types
            const countReleased = await prisma.typeReleased.count({ where: { userId } });
            if (countReleased === 0) {
                await prisma.typeReleased.createMany({
                    data: [
                        { name: "Original Bill of Lading", userId },
                        { name: "Telex Release", userId },
                        { name: "Sea Waybill", userId }
                    ]
                });
            }

            // Container Types
            const countTypeTc = await prisma.typeTc.count({ where: { userId } });
            if (countTypeTc === 0) {
                await prisma.typeTc.createMany({
                    data: [
                        { name: "20'GP", userId },
                        { name: "40'GP", userId },
                        { name: "40'HQ", userId },
                        { name: "40'RF", userId },
                        { name: "45'HQ", userId }
                    ]
                });
            }

            // Package Types
            const countPackages = await prisma.packageType.count({ where: { userId } });
            if (countPackages === 0) {
                await prisma.packageType.createMany({
                    data: [
                        { name: "Cartons", userId },
                        { name: "Palettes", userId },
                        { name: "Sacs", userId },
                        { name: "Fûts", userId },
                        { name: "Caisses", userId }
                    ]
                });
            }

            // Vessels & Voyages
            const countVessels = await prisma.vessel.count({ where: { userId } });
            if (countVessels === 0) {
                const vessel1 = await prisma.vessel.create({
                    data: { name: "OOCL BANGKOK", userId }
                });
                const vessel2 = await prisma.vessel.create({
                    data: { name: "OOCL ROTTERDAM", userId }
                });

                await prisma.voyage.createMany({
                    data: [
                        { name: "015E", vesselId: vessel1.id, userId },
                        { name: "016W", vesselId: vessel1.id, userId },
                        { name: "024E", vesselId: vessel2.id, userId },
                        { name: "025W", vesselId: vessel2.id, userId }
                    ]
                });
            }

            await prisma.$disconnect();

            results.push({
                database: db.name,
                success: true,
                output,
                adminSeeded: true
            });
        } catch (error: any) {
            results.push({
                database: db.name,
                success: false,
                error: error.message,
                stack: error.stack
            });
        }
    }

    const allSuccessful = results.every(r => r.success);
    return NextResponse.json({
        success: allSuccessful,
        results
    }, { status: allSuccessful ? 200 : 500 });
}
