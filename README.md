# OOCL Draft Shipping Instructions (SI) Manager

Un outil moderne et premium pour la gestion et la création de spécimens de Bill of Lading (B/L) pour OOCL.

## 🚀 Fonctionnalités

- **Tableau de Bord Analytique** : Visualisation des performances mensuelles (Tonnage et TEU) avec graphiques interactifs (Recharts).
- **Gestion Dynamique** : Création et modification simplifiée des expéditeurs, destinataires, et marchandises.
- **Design Premium** : Interface inspirée par Duolingo avec un mélange de couleurs OOCL (Rouge) et d'élégance moderne.
- **Authentification Sécurisée** : Système complet de gestion des utilisateurs avec rôles (Admin/Client).
- **Gestion des Conteneurs** : Table adaptative pour gérer les types de conteneurs (20' / 40'), poids et volumes.

## 🛠️ Stack Technique

- **Framework** : [Next.js 15+](https://nextjs.org/) (App Router)
- **Base de données** : [SQLite](https://sqlite.org/) avec [Prisma ORM](https://www.prisma.io/)
- **Styling** : Vanilla CSS avec variables globales pour une personnalisation poussée.
- **Charts** : [Recharts](https://recharts.org/) pour la visualisation de données.
- **Authentification** : [Auth.js (NextAuth)](https://authjs.dev/)

## 📦 Installation et Configuration

### 1. Cloner le dépôt
```bash
git clone https://github.com/votre-user/oocl-draft-si-manager.git
cd oocl-draft-si-manager
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
Copiez le fichier d'exemple et générez un secret :
```bash
cp .env.example .env
```
Éditez le fichier `.env` pour y mettre votre `AUTH_SECRET`.

### 4. Initialiser la base de données
```bash
npx prisma generate
npx prisma db push
```

### 5. Lancer le serveur de développement
```bash
npm run dev
```
Accédez à [http://localhost:3000](http://localhost:3000).

## 🚀 Déploiement sur Vercel

Pour rendre cette application accessible partout via Internet, suivez ces étapes :

### 1. Préparer la Base de Données (Production)
SQLite ne fonctionne pas bien sur Vercel car le système de fichiers est temporaire.
1. Créez une base de données **PostgreSQL** gratuite sur [Supabase](https://supabase.com/) ou [Neon](https://neon.tech/).
2. Dans `prisma/schema.prisma`, modifiez le provider : `provider = "postgresql"`.
3. Poussez vos changements sur GitHub.

### 2. Déployer sur Vercel
1. Connectez-vous sur [Vercel](https://vercel.com/) et importez votre dépôt GitHub.
2. Ajoutez les **Environment Variables** suivantes dans les paramètres Vercel :
   - `DATABASE_URL` : L'URL de votre base PostgreSQL (fournie par Supabase/Neon).
   - `AUTH_SECRET` : Un code secret aléatoire (généré avec `openssl rand -base64 32`).
   - `AUTH_TRUST_HOST` : `true`.
3. Cliquez sur **Deploy**.

Vercel exécutera automatiquement `npm install` et `npx prisma generate` (grâce au script `postinstall`).

---

## 📄 Licence

Ce projet est la propriété de l'utilisateur. Toute reproduction ou utilisation commerciale doit faire l'objet d'une autorisation.
