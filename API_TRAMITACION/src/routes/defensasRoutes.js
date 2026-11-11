const express = require('express');
const router = new express.Router();
const controller = require('../controllers/defensasController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/notificaciones', controller.listarNotificacionesPorDestinatario);
router.get('/aptos', authenticate, requireRole('correferente'), controller.listarAptos);
router.get('/documentos', controller.listarDocumentosDefensa);
router.get('/:estudianteId', controller.obtenerEstado);
router.post('/:estudianteId/autorizacion', controller.autorizarDefensa);
router.get('/:estudianteId/notificaciones', controller.obtenerNotificaciones);
router.post('/evaluacion', authenticate, requireRole('correferente'), controller.guardarEvaluacionCorreferente);
router.get('/:estudianteId/evaluacion', authenticate, controller.obtenerEvaluacionCorreferente);

module.exports = router;