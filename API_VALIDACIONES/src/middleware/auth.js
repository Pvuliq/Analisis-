const jwt = require('jsonwebtoken');

const getToken = (req) => {
    const header = req.headers.authorization || '';
    return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const authenticate = (req, res, next) => {
    const token = getToken(req);
    if (!token) {
        return res.status(401).json({ message: 'Debes iniciar sesión.' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'La sesión no es válida o expiró.' });
    }
};

module.exports = { authenticate };
