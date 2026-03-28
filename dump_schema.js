const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        console.log("INDICES FOR TypeReleased");
        const indices = await prisma.$queryRawUnsafe("SELECT * FROM pg_indexes WHERE tablename = 'TypeReleased'");
        console.log("INDICES:", JSON.stringify(indices, null, 2));

        console.log("CONSTRAINTS FOR TypeReleased");
        const constraints = await prisma.$queryRawUnsafe(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = '"TypeReleased"'::regclass
        `);
        console.log("CONSTRAINTS:", JSON.stringify(constraints, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
