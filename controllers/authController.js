const User = require('../models/userModel');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // 1. Vérifier si les champs ne sont pas vides
        if (!fullname || !email || !password) {
            return res.status(400).send('Veuillez remplir tous les champs.');
        }

        // 2. Vérifier si l'email est déjà utilisé
        const userExists = await User.findByEmail(email);
        if (userExists) {
            return res.status(400).send('Cet email est déjà utilisé.');
        }

        // 3. Sécuriser le mot de passe (Hachage)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Enregistrer dans la base de données
        await User.create(fullname, email, hashedPassword);

        res.status(201).send('Inscription réussie ! Vous pouvez vous connecter.');
    } catch (error) {
        res.status(500).send('Erreur serveur lors de l\'inscription : ' + error.message);
    }
};
