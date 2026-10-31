const express = require('express');
const router = new express.Router();
const controller = require('../controllers/revisionesController');

router.get('/createTable', controller.createTable);
router.post('/', controller.guardarRevision);
router.get('/', controller.obtenerRevisiones);

module.exports = router;