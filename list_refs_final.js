const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function list() {
  const tcs = await prisma.typeTc.findMany();
  console.log("--- TC ---");
  tcs.forEach(t => console.log(t.name));

  const pkgs = await prisma.packageType.findMany();
  console.log("--- PACKAGES ---");
  pkgs.forEach(p => console.log(p.name));
}

list();
