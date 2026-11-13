const express = require('express');
const { login, profile, listProfessorGuides } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/profile', authenticate, profile);
router.get('/profesores-guia', listProfessorGuides);

module.exports = router;
