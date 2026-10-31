const express = require('express');
const router = new express.Router();
const controller = require('../controllers/defensasController');

router.get('/notificaciones', controller.listarNotificacionesPorDestinatario);
router.get('/:estudianteId', controller.obtenerEstado);
router.post('/:estudianteId/autorizacion', controller.autorizarDefensa);
router.get('/:estudianteId/notificaciones', controller.obtenerNotificaciones);

module.exports = router;
