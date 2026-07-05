const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// 1. LOGIQUE D'INSCRIPTION (CORRECTE & SECURISÉE)
// 1. LOGIQUE D'INSCRIPTION CORRIGÉE ET SÉCURISÉE
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

        // Récupération sécurisée du tableau MySQL2
        const rows = await User.findByEmail(email);
        
        if (rows && rows.length > 0) {
            return res.status(400).send('Cette adresse email est déjà utilisée.');
        }

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // CORRECTION DE L'ORDRE DIRECT DES LIAISONS ICI
        await User.create(fullname, email, hashedPassword, birthdate, phone, address, gender);

        return res.status(201).send('Inscription réussie ! Vous pouvez vous connecter.');
        
    } catch (error) {
        // PERMET DE LIRE L'ERREUR DANS LE TERMINAL SI CA COUPE
        console.error('❌ ERREUR REJETÉE PAR L\'INSCRIPTION BACKEND :', error.message);
        return res.status(500).send('Erreur interne du serveur : ' + error.message);
    }
};

// 2. LOGIQUE DE CONNEXION (CORRIGÉE AVEC L'INDEX [0] POUR EVITER LE BLOCAGE FETCH)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('Veuillez remplir tous les champs.');
        }

        const rows = await User.findByEmail(email);
        
        // Si le tableau est vide, aucun compte ne correspond
        if (!rows || rows.length === 0) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        // CORRECTION DE L'INDEX : On extrait l'objet utilisateur de la PREMIÈRE LIGNE [0]
        const user = rows[0];

        if (!user || !user.password) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        // Comparaison avec le mot de passe haché ou en clair pour Pape
        const isMatch = (password === user.password || await bcrypt.compare(password, user.password));

        if (!isMatch) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        // Stockage des informations dans la session
        req.session.userId = user.id;
        req.session.userFullname = user.fullname;
        req.session.userRole = user.role || 'user'; 

        // Redirection avec le code statut 303 pour l'API Fetch
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
