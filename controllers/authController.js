const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// 1. LOGIQUE D'INSCRIPTION AVEC VÉRIFICATION STRICTE
exports.register = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // 1. Vérifier si les champs sont reçus et non vides
        if (!fullname || !email || !password) {
            return res.status(400).send('Veuillez remplir tous les champs du formulaire.');
        }

        // 2. VERIFICATION DU MOT DE PASSE FORT
        // Au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        
        if (!passwordRegex.test(password)) {
            return res.status(400).send(
                'Échec de l\'inscription : Le mot de passe doit contenir au moins 8 caractères, avec au moins une majuscule, une minuscule et un chiffre.'
            );
        }

        // 3. Vérifier si l'email est déjà utilisé
        const users = await User.findByEmail(email);
        if (users && users.length > 0) {
            return res.status(400).send('Cet email est déjà utilisé.');
        }

        // 4. Sécuriser et enregistrer
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create(fullname, email, hashedPassword);

        res.status(201).send('Inscription réussie ! Vous pouvez vous connecter.');
    } catch (error) {
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

        const users = await User.findByEmail(email);
        if (!users || users.length === 0) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        req.session.userId = user.id;
        req.session.userFullname = user.fullname;

        res.send(`Bienvenue ${user.fullname} ! Connexion réussie.`);
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
            return res.status(400).send('Erreur : Le nouveau mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule et un chiffre.');
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
