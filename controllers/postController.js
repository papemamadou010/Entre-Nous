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

// 2. LIRE TOUTES LES PUBLICATIONS AVEC LE COMPTEUR DE LIKES ET L'ID DE L'AUTEUR (CORRIGÉ)
exports.getFeedPosts = async (req, res) => {
    try {
        const query = `
            SELECT posts.id, posts.content, posts.image_url, posts.created_at, posts.user_id, users.fullname,
            (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS total_likes
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            ORDER BY posts.created_at DESC
        `;
        
        // [posts] extrait strictement le tableau de lignes de MariaDB
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

// 4. GESTION DU BOUTON LIKE (VÉRIFIE L'EXISTENCE ET INTERDIT LES DOUBLONS)
exports.toggleLike = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Vous devez être connecté.");
        }

        const userId = req.session.userId;
        const { postId } = req.params;

        // 1. On cherche si cet utilisateur a déjà aimé cette publication precisa
        const checkQuery = 'SELECT id FROM likes WHERE user_id = ? AND post_id = ?';
        const [existingLike] = await db.execute(checkQuery, [userId, postId]);

        if (existingLike.length > 0) {
            // L'utilisateur a déjà aimé -> Action inverse : ON RETIRE LE LIKE
            const deleteQuery = 'DELETE FROM likes WHERE user_id = ? AND post_id = ?';
            await db.execute(deleteQuery, [userId, postId]);
            return res.json({ liked: false, message: "Like retiré" });
        } else {
            // L'utilisateur n'a pas encore aimé -> ON RECONNAÎT LE LIKE
            const insertQuery = 'INSERT INTO likes (user_id, post_id) VALUES (?, ?)';
            await db.execute(insertQuery, [userId, postId]);
            return res.json({ liked: true, message: "Publication aimée" });
        }
    } catch (error) {
        console.error("❌ Erreur traitement Like :", error.message);
        res.status(500).send("Erreur lors de la gestion du like : " + error.message);
    }
};

// 5. AJOUTER UN COMMENTAIRE SUR UNE PUBLICATION
exports.addComment = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Vous devez être connecté pour commenter.");
        }

        const userId = req.session.userId;
        const { postId } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).send("Le commentaire ne peut pas être vide.");
        }

        const query = 'INSERT INTO comments (content, user_id, post_id, created_at) VALUES (?, ?, ?, NOW())';
        await db.execute(query, [content, userId, postId]);

        res.status(201).send("Commentaire ajouté avec succès !");
    } catch (error) {
        console.error("❌ Erreur ajout commentaire :", error.message);
        res.status(500).send("Erreur lors de l'ajout du commentaire : " + error.message);
    }
};

// 6. RÉCUPÉRER LES COMMENTAIRES D'UNE PUBLICATION SPÉCIFIQUE
exports.getComments = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const { postId } = req.params;

        // Requête avec jointure pour récupérer le nom de l'auteur et son avatar en même temps
        const query = `
            SELECT comments.id, comments.content, comments.created_at, users.fullname, users.avatar_url 
            FROM comments 
            JOIN users ON comments.user_id = users.id 
            WHERE comments.post_id = ?
            ORDER BY comments.created_at ASC
        `;
        
        const [comments] = await db.execute(query, [postId]);
        res.json(comments);
    } catch (error) {
        console.error("❌ Erreur lecture commentaires :", error.message);
        res.status(500).send("Erreur lors de la récupération des commentaires");
    }
};
// 7. SUPPRIMER UNE PUBLICATION SÉCURISÉE (AUTEUR OU ADMIN PAPE)
exports.deletePost = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).send("Non connecté");
        }

        const { postId } = req.params;
        const currentUserId = req.session.userId;
        const currentUserRole = req.session.userRole;

        // 1. On va chercher le créateur du post pour vérifier les droits
        const [postCheck] = await db.execute('SELECT user_id FROM posts WHERE id = ?', [postId]);

        if (postCheck.length === 0) {
            return res.status(404).send("Publication introuvable");
        }

        const postOwnerId = postCheck[0].user_id;

        // 2. Sécurité : Seul l'auteur OU Pape (ID 12 + Admin) peut supprimer
        const isOwner = Number(currentUserId) === Number(postOwnerId);
        const isAdminPape = Number(currentUserId) === 12 && currentUserRole === 'admin';

        if (!isOwner && !isAdminPape) {
            return res.status(403).send("Droit de suppression refusé.");
        }

        // 3. Suppression dans la base de données (les likes et commentaires liés sauteront automatiquement grâce au ON DELETE CASCADE)
        await db.execute('DELETE FROM posts WHERE id = ?', [postId]);

        res.status(200).send("Publication supprimée avec succès !");
    } catch (error) {
        console.error("❌ Erreur suppression post :", error.message);
        res.status(500).send("Erreur serveur lors de la suppression : " + error.message);
    }
};
