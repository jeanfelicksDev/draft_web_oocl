const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVessel() {
  try {
    const vessel = await prisma.vessel.findFirst({
      where: {
        name: {
          contains: 'EA CHARA',
          mode: 'insensitive'
        }
      }
    });

    if (vessel) {
      console.log('✅ Navire trouvé :', JSON.stringify(vessel, null, 2));
    } else {
      console.log('❌ Navire "EA CHARA" introuvable dans la base.');
      
      // Check if it's there but maybe for a different user or spelled differently
      const allVessels = await prisma.vessel.findMany({
          take: 5
      });
      console.log('Exemples de navires présents :', allVessels.map(v => v.name));
    }
  } catch (error) {
    console.error('Erreur Prisma :', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVessel();
