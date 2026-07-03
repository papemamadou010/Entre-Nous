const mysql = require('mysql2');
require('dotenv').config();

// Création d'un pool de connexions (plus performant pour un réseau social)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convertir le pool pour utiliser les Promesses (Async/Await)
const db = pool.promise();

// Tester la connexion au démarrage
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Erreur de connexion à la base MySQL :", err.message);
    } else {
        console.log("✅ Connexion réussie à la base de données MySQL !");
        connection.release();
    }
});

module.exports = db;
