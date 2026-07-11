// IMPORTATION OBLIGATOIRE DE LA CONNEXION À LA BASE DE DONNÉES MYSQL
const db = require('../config/db');
const Post = require('../models/postModel');

// 1. CRÉATION D'UNE PUBLICATION SÉCURISÉE AVEC IMAGE BASE64
exports.createPost = async (req, res) => {
    try {
        // Sécurité : On vérifie si l'utilisateur est bien connecté en session
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Vous devez être connecté pour publier.");
        }

        const { content, imageUrl } = req.body;
        const userId = req.session.userId; // ID dynamique de l'utilisateur connecté (ex: Pape = 12)

        if (!content) {
            return res.status(400).send("Le contenu du message ne peut pas être vide.");
        }

        // Insertion stricte dans la table posts de MariaDB
        const query = 'INSERT INTO posts (content, image_url, user_id, created_at) VALUES (?, ?, ?, NOW())';
        await db.execute(query, [content, imageUrl || null, userId]);

        res.status(201).send("Publication envoyée avec succès !");
    } catch (error) {
        console.error("❌ ERREUR CREATION POST BACKEND :", error.message);
        res.status(500).send("Erreur lors de la création de la publication : " + error.message);
    }
};

// 2. LIRE TOUTES LES PUBLICATIONS POUR LE FIL PUBLIC (HOME.HTML)
exports.getFeedPosts = async (req, res) => {
    try {
        const query = `
            SELECT posts.id, posts.content, posts.image_url, posts.created_at, users.fullname 
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            ORDER BY posts.created_at DESC
        `;
        
        // Extraction stricte du tableau de données rows de MySQL
        const [posts] = await db.execute(query);
        
        res.json(posts);
    } catch (error) {
        console.error("❌ ERREUR LECTURE FLUX POSTS :", error.message);
        res.status(500).send("Erreur lors de la récupération du fil d'actualité");
    }
};

// 3. RECUPERER LES PUBLICATIONS D'UN MEMBRE SPECIFIQUE (POUR PROFILE.HTML)
exports.getUserPosts = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const targetUserId = req.params.id;

        const query = `
            SELECT posts.id, posts.content, posts.image_url, posts.created_at, users.fullname 
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            WHERE posts.user_id = ?
            ORDER BY posts.created_at DESC
        `;
        
        const [posts] = await db.execute(query, [targetUserId]);
        res.json(posts);
    } catch (error) {
        console.error("❌ ERREUR LECTURE POSTS PROFIL :", error.message);
        res.status(500).send("Erreur lors de la récupération des posts du profil");
    }
};
