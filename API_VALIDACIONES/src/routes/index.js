const express = require('express');
const router = new express.Router();

const index = require('../controllers/index');
const authRoutes = require('./authRoutes');

router.get('/', (req, res) => res.json({message: 'Probando... La prueba de API_Validaciones fue un éxito!'}));

//==========================endpoints(Routes)============================//
// Esto es un ejemplo para endpoints
router.get('/createTable', index.createTable);
router.use('/api/auth', authRoutes);

module.exports = router;