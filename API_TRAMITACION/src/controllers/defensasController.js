const database = require('../db');

const query = (sql, values = [], executor = database) => new Promise((resolve, reject) => {
    executor.query(sql, values, (error, result) => {
        if (error) return reject(error);
        resolve(result);
    });
});

const getConnection = () => new Promise((resolve, reject) => {
    database.getConnection((error, connection) => {
        if (error) return reject(error);
        resolve(connection);
    });
});

const beginTransaction = (connection) => new Promise((resolve, reject) => {
    connection.beginTransaction((error) => error ? reject(error) : resolve());
});

const commitTransaction = (connection) => new Promise((resolve, reject) => {
    connection.commit((error) => error ? reject(error) : resolve());
});

const rollbackTransaction = (connection) => new Promise((resolve, reject) => {
    connection.rollback((error) => error ? reject(error) : resolve());
});

const ensureColumn = async (table, column, definition) => {
    const rows = await query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );

    if (rows[0].total === 0) {
        await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
};

const ensureStudentIdentifierType = async (table) => {
    await query(`ALTER TABLE \`${table}\` MODIFY COLUMN estudianteId VARCHAR(20) NOT NULL`);
};

const initializeSchema = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS avances (
            avanceId INT AUTO_INCREMENT PRIMARY KEY,
            estudianteId VARCHAR(20) NOT NULL,
            nombreArchivo VARCHAR(255) NOT NULL,
            archivoPdf LONGBLOB NOT NULL,
            tamanoBytes INT NOT NULL,
            fechaEntrega DATETIME NOT NULL,
            estado VARCHAR(50) NOT NULL,
            esVersionFinal TINYINT(1) NOT NULL DEFAULT 0
        )
    `);
    await ensureColumn('avances', 'esVersionFinal', 'TINYINT(1) NOT NULL DEFAULT 0');
    await ensureColumn('avances', 'profesorGuiaId', 'VARCHAR(20) NULL');
    await ensureStudentIdentifierType('avances');

    await query(`
        CREATE TABLE IF NOT EXISTS revisiones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            avanceId INT NULL,
            documento VARCHAR(255) DEFAULT 'Avance_memoria_v03.pdf',
            profesor_id INT DEFAULT 1,
            observaciones TEXT NOT NULL,
            resultado VARCHAR(50) NOT NULL,
            fecha_revision DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await ensureColumn('revisiones', 'avanceId', 'INT NULL');

    await query(`
        CREATE TABLE IF NOT EXISTS autorizaciones_defensa (
            id INT AUTO_INCREMENT PRIMARY KEY,
            estudianteId VARCHAR(20) NOT NULL,
            avanceId INT NOT NULL,
            revisionId INT NOT NULL,
            estado VARCHAR(50) NOT NULL,
            fechaAutorizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_autorizacion_estudiante (estudianteId)
        )
    `);
    await ensureStudentIdentifierType('autorizaciones_defensa');

    await query(`
        CREATE TABLE IF NOT EXISTS notificaciones_defensa (
            id INT AUTO_INCREMENT PRIMARY KEY,
            autorizacionId INT NOT NULL,
            destinatario VARCHAR(80) NOT NULL,
            mensaje VARCHAR(255) NOT NULL,
            fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            leida TINYINT(1) NOT NULL DEFAULT 0,
            UNIQUE KEY uq_notificacion_destinatario (autorizacionId, destinatario)
        )
    `);
};

const getStudentId = (value) => {
    const estudianteId = String(value || '').trim();
    return /^\d{8,9}-[\dKk]$/.test(estudianteId) ? estudianteId : null;
};

const getDefenseSnapshot = async (estudianteId, executor = database) => {
    const avances = await query(
        `SELECT a.avanceId, a.esVersionFinal, r.id AS revisionId
         FROM avances a
         LEFT JOIN revisiones r
            ON r.avanceId = a.avanceId AND r.resultado = 'Avance suficiente'
         WHERE a.estudianteId = ? AND a.esVersionFinal = 1
         ORDER BY a.fechaEntrega DESC, r.fecha_revision DESC
         LIMIT 1`,
        [estudianteId],
        executor
    );
    const autorizaciones = await query(
        `SELECT id, avanceId, revisionId, estado, fechaAutorizacion
         FROM autorizaciones_defensa
         WHERE estudianteId = ?`,
        [estudianteId],
        executor
    );
    const authorization = autorizaciones[0];
    const notifications = authorization
        ? await query(
            'SELECT COUNT(*) AS total FROM notificaciones_defensa WHERE autorizacionId = ?',
            [authorization.id],
            executor
        )
        : [{ total: 0 }];

    return {
        estudianteId,
        estado: authorization ? authorization.estado : 'En revisión final',
        versionFinalRegistrada: avances.length > 0,
        revisionFinalAprobada: avances.length > 0 && avances[0].revisionId !== null,
        autorizacionEmitida: Boolean(authorization),
        notificacionesRegistradas: notifications[0].total,
        fechaAutorizacion: authorization ? authorization.fechaAutorizacion : null
    };
};

const obtenerEstado = async (req, res) => {
    const estudianteId = getStudentId(req.params.estudianteId);
    if (!estudianteId) {
        return res.status(400).json({ message: 'estudianteId debe ser un entero positivo.' });
    }

    try {
        return res.json(await getDefenseSnapshot(estudianteId));
    } catch (error) {
        console.error('No se pudo consultar el estado de defensa:', error);
        return res.status(500).json({ message: 'No se pudo consultar el estado de defensa.' });
    }
};

const logRollbackError = async (connection) => {
    try {
        await rollbackTransaction(connection);
    } catch (rollbackError) {
        console.error('No se pudo revertir la transacción de autorización:', rollbackError);
    }
};

