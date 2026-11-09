const database = require('../db');

const createTable = (req, res) => {
    const query = `
        CREATE TABLE IF NOT EXISTS revisiones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            avanceId INT NULL,
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

const guardarRevision = (req, res) => {
    const { observaciones, resultado } = req.body;
    const avanceId = Number(req.body.avanceId ?? req.body.id_avance);

    if (!observaciones || !resultado || !Number.isInteger(avanceId) || avanceId <= 0) {
        return res.status(400).json({ error: 'avanceId, observaciones y resultado son obligatorios' });
    }

    const insertQuery = `
        INSERT INTO revisiones (avanceId, documento, observaciones, resultado)
        SELECT avanceId, nombreArchivo, ?, ?
        FROM avances
        WHERE avanceId = ?
    `;

    database.query(insertQuery, [observaciones, resultado, avanceId], (err, result) => {
        if (err) {
            console.error('No se pudo guardar la revisión:', err);
            return res.status(500).json({ message: 'No se pudo guardar la revisión.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No existe el avance que se intenta revisar' });
        }
        res.status(201).json({
            message: 'Revisión guardada',
            id: result.insertId,
            avanceId,
            resultado
        });
    });
};

const obtenerRevisiones = (req, res) => {
    const query = 'SELECT * FROM revisiones ORDER BY fecha_revision DESC';

    database.query(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

const obtenerPendientes = (req, res) => {
    const query = `
        SELECT a.avanceId, a.estudianteId AS estudianteIdentificacion, a.estudianteId,
               a.profesorGuiaId,
               a.nombreArchivo,
               a.tamanoBytes, a.fechaEntrega, a.estado, a.esVersionFinal
        FROM avances a
        LEFT JOIN revisiones r ON a.avanceId = r.avanceId
        WHERE r.id IS NULL
        ORDER BY a.fechaEntrega ASC
    `;

    database.query(query, (error, rows) => {
        if (error) {
            return res.status(500).json({ message: 'No se pudieron consultar las entregas pendientes.' });
        }
        return res.json(rows);
    });
};

module.exports = {
    createTable,
    guardarRevision,
    obtenerRevisiones,
    obtenerPendientes
};