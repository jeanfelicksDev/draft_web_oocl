const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log("USERS_START");
        users.forEach(u => console.log(`ID: ${u.id} EMAIL: ${u.email}`));
        console.log("USERS_END");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
