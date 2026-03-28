import { prisma } from './lib/prisma.js';

async function listAll() {
    const sessionUserId = "bec5e8a2-131b-4c0b-a9d5-052c71287058"; // Based on previous logs
    
    console.log("=== TYPE TC ===");
    const tcs = await prisma.typeTc.findMany({ where: { userId: sessionUserId }, orderBy: { name: 'asc' } });
    tcs.forEach(t => console.log(`- ${t.name} (id: ${t.id})`));

    console.log("\n=== PACKAGE TYPES ===");
    const pkgs = await prisma.packageType.findMany({ where: { userId: sessionUserId }, orderBy: { name: 'asc' } });
    pkgs.forEach(p => console.log(`- ${p.name} (id: ${p.id})`));

    console.log("\n=== RELEASED TYPES ===");
    const rels = await prisma.typeReleased.findMany({ where: { userId: sessionUserId }, orderBy: { name: 'asc' } });
    rels.forEach(r => console.log(`- ${r.name} (id: ${r.id})`));
}

listAll();
