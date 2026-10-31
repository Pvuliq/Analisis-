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
            estado VARCHAR(50) NOT NULL,
            esVersionFinal TINYINT(1) NOT NULL DEFAULT 0
        )
    `;

    database.query(createAdvanceTable, (tableError) => {
        if (tableError) {
            return res.status(500).json({ message: 'No se pudo preparar el almacenamiento del avance.' });
        }

        const fechaEntrega = new Date();
        const esVersionFinal = req.body.esVersionFinal === 'true';
        const insertAdvance = `
            INSERT INTO avances
                (estudianteId, nombreArchivo, archivoPdf, tamanoBytes, fechaEntrega, estado, esVersionFinal)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            estudianteId,
            req.file.originalname,
            req.file.buffer,
            req.file.size,
            fechaEntrega,
            'Esperando revisión',
            esVersionFinal
        ];

        database.getConnection((connectionError, connection) => {
            if (connectionError) {
                console.error('No se pudo obtener una conexión para registrar el avance:', connectionError);
                return res.status(500).json({ message: 'No se pudo registrar el avance.' });
            }

            connection.beginTransaction((transactionError) => {
                if (transactionError) {
                    connection.release();
                    console.error('No se pudo iniciar el registro del avance:', transactionError);
                    return res.status(500).json({ message: 'No se pudo registrar el avance.' });
                }

                const rollback = (error) => {
                    connection.rollback((rollbackError) => {
                        connection.release();
                        if (rollbackError) {
                            console.error('No se pudo revertir el registro del avance:', rollbackError);
                        }
                        console.error('No se pudo registrar el avance:', error);
                        res.status(500).json({ message: 'No se pudo registrar el avance.' });
                    });
                };

                const insert = () => {
                    connection.query(insertAdvance, values, (insertError, result) => {
                        if (insertError) return rollback(insertError);

                        connection.commit((commitError) => {
                            if (commitError) return rollback(commitError);
                            connection.release();
                            return res.status(201).json({
                                avanceId: result.insertId,
                                estudianteId,
                                nombreArchivo: req.file.originalname,
                                tamanoBytes: req.file.size,
                                fechaEntrega: fechaEntrega.toISOString(),
                                estado: 'Esperando revisión',
                                esVersionFinal,
                                mensaje: 'Avance registrado exitosamente.'
                            });
                        });
                    });
                };

                if (!esVersionFinal) return insert();

                connection.query(
                    'UPDATE avances SET esVersionFinal = 0 WHERE estudianteId = ?',
                    [estudianteId],
                    (updateError) => {
                        if (updateError) return rollback(updateError);
                        insert();
                    }
                );
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
               fechaEntrega, estado, esVersionFinal
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
