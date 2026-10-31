const express = require('express');
const multer = require('multer');
const router = new express.Router();

const index = require('../controllers/index');

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (req, file, callback) => {
		if (file.mimetype !== 'application/pdf') {
			return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
		}
		callback(null, true);
	}
});

// Esto es un ejemplo - SE PUEDE BORRAR
router.get('/', (req, res) => res.json({message: 'Probando... La prueba de API_Tramitacion fue un éxito!'}));

//==========================endpoints(Routes)============================//
// Esto es un ejemplo para endpoints
router.get('/createTable', index.createTable);
router.post('/api/avances', upload.single('archivoPdf'), index.createAdvance);
router.get('/api/avances', index.listAdvances);
router.use('/api/revisiones', require('./revisionesRoutes'));

router.use((error, req, res, next) => {
	if (!(error instanceof multer.MulterError)) return next(error);

	if (error.code === 'LIMIT_FILE_SIZE') {
		return res.status(413).json({ message: 'El archivo PDF supera el tamaño máximo de 10 MB.' });
	}

	return res.status(400).json({ message: 'Debe enviar un archivo PDF válido en archivoPdf.' });
});

module.exports = router;