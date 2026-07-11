const db = require('../config/db');

// 1. ENVOYER UN MESSAGE PRIVÉ
exports.sendPrivateMessage = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const senderId = req.session.userId;
        const { receiverId, message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).send("Le message ne peut pas être vide.");
        }

        const query = 'INSERT INTO private_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)';
        await db.execute(query, [senderId, receiverId, message]);

        res.status(201).send("Message envoyé !");
    } catch (error) {
        console.error("❌ Erreur envoi message privé :", error.message);
        res.status(500).send("Erreur serveur lors de l'envoi du message : " + error.message);
    }
};

// 2. RÉCUPÉRER L'HISTORIQUE DE DISCUSSION ENTRE DEUX UTILISATEURS
exports.getChatHistory = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const currentUserId = req.session.userId;
        const { targetUserId } = req.params;

        // Requête chirurgicale : on prend les messages où (A écrit à B) OU (B écrit à A)
        const query = `
            SELECT id, sender_id, receiver_id, message, is_read, created_at 
            FROM private_messages 
            WHERE (sender_id = ? AND receiver_id = ?) 
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        `;

        const [messages] = await db.execute(query, [currentUserId, targetUserId, targetUserId, currentUserId]);
        
        // Bonus : Dès qu'on ouvre la discussion, on marque les messages reçus comme "lus" (is_read = 1)
        const updateQuery = 'UPDATE private_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0';
        await db.execute(updateQuery, [targetUserId, currentUserId]);

        res.json(messages);
    } catch (error) {
        console.error("❌ Erreur lecture historique messages :", error.message);
        res.status(500).send("Erreur lors de la récupération de la discussion");
    }
};
