const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// 1. LOGIQUE D'INSCRIPTION
exports.register = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        if (!fullname || !email || !password) {
            return res.status(400).send('Veuillez remplir tous les champs.');
        }

        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).send('Le mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule et un chiffre.');
        }

        const users = await User.findByEmail(email);
        if (users && users.length > 0) {
            return res.status(400).send('Cet email est déjà utilisé.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create(fullname, email, hashedPassword);

        res.status(201).send('Inscription réussie ! Vous pouvez vous connecter.');
    } catch (error) {
        res.status(500).send('Erreur serveur lors de l\'inscription : ' + error.message);
    }
};

// 2. LOGIQUE DE CONNEXION (CORRIGÉE AVEC REDIRECTION ET INDEX 0)
exports.login = async (req, res) => {
    try {
        // LIGNE DE SURVEILLANCE TEMPORAIRE (À AJOUTER)
console.log("=== TENTATIVE DE CONNEXION ===");
console.log("Données reçues du formulaire :", req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('Veuillez remplir tous les champs.');
        }

        const users = await User.findByEmail(email);
        
        // On vérifie si le tableau de lignes MySQL est vide
        if (!users || users.length === 0) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        // CORRECTION CRUCIALE : On cible le premier utilisateur du tableau brut
        const user = users[0];

        // Comparaison du mot de passe saisi avec la clé hachée en BDD
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        // Enregistrement des données dans la session utilisateur
        req.session.userId = user.id;
        req.session.userFullname = user.fullname;
        req.session.userRole = user.role; 

        // REDIRECTION AUTOMATIQUE DIRECTE VERS LE FIL D'ACTUALITÉ
        res.redirect('/home.html');
    } catch (error) {
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

        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).send('Le nouveau mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule et un chiffre.');
        }

        const users = await User.findByEmail(email);
        if (!users || users.length === 0) {
            return res.status(404).send('Aucun compte trouvé avec cet email.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(email, hashedPassword);

        res.send('Votre mot de passe a bien été réinitialisé ! Vous pouvez vous connecter.');
    } catch (error) {
        res.status(500).send('Erreur lors de la réinitialisation : ' + error.message);
    }
};
