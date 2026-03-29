const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function updateAdmin() {
    const oldEmail = "admin@test.com";
    const newEmail = "jeanfelicks11@gmail.com";
    const newPassword = "admin";

    try {
        console.log(`Recherche du compte admin ${oldEmail}...`);
        const admin = await prisma.user.findUnique({
            where: { email: oldEmail }
        });

        if (!admin) {
            console.error(`Compte ${oldEmail} non trouvé.`);
            // Check if there are ANY admins
            const anyAdmins = await prisma.user.findMany({
                where: { role: "ADMIN" }
            });
            console.log("Admins trouvés dans la base :", anyAdmins.map(u => u.email));
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log(`Mise à jour du compte ${oldEmail} vers ${newEmail}...`);
        const updated = await prisma.user.update({
            where: { id: admin.id },
            data: {
                email: newEmail,
                password: hashedPassword
            }
        });

        console.log("✅ Compte admin mis à jour avec succès !");
        console.log("Nouveau mail :", updated.email);
        console.log("Nouveau mot de passe : (caché)");
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour :", error);
    } finally {
        await prisma.$disconnect();
    }
}

updateAdmin();
