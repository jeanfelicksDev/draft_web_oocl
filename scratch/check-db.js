const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
    try {
        const check = {
            typeReleased: await prisma.typeReleased.findUnique({ where: { id: "7a145e81-bd10-4558-a0ff-3da9feefa975" } }),
            shipper: await prisma.shipper.findUnique({ where: { id: "9598e060-d5cf-4da6-8759-26aa35076263" } }),
            consignee: await prisma.consignee.findUnique({ where: { id: "80ccf5e1-bf8e-4ed0-9e32-b41e0e6329c6" } }),
            notify: await prisma.notify.findUnique({ where: { id: "80ccf5e1-bf8e-4ed0-9e32-b41e0e6329c6" } }),
            alsoNotify: await prisma.alsoNotify.findUnique({ where: { id: "80ccf5e1-bf8e-4ed0-9e32-b41e0e6329c6" } }),
            forwarder: await prisma.forwarder.findUnique({ where: { id: "a1bdf51e-9fb5-43d0-a242-b687968dca1f" } }),
            freightBuyer: await prisma.freightBuyer.findUnique({ where: { id: "ea58136e-eb8c-48fc-b20d-164f6dbe7fd7" } }),
            goods: await prisma.goods.findUnique({ where: { id: "e16298ad-2767-41f8-b7a0-e366a11b3871" } }),
            vessel: await prisma.vessel.findUnique({ where: { id: "61051911-6c38-478f-833f-002acb55c8b7" } })
        };
        console.log("CHECK_RESULT:", JSON.stringify(check, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
