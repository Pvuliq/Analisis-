const mysql = require('mysql2');

require('dotenv').config();

const database = mysql.createPool({
    connectionLimit: 10,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    host:process.env.DB_HOST
});

module.exports = database;