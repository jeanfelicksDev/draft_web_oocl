const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const email = 'jeanfelicks@gmail.com';
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    let adminUser = await prisma.user.findUnique({
        where: { email }
    });

    if (adminUser) {
        console.log(`User ${email} already exists. Updating details...`);
        adminUser = await prisma.user.update({
            where: { id: adminUser.id },
            data: {
                password: hashedPassword,
                role: 'ADMIN',
                isAuthorized: true,
                mustChangePassword: false
            }
        });
        console.log(`✅ Admin ${email} updated successfully!`);
    } else {
        console.log(`User ${email} not found. Creating user...`);
        adminUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Jean Felicks',
                companyName: 'OOCL (Admin)',
                role: 'ADMIN',
                isAuthorized: true,
                mustChangePassword: false,
                permissions: '[]'
            }
        });
        console.log(`✅ Admin ${email} created successfully!`);
    }

    const userId = adminUser.id;

    // Seeding Type Released
    const countReleased = await prisma.typeReleased.count({ where: { userId } });
    if (countReleased === 0) {
        console.log("Seeding default Release Types...");
        await prisma.typeReleased.createMany({
            data: [
                { name: "Original Bill of Lading", userId },
                { name: "Telex Release", userId },
                { name: "Sea Waybill", userId }
            ]
        });
    }

    // Seeding Type TC (Containers)
    const countTypeTc = await prisma.typeTc.count({ where: { userId } });
    if (countTypeTc === 0) {
        console.log("Seeding default Container Types...");
        await prisma.typeTc.createMany({
            data: [
                { name: "20'GP", userId },
                { name: "40'GP", userId },
                { name: "40'HQ", userId },
                { name: "40'RF", userId },
                { name: "45'HQ", userId }
            ]
        });
    }

    // Seeding Package Types (Colisage)
    const countPackages = await prisma.packageType.count({ where: { userId } });
    if (countPackages === 0) {
        console.log("Seeding default Package Types...");
        await prisma.packageType.createMany({
            data: [
                { name: "Cartons", userId },
                { name: "Palettes", userId },
                { name: "Sacs", userId },
                { name: "Fûts", userId },
                { name: "Caisses", userId }
            ]
        });
    }

    // Seeding Vessels and Voyages
    const countVessels = await prisma.vessel.count({ where: { userId } });
    if (countVessels === 0) {
        console.log("Seeding default Vessels & Voyages...");
        const vessel1 = await prisma.vessel.create({
            data: { name: "OOCL BANGKOK", userId }
        });
        const vessel2 = await prisma.vessel.create({
            data: { name: "OOCL ROTTERDAM", userId }
        });

        // Add voyages linked to the vessels
        await prisma.voyage.createMany({
            data: [
                { number: "097W", vesselId: vessel1.id, userId, etaDate: new Date(), etdDate: new Date() },
                { number: "123E", vesselId: vessel2.id, userId, etaDate: new Date(), etdDate: new Date() }
            ]
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
