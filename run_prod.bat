@echo off
echo ===================================================
echo  OOCL Draft SI Manager - Demarrage Production
echo ===================================================
echo.
echo Configuration des variables d'environnement de Production...
set DATABASE_URL=postgresql://neondb_owner:npg_KULyzug76ZvT@ep-morning-water-agi3yojo-pooler.c-2.eu-central-1.aws.neon.tech/draft_oocl?sslmode=require
set DIRECT_URL=postgresql://neondb_owner:npg_KULyzug76ZvT@ep-morning-water-agi3yojo.c-2.eu-central-1.aws.neon.tech/draft_oocl?sslmode=require
set AUTH_SECRET=46e4cd1d63e39229bbea0808b96d65ee4dec6462bbda4304ba87a4937cd19eb5
set NEXTAUTH_SECRET=46e4cd1d63e39229bbea0808b96d65ee4dec6462bbda4304ba87a4937cd19eb5
set NEXTAUTH_URL=http://localhost:3002
set AUTH_TRUST_HOST=true
set PORT=3002
echo.
echo [1/3] Generation du client Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo Erreur lors de la generation du client Prisma.
    pause
    exit /b %errorlevel%
)
echo.
echo [2/3] Synchronisation de la base de donnees Neon...
call npx prisma db push
if %errorlevel% neq 0 (
    echo Erreur lors du push de la base de donnees.
    pause
    exit /b %errorlevel%
)
echo.
echo [2.5/3] Initialisation du compte administrateur jeanfelicks@gmail.com...
call node create_admin.js
if %errorlevel% neq 0 (
    echo Erreur lors de la creation du compte administrateur.
    pause
    exit /b %errorlevel%
)
echo.
echo [3/3] Construction (Build) de l'application Next.js...
call npm run build
if %errorlevel% neq 0 (
    echo Erreur lors de la construction Next.js.
    pause
    exit /b %errorlevel%
)
echo.
echo ===================================================
echo Lancement du serveur de Production sur le port 3002...
echo Interface disponible sur: http://localhost:3002
echo Appuyez sur Ctrl+C pour arreter le serveur.
echo ===================================================
call npm run start
pause
