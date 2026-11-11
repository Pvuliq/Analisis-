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

const ensureIndex = async (table, index, definition) => {
    const rows = await query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [table, index]
    );

    if (rows[0].total === 0) {
        await query(`ALTER TABLE \`${table}\` ADD ${definition}`);
    }
};

const removeIndex = async (table, index) => {
    const rows = await query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [table, index]
    );

    if (rows[0].total > 0) {
        await query(`ALTER TABLE \`${table}\` DROP INDEX \`${index}\``);
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
            UNIQUE KEY uq_autorizacion_revision (avanceId, revisionId)
        )
    `);
    await ensureStudentIdentifierType('autorizaciones_defensa');
    await removeIndex('autorizaciones_defensa', 'uq_autorizacion_estudiante');
    await ensureIndex(
        'autorizaciones_defensa',
        'uq_autorizacion_revision',
        'UNIQUE KEY uq_autorizacion_revision (avanceId, revisionId)'
    );

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

    await query(`
        CREATE TABLE IF NOT EXISTS evaluacion_correferente (
            id INT AUTO_INCREMENT PRIMARY KEY,
            estudianteId VARCHAR(20) NOT NULL,
            avanceId INT NULL,
            correferenteId VARCHAR(20) NULL,
            nota INT NOT NULL,
            comentarios TEXT NOT NULL,
            acuerdoDefensa TINYINT(1) NOT NULL DEFAULT 1,
            fechaEvaluacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_evaluacion_avance (avanceId)
        )
    `);
    await ensureStudentIdentifierType('evaluacion_correferente');
    await ensureColumn('evaluacion_correferente', 'avanceId', 'INT NULL');
    await query(`
        UPDATE evaluacion_correferente ec
        SET avanceId = (
            SELECT MAX(a.avanceId)
            FROM avances a
            WHERE a.estudianteId = ec.estudianteId
              AND a.fechaEntrega <= ec.fechaEvaluacion
        )
        WHERE ec.avanceId IS NULL
          AND EXISTS (
              SELECT 1
              FROM avances a
              WHERE a.estudianteId = ec.estudianteId
                AND a.fechaEntrega <= ec.fechaEvaluacion
          )
    `);
    await removeIndex('evaluacion_correferente', 'uq_evaluacion_estudiante');
    await ensureIndex(
        'evaluacion_correferente',
        'uq_evaluacion_avance',
        'UNIQUE KEY uq_evaluacion_avance (avanceId)'
    );
    const unlinkedEvaluations = await query(
        'SELECT COUNT(*) AS total FROM evaluacion_correferente WHERE avanceId IS NULL'
    );
    if (unlinkedEvaluations[0].total > 0) {
        console.warn(
            `${unlinkedEvaluations[0].total} evaluación(es) anterior(es) se conservaron sin asociar a un informe final porque no fue posible determinar su versión.`
        );
    }
};

const getStudentId = (value) => {
    const estudianteId = String(value || '').trim();
    return /^\d{8,9}-[\dKk]$/.test(estudianteId) ? estudianteId : null;
};

const getAdvanceId = (value) => {
    const avanceId = Number(value);
    return Number.isInteger(avanceId) && avanceId > 0 ? avanceId : null;
};

const getDefenseSnapshot = async (estudianteId, executor = database, requestedAdvanceId = null) => {
    const advanceParams = [estudianteId];
    const advanceCondition = requestedAdvanceId
        ? 'a.estudianteId = ? AND a.avanceId = ?'
        : 'a.estudianteId = ? AND a.esVersionFinal = 1';
    if (requestedAdvanceId) advanceParams.push(requestedAdvanceId);

    const avances = await query(
        `SELECT a.avanceId, a.esVersionFinal, r.id AS revisionId, r.resultado AS revisionResultado
         FROM avances a
         LEFT JOIN revisiones r
            ON r.id = (
                SELECT r2.id
                FROM revisiones r2
                WHERE r2.avanceId = a.avanceId
                ORDER BY r2.fecha_revision DESC, r2.id DESC
                LIMIT 1
            )
         WHERE ${advanceCondition}
         ORDER BY a.fechaEntrega DESC, a.avanceId DESC
         LIMIT 1`,
        advanceParams,
        executor
    );
    const advance = avances[0];
    const isFinalReport = Boolean(advance && Number(advance.esVersionFinal) === 1);
    const authorizationRows = isFinalReport && advance.revisionResultado === 'Avance suficiente'
        ? await query(
            `SELECT id, avanceId, revisionId, estado, fechaAutorizacion
             FROM autorizaciones_defensa
             WHERE estudianteId = ? AND avanceId = ? AND revisionId = ?`,
            [estudianteId, advance.avanceId, advance.revisionId],
            executor
        )
        : [];
    const authorization = authorizationRows[0];
    const notifications = authorization
        ? await query(
            'SELECT COUNT(*) AS total FROM notificaciones_defensa WHERE autorizacionId = ?',
            [authorization.id],
            executor
        )
        : [{ total: 0 }];

    return {
        estudianteId,
        avanceId: advance ? advance.avanceId : null,
        estado: authorization
            ? authorization.estado
            : !advance
                ? 'En revisión final'
                : !isFinalReport
                    ? 'Documento no marcado como final'
                : !advance.revisionId
                    ? 'Pendiente de revisión'
                    : advance.revisionResultado === 'Avance suficiente'
                        ? 'Pendiente de visto bueno'
                        : 'Necesita correcciones',
        versionFinalRegistrada: isFinalReport,
        revisionFinalAprobada: Boolean(isFinalReport && advance.revisionResultado === 'Avance suficiente'),
        revisionFinalResultado: advance ? advance.revisionResultado : null,
        autorizacionEmitida: Boolean(authorization),
        notificacionesRegistradas: notifications[0].total,
        fechaAutorizacion: authorization ? authorization.fechaAutorizacion : null
    };
};

const obtenerEstado = async (req, res) => {
    const estudianteId = getStudentId(req.params.estudianteId);
    const requestedAdvanceId = req.query.avanceId === undefined
        ? null
        : getAdvanceId(req.query.avanceId);
    if (!estudianteId) {
        return res.status(400).json({ message: 'estudianteId debe ser un formato de RUT válido.' });
    }
    if (req.query.avanceId !== undefined && !requestedAdvanceId) {
        return res.status(400).json({ message: 'El identificador del documento no es válido.' });
    }

    try {
        return res.json(await getDefenseSnapshot(estudianteId, database, requestedAdvanceId));
    } catch (error) {
        console.error('No se pudo consultar el estado de defensa:', error);
        return res.status(500).json({ message: 'No se pudo consultar el estado de defensa.' });
    }
};

const listarDocumentosDefensa = async (req, res) => {
    try {
        const rows = await query(`
            SELECT a.avanceId, a.estudianteId, a.nombreArchivo, a.fechaEntrega, a.esVersionFinal
            FROM avances a
            ORDER BY a.fechaEntrega DESC, a.avanceId DESC
        `);
        return res.json(rows);
    } catch (error) {
        console.error('No se pudieron consultar los documentos para defensa:', error);
        return res.status(500).json({ message: 'No se pudieron consultar los documentos para defensa.' });
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
    const body = req.body || {};
    const requestedAdvanceId = body.avanceId === undefined
        ? null
        : getAdvanceId(body.avanceId);
    if (!estudianteId) {
        return res.status(400).json({ message: 'estudianteId debe ser un formato de RUT válido.' });
    }
    if (body.avanceId !== undefined && !requestedAdvanceId) {
        return res.status(400).json({ message: 'El identificador del documento no es válido.' });
    }

    let connection;
    let transactionStarted = false;
    let transactionCommitted = false;
    try {
        connection = await getConnection();
        await beginTransaction(connection);
        transactionStarted = true;

        const avances = requestedAdvanceId
            ? await query(
                `SELECT avanceId, esVersionFinal
                 FROM avances
                 WHERE estudianteId = ? AND avanceId = ?
                 FOR UPDATE`,
                [estudianteId, requestedAdvanceId],
                connection
            )
            : await query(
                `SELECT avanceId, esVersionFinal
                 FROM avances
                 WHERE estudianteId = ? AND esVersionFinal = 1
                 ORDER BY fechaEntrega DESC, avanceId DESC
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
        if (Number(avances[0].esVersionFinal) !== 1) {
            await rollbackTransaction(connection);
            transactionStarted = false;
            return res.status(409).json({
                message: 'No se puede autorizar la defensa: el documento seleccionado no está marcado como versión final.'
            });
        }
        const revisiones = await query(
            `SELECT id, resultado
             FROM revisiones
             WHERE avanceId = ?
             ORDER BY fecha_revision DESC, id DESC
             LIMIT 1`,
            [avanceId],
            connection
        );

        if (revisiones.length === 0 || revisiones[0].resultado !== 'Avance suficiente') {
            await rollbackTransaction(connection);
            transactionStarted = false;
            return res.status(409).json({
                message: revisiones.length === 0
                    ? 'No se puede autorizar la defensa: la versión final aún no tiene una revisión.'
                    : 'No se puede autorizar la defensa: la revisión más reciente de la versión final requiere correcciones.'
            });
        }

        const existing = await query(
            `SELECT id
             FROM autorizaciones_defensa
             WHERE estudianteId = ? AND avanceId = ? AND revisionId = ?
             FOR UPDATE`,
            [estudianteId, avanceId, revisiones[0].id],
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

        const state = await getDefenseSnapshot(estudianteId, connection, avanceId);
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
        return res.status(400).json({ message: 'estudianteId debe ser un formato de RUT válido.' });
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

const listarAptos = async (req, res) => {
    try {
        const correferenteId = req.query.correferenteId || req.user?.rolUniversitario || req.user?.rut;

        let sql = `
            SELECT u.rol_universitario AS estudianteId,
                   COALESCE(NULLIF(p.nombre_persona, ''), u.nombre_usuario) AS nombre,
                   u.nombre_usuario AS username,
                   a.avanceId,
                   a.nombreArchivo AS archivoFinal,
                   a.fechaEntrega,
                   ec.nota AS notaCorreferente,
                   ec.comentarios AS comentariosCorreferente
            FROM BD02_VALIDACIONES.usuario u
            LEFT JOIN BD02_VALIDACIONES.persona p ON p.rut_persona = u.rut_persona
            INNER JOIN avances a
                ON a.estudianteId = u.rol_universitario
                AND a.esVersionFinal = 1
                AND a.avanceId = (
                    SELECT MAX(a2.avanceId)
                    FROM avances a2
                    WHERE a2.estudianteId = u.rol_universitario
                      AND a2.esVersionFinal = 1
                )
            LEFT JOIN evaluacion_correferente ec
                ON ec.estudianteId = u.rol_universitario
                AND ec.avanceId = a.avanceId
            WHERE LOWER(u.rol) IN ('memorista', 'estudiante', 'prememorista')
              AND u.rol_universitario IS NOT NULL
        `;

        const params = [];
        if (correferenteId) {
            sql += ` AND u.correferente_rol = ?`;
            params.push(correferenteId);
        }

        sql += ` ORDER BY nombre`;

        const rows = await query(sql, params);
        return res.json(rows);
    } catch (error) {
        console.error('Error al listar estudiantes aptos:', error);
        return res.status(500).json({ message: 'No se pudo obtener la lista de memoristas y sus informes finales.' });
    }
};

const guardarEvaluacionCorreferente = async (req, res) => {
    const estudianteId = getStudentId(req.body.estudianteId);
    const avanceId = getAdvanceId(req.body.avanceId);
    const correferenteId = req.body.correferenteId || req.user?.rolUniversitario || req.user?.rut || null;
    const nota = Number(req.body.nota);
    const comentarios = String(req.body.comentarios || '').trim();
    const acuerdoDefensa = req.body.acuerdoDefensa !== undefined ? Boolean(req.body.acuerdoDefensa) : (nota >= 70);

    if (!estudianteId) {
        return res.status(400).json({ message: 'El identificador del estudiante es inválido.' });
    }
    if (!avanceId) {
        return res.status(400).json({ message: 'El identificador del informe final es inválido.' });
    }
    if (!Number.isInteger(nota) || nota < 0 || nota > 100) {
        return res.status(400).json({ message: 'La calificación debe ser un valor entero entre 0 y 100.' });
    }
    if (!comentarios) {
        return res.status(400).json({ message: 'Debe ingresar comentarios u observaciones.' });
    }

    try {
        const finalReports = await query(
            `SELECT avanceId
             FROM avances
             WHERE estudianteId = ? AND avanceId = ? AND esVersionFinal = 1
             LIMIT 1`,
            [estudianteId, avanceId]
        );
        if (finalReports.length === 0) {
            return res.status(409).json({ message: 'El informe final indicado ya no está disponible para evaluación.' });
        }

        await query(`
            INSERT INTO evaluacion_correferente
                (estudianteId, avanceId, correferenteId, nota, comentarios, acuerdoDefensa)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                correferenteId = COALESCE(VALUES(correferenteId), correferenteId),
                nota = VALUES(nota),
                comentarios = VALUES(comentarios),
                acuerdoDefensa = VALUES(acuerdoDefensa),
                fechaEvaluacion = CURRENT_TIMESTAMP
        `, [estudianteId, avanceId, correferenteId, nota, comentarios, acuerdoDefensa ? 1 : 0]);

        return res.status(201).json({
            message: 'Evaluación de correferente registrada con éxito.',
            estudianteId,
            avanceId
        });
    } catch (error) {
        console.error('Error al registrar evaluación de correferente:', error);
        return res.status(500).json({ message: 'No se pudo guardar la evaluación del correferente.' });
    }
};

const obtenerEvaluacionCorreferente = async (req, res) => {
    const estudianteId = getStudentId(req.params.estudianteId);
    const requestedAdvanceId = req.query.avanceId;
    const avanceId = requestedAdvanceId === undefined ? null : getAdvanceId(requestedAdvanceId);
    if (!estudianteId) {
        return res.status(400).json({ message: 'El identificador del estudiante es inválido.' });
    }
    if (requestedAdvanceId !== undefined && !avanceId) {
        return res.status(400).json({ message: 'El identificador del informe final es inválido.' });
    }

    try {
        const conditions = ['estudianteId = ?'];
        const params = [estudianteId];
        if (avanceId) {
            conditions.push('avanceId = ?');
            params.push(avanceId);
        }

        const rows = await query(`
            SELECT estudianteId, avanceId, correferenteId, nota, comentarios, acuerdoDefensa, fechaEvaluacion
            FROM evaluacion_correferente
            WHERE ${conditions.join(' AND ')}
            ORDER BY fechaEvaluacion DESC
            LIMIT 1
        `, params);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No existe evaluación para este estudiante.' });
        }

        return res.json(rows[0]);
    } catch (error) {
        console.error('Error al consultar evaluación de correferente:', error);
        return res.status(500).json({ message: 'No se pudo consultar la evaluación del correferente.' });
    }
};

module.exports = {
    initializeSchema,
    obtenerEstado,
    listarDocumentosDefensa,
    autorizarDefensa,
    obtenerNotificaciones,
    listarNotificacionesPorDestinatario,
    listarAptos,
    guardarEvaluacionCorreferente,
    obtenerEvaluacionCorreferente
};