const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'compte1@gmail.ccom' } });
    console.log(user);
}
main().finally(() => prisma.$disconnect());
