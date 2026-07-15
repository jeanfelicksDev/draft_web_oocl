/**
 * setup_user_both_dbs.js
 * Crée ou met à jour l'utilisateur admin dans :
 *   1. La base Neon (PostgreSQL) lue depuis .env.local
 *   2. La base SQLite locale (dev.db) lue depuis .env
 *
 * Usage : node setup_user_both_dbs.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');

const EMAIL = 'jeanfelicks@gmail.com';
const PASSWORD = 'admin';

async function upsertUser(prisma, dbLabel) {
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    try {
        let user = await prisma.user.findUnique({ where: { email: EMAIL } });

        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    isAuthorized: true,
                    mustChangePassword: false,
                }
            });
            console.log(`✅ [${dbLabel}] Utilisateur ${EMAIL} mis à jour (mot de passe: "${PASSWORD}")`);
        } else {
            await prisma.user.create({
                data: {
                    email: EMAIL,
                    password: hashedPassword,
                    name: 'Jean Felicks',
                    companyName: 'OOCL (Admin)',
                    role: 'ADMIN',
                    isAuthorized: true,
                    mustChangePassword: false,
                    permissions: '[]',
                }
            });
            console.log(`✅ [${dbLabel}] Utilisateur ${EMAIL} créé (mot de passe: "${PASSWORD}")`);
        }
    } catch (err) {
        console.error(`❌ [${dbLabel}] Erreur :`, err.message);
    }
}

async function main() {
    // ─── 1. Base Neon (PostgreSQL) depuis .env.local ───────────────────────────
    console.log('\n📡 Connexion à la base Neon (PostgreSQL)...');
    const dotenvLocal = require('dotenv');
    dotenvLocal.config({ path: path.resolve(__dirname, '.env.local'), override: true });

    const neonUrl = process.env.DATABASE_URL;
    if (!neonUrl || !neonUrl.startsWith('postgresql')) {
        console.error('❌ DATABASE_URL dans .env.local ne semble pas être une URL PostgreSQL :', neonUrl);
    } else {
        const prismaNeon = new PrismaClient({ datasources: { db: { url: neonUrl } } });
        await upsertUser(prismaNeon, 'Neon PostgreSQL');
        await prismaNeon.$disconnect();
    }

    // ─── 2. Base SQLite locale (dev.db) depuis .env ────────────────────────────
    console.log('\n💾 Connexion à la base SQLite locale (dev.db)...');
    dotenvLocal.config({ path: path.resolve(__dirname, '.env'), override: true });

    const sqliteUrl = process.env.DATABASE_URL;
    if (!sqliteUrl || !sqliteUrl.startsWith('file:')) {
        console.error('❌ DATABASE_URL dans .env ne semble pas être une URL SQLite :', sqliteUrl);
    } else {
        const prismaSqlite = new PrismaClient({ datasources: { db: { url: sqliteUrl } } });
        await upsertUser(prismaSqlite, 'SQLite locale');
        await prismaSqlite.$disconnect();
    }

    console.log('\n🎉 Terminé ! Connectez-vous avec :');
    console.log(`   Email    : ${EMAIL}`);
    console.log(`   Mot de passe : ${PASSWORD}`);
}

main().catch(console.error);
