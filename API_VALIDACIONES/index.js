const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
require('dotenv').config();

const routes = require('./src/routes/index');
const database = require('./src/db');

const query = (sql, values = []) => new Promise((resolve, reject) => {
    database.query(sql, values, (error, result) => error ? reject(error) : resolve(result));
});

const ensureColumn = async (table, column, definition) => {
    const rows = await query(`
        SELECT COUNT(*) AS total
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [table, column]);
    if (rows[0].total === 0) {
        await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
};

const initializeSchema = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS persona (
            rut_persona VARCHAR(20) PRIMARY KEY,
            nombre_persona VARCHAR(100) NOT NULL,
            departamento VARCHAR(100),
            sede VARCHAR(100),
            mail_persona VARCHAR(100),
            fono_persona VARCHAR(20)
        )
    `);
    await query(`
            CREATE TABLE IF NOT EXISTS usuario (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                rut_persona VARCHAR(20),
                rol_universitario VARCHAR(20),
                profesor_guia_rol VARCHAR(20),
                correferente_rol VARCHAR(20),
                nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
                correo VARCHAR(100) NOT NULL UNIQUE,
                contrasena VARCHAR(100) NOT NULL,
                rol VARCHAR(50) NOT NULL
            )
        `);
    await ensureColumn('usuario', 'rut_persona', 'VARCHAR(20)');
    await ensureColumn('usuario', 'rol_universitario', 'VARCHAR(20)');
    await ensureColumn('usuario', 'profesor_guia_rol', 'VARCHAR(20)');
    await ensureColumn('usuario', 'correferente_rol', 'VARCHAR(20)');
    await query(`
        DELETE FROM usuario
        WHERE nombre_usuario IN (
            'estudiante.usm', 'estudiante2.usm', 'profesor.usm', 'martina.tejo',
            'paula.castillo', 'felipe.aguilera', 'benjamin.vergara', 'javiera.roda'
        )
    `);
    await query(`
                        INSERT IGNORE INTO persona
                            (rut_persona, nombre_persona, departamento, sede, mail_persona)
                        VALUES
                            ('12.345.678-5', 'Paula Castillo', 'Informática', 'Casa Central', 'paula.castillo@usm.cl'),
                            ('19.876.543-2', 'Felipe Aguilera', 'Informática', 'Casa Central', 'felipe.aguilera@usm.cl'),
                            ('18.765.432-1', 'Benjamin Vergara', 'Informática', 'Casa Central', 'benjamin.vergara@usm.cl'),
                            ('16.543.210-9', 'Javiera Roda', 'Informática', 'Casa Central', 'javiera.roda@usm.cl')
                    `);
    await query(`
                            INSERT IGNORE INTO usuario
                                (rut_persona, rol_universitario, profesor_guia_rol, correferente_rol, nombre_usuario, correo, contrasena, rol)
                            VALUES
                                ('12.345.678-5', '202473070-3', '202473009-6', '202473010-K', 'paula.castillo', 'paula.castillo@usm.cl',
                                 '$2a$10$CZUh2ZdYYRdBTvVnNxN.XuiFUqob3OvbU7TJqLvOmC5tN9xT05Ncu', 'memorista'),
                                ('12.345.679-6', '202473021-5', '202473009-6', '202473010-K', 'felipe.aguilera', 'felipe.aguilera@usm.cl',
                                 '$2a$10$CZUh2ZdYYRdBTvVnNxN.XuiFUqob3OvbU7TJqLvOmC5tN9xT05Ncu', 'memorista'),
                                ('18.765.432-1', '202473083-5', '202473009-6', '202473010-K', 'benjamin.vergara', 'benjamin.vergara@usm.cl',
                                 '$2a$10$CZUh2ZdYYRdBTvVnNxN.XuiFUqob3OvbU7TJqLvOmC5tN9xT05Ncu', 'memorista'),
                                ('16.543.210-9', '202473009-6', NULL, NULL, 'javiera.roda', 'javiera.roda@usm.cl',
                                 '$2a$10$6KNuajBjplmhiTsjmLDItOus3RqIjKc.fy0qKcNQot/huMqIsRicG', 'profesor_guia')
                        `);
    await query(`
                                UPDATE usuario
                                SET rol_universitario = '202473070-3', profesor_guia_rol = '202473009-6'
                                WHERE nombre_usuario = 'paula.castillo';
                            `);
    await query(`
                                UPDATE usuario
                                SET rol_universitario = '202473021-5', profesor_guia_rol = '202473009-6'
                                WHERE nombre_usuario = 'felipe.aguilera';
                            `);
    await query(`
                                UPDATE usuario
                                SET rol_universitario = '202473083-5', profesor_guia_rol = '202473009-6'
                                WHERE nombre_usuario = 'benjamin.vergara';
                            `);
    await query(`
                                UPDATE usuario
                                SET rol_universitario = '202473009-6', profesor_guia_rol = NULL
                                WHERE nombre_usuario = 'javiera.roda'
                            `);
};

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(routes);

initializeSchema()
    .then(() => app.listen(process.env.PORT_API, () => console.log('Server running!')))
    .catch((error) => {
        console.error('No se pudo preparar el esquema de Validaciones:', error);
        process.exitCode = 1;
    });