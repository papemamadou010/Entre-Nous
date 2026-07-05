const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// IMPORTATION OBLIGATOIRE POUR SUPPRIMER LE MESSAGE "NOT DEFINED"
const adminController = require('../controllers/adminController');

// Vos routes d'authentification existantes (Connexion, Inscription, Déconnexion)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);

// Route pour récupérer les suggestions des membres inscrits (MySQL)
router.get('/suggestions', adminController.getSuggestions);

// Route manquante qui permet à home.html de savoir qui est connecté
router.get('/me', (req, res) => {
    if (req.session && req.session.userId) {
        // Renvoie les infos stockées dans la session lors de la connexion
        res.json({
            id: req.session.userId,
            fullname: req.session.userFullname,
            role: req.session.userRole
        });
    } else {
        res.status(401).send("Non connecté");
    }
});

module.exports = router;
