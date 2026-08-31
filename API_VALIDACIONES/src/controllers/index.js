const database = require('../db');


//Esta tabla es solo un ejemplo para que puedan ver como se hacen querys a la bdd, después puede ser eliminada
const createTable = (req, res) => {
    const query =  'CREATE TABLE IF NOT EXISTS user(id int AUTO_INCREMENT, firstname VARCHAR(50), lastname VARCHAR(50), email VARCHAR(50), PRIMARY KEY(id))';

    database.query(query, (err) => {
        if (err) throw err;
        res.send('Tabla creada')
    });
};


module.exports = {
    createTable
};