const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            req.user = { userId: decoded.userId };

            // Enrich user data from Auth Service (inter-service communication)
            try {
                const authResponse = await axios.get(`${config.authService.url}/auth/validate`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000,
                });
                if (authResponse.data.valid) {
                    req.user = {
                        userId: authResponse.data.data.userId,
                        email: authResponse.data.data.email,
                        studentId: authResponse.data.data.studentId,
                        role: authResponse.data.data.role,
                        firstName: authResponse.data.data.firstName,
                        lastName: authResponse.data.data.lastName,
                    };
                }
            } catch (_authErr) {
                console.warn('Auth service unavailable, using local token data'); // eslint-disable-line no-console
            }
            next();
        } catch (jwtError) {
            const msg = jwtError.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.';
            return res.status(401).json({ success: false, message: msg });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { authenticate };
