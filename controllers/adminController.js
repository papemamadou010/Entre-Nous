const db = require('../config/db');
const bcrypt = require('bcrypt');

// 1. Confirmer le mot de passe de l'admin pour double authentification
exports.verifyConfirm = async (req, res) => {
    try {
        const { password } = req.body;
        if (!req.session || !req.session.userId) return res.sendStatus(401);

        // Récupérer le hash de l'admin connecté
        const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [req.session.userId]);
        if (users.length === 0) return res.sendStatus(401);

        const user = users[0];

        // Comparaison stricte avec la clé de secours ou le hash bcrypt
        const isMatch = (password === user.password || await bcrypt.compare(password, user.password));
        if (!isMatch) return res.status(400).send('Mot de passe incorrect.');

        res.sendStatus(200);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// 2. Récupérer tous les utilisateurs pour le tableau de bord
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, fullname, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users); // Envoie la liste brute au format JSON pour l'interface frontend
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des membres : ' + error.message);
    }
};

// 3. Récupérer toutes les publications de la plateforme (avec jointure SQL)
exports.getAllPosts = async (req, res) => {
    try {
        const query = `
            SELECT posts.id, posts.content, posts.image_url, posts.created_at, users.fullname 
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            ORDER BY posts.created_at DESC
        `;
        const [posts] = await db.execute(query);
        res.json(posts); // Envoie la liste des publications au format JSON
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des posts : ' + error.message);
    }
};

// 4. Supprimer (Bannir) un utilisateur de MySQL
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM users WHERE id = ?', [id]);
        res.sendStatus(200);
    } catch (error) {
        res.status(500).send('Erreur lors du bannissement : ' + error.message);
    }
};

// 5. Supprimer une publication inappropriée de MySQL
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM posts WHERE id = ?', [id]);
        res.sendStatus(200);
    } catch (error) {
        res.status(500).send('Erreur lors de la suppression du post : ' + error.message);
    }
};

// 6. Récupérer les détails complets d'un seul utilisateur spécifique pour la fiche au clic
exports.getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.execute(
            'SELECT id, fullname, email, role, birthdate, address, gender, phone, created_at FROM users WHERE id = ?',
            [id]
        );
        
        if (users.length === 0) {
            return res.status(404).send('Utilisateur introuvable.');
        }
        
        res.json(users[0]); // Envoie le profil unique (index 0) au format JSON
    } catch (error) {
        res.status(500).send('Erreur serveur : ' + error.message);
    }
};

// 7. Mettre à jour le profil de l'admin (ou de n'importe quel membre) - Mis en conformité avec MySQL2 execute
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const { fullname, phone, address, gender } = req.body;

        const sql = `UPDATE users 
                     SET fullname = ?, phone = ?, address = ?, gender = ? 
                     WHERE id = ?`;

        await db.execute(sql, [fullname, phone, address, gender, userId]);
        
        // On renvoie un succès JSON pour que le fichier HTML sache que c'est bien enregistré
        res.json({ success: true, message: "Profil mis à jour avec succès !" });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'admin dans le contrôleur :", error);
        res.status(500).send("Impossible d'enregistrer les modifications en BDD : " + error.message);
    }
};
