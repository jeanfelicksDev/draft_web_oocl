const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const userId = "6e306a87-4b68-484e-a247-801fd1836dff"; // test@example.com
    try {
        console.log("Trying to insert TypeReleased for user:", userId);
        const res = await prisma.typeReleased.create({
            data: {
                name: "Original Bill of Lading (OBL)",
                userId: userId
            }
        });
        console.log("SUCCESS:", res);
    } catch (e) {
        console.error("FAILURE:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
