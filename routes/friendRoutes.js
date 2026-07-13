const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

router.post('/request', friendController.sendFriendRequest);
router.post('/respond', friendController.respondToRequest);
router.get('/pending', friendController.getPendingRequests);
router.get('/list', friendController.getFriendsList);
router.get('/status/:targetUserId', friendController.getRelationStatus);
// Route pour extraire les compteurs d'amis et les correspondants communs
router.get('/mutual/:targetUserId', friendController.getMutualFriends);

module.exports = router;
