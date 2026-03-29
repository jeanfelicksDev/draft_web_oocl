 
import { PrismaClient } from "@prisma/client";

// Mettre en cache l'instance Prisma dans l'environnement de développement pour éviter les avertissements "Trop de connexions"
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ["query", "error", "warn"],
    });

// Force refresh if the model is missing
if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma && !(globalForPrisma.prisma as any).expectedBooking) {
    console.log("Re-initializing Prisma Client because expectedBooking is missing on global instance");
    globalForPrisma.prisma = new PrismaClient({ log: ["query", "error", "warn"] });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
