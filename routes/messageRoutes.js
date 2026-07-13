const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
// 1. Route pour récupérer la liste des conversations (Panneau gauche)
router.get('/conversations', messageController.getConversationsList);

// 2. Route pour récupérer l'historique de chat (Panneau droit)
router.get('/history/:targetUserId', messageController.getChatHistory);

// 3. Route pour envoyer un nouveau message (Barre de saisie inférieure)
router.post('/send', messageController.sendPrivateMessage);

module.exports = router;
