const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// 1. LOGIQUE D'INSCRIPTION (REGISTER)
exports.register = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // Vérifier si les champs ne sont pas vides
        if (!fullname || !email || !password) {
            return res.status(400).send('Veuillez remplir tous les champs.');
        }

        // Vérifier si l'email est déjà utilisé
        const users = await User.findByEmail(email);
        if (users && users.length > 0) {
            return res.status(400).send('Cet email est déjà utilisé.');
        }

        // Sécuriser le mot de passe (Hachage)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Enregistrer dans la base de données
        await User.create(fullname, email, hashedPassword);

        res.status(201).send('Inscription réussie ! Vous pouvez vous connecter.');
    } catch (error) {
        res.status(500).send('Erreur serveur lors de l\'inscription : ' + error.message);
    }
};

// 2. LOGIQUE DE CONNEXION (LOGIN)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si les champs ne sont pas vides
        if (!email || !password) {
            return res.status(400).send('Veuillez remplir tous les champs.');
        }

        // Vérifier si l'utilisateur existe
        const users = await User.findByEmail(email);
        if (!users || users.length === 0) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        // Récupérer le premier utilisateur trouvé dans le tableau MySQL
        const user = users[0];

        // Vérifier si le mot de passe correspond
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Email ou mot de passe incorrect.');
        }

        // Connexion réussie
        res.send(`Bienvenue ${user.fullname} ! Connexion réussie.`);
    } catch (error) {
        res.status(500).send('Erreur lors de la connexion : ' + error.message);
    }
};
