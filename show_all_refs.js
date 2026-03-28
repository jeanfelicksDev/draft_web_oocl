const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function showAll() {
  console.log("=== TOUS LES TC ===");
  const tcs = await prisma.typeTc.findMany();
  tcs.forEach(t => console.log(`[${t.userId}] ${t.name}`));

  console.log("\n=== TOUS LES PACKAGES ===");
  const pkgs = await prisma.packageType.findMany();
  pkgs.forEach(p => console.log(`[${p.userId}] ${p.name}`));
}

showAll();
