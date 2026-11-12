const authenticate = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Debes iniciar sesión.' });
    }

    try {
        const parts = token.split('.');
        if (parts.length === 3) {
            const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
            req.user = JSON.parse(payloadJson);
        } else {
            req.user = { 
                role: req.headers['x-role'] || 'memorista',
                rol: req.headers['x-role'] || 'memorista'
            };
        }
        return next();
    } catch {
        return res.status(401).json({ message: 'La sesión no es válida o expiró.' });
    }
};

const requireRole = (role) => (req, res, next) => {
    const userRole = req.user?.role || req.user?.rol;
    if (userRole !== role) {
        return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
    }
    return next();
};

module.exports = { authenticate, requireRole };