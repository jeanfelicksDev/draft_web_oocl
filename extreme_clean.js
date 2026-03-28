const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function extremeClean() {
  console.log("== Nettoyage Extrême des doublons ==");

  try {
    // 1. Liste de tous les utilisateurs ayant des données
    const users = await prisma.user.findMany({ select: { id: true } });
    
    for (const user of users) {
      const userId = user.id;

      // Nettoyage TC pour cet utilisateur
      const tcs = await prisma.typeTc.findMany({ where: { userId } });
      const seenTc = new Set();
      for (const tc of tcs) {
        const normalized = tc.name.replace(/(\d+)/, "$1'").trim().toUpperCase();
        if (seenTc.has(normalized)) {
          console.log(`- Suppression Doublon TC (${normalized}) pour user ${userId}`);
          await prisma.typeTc.delete({ where: { id: tc.id } });
        } else {
          seenTc.add(normalized);
          if (tc.name !== normalized) {
            await prisma.typeTc.update({ where: { id: tc.id }, data: { name: normalized } });
          }
        }
      }

      // Nettoyage Packages pour cet utilisateur
      const pkgs = await prisma.packageType.findMany({ where: { userId } });
      const seenPkg = new Set();
      const pkgStandard = { "SAC": "BAG", "PALLETTE": "PALLET", "PALLET": "PALLET", "PACKAGE": "PACKAGE", "CARTON": "CARTON" };
      
      for (const pkg of pkgs) {
        let normalized = pkg.name.toUpperCase().trim();
        normalized = pkgStandard[normalized] || normalized;

        if (seenPkg.has(normalized)) {
          console.log(`- Suppression Doublon Package (${normalized}) pour user ${userId}`);
          await prisma.packageType.delete({ where: { id: pkg.id } });
        } else {
          seenPkg.add(normalized);
          if (pkg.name !== normalized) {
            await prisma.packageType.update({ where: { id: pkg.id }, data: { name: normalized } });
          }
        }
      }
    }
    console.log("== Fin du nettoyage extrême ==");
  } catch (err) {
    console.error("ERREUR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

extremeClean();
