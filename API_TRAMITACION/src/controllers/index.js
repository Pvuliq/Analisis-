const database = require('../db');

const createTable = (req, res) => {
    const query = 'CREATE TABLE IF NOT EXISTS user(id int AUTO_INCREMENT, firstname VARCHAR(50), lastname VARCHAR(50), email VARCHAR(50), PRIMARY KEY(id))';

    database.query(query, (err) => {
        if (err) throw err;
        res.send('Tabla creada');
    });
};

const createAdvance = (req, res) => {
    if (req.headers['x-authenticated'] === 'false') {
        return res.status(401).json({ message: 'La sesión no está autenticada.' });
    }

    const role = req.headers['x-role'];
    if (role && !['student', 'memorista', 'prememorista'].includes(role.toLowerCase())) {
        return res.status(403).json({ message: 'El rol no está autorizado para subir avances.' });
    }

    if (!req.file || !req.body.estudianteId) {
        return res.status(400).json({ message: 'archivoPdf y estudianteId son obligatorios.' });
    }

    const estudianteId = Number(req.body.estudianteId);
    if (!Number.isInteger(estudianteId) || estudianteId <= 0) {
        return res.status(400).json({ message: 'estudianteId debe ser un entero positivo.' });
    }

    const createAdvanceTable = `
        CREATE TABLE IF NOT EXISTS avances (
            avanceId INT AUTO_INCREMENT PRIMARY KEY,
            estudianteId INT NOT NULL,
            nombreArchivo VARCHAR(255) NOT NULL,
            archivoPdf LONGBLOB NOT NULL,
            tamanoBytes INT NOT NULL,
            fechaEntrega DATETIME NOT NULL,
            estado VARCHAR(50) NOT NULL
        )
    `;

    database.query(createAdvanceTable, (tableError) => {
        if (tableError) {
            return res.status(500).json({ message: 'No se pudo preparar el almacenamiento del avance.' });
        }

        const fechaEntrega = new Date();
        const insertAdvance = `
            INSERT INTO avances
                (estudianteId, nombreArchivo, archivoPdf, tamanoBytes, fechaEntrega, estado)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [
            estudianteId,
            req.file.originalname,
            req.file.buffer,
            req.file.size,
            fechaEntrega,
            'Esperando revisión'
        ];

        database.query(insertAdvance, values, (insertError, result) => {
            if (insertError) {
                return res.status(500).json({ message: 'No se pudo registrar el avance.' });
            }

            return res.status(201).json({
                avanceId: result.insertId,
                estudianteId,
                nombreArchivo: req.file.originalname,
                tamanoBytes: req.file.size,
                fechaEntrega: fechaEntrega.toISOString(),
                estado: 'Esperando revisión',
                mensaje: 'Avance registrado exitosamente.'
            });
        });
    });
};

const listAdvances = (req, res) => {
    const estudianteId = Number(req.query.estudianteId);

    if (!Number.isInteger(estudianteId) || estudianteId <= 0) {
        return res.status(400).json({ message: 'estudianteId debe ser un entero positivo.' });
    }

    const query = `
        SELECT avanceId, estudianteId, nombreArchivo, tamanoBytes,
               fechaEntrega, estado
        FROM avances
        WHERE estudianteId = ?
        ORDER BY fechaEntrega DESC
    `;

    database.query(query, [estudianteId], (error, rows) => {
        if (error) {
            return res.status(500).json({ message: 'No se pudieron consultar los avances.' });
        }

        return res.json(rows);
    });
};

module.exports = {
    createTable,
    createAdvance,
    listAdvances
};
