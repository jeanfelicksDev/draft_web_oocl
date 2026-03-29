const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const voyageId = "6cd8f196-85a6-45f9-b834-242ae247ab58"; // From logs
    console.log(`Trying to create booking for voyage ${voyageId}...`);
    try {
        const res = await prisma.rotationBooking.create({
            data: {
                number: "TEST_" + Date.now(),
                voyageId: voyageId
            }
        });
        console.log("SUCCESS:", res);
        
        const count = await prisma.rotationBooking.delete({ where: { id: res.id } });
        console.log("Cleanup SUCCESS.");
    } catch (err) {
        console.error("FAILURE:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
