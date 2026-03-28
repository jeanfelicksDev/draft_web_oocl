const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function list() {
  const rels = await prisma.typeReleased.findMany();
  console.log("--- TYPES DE CONNAISSEMENT ---");
  rels.forEach(r => console.log(r.name));
}

list();
