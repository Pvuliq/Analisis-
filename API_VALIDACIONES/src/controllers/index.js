const database = require('../db');


//Esta tabla es solo un ejemplo para que puedan ver como se hacen querys a la bdd, después puede ser eliminada
const createTable = (req, res) => {
    const personaQuery = `
        CREATE TABLE IF NOT EXISTS persona (
            rut_persona VARCHAR(20) PRIMARY KEY,
            nombre_persona VARCHAR(100) NOT NULL,
            departamento VARCHAR(100),
            sede VARCHAR(100),
            mail_persona VARCHAR(100),
            fono_persona VARCHAR(20)
        )
    `;
    const usuarioQuery = `
        CREATE TABLE IF NOT EXISTS usuario (
            id_usuario INT AUTO_INCREMENT PRIMARY KEY,
            nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
            correo VARCHAR(100) NOT NULL UNIQUE,
            contrasena VARCHAR(100) NOT NULL,
            rol VARCHAR(50) NOT NULL
        )
    `;

    database.query(personaQuery, (personaError) => {
        if (personaError) {
            console.error('No se pudo crear la tabla persona:', personaError);
            return res.status(500).json({ message: 'No se pudieron crear las tablas de validaciones.' });
        }
        database.query(usuarioQuery, (usuarioError) => {
            if (usuarioError) {
                console.error('No se pudo crear la tabla usuario:', usuarioError);
                return res.status(500).json({ message: 'No se pudieron crear las tablas de validaciones.' });
            }
            return res.json({ message: 'Tablas de autenticación creadas.' });
        });
    });
};


module.exports = {
    createTable
};