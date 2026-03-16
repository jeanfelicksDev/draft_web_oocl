
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Suppression de tous les comptes utilisateur...');
  
  // Dans l'ordre pour éviter les erreurs de contraintes si Cascade n'est pas partout
  // Mais avec PostgreSQL, on peut tenter un deleteMany global
  try {
    // Suppression en cascade manuelle si nécessaire, ou simplement tenter User
    // Note: BillOfLading, Shipper, etc. sont liés à User.
    
    const users = await prisma.user.deleteMany({});
    console.log(`${users.count} comptes supprimés avec succès.`);
  } catch (error) {
    console.error('Erreur lors de la suppression :', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
