const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function findSIByNumber() {
    const numbers = ["4054102145", "4055066160"];
    
    try {
        console.log("🔍 Recherche des documents (BillOfLading) correspondants...");
        
        const SIs = await prisma.billOfLading.findMany({
            where: {
                OR: [
                    { bookingNumber: { in: numbers } },
                    { contractNumber: { in: numbers } }
                ]
            },
            include: {
                user: {
                    select: {
                        email: true,
                        companyName: true,
                        role: true
                    }
                }
            }
        });

        if (SIs.length > 0) {
            SIs.forEach(si => {
                console.log(`\n📄 S.I. trouvée (Booking #${si.bookingNumber})`);
                console.log(`👤 Créé par : ${si.user?.email}`);
                console.log(`🏢 Entreprise : ${si.user?.companyName}`);
                console.log(`📅 Date de création : ${si.createdAt.toLocaleString('fr-FR')}`);
            });
        } else {
             console.log("\n❌ Aucun document trouvé avec ces numéros.");
             
             // Check recent documents to help the user
             const recent = await prisma.billOfLading.findMany({
                 take: 5,
                 orderBy: { createdAt: 'desc' },
                 include: { user: { select: { email: true } } }
             });
             
             if (recent.length > 0) {
                 console.log("\nDernières S.I. créées :");
                 recent.forEach(r => console.log(`- #${r.bookingNumber} par ${r.user.email}`));
             }
        }
    } catch (error) {
        console.error("❌ Erreur :", error);
    } finally {
        await prisma.$disconnect();
    }
}

findSIByNumber();
