const express = require('express');
const app = express();
require('dotenv').config();

// Importer la connexion à la base de données
const db = require('./config/db');

// Importer les routes d'authentification
const authRoutes = require('./routes/authRoutes');

// Middlewares pour récupérer les données envoyées par les formulaires
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rendre le dossier public accessible
app.use(express.static('public'));

// Activer les routes d'authentification
app.use('/auth', authRoutes);

// Route d'accueil temporaire
app.get('/', (req, res) => {
    res.send('<h1>Bienvenue sur EntreNous ! Le serveur fonctionne.</h1>');
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur : http://localhost:${PORT}`);
});
