const db = require('../config/db');

const User = {
    // 1. Créer un compte
    create: async (fullname, email, hashedPassword) => {
        const [result] = await db.execute(
            'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)',
            [fullname, email, hashedPassword]
        );
        return result;
    },

    // 2. Chercher un utilisateur (Renvoie le tableau brut)
    findByEmail: async (email) => {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows; 
    },

    // 3. Modifier le mot de passe
    updatePassword: async (email, newHashedPassword) => {
        const [result] = await db.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [newHashedPassword, email]
        );
        return result;
    }
};

module.exports = User;
