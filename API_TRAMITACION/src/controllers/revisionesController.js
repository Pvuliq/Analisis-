const database = require('../db');

const createTable = (req, res) => {
    const query = `
        CREATE TABLE IF NOT EXISTS revisiones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            avanceId INT NULL,
            documento VARCHAR(255) DEFAULT 'Avance_memoria_v03.pdf',
            profesor_id INT DEFAULT 1,
            profesor_guia_id VARCHAR(20) NULL,
            profesor_nombre VARCHAR(100) NULL,
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
    const profesorGuiaId = String(req.user?.rolUniversitario || '').trim();
    const profesorNombre = String(req.user?.name || req.user?.username || '').trim();

    if (!observaciones || !resultado || !Number.isInteger(avanceId) || avanceId <= 0 ||
        !profesorGuiaId || !profesorNombre) {
        return res.status(400).json({ error: 'avanceId, observaciones y resultado son obligatorios' });
    }

    const insertQuery = `
        INSERT INTO revisiones
            (avanceId, documento, profesor_id, profesor_guia_id, profesor_nombre, observaciones, resultado)
        SELECT avanceId, nombreArchivo, ?, ?, ?, ?, ?
        FROM avances
        WHERE avanceId = ? AND profesorGuiaId = ?
    `;

    database.query(
        insertQuery,
        [req.user.id || null, profesorGuiaId, profesorNombre, observaciones, resultado, avanceId, profesorGuiaId],
        (err, result) => {
        if (err) {
            console.error('No se pudo guardar la revisión:', err);
            return res.status(500).json({ message: 'No se pudo guardar la revisión.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No existe el avance que se intenta revisar' });
        }

        const updateQuery = `UPDATE avances SET estado = 'Revisado' WHERE avanceId = ?`;
        
        database.query(updateQuery, [avanceId], (updateErr) => {
            if (updateErr) {
                console.error('Error al actualizar el estado del avance:', updateErr);
                return res.status(500).json({ message: 'Revisión guardada, pero falló la actualización del estado.' });
            }
            
            res.status(201).json({
                message: 'Revisión guardada y estado actualizado',
                id: result.insertId,
                avanceId,
                resultado
            });
        });
        }
    );
};

const obtenerRevisiones = (req, res) => {
    const estudianteId = String(req.user?.estudianteId || '').trim();
    const query = `
        SELECT r.id, r.avanceId, r.documento, r.observaciones, r.resultado,
               r.fecha_revision, r.profesor_guia_id, r.profesor_nombre,
               a.estado, a.fechaEntrega
        FROM revisiones r
        INNER JOIN avances a ON a.avanceId = r.avanceId
        WHERE a.estudianteId = ?
        ORDER BY r.fecha_revision DESC
    `;

    database.query(query, [estudianteId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

const obtenerPendientes = (req, res) => {
    const query = `
        SELECT a.avanceId, a.estudianteId AS estudianteIdentificacion, a.estudianteId,
               COALESCE(p.nombre_persona, u.nombre_usuario, a.estudianteId) AS nombreEstudiante,
               a.profesorGuiaId,
               a.nombreArchivo,
               a.tamanoBytes, a.fechaEntrega, a.estado, a.esVersionFinal
        FROM avances a
        LEFT JOIN revisiones r ON a.avanceId = r.avanceId
        LEFT JOIN BD02_VALIDACIONES.usuario u ON u.rol_universitario = a.estudianteId
        LEFT JOIN BD02_VALIDACIONES.persona p ON p.rut_persona = u.rut_persona
        WHERE r.id IS NULL AND a.profesorGuiaId = ?
        ORDER BY a.fechaEntrega ASC
    `;

    database.query(query, [String(req.user?.rolUniversitario || '').trim()], (error, rows) => {
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