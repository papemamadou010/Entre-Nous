const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Route pour envoyer un message
router.post('/send', messageController.sendPrivateMessage);

// Route pour charger la discussion avec un ami spécifique
router.get('/history/:targetUserId', messageController.getChatHistory);

// Route pour récupérer la liste des conversations (Boîte de réception)
router.get('/conversations', messageController.getConversationsList);

module.exports = router;
