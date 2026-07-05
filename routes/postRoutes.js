const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// Route propre sans le middleware upload.single() qui bloquait
router.post('/create', postController.createPost);

module.exports = router;
