const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAdmin = require('../middleware/adminMiddleware'); // Ton gardien

// Toutes les requêtes qui passent par ici vérifient d'abord si la personne est 'admin'
router.get('/users', isAdmin, adminController.getAllUsers);
router.get('/posts', isAdmin, adminController.getAllPosts);

// Nouvelle route pour récupérer la fiche d'inscription d'un seul membre spécifique
router.get('/users/:id', isAdmin, adminController.getUserDetails);

// Route pour le bouton de modification du profil de Pape
router.put('/users/:id', isAdmin, adminController.updateUserProfile);

// Route pour récupérer les suggestions des membres inscrits (Ligne corrigée)
router.get('/suggestions', isAdmin, adminController.getSuggestions);

module.exports = router;
