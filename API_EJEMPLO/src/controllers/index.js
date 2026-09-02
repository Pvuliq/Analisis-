const database = require('../db');

// Retorna todos los paises
const getPaises = (req, res) => {
  const query = 'SELECT * FROM paises';

  database.query(query, (err, result) => {
      if (err) throw err;
      res.status(200).send(result);
  });
}

// Agrega un nuevo pais
const addPais = (req, res) => {
  const { nombre, capital, continente } = req.body;
  const query = "INSERT INTO paises (nombre, capital, continente) VALUES (?,?,?)";
  const values = [nombre, capital, continente];
    
  database.query(query, values, (err, result) => {
    if (err) throw err;
    const newPais = { id: result.insertId,
      nombre,
      capital,
      continente
    };
    res.status(201).json(newPais);
  });
}

// Actualiza los datos de un pais
const updatePais = (req, res) => {
  const paisId = req.params.id;
  const data = req.body;
  let pais;
  database.query(`SELECT * from paises WHERE id = ${paisId}`, (err, result) => {
    if (err) throw err;
    pais = result[0];
    if (!pais) {
      res.status(404).send(`Pais not found`)
      return  
    };

    const values = [
      data.nombre || pais.nombre,
      data.capital || pais.capital,
      data.continente || pais.continente,
      paisId,
    ];

    const query = "UPDATE paises SET nombre = ?, capital = ?, continente = ? WHERE id = ?";
    database.query(query, values, (err, result) => {
      if (err) throw err;
      const updatedPais = {
        id: paisId,
        nombre: values[0],
        capital: values[1],
        continente: values[2],
      };
      res.status(200).send(updatedPais);
    });
  })
}

// Elimina un pais
const deletePais = (req, res) => {
  const paisId = req.params.id;
  const query = `DELETE FROM paises WHERE id = ${paisId}`;

  database.query(query, (err, result) => {
    if (err) throw err;
    if (result.affectedRows === 0) {
      res.status(404).send('Pais not found');
    } else {
      res.status(200).send('Pais deleted');
    }
  });
}

module.exports = {
  getPaises,
  addPais,
  updatePais,
  deletePais,
};