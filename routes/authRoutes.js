const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);

// Route pour que le frontend connaisse les infos de la session actuelle
router.get('/me', (req, res) => {
    if (req.session && req.session.userId) {
        return res.json({
            id: req.session.userId,
            fullname: req.session.userFullname,
            role: req.session.userRole
        });
    }
    res.status(401).json({ error: "Non connecté" });
});

module.exports = router;
