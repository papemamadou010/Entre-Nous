const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Importation de la connexion BDD

// 1. LOGIQUE D'INSCRIPTION
exports.register = async (req, res) => {
    try {
        const { fullname, email, password, birthdate, phone, address, gender } = req.body;

        if (!fullname || !email || !password || !birthdate || !phone || !address || !gender) {
            return res.status(400).send('Veuillez remplir tous les champs obligatoires.');
        }

        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).send('Le mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule et un chiffre.');
        }

        const rows = await User.findByEmail(email);
        
        if (rows && rows.length > 0) {
            return res.status(400).send('Cette adresse email est déjà utilisée.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create(fullname, email, hashedPassword, birthdate, phone, address, gender);

        res.status(201).send('Inscription réussie ! Vous pouvez vous connecter.');
    } catch (error) {
        console.error('Erreur inscription backend :', error);
        res.status(500).send('Erreur serveur lors de l\'inscription : ' + error.message);
    }
};

// 2. LOGIQUE DE CONNEXION
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('Veuillez remplir tous les champs.');
        }

        const rows = await User.findByEmail(email);
        
        if (!rows || rows.length === 0) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        const user = rows[0];

        if (!user || !user.password) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        const isMatch = (password === user.password || await bcrypt.compare(password, user.password));

        if (!isMatch) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        req.session.userId = user.id;
        req.session.userFullname = user.fullname;
        req.session.userRole = user.role || 'user'; 

        res.redirect(303, '/home.html');
    } catch (error) {
        console.error('Erreur connexion backend :', error);
        res.status(500).send('Erreur lors de la connexion : ' + error.message);
    }
};

// 3. LOGIQUE DE MOT DE PASSE OUBLIÉ
exports.forgotPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).send('Veuillez remplir tous les champs.');
        }

        const rows = await User.findByEmail(email);
        
        if (!rows || rows.length === 0) {
            return res.status(404).send('Aucun compte trouvé avec cet email.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(email, hashedPassword);

        res.send('Votre mot de passe a bien été réinitialisé !');
    } catch (error) {
        res.status(500).send('Erreur lors de la réinitialisation : ' + error.message);
    }
};

// 4. METTRE À JOUR LA PHOTO DE PROFIL EN BASE64
exports.updateAvatar = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const { avatar_url } = req.body;
        const userId = req.session.userId;

        const query = 'UPDATE users SET avatar_url = ? WHERE id = ?';
        await db.execute(query, [avatar_url, userId]);

        res.status(200).send("Photo de profil enregistrée avec succès !");
    } catch (error) {
        console.error("Erreur serveur avatar :", error);
        res.status(500).send("Erreur lors de l'enregistrement de l'image : " + error.message);
    }
};

// 5. METTRE À JOUR LES INFORMATIONS TEXTUELLES (BIO, PHONE, ADDRESS)
exports.updateProfileInfos = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const { bio, phone, address } = req.body;
        const userId = req.session.userId;

        const query = 'UPDATE users SET bio = ?, phone = ?, address = ? WHERE id = ?';
        await db.execute(query, [bio, phone, address, userId]);

        res.status(200).send("Informations de profil mises à jour !");
    } catch (error) {
        console.error("Erreur mise à jour infos profil :", error);
        res.status(500).send("Erreur lors de la mise à jour des informations : " + error.message);
    }
};

// ================= RECULLER L'ÉTAPE 2 ICI PROPREMENT =================
// 6. LIRE LE PROFIL PUBLIC D'UN AUTRE MEMBRE (ACCESSIBLE À TOUS)
// EXPLOITATION DU PROFIL PUBLIC ENRICHI (STYLE FACEBOOK)
exports.getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;
        
        // AJOUT SÉCURISÉ DE LA COLONNE LAST_SEEN À LA FIN DE VOTRE SELECT
        const query = `
            SELECT id, fullname, bio, phone, address, avatar_url,
                   birthdate, gender, relationship_status, workplace, 
                   education_university, education_highschool, last_seen 
            FROM users WHERE id = ?
        `;
        
        const [rows] = await db.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).send("Utilisateur introuvable");
        }

        // CONSERVATION STRICTE DE VOTRE LOGIQUE : On renvoie l'objet index 0 pour ne rien casser
        res.json(rows[0]);
    } catch (error) {
        console.error("❌ Erreur getPublicProfile :", error.message);
        res.status(500).send("Erreur lors de la récupération du profil");
    }
};


// 7. RECHERCHE DYNAMIQUE D'UTILISATEURS INSCRITS
exports.searchUsers = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const { q } = req.query; // Récupère le texte tapé (ex: /auth/search?q=ali)
        if (!q || q.trim() === '') {
            return res.json([]);
        }

        // Requête SQL cherchant dans les noms complets, en excluant l'utilisateur connecté
        const query = `
            SELECT id, fullname, avatar_url 
            FROM users 
            WHERE fullname LIKE ? AND id != ?
            LIMIT 5
        `;
        
        const [users] = await db.execute(query, [`%${q}%`, req.session.userId]);
        res.json(users);
    } catch (error) {
        console.error("Erreur recherche backend :", error);
        res.status(500).send("Erreur serveur lors de la recherche");
    }
};
