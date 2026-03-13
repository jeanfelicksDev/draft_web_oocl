const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const blId = "dc5c0d9d-d4d5-4e6b-849b-af02951ac6ad";
  const bl = await prisma.billOfLading.findUnique({ where: { id: blId } });
  
  if (bl && bl.originalData) {
    const newData = { ...bl.originalData };
    if (newData.notify) {
        newData.notify.name = "KIPRE PIERRE"; // Remove the S in original
    }
    
    await prisma.billOfLading.update({
        where: { id: blId },
        data: { originalData: newData }
    });
    console.log("Original data fixed for BL", blId);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
