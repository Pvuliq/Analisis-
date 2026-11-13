const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../db');

const login = (req, res) => {
    const { nombreUsuario, contrasena } = req.body;
    if (!nombreUsuario || !contrasena) {
        return res.status(400).json({ message: 'El usuario y la contraseña son obligatorios.' });
    }

    const query = `
        SELECT u.id_usuario, u.rut_persona, u.rol_universitario,
               u.profesor_guia_rol,
               u.nombre_usuario, u.correo, u.contrasena, u.rol,
               p.nombre_persona
        FROM usuario u
        LEFT JOIN persona p ON p.rut_persona = u.rut_persona
        WHERE u.nombre_usuario = ?
        LIMIT 1
    `;

    database.query(query, [nombreUsuario.trim()], (error, rows) => {
        if (error) {
            console.error('Error al consultar el usuario:', error);
            return res.status(500).json({ message: 'No se pudo validar el inicio de sesión.' });
        }

        const user = rows[0];
        if (!user || !bcrypt.compareSync(contrasena, user.contrasena)) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
        }

        const payload = {
            id: user.id_usuario,
            id_usuario: user.id_usuario,
            rut: user.rut_persona,
            rolUniversitario: user.rol_universitario,
            estudianteId: user.rol_universitario,
            profesorGuiaId: user.profesor_guia_rol,
            username: user.nombre_usuario,
            role: user.rol,
            name: user.nombre_persona || user.nombre_usuario
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        return res.json({ token, user: payload });
    });
};

const profile = (req, res) => res.json({ user: req.user });

const listProfessorGuides = (req, res) => {
    const query = `
        SELECT u.rol_universitario AS profesorGuiaId,
               COALESCE(p.nombre_persona, u.nombre_usuario) AS nombre
        FROM usuario u
        LEFT JOIN persona p ON p.rut_persona = u.rut_persona
        WHERE LOWER(u.rol) IN ('profesor_guia', 'profesor', 'guia')
          AND u.rol_universitario IS NOT NULL
        ORDER BY nombre ASC
    `;

    database.query(query, (error, rows) => {
        if (error) {
            console.error('No se pudieron consultar los profesores guía:', error);
            return res.status(500).json({ message: 'No se pudieron consultar los profesores guía.' });
        }
        return res.json(rows);
    });
};

module.exports = { login, profile, listProfessorGuides };
