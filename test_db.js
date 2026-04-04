const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();

async function test() {
  try {
    const count = await p.user.count();
    console.log('✅ DB connectée! Users:', count);
    
    const users = await p.user.findMany({ select: { id: true, email: true, name: true }, take: 5 });
    console.log('Utilisateurs:', JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('❌ Erreur DB:', e.message);
  } finally {
    await p.$disconnect();
  }
}

test();
