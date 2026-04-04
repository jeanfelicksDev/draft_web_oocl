const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            isAuthorized: true,
            role: true,
            mustChangePassword: true,
            password: true
        }
    });
    console.log(users);

    const testUser = users.find(u => u.email === 'compte1@gmail.ccom');
    if (testUser) {
        const isValid = await bcrypt.compare('testpassword', testUser.password || ''); // Just checking if it crashes
        console.log("Found compte1@gmail.ccom. Authorized:", testUser.isAuthorized);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
