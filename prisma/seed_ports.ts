import { PrismaClient } from "@prisma/client";
import { MARITIME_COUNTRIES, WORLD_PORTS_BY_COUNTRY } from "../lib/world-ports-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding global countries and ports...");

  for (const countryName of MARITIME_COUNTRIES) {
    const country = await prisma.globalCountry.upsert({
      where: { name: countryName },
      update: {},
      create: { name: countryName },
    });

    const ports = WORLD_PORTS_BY_COUNTRY[countryName] || [];
    for (const portName of ports) {
      await prisma.globalPort.upsert({
        where: {
          name_countryId: {
            name: portName,
            countryId: country.id
          }
        },
        update: {},
        create: {
          name: portName,
          countryId: country.id
        }
      });
    }
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
