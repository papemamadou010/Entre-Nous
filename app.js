const express = require('express');
const session = require('express-session');
const path = require('path'); // Module natif pour gérer les chemins de fichiers sans erreur
const app = express();
require('dotenv').config();

// Importer la connexion BDD et les routes
const db = require('./config/db');


// 🛠️ SCRIPT AUTOMATIQUE DE MISE À NIVEAU DE LA BASE DE DONNÉES (AJOUT AVATAR + BIO)
db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url LONGTEXT NULL")
  .then(() => db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NULL"))
  .then(() => db.execute("ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL"))
  .then(() => console.log("🚀 BASE DE DONNÉES PRÊTE : Colonnes 'avatar_url' et 'bio' activées !"))
  .catch(err => console.error("❌ Erreur de mise à niveau BDD :", err.message));

// 🛠️ SCRIPT AUTOMATIQUE DE MISE À NIVEAU DE LA BASE DE DONNÉES
// Crée et configure la colonne avatar_url au format maximal LONGTEXT pour les images Base64
db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url LONGTEXT NULL")
  .then(() => db.execute("ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL"))
  .then(() => console.log("🚀 BASE DE DONNÉES ENTRAÎNÉE : Colonne 'avatar_url' activée en LONGTEXT !"))
  .catch(err => console.error("❌ Erreur de mise à niveau BDD :", err.message));

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes'); // 1. IMPORTATION DES ROUTES ADMIN

// Middlewares obligatoires
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration des Sessions Utilisateurs
app.use(session({
    secret: 'le_secret_de_notre_reseau_social_entrenous',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Session active pendant 24h
}));

// Rendre les dossiers accessibles au navigateur
app.use(express.static('public'));
app.use(express.static('views'));

// Activer les modules de l'application
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/admin-api', adminRoutes); // 2. ACTIVATION DU MODULE SECRÈT ADMIN

// Route d'accueil principale corrigée (affiche index.html dès l'entrée sur le site)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
// Écraser ou ajouter cette route propre tout en bas de app.js (avant app.listen)
app.get('/forgot-password.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur : http://localhost:${PORT}`);
});
