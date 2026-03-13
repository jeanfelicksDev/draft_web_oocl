import { prisma } from "./lib/prisma.js";

async function main() {
    try {
        console.log("--- DIAGNOSTIC USERS ---");
        const count = await prisma.user.count();
        console.log("Total Users:", count);

        const users = await prisma.$queryRaw`SELECT id, email, "isAuthorized", "tempPassword", role FROM "User"`;
        console.log("Raw Users Data:", JSON.stringify(users, null, 2));

        // Fix: Set isAuthorized to true for everyone who is null or false (to recover)
        const updateResult = await prisma.$executeRaw`UPDATE "User" SET "isAuthorized" = true WHERE "isAuthorized" IS NULL OR "isAuthorized" = false`;
        console.log("Updated isAuthorized for", updateResult, "users");

    } catch (e) {
        console.error("DIAGNOSTIC ERROR:", e);
    } finally {
        process.exit(0);
    }
}

main();
