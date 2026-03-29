require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("DB URL from env:", process.env.DATABASE_URL);
  const users = await prisma.user.findMany();
  console.log("Users in DB:", users.map(u => u.id));
}

main().catch(console.error).finally(() => prisma.$disconnect());
