const express = require('express');
const router = new express.Router();
const controller = require('../controllers/revisionesController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/createTable', controller.createTable);
router.post('/', authenticate, requireRole('profesor_guia'), controller.guardarRevision);
router.get('/', authenticate, requireRole('memorista'), controller.obtenerRevisiones);
router.get('/pendientes', authenticate, requireRole('profesor_guia'), controller.obtenerPendientes);

module.exports = router;