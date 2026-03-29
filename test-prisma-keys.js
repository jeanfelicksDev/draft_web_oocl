const { prisma } = require("./lib/prisma");

async function main() {
    console.log("Checking keys of the exported prisma instance...");
    const keys = Object.keys(prisma).filter(k => !k.startsWith("_") && !k.startsWith("$"));
    console.log("Keys:", keys);
    if (keys.includes("expectedBooking")) {
        console.log("SUCCESS: expectedBooking is present.");
    } else {
        console.log("FAILURE: expectedBooking is MISSING.");
        // Try to find anything similar
        const similar = keys.filter(k => k.toLowerCase().includes("booking"));
        console.log("Similar keys:", similar);
    }
}

main().catch(err => {
    console.error("Error in test script:", err);
    process.exit(1);
});
