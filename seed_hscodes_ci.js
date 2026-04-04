/**
 * Script d'insertion des HS Codes usuels à l'exportation en Côte d'Ivoire
 * Exécuter avec : node seed_hscodes_ci.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// HS Codes principaux à l'exportation en Côte d'Ivoire
const hsCodes = [
    // ── CACAO (principal produit export CI) ──
    { code: "1801.00.00", description: "Cacao en fèves et brisures - brut ou torréfié" },
    { code: "1802.00.00", description: "Coques, pellicules et déchets de cacao" },
    { code: "1803.10.00", description: "Pâte de cacao non dégraissée" },
    { code: "1803.20.00", description: "Pâte de cacao totalement ou partiellement dégraissée" },
    { code: "1804.00.00", description: "Beurre, graisse et huile de cacao" },
    { code: "1805.00.00", description: "Poudre de cacao sans addition de sucre ou d'autres édulcorants" },
    { code: "1806.10.00", description: "Poudre de cacao avec addition de sucre ou édulcorants" },

    // ── CAFÉ ──
    { code: "0901.11.00", description: "Café non torréfié, non décaféiné (café vert)" },
    { code: "0901.12.00", description: "Café non torréfié, décaféiné" },
    { code: "0901.21.00", description: "Café torréfié, non décaféiné" },
    { code: "0901.90.00", description: "Coques et pellicules de café; succédanés du café" },

    // ── NOIX DE CAJOU / ANACARDE ──
    { code: "0801.31.00", description: "Noix de cajou (anacarde) en coques - fraîches ou sèches" },
    { code: "0801.32.00", description: "Noix de cajou (anacarde) sans coques - fraîches ou sèches" },

    // ── CAOUTCHOUC NATUREL ──
    { code: "4001.10.00", description: "Latex de caoutchouc naturel, même prévulcanisé" },
    { code: "4001.21.00", description: "Caoutchouc naturel fumé - feuilles" },
    { code: "4001.22.00", description: "Caoutchouc naturel techniquement spécifié (TSNR)" },
    { code: "4001.29.00", description: "Caoutchouc naturel sous d'autres formes" },

    // ── HUILE DE PALME ──
    { code: "1511.10.00", description: "Huile de palme brute" },
    { code: "1511.90.00", description: "Huile de palme raffinée et ses fractions" },
    { code: "1513.21.00", description: "Huile brute de palmiste" },
    { code: "1513.29.00", description: "Huile de palmiste raffinée et ses fractions" },

    // ── BANANE ──
    { code: "0803.90.10", description: "Bananes fraîches (autres que plantains)" },
    { code: "0803.10.00", description: "Plantains frais ou secs" },

    // ── ANANAS ──
    { code: "0804.30.00", description: "Ananas frais ou secs" },

    // ── MANGUE ET AUTRES FRUITS ──
    { code: "0804.50.00", description: "Goyaves, mangues et mangoustans - frais ou secs" },
    { code: "0810.90.00", description: "Autres fruits frais (papaye, avocat, etc.)" },

    // ── COTON ──
    { code: "5201.00.00", description: "Coton, non cardé ni peigné" },
    { code: "5202.10.00", description: "Déchets de filature de coton" },

    // ── BOIS ET PRODUITS FORESTIERS ──
    { code: "4403.21.00", description: "Bois bruts de bois tropicaux - Acajou (Swietenia spp.)" },
    { code: "4403.41.00", description: "Bois bruts - Bois sombres (Dark Red Meranti)" },
    { code: "4403.49.00", description: "Autres bois bruts tropicaux" },
    { code: "4407.21.00", description: "Bois sciés ou dédossés - Acajou (Swietenia spp.)" },
    { code: "4407.29.00", description: "Autres bois sciés ou dédossés tropicaux" },
    { code: "4408.31.00", description: "Feuilles pour placage de bois tropicaux" },

    // ── OR ET MÉTAUX PRÉCIEUX ──
    { code: "7108.12.00", description: "Or non monétaire - sous formes brutes (poudre, lingots)" },
    { code: "7108.13.00", description: "Or non monétaire - sous d'autres formes mi-ouvrées" },

    // ── POISSONS ET PRODUITS DE LA MER ──
    { code: "0302.89.00", description: "Poissons frais ou réfrigérés - autres" },
    { code: "0303.89.00", description: "Poissons congelés - autres" },
    { code: "0306.17.00", description: "Crevettes congelées" },
    { code: "0307.49.00", description: "Seiches et calmars congelés" },

    // ── PRODUITS PÉTROLIERS ──
    { code: "2709.00.00", description: "Huiles brutes de pétrole ou de minéraux bitumineux" },
    { code: "2710.12.00", description: "Essences légères (carburants aviation, essences)" },
    { code: "2710.19.00", description: "Autres huiles de pétrole raffinées (gazole, fuel)" },

    // ── SUCRE ──
    { code: "1701.12.00", description: "Sucre de canne brut" },
    { code: "1701.91.00", description: "Sucre blanc raffiné de canne" },

    // ── NOIX DE COLA ──
    { code: "0802.70.00", description: "Noix de kola (Cola spp.) - fraîches ou sèches" },

    // ── CUIRS ET PEAUX ──
    { code: "4101.20.00", description: "Cuirs et peaux entiers de bovins - bruts" },
    { code: "4101.50.00", description: "Cuirs et peaux de bovins - en morceaux" },

    // ── TABAC ──
    { code: "2401.10.00", description: "Tabac non fabriqué - non écôté" },
    { code: "2401.20.00", description: "Tabac non fabriqué - partiellement ou totalement écôté" },

    // ── GRAINES OLÉAGINEUSES ──
    { code: "1207.40.00", description: "Graines de sésame" },
    { code: "1207.99.00", description: "Autres graines et fruits oléagineux" },

    // ── VÉHICULES ET MACHINES (RÉEXPORTATION) ──
    { code: "8703.23.00", description: "Voitures de tourisme - cylindrée entre 1500 et 3000 cm³" },
    { code: "8704.21.00", description: "Véhicules pour transport marchandises - diesel ≤5T" },
    { code: "8708.99.00", description: "Parties et accessoires de véhicules automobiles" },

    // ── DÉCHETS ET FERRAILLE ──
    { code: "7204.10.00", description: "Déchets et débris de fonte" },
    { code: "7204.49.00", description: "Autres déchets et débris de fer ou d'acier (ferraille)" },
];

async function main() {
    console.log(`\n🌍 Insertion des HS Codes d'exportation - Côte d'Ivoire`);
    console.log(`📦 ${hsCodes.length} codes à traiter...\n`);

    // Trouver le premier admin pour assigner les codes
    const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true, email: true }
    });

    if (!adminUser) {
        // Prendre le premier utilisateur disponible
        const anyUser = await prisma.user.findFirst({ select: { id: true, email: true } });
        if (!anyUser) {
            console.error("❌ Aucun utilisateur trouvé dans la base !");
            return;
        }
        console.log(`ℹ️  Utilisation de l'utilisateur: ${anyUser.email}`);
        await insertCodes(anyUser.id);
    } else {
        console.log(`ℹ️  Utilisateur admin: ${adminUser.email}`);
        await insertCodes(adminUser.id);
    }
}

async function insertCodes(userId) {
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // D'abord, supprimer les anciens codes génériques (BANANE, CACAO sans code précis)
    const deleted = await prisma.hSCode.deleteMany({
        where: {
            userId,
            description: { in: ["BANANE", "CACAO"] }
        }
    });
    if (deleted.count > 0) {
        console.log(`🗑️  ${deleted.count} ancien(s) code(s) générique(s) supprimé(s)\n`);
    }

    for (const hs of hsCodes) {
        try {
            const existing = await prisma.hSCode.findFirst({
                where: { code: hs.code, userId }
            });

            if (existing) {
                await prisma.hSCode.update({
                    where: { id: existing.id },
                    data: { description: hs.description }
                });
                console.log(`  🔄 MAJ: ${hs.code} - ${hs.description.substring(0, 50)}...`);
                updated++;
            } else {
                await prisma.hSCode.create({
                    data: { code: hs.code, description: hs.description, userId }
                });
                console.log(`  ✅ Ajout: ${hs.code} - ${hs.description.substring(0, 50)}`);
                inserted++;
            }
        } catch (e) {
            console.error(`  ❌ Erreur pour ${hs.code}: ${e.message}`);
            errors++;
        }
    }

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`✅ Insertions: ${inserted}`);
    console.log(`🔄 Mises à jour: ${updated}`);
    if (errors > 0) console.log(`❌ Erreurs: ${errors}`);
    console.log(`📊 Total traité: ${inserted + updated + errors} / ${hsCodes.length}`);
    console.log(`${'─'.repeat(60)}\n`);
}

main()
    .catch(e => console.error('Erreur fatale:', e))
    .finally(() => prisma.$disconnect());
