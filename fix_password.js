const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function updatePassword() {
    // Note: The user said "jeanfelicks@gmail.com" this time, vs "jeanfelicks11@gmail.com" earlier.
    // I will check for both just in case it was a typo.
    const emails = ["jeanfelicks@gmail.com", "jeanfelicks11@gmail.com"];
    const newPassword = "admin";

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        for (const email of emails) {
            console.log(`Vérification de ${email}...`);
            const user = await prisma.user.findUnique({
                where: { email: email }
            });

            if (user) {
                console.log(`Mise à jour du mot de passe pour ${email}...`);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { password: hashedPassword }
                });
                console.log(`✅ Mot de passe de ${email} mis à jour avec succès !`);
            } else {
                console.log(`❌ ${email} non trouvé.`);
            }
        }
    } catch (error) {
        console.error("❌ Erreur :", error);
    } finally {
        await prisma.$disconnect();
    }
}

updatePassword();
