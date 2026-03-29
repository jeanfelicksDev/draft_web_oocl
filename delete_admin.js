import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Attempting to delete admin@test.com...');
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@test.com' }});
    if (!user) {
        console.log('User not found.');
        return;
    }
    
    // Clean dependencies
    await prisma.container.deleteMany({ where: { billOfLading: { userId: user.id } } });
    await prisma.billOfLading.deleteMany({ where: { userId: user.id } });
    await prisma.shipper.deleteMany({ where: { userId: user.id } });
    await prisma.consignee.deleteMany({ where: { userId: user.id } });
    await prisma.notify.deleteMany({ where: { userId: user.id } });
    await Object.keys(prisma).includes('alsoNotify') && await prisma.alsoNotify.deleteMany({ where: { userId: user.id } });
    await prisma.forwarder.deleteMany({ where: { userId: user.id } });
    await prisma.freightBuyer.deleteMany({ where: { userId: user.id } });
    await prisma.goods.deleteMany({ where: { userId: user.id } });
    await prisma.hSCode.deleteMany({ where: { userId: user.id } });
    await Object.keys(prisma).includes('port') && await prisma.port.deleteMany({ where: { userId: user.id } });
    await Object.keys(prisma).includes('city') && await prisma.city.deleteMany({ where: { userId: user.id } });
    
    if (prisma.typeReleased) await prisma.typeReleased.deleteMany({ where: { userId: user.id } });
    if (prisma.typeTc) await prisma.typeTc.deleteMany({ where: { userId: user.id } });
    if (prisma.packageType) await prisma.packageType.deleteMany({ where: { userId: user.id } });
    
    // Fix Vessels and Voyages
    if (prisma.voyage) await prisma.voyage.deleteMany({ where: { userId: user.id } });
    if (prisma.vessel) await prisma.vessel.deleteMany({ where: { userId: user.id } });
    
    await prisma.user.delete({ where: { email: 'admin@test.com' } });
    console.log('Successfully deleted admin@test.com');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
