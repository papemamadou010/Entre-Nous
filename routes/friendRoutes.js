const express = require('express');
const router = express.Router();
// IMPORTATION DE LA SÉCURITÉ DE LA BASE DE DONNÉES MANQUANTE
const db = require('../config/db');

const friendController = require('../controllers/friendController');


router.post('/request', friendController.sendFriendRequest);
router.post('/respond', friendController.respondToRequest);
router.get('/pending', friendController.getPendingRequests);
router.get('/list', friendController.getFriendsList);
router.get('/status/:targetUserId', friendController.getRelationStatus);
// Route pour extraire les compteurs d'amis et les correspondants communs
router.get('/mutual/:targetUserId', friendController.getMutualFriends);

// Route pour récupérer uniquement la liste des amis acceptés pour la modale de partage
router.get('/my-accepted-friends', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) return res.status(401).send("Non connecté");
        const [rows] = await db.execute(
            `SELECT id, fullname, avatar_url FROM users WHERE id IN (
                SELECT IF(requester_id = ?, receiver_id, requester_id) FROM friendships WHERE status = 'accepted' AND (requester_id = ? OR receiver_id = ?)
            )`, [req.session.userId, req.session.userId, req.session.userId]
        );
        res.json(rows);
    } catch (err) { res.status(500).send(err.message); }
});

// Route pour insérer un message de partage automatique dans la table des messages privés
// ROUTE DE PARTAGE PUBLIC : Crée un nouveau post sur le fil d'actualité de Pape
router.post('/execute-share-message', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) return res.status(401).send("Non connecté");
        const senderId = req.session.userId;
        const { postId } = req.body;

        // 1. On va chercher le texte et l'image du post d'origine que Pape veut partager
        const [originalPost] = await db.execute(
            'SELECT content, image_url FROM posts WHERE id = ?', 
            [postId]
        );

        if (originalPost.length === 0) return res.status(404).send("Publication introuvable");

        const originalContent = originalPost[0].content || '';
        const originalImage = originalPost[0].image_url || null;

        // 2. On fabrique le nouveau texte partagé
        const newSharedContent = `🔄 Partagé :\n"${originalContent}"`;

        // 3. On insère la nouvelle publication sur le profil de l'utilisateur connecté (Pape)
        const insertQuery = `
            INSERT INTO posts (user_id, content, image_url, created_at) 
            VALUES (?, ?, ?, NOW())
        `;
        await db.execute(insertQuery, [senderId, newSharedContent, originalImage]);

        res.status(200).send("Publication partagée avec succès !");
    } catch (err) {
        console.error("Erreur action partage :", err.message);
        res.status(500).send("Erreur lors de la publication du partage");
    }
});



module.exports = router;
