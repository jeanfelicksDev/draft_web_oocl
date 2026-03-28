const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function globalClean() {
  console.log("== Liste de toutes les références en base ==");

  try {
    const tcs = await prisma.typeTc.findMany();
    const pkgs = await prisma.packageType.findMany();

    console.log(`- TC trouvés: ${tcs.length}`);
    console.log(`- Packages trouvés: ${pkgs.length}`);

    // Standardiser les TC
    for (const tc of tcs) {
        if (!tc.name.includes("'")) {
            const standard = tc.name.replace(/(\d+)/, "$1'");
            const exists = await prisma.typeTc.findFirst({
                where: { userId: tc.userId, name: standard }
            });
            if (exists) {
                console.log(`  Deleting duplicate TC: ${tc.name}`);
                await prisma.typeTc.delete({ where: { id: tc.id } });
            } else {
                console.log(`  Renaming TC: ${tc.name} -> ${standard}`);
                await prisma.typeTc.update({ where: { id: tc.id }, data: { name: standard } });
            }
        }
    }

    // Standardiser les Packages
    const pkgMap = {
        "Sac": "BAG", "SAC": "BAG", "Package": "PACKAGE", "Carton": "CARTON", "Palette": "PALLET", "Palette-type": "PALETTE"
    };

    for (const pkg of pkgs) {
        let standard = pkgMap[pkg.name] || pkg.name.toUpperCase();
        if (standard === "PALETTE") standard = "PALLET"; // standardization
        
        const exists = await prisma.packageType.findFirst({
            where: { userId: pkg.userId, name: standard, id: { not: pkg.id } }
        });
        if (exists) {
            console.log(`  Deleting duplicate Package: ${pkg.name}`);
            await prisma.packageType.delete({ where: { id: pkg.id } });
        } else if (pkg.name !== standard) {
            console.log(`  Renaming Package: ${pkg.name} -> ${standard}`);
            await prisma.packageType.update({ where: { id: pkg.id }, data: { name: standard } });
        }
    }

    console.log("== Nettoyage global terminé ! ==");
  } catch (err) {
    console.error("ERREUR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

globalClean();
