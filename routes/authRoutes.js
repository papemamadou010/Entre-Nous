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
// CORRECTION CRUCIALE : Récupère TOUTES les informations (Y COMPRIS LES CHAMPS FACEBOOK)
router.get('/me', async (req, res) => {
    try {
        if (req.session && req.session.userId) {
            // AJOUT DES 6 COLONNES MANQUANTES DANS LE SELECT
            const [rows] = await db.execute(
                `SELECT id, fullname, email, role, bio, phone, address, avatar_url,
                        birthdate, gender, relationship_status, workplace, 
                        education_university, education_highschool 
                 FROM users WHERE id = ?`, 
                [req.session.userId]
            );

            if (rows.length > 0) {
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

// Route publique pour la recherche d'amis inscrits
router.get('/search', authController.searchUsers);

// 👤 ROUTE DE MISE À JOUR DU PROFIL ENRICHI STYLE FACEBOOK
router.put('/update-profile', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        // On attrape toutes les nouvelles cases envoyées par le profil
        const { 
            bio, phone, address, 
            birthdate, gender, relationship_status, 
            workplace, education_university, education_highschool 
        } = req.body;
        
        const userId = req.session.userId;

        // On enregistre tout d'un coup au bon endroit dans MySQL
        const query = `
            UPDATE users 
            SET bio = ?, phone = ?, address = ?, 
                birthdate = ?, gender = ?, relationship_status = ?, 
                workplace = ?, education_university = ?, education_highschool = ? 
            WHERE id = ?
        `;
        
        await db.execute(query, [
            bio || null, phone || null, address || null, 
            birthdate || null, gender || null, relationship_status || null, 
            workplace || null, education_university || null, education_highschool || null, 
            userId
        ]);

        res.status(200).send("Profil complet mis à jour dans MySQL avec succès !");
    } catch (error) {
        console.error("❌ Erreur lors du UPDATE profile complet :", error);
        res.status(500).send("Erreur serveur lors de la mise à jour");
    }
});


module.exports = router;
