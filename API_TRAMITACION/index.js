const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
require('dotenv').config();

const routes = require('./src/routes/index');
const defensasController = require('./src/controllers/defensasController');
const propuestasController = require('./src/controllers/propuestasController');

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes);

Promise.all([
    defensasController.initializeSchema(),
    propuestasController.initializeSchema()
])
    .then(() => {
        app.listen(process.env.PORT_API, () => {
            console.log('Server running!');
        });
    })
    .catch((error) => {
        console.error('No se pudo preparar el esquema de Tramitación:', error);
        process.exitCode = 1;
    });