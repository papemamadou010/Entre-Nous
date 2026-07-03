const db = require('../config/db');

const User = {
    // Insérer un nouvel utilisateur
    create: async (fullname, email, hashedPassword) => {
        const [result] = await db.execute(
            'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)',
            [fullname, email, hashedPassword]
        );
        return result;
    },

    // Chercher un utilisateur par email (pour vérifier s'il existe déjà)
    findByEmail: async (email) => {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0]; // Retourne l'utilisateur s'il existe, sinon undefined
    }
};

module.exports = User;
