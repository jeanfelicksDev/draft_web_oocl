/**
 * run-migration-script.js
 * 
 * Standalone script to:
 * 1. Push the Prisma schema to both local/Neon databases (draft_oocl and neondb).
 * 2. Seed the admin user (jeanfelicks@gmail.com / admin) and default data.
 * 
 * Run this in your terminal:
 *   node run-migration-script.js
 */

const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const DATABASES = [
    {
        name: "draft_oocl (Local/Neon)",
        url: "postgresql://neondb_owner:npg_KULyzug76ZvT@ep-morning-water-agi3yojo.c-2.eu-central-1.aws.neon.tech/draft_oocl?sslmode=require"
    },
    {
        name: "neondb (Vercel standard)",
        url: "postgresql://neondb_owner:npg_KULyzug76ZvT@ep-morning-water-agi3yojo-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
    }
];

async function run() {
    console.log("🚀 Starting database migration and seeding script...");

    for (const db of DATABASES) {
        console.log(`\n--------------------------------------------`);
        console.log(`Processing Database: ${db.name}`);
        console.log(`--------------------------------------------`);
        
        try {
            // 1. Run schema push
            console.log("⏳ Running prisma db push...");
            execSync("npx prisma db push --accept-data-loss", {
                env: {
                    ...process.env,
                    DATABASE_URL: db.url
                },
                stdio: "inherit"
            });
            console.log("✅ Schema pushed successfully!");

            // 2. Instantiate Prisma client for this DB to seed the admin user
            const prisma = new PrismaClient({
                datasources: {
                    db: {
                        url: db.url
                    }
                }
            });

            console.log("⏳ Seeding admin user...");
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
                console.log(`✅ Admin user ${email} updated (Password: 'admin')`);
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
                console.log(`✅ Admin user ${email} created (Password: 'admin')`);
            }

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
                console.log("✅ Seeded default Release Types");
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
                console.log("✅ Seeded default Container Types");
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
                console.log("✅ Seeded default Package Types");
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
                console.log("✅ Seeded default Vessels & Voyages");
            }

            await prisma.$disconnect();
            console.log(`🎉 Database seeding completed successfully for ${db.name}!`);

        } catch (error) {
            console.error(`❌ Error processing database ${db.name}:`, error.message);
            if (error.stack) {
                console.error(error.stack);
            }
        }
    }

    console.log("\n⭐️ All operations completed! Try logging in to your Vercel deployment now.");
}

run();
