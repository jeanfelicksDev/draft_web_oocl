import { prisma } from "./lib/prisma.js";

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log("USERS IN DB:", JSON.stringify(users, null, 2));
    } catch (e) {
        console.error("PRISMA ERROR:", e);
    }
}

main();
