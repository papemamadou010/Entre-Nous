const multer = require('multer');
const path = require('path');

// Configuration du dossier de stockage avec un chemin absolu sécurisé
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // __dirname remonte à la racine et cible précisément le bon dossier physique
        cb(null, path.join(__dirname, '..', 'public', 'uploads', 'posts'));
    },
    filename: (req, file, cb) => {
        // Crée un nom unique (ex: 1717145620-image.jpg)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtre de sécurité : seules les images sont acceptées
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        return cb(null, true);
    } else {
        cb(new Error('Erreur : Seules les images (JPG, JPEG, PNG, GIF) sont autorisées.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite à 5 Mo max
});

module.exports = upload;
