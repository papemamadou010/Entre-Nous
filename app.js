const express = require('express');
const app = express();
require('dotenv').config();

// Changez la ligne 6 par ceci :
const db = require('./config/config/db');


// Middleware pour lire les données des formulaires et du JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rendre le dossier public accessible (CSS, Images JS)
app.use(express.static('public'));

// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
    res.send('<h1>Bienvenue sur EntreNous ! Le serveur fonctionne.</h1>');
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur : http://localhost:${PORT}`);
});
