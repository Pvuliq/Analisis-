USE BD02_VALIDACIONES;

CREATE TABLE IF NOT EXISTS persona (
    rut_persona VARCHAR(20) PRIMARY KEY,
    nombre_persona VARCHAR(100) NOT NULL,
    departamento VARCHAR(100),
    sede VARCHAR(100),
    mail_persona VARCHAR(100),
    fono_persona VARCHAR(20)
);

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
);

INSERT IGNORE INTO persona
    (rut_persona, nombre_persona, departamento, sede, mail_persona)
VALUES
    ('12.345.678-5', 'Paula Castillo', 'Informática', 'Casa Central', 'paula.castillo@usm.cl'),
    ('12.345.679-6', 'Felipe Aguilera', 'Informática', 'Casa Central', 'felipe.aguilera@usm.cl'),
    ('18.765.432-1', 'Benjamin Vergara', 'Informática', 'Casa Central', 'benjamin.vergara@usm.cl'),
    ('16.543.210-9', 'Javiera Roda', 'Informática', 'Casa Central', 'javiera.roda@usm.cl'),
    ('15.890.123-4', 'Facundo Salazar', 'Informática', 'Casa Central', 'facundo.salazar@usm.cl');

INSERT IGNORE INTO usuario
    (rut_persona, rol_universitario, profesor_guia_rol, correferente_rol, nombre_usuario, correo, contrasena, rol)
VALUES
    ('12.345.678-5', '202473070-3', '202473009-6', '202473010-K', 'paula.castillo', 'paula.castillo@usm.cl', '$2a$10$CZUh2ZdYYRdBTvVnNxN.XuiFUqob3OvbU7TJqLvOmC5tN9xT05Ncu', 'memorista'),
    ('12.345.679-6', '202473021-5', '202473009-6', '202473010-K', 'felipe.aguilera', 'felipe.aguilera@usm.cl', '$2a$10$CZUh2ZdYYRdBTvVnNxN.XuiFUqob3OvbU7TJqLvOmC5tN9xT05Ncu', 'memorista'),
    ('18.765.432-1', '202473083-5', '202473009-6', NULL, 'benjamin.vergara', 'benjamin.vergara@usm.cl', '$2a$10$CZUh2ZdYYRdBTvVnNxN.XuiFUqob3OvbU7TJqLvOmC5tN9xT05Ncu', 'memorista'),
    ('16.543.210-9', '202473009-6', NULL, NULL, 'javiera.roda', 'javiera.roda@usm.cl', '$2a$10$6KNuajBjplmhiTsjmLDItOus3RqIjKc.fy0qKcNQot/huMqIsRicG', 'profesor_guia'),
    ('15.890.123-4', '202473010-K', NULL, NULL, 'facundo.salazar', 'facundo.salazar@usm.cl', '$2a$10$6KNuajBjplmhiTsjmLDItOus3RqIjKc.fy0qKcNQot/huMqIsRicG', 'correferente');