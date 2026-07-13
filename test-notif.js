const db = require('./config/db');

async function injectTestNotification() {
    try {
        // 1. On va chercher le premier utilisateur existant dans votre table pour s'assurer qu'il y a un compte
        const [users] = await db.execute('SELECT id, fullname FROM users ORDER BY id ASC LIMIT 2');
        
        if (users.length === 0) {
            console.log("❌ Erreur : Aucun utilisateur trouvé dans votre base de données MySQL.");
            process.exit();
        }

        // On prend le premier utilisateur trouvé (ce sera vous)
        const myUser = users[0];
        // S'il y a un deuxième utilisateur, il sera l'expéditeur, sinon on utilise le même
        const fakeSenderId = users[1] ? users[1].id : users[0].id; 

        console.log(`📡 Identification : Injection sur le compte de [${myUser.fullname}] (ID: ${myUser.id})...`);

        const query = `
            INSERT INTO notifications (user_id, sender_id, type, message, is_read) 
            VALUES (?, ?, 'like', '❤️ Quelqu\\'un a aimé votre publication.', 0)
        `;
        
        await db.execute(query, [myUser.id, fakeSenderId]);
        console.log("🎉 Succès absolu : La notification est bien arrivée sur votre compte !");
        process.exit();
    } catch (err) {
        console.error("❌ Erreur d'injection :", err.message);
        process.exit();
    }
}

injectTestNotification();
