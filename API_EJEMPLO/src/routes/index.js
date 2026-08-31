const express = require('express');
const router = new express.Router();

const index = require('../controllers/index');

//==========================endpoints(Routes)============================//
router.get('/api/pais', index.getPaises);
router.post("/api/pais", index.addPais);
router.put("/api/pais/:id", index.updatePais);
router.delete("/api/pais/:id", index.deletePais);

module.exports = router;