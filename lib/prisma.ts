 
import { PrismaClient } from "@prisma/client";

// Mettre en cache l'instance Prisma dans l'environnement de développement pour éviter les avertissements "Trop de connexions"
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ["query"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
