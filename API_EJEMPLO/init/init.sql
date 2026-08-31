CREATE DATABASE IF NOT EXISTS BD_EJEMPLO;

USE BD_EJEMPLO;

CREATE TABLE IF NOT EXISTS paises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    capital VARCHAR(100),
    continente VARCHAR(100)
);

INSERT INTO paises (nombre, capital, continente)
VALUES 
('Chile', 'Santiago', 'America del sur'),
('Noruega', 'Oslo', 'Europa'),
('Mexico', 'Ciudad de Mexico', 'America del norte');
