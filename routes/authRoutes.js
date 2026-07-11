const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

// IMPORTATION DE LA CONNEXION MYSQL POUR LA ROUTE DYNAMIQUE /ME
const db = require('../config/db');

// Vos routes d'authentification existantes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);

// Route pour récupérer les suggestions des membres inscrits (MySQL)
router.get('/suggestions', adminController.getSuggestions);

// CORRECTION CRUCIALE : Récupère TOUTES les informations en temps réel dans MySQL
// Correction de la route /me pour renvoyer un objet JSON direct
router.get('/me', async (req, res) => {
    try {
        if (req.session && req.session.userId) {
            const [rows] = await db.execute(
                'SELECT id, fullname, email, role, bio, phone, address, avatar_url FROM users WHERE id = ?', 
                [req.session.userId]
            );

            if (rows.length > 0) {
                // IMPORTANT : On extrait l'objet unique index 0 pour éviter d'envoyer un tableau
                res.json(rows[0]); 
            } else {
                res.status(404).send("Utilisateur introuvable");
            }
        } else {
            res.status(401).send("Non connecté");
        }
    } catch (error) {
        console.error("Erreur API /auth/me :", error);
        res.status(500).send("Erreur serveur : " + error.message);
    }
});

// Route publique pour voir le profil de n'importe quel membre sans blocage admin
router.get('/public-users/:id', authController.getPublicProfile);


module.exports = router;
