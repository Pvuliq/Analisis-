const database = require('../db');

const STUDENT_ID_PATTERN = /^\d{8,9}-[\dKk]$/;
const MAX_LENGTHS = {
    tituloProvisional: 100,
    origenMemoria: 500,
    descripcionProblema: 1000,
    alcanceObjetivos: 1000,
    correoInstitucional: 100,
    telefonoContacto: 20
};
const VALID_MEMORY_ORIGINS = [
    'Proyecto propio del estudiante',
    'Proyecto desarrollado para una empresa',
    'Proyecto propuesto por un profesor',
    'Proyecto presentado en Feria de Software'
];

const query = (sql, values = []) => new Promise((resolve, reject) => {
    database.query(sql, values, (error, result) => {
        if (error) return reject(error);
        resolve(result);
    });
});

const ensureColumn = async (column, definition) => {
    const rows = await query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'propuestas'
           AND COLUMN_NAME = ?`,
        [column]
    );

    if (rows[0].total === 0) {
        await query(`ALTER TABLE propuestas ADD COLUMN ${column} ${definition}`);
    }
};

const initializeSchema = async () => {
    await query(`
    CREATE TABLE IF NOT EXISTS propuestas (
        propuestaId INT AUTO_INCREMENT PRIMARY KEY,
        estudianteId VARCHAR(20) NOT NULL UNIQUE,
        tituloProvisional VARCHAR(150) NOT NULL,
        profesorGuiaId VARCHAR(20) NOT NULL,
        correoInstitucional VARCHAR(100) NOT NULL,
        telefonoContacto VARCHAR(20) NOT NULL,
        origenMemoria TEXT NOT NULL,
        descripcionProblema TEXT NOT NULL,
        alcanceObjetivos TEXT NOT NULL,
        compromisoEtico TINYINT(1) NOT NULL DEFAULT 0,
        estado VARCHAR(40) NOT NULL DEFAULT 'Pendiente de validación',
        fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fechaActualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    `);
    await ensureColumn('correoInstitucional', 'VARCHAR(100) NULL');
    await ensureColumn('telefonoContacto', 'VARCHAR(20) NULL');
    await ensureColumn('compromisoEtico', 'TINYINT(1) NOT NULL DEFAULT 0');
};

const normalizeText = (value) => String(value ?? '').trim();

const validateProposal = (body) => {
    const proposal = {
        estudianteId: normalizeText(body.estudianteId),
        tituloProvisional: normalizeText(body.tituloProvisional),
        profesorGuiaId: normalizeText(body.profesorGuiaId),
        correoInstitucional: normalizeText(body.correoInstitucional).toLowerCase(),
        telefonoContacto: normalizeText(body.telefonoContacto),
        origenMemoria: normalizeText(body.origenMemoria),
        descripcionProblema: normalizeText(body.descripcionProblema),
        alcanceObjetivos: normalizeText(body.alcanceObjetivos),
        compromisoEtico: body.compromisoEtico === true || body.compromisoEtico === 'true'
    };

    if (!STUDENT_ID_PATTERN.test(proposal.estudianteId)) {
        return 'estudianteId debe tener formato RUT, por ejemplo 202473021-5.';
    }

    if (!STUDENT_ID_PATTERN.test(proposal.profesorGuiaId)) {
        return 'profesorGuiaId debe tener formato ROL, por ejemplo 202473009-6.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(proposal.correoInstitucional) ||
        !proposal.correoInstitucional.endsWith('@usm.cl')) {
        return 'Ingresa un correo institucional USM válido.';
    }

    if (!/^[0-9+()\s-]{7,20}$/.test(proposal.telefonoContacto)) {
        return 'Ingresa un número celular válido.';
    }

    if (!proposal.compromisoEtico) {
        return 'Debes aceptar el compromiso ético para registrar la propuesta.';
    }

    if (!VALID_MEMORY_ORIGINS.includes(proposal.origenMemoria)) {
        return 'Selecciona un origen válido para la memoria.';
    }

    const labels = {
        tituloProvisional: 'El título provisional',
        origenMemoria: 'El origen de la memoria',
        descripcionProblema: 'La descripción del problema',
        alcanceObjetivos: 'El alcance y los objetivos'
    };

    for (const [field, label] of Object.entries(labels)) {
        if (!proposal[field]) return `${label} es obligatorio.`;
        if (proposal[field].length > MAX_LENGTHS[field]) {
            return `${label} no puede superar los ${MAX_LENGTHS[field]} caracteres.`;
        }
    }

    return proposal;
};

const getProposal = (req, res) => {
    const estudianteId = normalizeText(req.params.estudianteId);
    if (!STUDENT_ID_PATTERN.test(estudianteId)) {
        return res.status(400).json({ message: 'El identificador del estudiante no es válido.' });
    }

    database.query(
        `SELECT estado
         FROM propuestas
         WHERE estudianteId = ?
         LIMIT 1`,
        [estudianteId],
        (error, rows) => {
            if (error) {
                console.error('No se pudo consultar la propuesta:', error);
                return res.status(500).json({ message: 'No se pudo consultar la propuesta.' });
            }
            if (rows.length === 0) {
                return res.json({ existe: false, estado: null });
            }
            return res.json({ existe: true, estado: rows[0].estado });
        }
    );
};

const createProposal = (req, res) => {
    const proposal = validateProposal(req.body);
    if (typeof proposal === 'string') {
        return res.status(400).json({ message: proposal });
    }

    const insertQuery = `
        INSERT INTO propuestas
            (estudianteId, tituloProvisional, profesorGuiaId, origenMemoria,
             descripcionProblema, alcanceObjetivos, correoInstitucional,
             telefonoContacto, compromisoEtico, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente de validación')
    `;

    database.query(
        insertQuery,
        [
            proposal.estudianteId,
            proposal.tituloProvisional,
            proposal.profesorGuiaId,
            proposal.origenMemoria,
            proposal.descripcionProblema,
            proposal.alcanceObjetivos,
            proposal.correoInstitucional,
            proposal.telefonoContacto,
            proposal.compromisoEtico
        ],
        (error, result) => {
            if (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'El estudiante ya tiene una propuesta registrada.' });
                }
                console.error('No se pudo registrar la propuesta:', error);
                return res.status(500).json({ message: 'No se pudo registrar la propuesta.' });
            }

            return res.status(201).json({
                propuestaId: result.insertId,
                ...proposal,
                estado: 'Pendiente de validación',
                mensaje: 'Propuesta registrada exitosamente.'
            });
        }
    );
};

module.exports = {
    initializeSchema,
    getProposal,
    createProposal
};
