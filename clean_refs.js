const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanUp() {
  const userId = "bec5e8a2-131b-4c0b-a9d5-052c71287058"; // Session ID contextuel

  console.log("== Nettoyage des références initié ==");

  try {
    // 1. Types TC : Garder uniquement le format avec apostrophe (ex: 20'DC)
    // Supprime 20DC, 40HC, etc. si leurs équivalents 20'DC, 40'HC existent
    const tcs = await prisma.typeTc.findMany({ where: { userId } });
    const tcNames = tcs.map(t => t.name);
    
    for (const tc of tcs) {
      if (!tc.name.includes("'")) {
        const standard = tc.name.replace(/(\d+)/, "$1'"); // 20DC -> 20'DC
        if (tcNames.includes(standard)) {
          console.log(`- Suppression du doublon TC: ${tc.name}`);
          await prisma.typeTc.delete({ where: { id: tc.id } });
        } else {
          console.log(`- Renommage TC: ${tc.name} -> ${standard}`);
          await prisma.typeTc.update({ where: { id: tc.id }, data: { name: standard } });
        }
      }
    }

    // 2. Package Types : Tout passer en UPPERCASE Anglais
    const pkgs = await prisma.packageType.findMany({ where: { userId } });
    const pkgMap = {
      "Sac": "BAG",
      "Palette": "PALLET",
      "Carton": "CARTON",
      "SAC": "BAG",
      "Package": "PACKAGE",
      "Package-type": "PACKAGE"
    };

    for (const pkg of pkgs) {
      const standard = pkgMap[pkg.name] || pkg.name.toUpperCase();
      const alreadyExists = await prisma.packageType.findFirst({
        where: { userId, name: standard, id: { not: pkg.id } }
      });

      if (alreadyExists) {
        console.log(`- Fusion Package: ${pkg.name} -> ${standard} (Doublon supprimé)`);
        await prisma.packageType.delete({ where: { id: pkg.id } });
      } else if (pkg.name !== standard) {
        console.log(`- Renommage Package: ${pkg.name} -> ${standard}`);
        await prisma.packageType.update({ where: { id: pkg.id }, data: { name: standard } });
      }
    }

    console.log("== Nettoyage terminé avec succès ! ==");
  } catch (err) {
    console.error("Erreur durant le nettoyage:", err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanUp();
