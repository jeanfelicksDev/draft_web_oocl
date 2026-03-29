const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Brute-forcing model name on prisma object...");
    const keys = Object.keys(prisma).filter(k => !k.startsWith("_") && !k.startsWith("$"));
    console.log("Available keys:", keys);
    
    const targets = ["expectedBooking", "ExpectedBooking", "expectedBookings", "ExpectedBookings", "expected_booking"];
    for (const t of targets) {
        console.log(`Checking '${t}':`, typeof prisma[t]);
        if (prisma[t] && typeof prisma[t].findMany === 'function') {
            console.log(`FOUND WORKING MODEL ACCESSOR: prisma.${t}`);
        }
    }
}

main().catch(console.error);
