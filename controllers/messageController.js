const db = require('../config/db');

// 1. ENVOYER UN MESSAGE PRIVÉ (SÉCURISÉ PAR L'AMITIÉ + DÉCLENCHEUR DE NOTIFICATION)
exports.sendPrivateMessage = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const senderId = req.session.userId;
        const { receiverId, message } = req.body;

        // 🔒 VERROU STRICT DU CAHIER DES CHARGES : Vérification d'amitié acceptée active
        const [friendCheck] = await db.execute(
            "SELECT id FROM friendships WHERE status = 'accepted' AND ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))",
            [senderId, receiverId, receiverId, senderId]
        );

        if (friendCheck.length === 0) {
            return res.status(403).send("🔒 Sécurité : Vous devez être amis acceptés pour communiquer en privé.");
        }

        if (!message || message.trim() === '') {
            return res.status(400).send("Le message ne peut pas être vide.");
        }

        // A. Enregistrement du message privé dans MySQL
        const query = 'INSERT INTO private_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)';
        await db.execute(query, [senderId, receiverId, message]);

        // 🔔 B. DÉCLENCHEUR DE NOTIFICATION AUTOMATIQUE : NOUVEAU MESSAGE PRIVÉ
        try {
            // Récupérer le nom de l'expéditeur (Moi) pour personnaliser l'alerte d'Aminata/Aliou
            const [senderRows] = await db.execute('SELECT fullname FROM users WHERE id = ?', [senderId]);
            const senderName = senderRows[0]?.fullname || "Un membre";

            const notifQuery = `
                INSERT INTO notifications (user_id, sender_id, type, message) 
                VALUES (?, ?, 'message', ?)
            `;
            await db.execute(notifQuery, [
                receiverId, // Le destinataire qui reçoit la notification
                senderId,   // Vous (l'expéditeur)
                `✉️ ${senderName} vous a envoyé un message privé.`
            ]);
        } catch (notifErr) {
            // Sécurité : Si la notification échoue, on n'empêche pas le message de s'envoyer
            console.error("❌ Erreur silencieuse déclencheur notification message :", notifErr.message);
        }

        res.status(201).send("Message envoyé !");
    } catch (error) {
        console.error("❌ Erreur envoi message privé :", error.message);
        res.status(500).send("Erreur serveur lors de l'envoi du message : " + error.message);
    }
};


// 2. RÉCUPÉRER L'HISTORIQUE DE DISCUSSION ENTRE DEUX UTILISATEURS (SÉCURISÉ PAR L'AMITIÉ)
exports.getChatHistory = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const currentUserId = req.session.userId;
        const { targetUserId } = req.params;

        // 🔒 VERROU STRICT DU CAHIER DES CHARGES : Vérification d'amitié acceptée active
        const [friendCheck] = await db.execute(
            "SELECT id FROM friendships WHERE status = 'accepted' AND ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))",
            [currentUserId, targetUserId, targetUserId, currentUserId]
        );

        if (friendCheck.length === 0) {
            return res.status(403).send("🔒 Sécurité : Vous devez être amis acceptés pour consulter l'historique.");
        }

        // Requête originale préservée : on prend les messages échangés
        const query = `
            SELECT id, sender_id, receiver_id, message, is_read, created_at 
            FROM private_messages 
            WHERE (sender_id = ? AND receiver_id = ?) 
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        `;

        const [messages] = await db.execute(query, [currentUserId, targetUserId, targetUserId, currentUserId]);
        
        // Dès qu'on ouvre la discussion, on marque les messages reçus comme "lus"
        const updateQuery = 'UPDATE private_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0';
        await db.execute(updateQuery, [targetUserId, currentUserId]);

        res.json(messages);
    } catch (error) {
        console.error("❌ Erreur lecture historique messages :", error.message);
        res.status(500).send("Erreur lors de la récupération de la discussion");
    }
};

// 3. RÉCUPÉRER LA LISTE DES CONVERSATIONS EN COURS (BOÎTE DE RÉCEPTION)
exports.getConversationsList = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const currentUserId = req.session.userId;

        // Requête SQL avancée : On cherche tous les correspondants uniques (expéditeurs ou destinataires)
        // et on récupère leur nom, leur avatar, le dernier message échangé et le compte des messages non lus.
        const query = `
            SELECT 
                users.id AS contact_id,
                users.fullname AS contact_name,
                users.avatar_url AS contact_avatar,
                msg.message AS last_message,
                msg.created_at AS last_message_time,
                (SELECT COUNT(*) FROM private_messages WHERE sender_id = users.id AND receiver_id = ? AND is_read = 0) AS unread_count
            FROM users
            JOIN private_messages msg ON (msg.sender_id = users.id AND msg.receiver_id = ?) 
                                      OR (msg.sender_id = ? AND msg.receiver_id = users.id)
            WHERE msg.id IN (
                SELECT MAX(id) 
                FROM private_messages 
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY IF(sender_id = ?, receiver_id, sender_id)
            )
            AND users.id != ?
            ORDER BY msg.created_at DESC
        `;

        const [conversations] = await db.execute(query, [
            currentUserId, currentUserId, currentUserId, 
            currentUserId, currentUserId, currentUserId, 
            currentUserId
        ]);

        res.json(conversations);
    } catch (error) {
        console.error("❌ Erreur lecture liste conversations :", error.message);
        res.status(500).send("Erreur lors de la récupération de la boîte de réception");
    }
};
