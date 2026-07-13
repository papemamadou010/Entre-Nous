const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. RÉCUPÉRER TOUTES LES NOTIFICATIONS D'UN UTILISATEUR (AVEC LES AVATARS DES EXPÉDITEURS)
router.get('/', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const userId = req.session.userId;

        // Requête SQL avec jointure pour récupérer la photo de profil de la personne qui a déclenché l'action
        const query = `
            SELECT n.id, n.type, n.post_id, n.message, n.is_read, n.created_at,
                   u.fullname AS sender_name, u.avatar_url AS sender_avatar
            FROM notifications n
            JOIN users u ON n.sender_id = u.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
        `;

        const [notifications] = await db.execute(query, [userId]);
        res.json(notifications);
    } catch (error) {
        console.error("❌ Erreur lecture notifications :", error.message);
        res.status(500).send("Erreur serveur lors de la récupération des notifications");
    }
});

// 2. COMPTER LE NOMBRE DE NOTIFICATIONS NON LUES (POUR LA BULLE ROUGE DU MENU)
router.get('/unread-count', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const query = "SELECT COUNT(*) AS unread_total FROM notifications WHERE user_id = ? AND is_read = 0";
        const [[{ unread_total }]] = await db.execute(query, [req.session.userId]);

        res.json({ count: unread_total });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 3. MARQUER TOUTES LES NOTIFICATIONS COMME LUES (QUAND ON OUVRE LA PAGE)
router.put('/mark-all-read', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const query = "UPDATE notifications SET is_read = 1 WHERE user_id = ?";
        await db.execute(query, [req.session.userId]);

        res.status(200).send("Notifications marquées comme lues !");
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;
