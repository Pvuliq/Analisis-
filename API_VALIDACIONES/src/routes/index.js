const express = require('express');
const router = new express.Router();

const index = require('../controllers/index');
const authRoutes = require('./authRoutes');

// Esto es un ejemplo - SE PUEDE BORRAR
router.get('/', (req, res) => res.json({message: 'Probando... La prueba de API_Validaciones fue un éxito!'}));
router.get('/health', (req, res) => {
    const database = require('../db');
    database.query('SELECT 1 AS healthy', (error) => {
        if (error) {
            console.error('API_VALIDACIONES no puede acceder a MySQL:', error);
            return res.status(503).json({ status: 'unhealthy', database: 'unavailable' });
        }
        return res.json({ status: 'ok', database: 'connected' });
    });
});

//==========================endpoints(Routes)============================//
// Esto es un ejemplo para endpoints
router.get('/createTable', index.createTable);
router.use('/api/auth', authRoutes);

module.exports = router;