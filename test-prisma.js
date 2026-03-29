const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Checking prisma.expectedBooking...");
    try {
        const count = await prisma.expectedBooking.count();
        console.log("Count:", count);
        console.log("SUCCESS: prisma.expectedBooking is available.");
    } catch (err) {
        console.error("FAILURE:", err.message);
        if (err.message.includes("is not a function")) {
             console.log("Available models:", Object.keys(prisma).filter(k => !k.startsWith("_")));
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
