const db = require('../config/db');

const Post = {
    // Requête alignée avec la structure de votre table
    create: async (userId, content, imageUrl) => {
        // Si la colonne s'appelle 'image_url' ou 'image', on s'adapte dynamiquement
        const [columns] = await db.execute('DESCRIBE posts');
        const hasImageUrl = columns.some(col => col.Field === 'image_url');
        
        const columnName = hasImageUrl ? 'image_url' : 'image';
        
        const query = `INSERT INTO posts (user_id, content, ${columnName}) VALUES (?, ?, ?)`;
        const [result] = await db.execute(query, [userId, content, imageUrl]);
        return result;
    }
};

module.exports = Post;
