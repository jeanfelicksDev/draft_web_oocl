const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkSIs() {
    const blNumbers = ["4054102145", "4055066160"];
    
    try {
        console.log("Recherche des S.I. par numéro de BL...");
        
        const SIs = await prisma.billOfLading.findMany({
            where: {
                blNumber: {
                    in: blNumbers
                }
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
                console.log(`\nS.I. BL #${si.blNumber}`);
                console.log(`Créé par : ${si.user?.email || "Email inconnu"}`);
                console.log(`Entreprise : ${si.user?.companyName || "Non renseigné"}`);
                console.log(`Rôle : ${si.user?.role}`);
                console.log(`Date création : ${si.createdAt}`);
            });
        } else {
            console.log("❌ Aucune S.I. trouvée pour ces numéros dans 'billOfLading'.");
            
            // Tentative dans expectedBooking car le design ressemble à des bookings
            const bookings = await prisma.expectedBooking.findMany({
                where: {
                    bookingNumber: { in: blNumbers }
                },
                include: {
                    user: { select: { email: true, companyName: true } }
                }
            });
            
            if (bookings.length > 0) {
                 bookings.forEach(b => {
                    console.log(`\nBooking #${b.bookingNumber}`);
                    console.log(`Créé par : ${b.user?.email}`);
                    console.log(`Entreprise : ${b.user?.companyName}`);
                });
            } else {
                console.log("❌ Aucun enregistrement trouvé non plus dans 'expectedBooking'.");
            }
        }
    } catch (error) {
        console.error("❌ Erreur :", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSIs();
