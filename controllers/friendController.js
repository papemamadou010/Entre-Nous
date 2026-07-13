// 1. ENVOYER OU RE-TENTER UNE DEMANDE D'AMI (AVEC DÉCLENCHEUR DE NOTIFICATION INTEGRÉ)
exports.sendFriendRequest = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) return res.status(401).send("Non connecté");
        const requesterId = req.session.userId;
        const { receiverId } = req.body;

        if (Number(requesterId) === Number(receiverId)) {
            return res.status(400).send("Vous ne pouvez pas vous ajouter vous-même.");
        }

        // Récupérer le nom de la personne connectée (Moi) pour personnaliser le message d'alerte
        const [senderRows] = await db.execute('SELECT fullname FROM users WHERE id = ?', [requesterId]);
        const senderName = senderRows[0]?.fullname || "Un membre";

        // Vérifier si une relation existe déjà
        const [existing] = await db.execute(
            'SELECT * FROM friendships WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)',
            [requesterId, receiverId, receiverId, requesterId]
        );

        if (existing.length > 0) {
            const rel = existing[0];
            if (rel.status === 'accepted') return res.status(400).send("Vous êtes déjà amis.");
            if (rel.status === 'pending') return res.status(400).send("Une demande est déjà en attente.");
            
            // Si la demande précédente avait été refusée, on la relance en 'pending'
            await db.execute('UPDATE friendships SET status = "pending", requester_id = ?, receiver_id = ? WHERE id = ?', [requesterId, receiverId, rel.id]);
            
            // 🔔 NOTIFICATION CAS A : Insertion de l'alerte de relance
            await db.execute(
                'INSERT INTO notifications (user_id, sender_id, type, message) VALUES (?, ?, "friend_request", ?)',
                [receiverId, requesterId, `👤 ${senderName} vous a renvoyé une demande d'ami.`]
            );

            return res.json({ status: 'pending', message: "Demande réenvoyée !" });
        }

        // Nouvelle demande
        await db.execute('INSERT INTO friendships (requester_id, receiver_id, status) VALUES (?, ?, "pending")', [requesterId, receiverId]);
        
        // 🔔 NOTIFICATION CAS B : Insertion de la toute première alerte
        await db.execute(
            'INSERT INTO notifications (user_id, sender_id, type, message) VALUES (?, ?, "friend_request", ?)',
            [receiverId, requesterId, `👤 ${senderName} vous a envoyé une demande d'ami.`]
        );

        res.status(201).json({ status: 'pending', message: "Demande d'ami envoyée !" });
    } catch (error) {
        console.error("Erreur envoi demande ami :", error);
        res.status(500).send("Erreur serveur");
    }
};


// 2. ACCEPTER OU REFUSER UNE DEMANDE D'AMI
exports.respondToRequest = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) return res.status(401).send("Non connecté");
        const currentUserId = req.session.userId;
        const { requesterId, action } = req.body; // action: 'accepted' ou 'declined'

        if (!['accepted', 'declined'].includes(action)) return res.status(400).send("Action invalide");

        if (action === 'accepted') {
            await db.execute(
                'UPDATE friendships SET status = "accepted" WHERE requester_id = ? AND receiver_id = ? AND status = "pending"',
                [requesterId, currentUserId]
            );
            res.json({ success: true, message: "Demande acceptée !" });
        } else {
            // Si refusé, on supprime carrément la ligne pour permettre de réinviter plus tard proprement
            await db.execute(
                'DELETE FROM friendships WHERE requester_id = ? AND receiver_id = ? AND status = "pending"',
                [requesterId, currentUserId]
            );
            res.json({ success: true, message: "Demande refusée." });
        }
    } catch (error) {
        console.error("Erreur réponse demande ami :", error);
        res.status(500).send("Erreur serveur");
    }
};

// 3. RÉCUPÉRER LE NOMBRE ET LA LISTE DES DEMANDES EN ATTENTE (POUR LE BADGE ROUGE ET LA MODALE)
exports.getPendingRequests = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) return res.status(401).send("Non connecté");
        const currentUserId = req.session.userId;

        const query = `
            SELECT users.id, users.fullname, users.avatar_url 
            FROM friendships
            JOIN users ON friendships.requester_id = users.id
            WHERE friendships.receiver_id = ? AND friendships.status = 'pending'
            ORDER BY friendships.created_at DESC
        `;
        const [requests] = await db.execute(query, [currentUserId]);
        res.json(requests);
    } catch (error) {
        console.error("Erreur lecture demandes reçues :", error);
        res.status(500).send("Erreur serveur");
    }
};

