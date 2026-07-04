const db = require('../config/db');

const Post = {
    // Insérer une publication dans MySQL liée à l'utilisateur connecté
    create: async (userId, content, imageUrl) => {
        const [result] = await db.execute(
            'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
            [userId, content, imageUrl]
        );
        return result;
    }
};

module.exports = Post;
