const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAdmin = require('../middleware/adminMiddleware'); // Importation de ton gardien

// Toutes les requêtes qui passent par ici vérifient d'abord si la personne est 'admin'
router.get('/users', isAdmin, adminController.getAllUsers);
router.get('/posts', isAdmin, adminController.getAllPosts);

module.exports = router;
