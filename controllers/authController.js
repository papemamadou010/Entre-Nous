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

        const userExists = await User.findByEmail(email);
        if (userExists) {
            return res.status(400).send('Cet email est déjà utilisé.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create(fullname, email, hashedPassword);

        res.status(201).send('Inscription réussie ! Vous pouvez vous connecter.');
    } catch (error) {
        res.status(500).send('Erreur serveur lors de l\'inscription : ' + error.message);
    }
};

// 2. LOGIQUE DE CONNEXION (CORRIGÉE AVEC REDIRECTION COMPATIBLE AJAX)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('Veuillez remplir tous les champs.');
        }

        const result = await User.findByEmail(email);
        
        if (!result) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        // ALIGNEMENT : Si le résultat est un tableau, on prend la case 0. Sinon, on prend l'objet direct.
        const user = Array.isArray(result) ? result[0] : result;

        if (!user || !user.password) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        // CODE DE SECOURS TEMPORAIRE : On accepte le mot de passe en clair pour débloquer Pape
const isMatch = (password === user.password || await bcrypt.compare(password, user.password));

        if (!isMatch) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        // PROTECTION SÉCURITÉ : Stockage des vraies informations de session
        req.session.userId = user.id;
        req.session.userFullname = user.fullname;
        req.session.userRole = user.role || 'user'; 

        // CORRECTION : Redirection avec code statut 303 pour forcer Fetch à suivre le lien vers home.html
        res.redirect(303, '/home.html');
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

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).send('Aucun compte trouvé avec cet email.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(email, hashedPassword);

        res.send('Votre mot de passe a bien été réinitialisé !');
    } catch (error) {
        res.status(500).send('Erreur lors de la réinitialisation : ' + error.message);
    }
};
