require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@test.com' } });
  
  if (existingAdmin) {
    console.log("L'admin existe déjà : admin@test.com");
    return;
  }

  const hash = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hash,
      name: 'Administrateur',
      role: 'ADMIN',
      companyName: 'OOCL (Admin)',
      isAuthorized: true,
      mustChangePassword: false
    }
  });

  console.log("✅ Admin créé avec succès !");
  console.log("Email    : admin@test.com");
  console.log("Password : admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
