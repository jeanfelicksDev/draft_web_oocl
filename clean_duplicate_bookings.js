/**
 * clean_duplicate_bookings.js
 * Supprime les doublons de bookingNumber dans la base Neon.
 * Pour chaque groupe de doublons, garde le plus récent (updatedAt le plus grand)
 * et supprime les autres (avec leurs containers en cascade).
 *
 * Usage : node clean_duplicate_bookings.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local'), override: true });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Recherche des doublons de booking...\n');

    // Récupérer tous les BL, grouper par (bookingNumber, userId)
    const allBLs = await prisma.billOfLading.findMany({
        orderBy: { createdAt: 'asc' }
    });

    // Grouper par clé composite
    const groups = {};
    for (const bl of allBLs) {
        const key = `${bl.bookingNumber}__${bl.userId}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(bl);
    }

    // Trouver les groupes avec doublons
    const duplicateGroups = Object.entries(groups).filter(([, list]) => list.length > 1);

    if (duplicateGroups.length === 0) {
        console.log('✅ Aucun doublon trouvé !');
        return;
    }

    console.log(`⚠️  ${duplicateGroups.length} groupe(s) de doublons trouvés :\n`);

    let totalDeleted = 0;

    for (const [key, list] of duplicateGroups) {
        const [bookingNumber] = key.split('__');
        console.log(`📋 Booking #${bookingNumber} — ${list.length} entrées`);

        // Trier : garder le plus récent (updatedAt DESC)
        list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const toKeep = list[0];
        const toDelete = list.slice(1);

        console.log(`   ✅ Conservé  : id=${toKeep.id} (${toKeep.saveStatus}, updatedAt=${toKeep.updatedAt})`);

        for (const dup of toDelete) {
            console.log(`   🗑️  Supprimé  : id=${dup.id} (${dup.saveStatus}, updatedAt=${dup.updatedAt})`);
            // Les containers sont supprimés en cascade (onDelete: Cascade)
            await prisma.billOfLading.delete({ where: { id: dup.id } });
            totalDeleted++;
        }
        console.log('');
    }

    console.log(`\n🎉 Terminé ! ${totalDeleted} doublon(s) supprimé(s).`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
