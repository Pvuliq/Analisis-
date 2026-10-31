const express = require('express');
const router = new express.Router();
const controller = require('../controllers/revisionesController');

router.get('/createTable', controller.createTable);
router.post('/', controller.guardarRevision);

module.exports = router;