// 4. RÉCUPÉRER LA LISTE DE TOUS LES AMIS ACCEPTÉS
exports.getFriendsList = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) return res.status(401).send("Non connecté");
        const currentUserId = req.session.userId;

        // On prend les utilisateurs connectés par une relation 'accepted'
        const query = `
            SELECT users.id, users.fullname, users.avatar_url 
            FROM users
            JOIN friendships ON (friendships.requester_id = users.id AND friendships.receiver_id = ?)
                             OR (friendships.receiver_id = users.id AND friendships.requester_id = ?)
            WHERE friendships.status = 'accepted' AND users.id != ?
            ORDER BY users.fullname ASC
        `;
        const [friends] = await db.execute(query, [currentUserId, currentUserId, currentUserId]);
        res.json(friends);
    } catch (error) {
        console.error("Erreur lecture liste amis :", error);
        res.status(500).send("Erreur serveur");
    }
};

// 5. CONNAÎTRE LE STATUT CRITIQUE ENTRE MOI ET UN PROFIL VISITÉ (POUR LE BOUTON DYNAMIQUE)
exports.getRelationStatus = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) return res.json({ status: 'none' });
        const currentUserId = req.session.userId;
        const { targetUserId } = req.params;

        const query = `
            SELECT id, requester_id, receiver_id, status 
            FROM friendships 
            WHERE (requester_id = ? AND receiver_id = ?) 
               OR (requester_id = ? AND receiver_id = ?)
        `;
        const [rows] = await db.execute(query, [currentUserId, targetUserId, targetUserId, currentUserId]);

        if (rows.length === 0) return res.json({ status: 'none' });

        const rel = rows[0];
        if (rel.status === 'accepted') return res.json({ status: 'friends' });
        
        // Si c'est en attente, on précise qui a envoyé pour savoir s'il faut afficher "En attente" ou "Accepter"
        if (rel.status === 'pending') {
            if (Number(rel.requester_id) === Number(currentUserId)) {
                return res.json({ status: 'sent_pending' });
            } else {
                return res.json({ status: 'received_pending' });
            }
        }
        res.json({ status: 'none' });
    } catch (error) {
        res.status(500).send("Erreur statut");
    }
};
// 6. CALCULER LE COMPTE ET RECHERCHER LES AMIS EN COMMUN (REQUÊTE BI-DIRECTIONNELLE CORRIGÉE)
exports.getMutualFriends = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) return res.status(401).send("Non connecté");
        const currentUserId = req.session.userId;
        const { targetUserId } = req.params;

        // A. Correction du compteur total : On compte si le membre est demandeur OU receveur
        const countTotalQuery = `
            SELECT COUNT(*) AS total_friends FROM friendships 
            WHERE status = 'accepted' AND (requester_id = ? OR receiver_id = ?)
        `;
        const [[{ total_friends }]] = await db.execute(countTotalQuery, [targetUserId, targetUserId]);

        // B. Extraire la liste des identifiants des amis de l'utilisateur connecté (Moi)
        const [myFriendsRows] = await db.execute(
            `SELECT IF(requester_id = ?, receiver_id, requester_id) AS friend_id 
             FROM friendships WHERE status = 'accepted' AND (requester_id = ? OR receiver_id = ?)`,
            [currentUserId, currentUserId, currentUserId]
        );
        const myFriendsIds = myFriendsRows.map(row => row.friend_id);

        // C. Extraire la liste des identifiants des amis du profil visité (Cible)
        const [targetFriendsRows] = await db.execute(
            `SELECT IF(requester_id = ?, receiver_id, requester_id) AS friend_id 
             FROM friendships WHERE status = 'accepted' AND (requester_id = ? OR receiver_id = ?)`,
            [targetUserId, targetUserId, targetUserId]
        );
        const targetFriendsIds = targetFriendsRows.map(row => row.friend_id);

        // D. Trouver l'intersection (les identifiants présents dans les deux listes)
        const mutualIds = myFriendsIds.filter(id => targetFriendsIds.includes(id) && id !== currentUserId && id !== Number(targetUserId));

        // E. Si aucun ami en commun, on renvoie une liste vide rapidement
        if (mutualIds.length === 0) {
            return res.json({
                totalFriends: total_friends,
                mutualCount: 0,
                mutualList: []
            });
        }

        // F. Récupérer les noms et avatars des amis en commun trouvés
        const placeholders = mutualIds.map(() => '?').join(',');
        const mutualQuery = `
            SELECT id, fullname, avatar_url FROM users 
            WHERE id IN (${placeholders}) 
            ORDER BY fullname ASC
        `;
        const [mutualFriends] = await db.execute(mutualQuery, mutualIds);

        res.json({
            totalFriends: total_friends,
            mutualCount: mutualFriends.length,
            mutualList: mutualFriends
        });
    } catch (error) {
        console.error("❌ Erreur calcul amis en commun :", error.message);
        res.status(500).send("Erreur lors du calcul des relations");
    }
};
