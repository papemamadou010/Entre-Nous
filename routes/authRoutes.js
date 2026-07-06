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
router.get('/me', async (req, res) => {
    try {
        if (req.session && req.session.userId) {
            // Requête SQL pour extraire le profil ultra-frais
            const [rows] = await db.execute(
                'SELECT id, fullname, email, role, bio, phone, address, avatar_url FROM users WHERE id = ?', 
                [req.session.userId]
            );

            if (rows.length > 0) {
                // Renvoie le profil complet lu directement dans MariaDB
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

// Route pour mettre à jour la photo de profil en Base64
router.put('/update-avatar', authController.updateAvatar);

// Route pour enregistrer la biographie, le téléphone et la ville
router.put('/update-profile', authController.updateProfileInfos);
// Route publique pour voir le profil de n'importe quel membre
router.get('/public-users/:id', authController.getPublicProfile);



module.exports = router;
