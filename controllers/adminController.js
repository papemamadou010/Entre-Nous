const db = require('../config/db');

// 1. Récupérer tous les utilisateurs pour le tableau de bord
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, fullname, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users); // Envoie la liste brute au format JSON pour l'interface frontend
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des membres : ' + error.message);
    }
};

// 2. Récupérer toutes les publications de la plateforme (avec jointure SQL)
exports.getAllPosts = async (req, res) => {
    try {
        // Cette requête fait une jointure (JOIN) pour récupérer le nom de l'auteur de chaque post
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
