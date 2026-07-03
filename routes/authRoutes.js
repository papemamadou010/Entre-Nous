const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route POST pour l'inscription
router.post('/register', authController.register);

module.exports = router;
