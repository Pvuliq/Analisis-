const database = require('../db');

// Crea exclusivamente la tabla revisiones
const createTable = (req, res) => {
    const query = `
        CREATE TABLE IF NOT EXISTS revisiones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            documento VARCHAR(255) DEFAULT 'Avance_memoria_v03.pdf',
            profesor_id INT DEFAULT 1,
            observaciones TEXT NOT NULL,
            resultado VARCHAR(50) NOT NULL,
            fecha_revision DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    database.query(query, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.send('Tabla revisiones creada correctamente');
    });
};

// Guarda la observación y veredicto del profesor
const guardarRevision = (req, res) => {
    const { observaciones, resultado, documento = 'Avance_memoria_v03.pdf' } = req.body;

    if (!observaciones || !resultado) {
        return res.status(400).json({ error: 'Observaciones y resultado son obligatorios' });
    }

    const query = 'INSERT INTO revisiones (documento, observaciones, resultado) VALUES (?, ?, ?)';

    database.query(query, [documento, observaciones, resultado], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
            message: 'Revisión guardada',
            id: result.insertId,
            resultado
        });
    });
};

// Lista todas las revisiones para mostrarlas en el frontend
const obtenerRevisiones = (req, res) => {
    const query = 'SELECT * FROM revisiones ORDER BY fecha_revision DESC';

    database.query(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

module.exports = {
    createTable,
    guardarRevision,
    obtenerRevisiones
};