const autorizarDefensa = async (req, res) => {
    if (req.headers['x-authenticated'] === 'false') {
        return res.status(401).json({ message: 'La sesión no está autenticada.' });
    }
    if (req.headers['x-role'] !== 'guide') {
        return res.status(403).json({ message: 'Solo el Profesor Guía puede autorizar la defensa.' });
    }

    const estudianteId = getStudentId(req.params.estudianteId);
    if (!estudianteId) {
        return res.status(400).json({ message: 'estudianteId debe ser un entero positivo.' });
    }

    let connection;
    let transactionStarted = false;
    let transactionCommitted = false;
    try {
        connection = await getConnection();
        await beginTransaction(connection);
        transactionStarted = true;

        const avances = await query(
            `SELECT avanceId
             FROM avances
             WHERE estudianteId = ? AND esVersionFinal = 1
             ORDER BY fechaEntrega DESC
             LIMIT 1
             FOR UPDATE`,
             [estudianteId],
             connection
        );

        if (avances.length === 0) {
             await rollbackTransaction(connection);
             transactionStarted = false;
             return res.status(409).json({
                 message: 'No se puede autorizar la defensa: falta registrar la versión final del documento.'
            });
        }

        const avanceId = avances[0].avanceId;
        const revisiones = await query(
            `SELECT id
             FROM revisiones
             WHERE avanceId = ? AND resultado = 'Avance suficiente'
             ORDER BY fecha_revision DESC
             LIMIT 1`,
            [avanceId],
            connection
        );

        if (revisiones.length === 0) {
            await rollbackTransaction(connection);
            transactionStarted = false;
            return res.status(409).json({
                message: 'No se puede autorizar la defensa: la versión final aún no tiene una revisión aprobada.'
            });
        }

        const existing = await query(
            'SELECT id FROM autorizaciones_defensa WHERE estudianteId = ? FOR UPDATE',
            [estudianteId],
            connection
        );

        let autorizacionId;
        let statusCode = 201;
        if (existing.length > 0) {
            autorizacionId = existing[0].id;
            statusCode = 200;
        } else {
            const result = await query(
                `INSERT INTO autorizaciones_defensa
                    (estudianteId, avanceId, revisionId, estado)
                 VALUES (?, ?, ?, 'Apto para defensa')`,
                [estudianteId, avanceId, revisiones[0].id],
                connection
            );
            autorizacionId = result.insertId;

            await query(
                `INSERT INTO notificaciones_defensa (autorizacionId, destinatario, mensaje)
                 VALUES
                    (?, 'Jefatura de Carrera', ?),
                    (?, 'Secretaría', ?)`,
                [
                    autorizacionId,
                    `La memoria del estudiante ${estudianteId} está apta para defensa.`,
                    autorizacionId,
                    `La memoria del estudiante ${estudianteId} está apta para defensa.`
                ],
                connection
            );
        }

        const state = await getDefenseSnapshot(estudianteId, connection);
        await commitTransaction(connection);
        transactionCommitted = true;
        return res.status(statusCode).json(state);
    } catch (error) {
        if (connection && transactionStarted && !transactionCommitted) {
            await logRollbackError(connection);
        }
        console.error('No se pudo autorizar la defensa:', error);
        return res.status(500).json({ message: 'No se pudo registrar la autorización de defensa.' });
    } finally {
        if (connection) connection.release();
    }
};

const obtenerNotificaciones = async (req, res) => {
    const estudianteId = getStudentId(req.params.estudianteId);
    if (!estudianteId) {
        return res.status(400).json({ message: 'estudianteId debe ser un entero positivo.' });
    }

    try {
        const rows = await query(
            `SELECT n.id, n.destinatario, n.mensaje, n.fechaCreacion, n.leida
             FROM notificaciones_defensa n
             INNER JOIN autorizaciones_defensa a ON a.id = n.autorizacionId
             WHERE a.estudianteId = ?
             ORDER BY n.fechaCreacion DESC`,
            [estudianteId]
        );
        return res.json(rows);
    } catch (error) {
        console.error('No se pudieron consultar las notificaciones de defensa:', error);
        return res.status(500).json({ message: 'No se pudieron consultar las notificaciones de defensa.' });
    }
};

const listarNotificacionesPorDestinatario = async (req, res) => {
    const destinatario = req.query.destinatario;
    const rolesAutorizados = {
        'Jefatura de Carrera': 'head',
        'Secretaría': 'secretary'
    };

    if (!Object.prototype.hasOwnProperty.call(rolesAutorizados, destinatario)) {
        return res.status(400).json({
            message: 'destinatario debe ser Jefatura de Carrera o Secretaría.'
        });
    }
    if (req.headers['x-role'] !== rolesAutorizados[destinatario]) {
        return res.status(403).json({
            message: 'El rol no está autorizado para consultar estas notificaciones.'
        });
    }

    try {
        const rows = await query(
            `SELECT n.id, n.destinatario, n.mensaje, n.fechaCreacion, n.leida,
                    a.estudianteId, a.estado
             FROM notificaciones_defensa n
             INNER JOIN autorizaciones_defensa a ON a.id = n.autorizacionId
             WHERE n.destinatario = ?
             ORDER BY n.fechaCreacion DESC`,
            [destinatario]
        );
        return res.json(rows);
    } catch (error) {
        console.error('No se pudieron consultar las notificaciones del destinatario:', error);
        return res.status(500).json({ message: 'No se pudieron consultar las notificaciones.' });
    }
};

module.exports = {
    initializeSchema,
    obtenerEstado,
    autorizarDefensa,
    obtenerNotificaciones,
    listarNotificacionesPorDestinatario
};
