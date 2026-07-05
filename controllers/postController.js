const Post = require('../models/postModel');

exports.createPost = async (req, res) => {
    try {
        const { content, imageUrl } = req.body;
        
        const userId = (req.session && req.session.userId) ? req.session.userId : 12;
        
        if (!content && !imageUrl) {
            return res.status(400).send('Veuillez ajouter du texte ou une image.');
        }

        // Enregistrement dans MySQL (ton modèle gère déjà dynamiquement la colonne)
        await Post.create(userId, content, imageUrl);

        // Envoyer un statut de réussite au script Frontend
        res.sendStatus(200);

    } catch (error) {
        res.status(500).send('Erreur lors de la publication : ' + error.message);
    }
};
