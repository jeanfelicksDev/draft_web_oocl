const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bls = await prisma.billOfLading.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 3,
    include: {
        shipper: true,
        containers: true
    }
  });

  console.log(JSON.stringify(bls, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
