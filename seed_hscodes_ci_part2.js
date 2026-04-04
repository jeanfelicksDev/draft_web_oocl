/**
 * Complément HS Codes - Exportations Côte d'Ivoire (Part 2)
 * Optimisé : batch upsert via createMany + skipDuplicates
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const additionalHsCodes = [
    // Racines et tubercules
    { code: "0714.10.00", description: "Racines de manioc - fraîches, réfrigérées ou congelées" },
    { code: "0714.20.00", description: "Patates douces - fraîches, réfrigérées ou congelées" },
    { code: "0714.50.00", description: "Ignames (Dioscorea spp.) - fraîches ou sèches" },
    // Légumes
    { code: "0702.00.00", description: "Tomates fraîches ou réfrigérées" },
    { code: "0709.60.00", description: "Piments (Capsicum) frais - poivrons et piments forts" },
    { code: "0710.80.00", description: "Légumes congelés (gombos, haricots verts, etc.)" },
    // Riz et céréales
    { code: "1006.10.00", description: "Riz non décortiqué (paddy)" },
    { code: "1006.20.00", description: "Riz décortiqué (cargo/brun)" },
    { code: "1006.30.00", description: "Riz semi-blanchi ou blanchi" },
    { code: "1005.90.00", description: "Maïs - autres que semence" },
    // Légumineuses
    { code: "0713.33.00", description: "Haricot commun (Phaseolus vulgaris) - sec, écossé" },
    { code: "0713.40.00", description: "Lentilles - sèches, écossées" },
    // Noix de coco
    { code: "0801.21.00", description: "Noix de coco fraîches - en coques" },
    { code: "0801.22.00", description: "Noix de coco fraîches - sans coques" },
    // Épices et aromates
    { code: "0906.11.00", description: "Cannelle et fleurs de cannelier non broyées ni pulvérisées" },
    { code: "0907.00.00", description: "Clous de girofle - entiers, tiges et griffes" },
    { code: "0908.21.00", description: "Noix muscades - non broyées ni pulvérisées" },
    { code: "0910.11.00", description: "Gingembre - non broyé ni pulvérisé" },
    { code: "0904.21.00", description: "Poivre séché - non broyé ni pulvérisé" },
    { code: "0905.10.00", description: "Vanille - non broyée ni pulvérisée" },
    // Plantes médicinales
    { code: "1211.90.00", description: "Plantes et parties de plantes à usage pharmaceutique ou parfumerie" },
    { code: "1301.20.00", description: "Gomme arabique" },
    { code: "1301.90.00", description: "Autres gommes et résines naturelles" },
    // Huiles végétales
    { code: "1508.10.00", description: "Huile d'arachide brute" },
    { code: "1508.90.00", description: "Huile d'arachide raffinée et ses fractions" },
    { code: "1515.50.00", description: "Huile de sésame et ses fractions" },
    { code: "1515.90.00", description: "Autres graisses et huiles végétales fixes (karité, shea, etc.)" },
    { code: "1516.20.00", description: "Graisses et huiles végétales et fractions hydrogénées" },
    // Farine et amidons
    { code: "1102.20.00", description: "Farine de maïs" },
    { code: "1108.14.00", description: "Amidon de manioc (tapioca)" },
    // Produits de la mer
    { code: "0301.99.00", description: "Poissons vivants - autres" },
    { code: "0304.61.00", description: "Filets de tilapia congelés" },
    { code: "0304.89.00", description: "Filets de poissons congelés - autres" },
    { code: "0305.49.00", description: "Autres poissons fumés" },
    { code: "0305.59.00", description: "Autres poissons séchés, salés" },
    { code: "1604.14.00", description: "Préparations et conserves de thon et bonite" },
    { code: "1604.20.00", description: "Autres préparations et conserves de poissons" },
    // Engrais et produits chimiques
    { code: "3101.00.00", description: "Engrais d'origine animale ou végétale" },
    { code: "3102.10.00", description: "Urée - teneur en azote > 45%" },
    { code: "3104.20.00", description: "Chlorure de potassium - engrais" },
    { code: "3105.20.00", description: "Engrais minéraux ou chimiques NPK" },
    { code: "3808.91.00", description: "Insecticides conditionnés pour la vente au détail" },
    { code: "3808.92.00", description: "Fongicides conditionnés pour la vente au détail" },
    { code: "3808.93.00", description: "Herbicides, inhibiteurs de germination et régulateurs de croissance" },
    // Médicaments
    { code: "3004.20.00", description: "Médicaments contenant des antibiotiques" },
    { code: "3004.90.00", description: "Autres médicaments conditionnés pour la vente au détail" },
    // Minéraux et métaux
    { code: "2601.11.00", description: "Minerais de fer et leurs concentrés non agglomérés" },
    { code: "2606.00.00", description: "Minerais d'aluminium et leurs concentrés (bauxite)" },
    { code: "7102.31.00", description: "Diamants non industriels - non travaillés" },
    { code: "7106.91.00", description: "Argent - sous formes brutes" },
    // Bois (compléments)
    { code: "4401.11.00", description: "Bois de chauffage en rondins, bûches, tronçons" },
    { code: "4401.21.00", description: "Bois en plaquettes ou en particules - feuillus" },
    { code: "4410.11.00", description: "Panneaux de particules de bois" },
    { code: "4411.12.00", description: "Panneaux de fibres de bois à haute densité (HDF)" },
    { code: "4412.31.00", description: "Contreplaqué de bois tropicaux" },
    { code: "4415.10.00", description: "Caisses, caissettes et emballages similaires en bois" },
    // Caoutchouc et plastiques
    { code: "4005.10.00", description: "Caoutchouc mélangé non vulcanisé - additionné de noir de carbone" },
    { code: "4011.10.00", description: "Pneumatiques neufs pour voitures de tourisme" },
    { code: "4011.20.00", description: "Pneumatiques neufs pour autobus et camions" },
    { code: "3901.10.00", description: "Polyéthylène de densité < 0,94 - formes primaires" },
    { code: "3902.10.00", description: "Polypropylène - formes primaires" },
    // Textiles et vêtements
    { code: "5205.11.00", description: "Fils de coton simples non peignés" },
    { code: "5208.21.00", description: "Tissus de coton >= 85% écrus - armure toile <= 100 g/m2" },
    { code: "5209.11.00", description: "Tissus de coton >= 85% non écrus - armure toile > 200 g/m2" },
    { code: "6109.10.00", description: "T-shirts et gilets de corps en coton - bonneterie" },
    { code: "6203.42.00", description: "Pantalons et combinaisons pour hommes en coton" },
    { code: "6204.62.00", description: "Pantalons et combinaisons pour femmes en coton" },
    { code: "6302.21.00", description: "Linge de lit imprimé en coton" },
    // Produits alimentaires transformés
    { code: "1902.30.00", description: "Autres pâtes alimentaires (spaghetti, macaroni)" },
    { code: "2002.10.00", description: "Tomates entières ou en morceaux - autrement préparées" },
    { code: "2007.99.00", description: "Autres confitures, gelées et marmelades" },
    { code: "2009.89.00", description: "Jus d'autres fruits ou légumes non fermentés" },
    { code: "2101.11.00", description: "Extraits et préparations à base de café" },
    { code: "2202.10.00", description: "Eaux minérales et gazéifiées avec addition de sucre" },
    { code: "2203.00.00", description: "Bières de malt" },
    { code: "2208.40.00", description: "Rhum et eaux-de-vie de sucrerie" },
    { code: "2304.00.00", description: "Tourteaux d'huile de soja - résidus d'extraction" },
    { code: "2306.60.00", description: "Tourteaux d'huile de palmiste - résidus d'extraction" },
    // Cosmétiques et soins
    { code: "3301.29.00", description: "Huiles essentielles autres que d'agrumes (vétiver, citronnelle)" },
    { code: "3303.00.00", description: "Parfums et eaux de toilette" },
    { code: "3304.99.00", description: "Préparations de beauté ou de maquillage - autres" },
    { code: "3305.10.00", description: "Shampoings" },
    { code: "3401.11.00", description: "Savons de toilette en barres ou en pains" },
    { code: "3402.20.00", description: "Préparations détergentes pour ménage - conditionnées" },
    // Matériaux de construction
    { code: "2523.21.00", description: "Ciment gris Portland" },
    { code: "2523.29.00", description: "Autres ciments Portland" },
    { code: "6907.21.00", description: "Carreaux et dalles de revêtement en céramique non vernissée" },
    { code: "6908.90.00", description: "Carreaux et dalles de revêtement en céramique vernissée" },
    // Equipements électriques et électroniques
    { code: "8544.49.00", description: "Conducteurs électriques pour tensions <= 1000 V - autres" },
    { code: "8539.50.00", description: "Lampes et tubes à diodes électroluminescentes (LED)" },
    { code: "8507.60.00", description: "Accumulateurs électriques au lithium" },
    { code: "8517.12.00", description: "Téléphones pour réseaux cellulaires (smartphones)" },
    { code: "8471.30.00", description: "Machines automatiques de traitement de l'information portables" },
    // Véhicules (compléments)
    { code: "8701.92.00", description: "Tracteurs à roues - puissance entre 18 et 37 kW" },
    { code: "8716.39.00", description: "Autres remorques et semi-remorques" },
    // Emballages et papier
    { code: "4819.10.00", description: "Boîtes et caisses en papier ou carton ondulé" },
    { code: "4820.10.00", description: "Registres, livres de comptabilité, carnets en papier" },
    // Déchets recyclables
    { code: "7602.00.00", description: "Déchets et débris d'aluminium" },
    { code: "7404.00.00", description: "Déchets et débris de cuivre" },
];

async function main() {
    console.log(`\n🌍 Complément HS Codes - Côte d'Ivoire (batch mode)`);
    console.log(`📦 ${additionalHsCodes.length} codes à insérer...\n`);

    // Récupérer l'utilisateur admin
    const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true, email: true }
    }) ?? await prisma.user.findFirst({ select: { id: true, email: true } });

    if (!adminUser) { console.error('❌ Aucun utilisateur trouvé !'); return; }
    console.log(`ℹ️  Utilisateur: ${adminUser.email}`);

    // Récupérer les codes déjà en base pour cet utilisateur
    const existingCodes = await prisma.hSCode.findMany({
        where: { userId: adminUser.id },
        select: { code: true }
    });
    const existingSet = new Set(existingCodes.map(c => c.code));
    console.log(`📋 Codes déjà en base: ${existingSet.size}`);

    // Filtrer pour ne garder que les nouveaux
    const toInsert = additionalHsCodes
        .filter(hs => !existingSet.has(hs.code))
        .map(hs => ({ ...hs, userId: adminUser.id }));

    const skipped = additionalHsCodes.length - toInsert.length;
    console.log(`⏭️  Déjà présents: ${skipped}`);
    console.log(`🆕 À insérer: ${toInsert.length}\n`);

    if (toInsert.length === 0) {
        console.log('✅ Tous les codes sont déjà en base.');
    } else {
        // Insertion en batch (une seule requête)
        const result = await prisma.hSCode.createMany({
            data: toInsert,
            skipDuplicates: true
        });
        console.log(`✅ Insérés avec succès: ${result.count} codes`);
    }

    const total = await prisma.hSCode.count({ where: { userId: adminUser.id } });
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`📊 TOTAL en base : ${total} codes HS`);
    console.log(`${'═'.repeat(50)}\n`);
}

main()
    .catch(e => { console.error('Erreur fatale:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
