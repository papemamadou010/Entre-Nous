const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// 🔓 ROUTE MANQUANTE ENFIN CORRIGÉE : Pour lire les publications sur le fil d'actualité !
router.get('/', postController.getFeedPosts);

// Route propre pour la création des publications
router.post('/create', postController.createPost);

// Route publique pour récupérer uniquement les posts d'un utilisateur spécifique
router.get('/user/:id', postController.getUserPosts);

module.exports = router;
