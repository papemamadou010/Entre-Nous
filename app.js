const express = require('express');
const session = require('express-session');
const path = require('path'); // Module natif pour gérer les chemins de fichiers sans erreur
const app = express();
require('dotenv').config();

// Importer la connexion BDD et les routes
const db = require('./config/db');
const messageRoutes = require('./routes/messageRoutes');



// 🛠️ SCRIPT AUTOMATIQUE DE MISE À NIVEAU DE LA BASE DE DONNÉES (AVATAR + BIO + POSTS + LIKES)
db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url LONGTEXT NULL")
  .then(() => db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NULL"))
  .then(() => db.execute("ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL"))
  .then(() => db.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url LONGTEXT NULL"))
  .then(() => db.execute(`
    CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_post (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `)) // <-- CRÉE LA TABLE LIKES EN INTERDISANT STRICTEMENT LES DOUBLONS
  .then(() => console.log("🚀 BASE DE DONNÉES PRÊTE : Tous les modules et la table 'likes' sont activés !"))
  .catch(err => console.error("❌ Erreur de mise à niveau BDD :", err.message));


  // 🛠️ SCRIPT AUTOMATIQUE DE MISE À NIVEAU DE LA BASE DE DONNÉES (AVATAR + BIO + POSTS + LIKES + COMMENTS)
db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url LONGTEXT NULL")
  .then(() => db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NULL"))
  .then(() => db.execute("ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL"))
  .then(() => db.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url LONGTEXT NULL"))
  .then(() => db.execute(`
    CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_post (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `))
  .then(() => db.execute(`
    CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `)) // <-- CRÉE LA TABLE COMMENTS LIÉE AUX UTILISATEURS ET AUX POSTS
  .then(() => console.log("🚀 BASE DE DONNÉES PRÊTE : Tous les modules, les likes et la table 'comments' sont activés !"))
  .catch(err => console.error("❌ Erreur de mise à niveau BDD :", err.message));


// 🛠️ SCRIPT AUTOMATIQUE DE MISE À NIVEAU DE LA BASE DE DONNÉES
// Configuration des colonnes pour l'avatar, la bio et l'image des publications
db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url LONGTEXT NULL")
  .then(() => db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NULL"))
  .then(() => db.execute("ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL"))
  .then(() => db.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url LONGTEXT NULL")) // ACTIVE LA COLONNE DANS POSTS
  .then(() => console.log("🚀 BASE DE DONNÉES PRÊTE : Tous les modules et 'image_url' sont activés !"))
  .catch(err => console.error("❌ Erreur de mise à niveau BDD :", err.message));

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const friendRoutes = require('./routes/friendRoutes');
 // 1. IMPORTATION DES ROUTES ADMIN

// 🛠️ UNIQUE ET UNIQUE SCRIPT AUTOMATIQUE DE MISE À NIVEAU DE LA BASE DE DONNÉES
// (AVATAR + BIO + POSTS + LIKES + COMMENTS + PRIVATE MESSAGES + FRIENDSHIPS)
db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url LONGTEXT NULL")
  .then(() => db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NULL"))
  .then(() => db.execute("ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL"))
  .then(() => db.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url LONGTEXT NULL"))
  .then(() => db.execute(`
    CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_post (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `))
  .then(() => db.execute(`
    CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `))
  .then(() => db.execute(`
    CREATE TABLE IF NOT EXISTS private_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `))
  .then(() => db.execute(`
    CREATE TABLE IF NOT EXISTS friendships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        requester_id INT NOT NULL,
        receiver_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_friendship (requester_id, receiver_id),
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)) // <-- CRÉE LA TABLE DE VERROUILLAGE DES INVITATIONS D'AMIS
  .then(() => console.log("🚀 BASE DE DONNÉES PRÊTE : Tous les modules, les messages et la table 'friendships' sont activés !"))
  .catch(err => console.error("❌ Erreur critique de mise à niveau BDD :", err.message));




// Autoriser le passage des très longues chaînes de caractères (Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


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
app.use('/messages', messageRoutes);
app.use('/friends', friendRoutes);


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
