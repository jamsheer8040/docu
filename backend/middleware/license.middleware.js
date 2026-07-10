const { SystemConfig } = require('../models');

/**
 * Middleware to check if the system license has expired.
 * If expired, only allow Developer role to proceed.
 * Special routes like /auth/login must always be allowed.
 */
module.exports = async (req, res, next) => {
    try {
        // Always allow public routes
        const publicRoutes = ['/api/v1/auth/login', '/api/v1/health'];
        if (publicRoutes.includes(req.originalUrl)) {
            return next();
        }

        // Special check for Developer role (even if system is expired)
        // Since verifyToken runs after this, we manually check for the 'Developer' role in the token if available
        let userRole = req.user?.Role?.name;
        
        if (!userRole && req.headers.authorization?.startsWith('Bearer ')) {
            try {
                const jwt = require('jsonwebtoken');
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // We're doing a lightweight check here. Full verification happens later in requirePermission/verifyToken.
                if (decoded && decoded.role === 'Developer') {
                    return next();
                }
            } catch (e) {
                // Ignore token errors here, they will be handled by verifyToken middleware
            }
        }

        if (userRole === 'Developer') {
            return next();
        }

        // Fetch license expiry from config
        const expiryConfig = await SystemConfig.findOne({ where: { key: 'license_expiry_date' } });
        
        if (expiryConfig && expiryConfig.value) {
            const expiryDate = new Date(expiryConfig.value);
            if (Date.now() > expiryDate.getTime()) {
                return res.status(403).json({
                    success: false,
                    is_expired: true,
                    message: 'The system has expired. Please contact the administrator/developer.'
                });
            }
        }

        next();
    } catch (err) {
        console.error('[License Middleware] Error:', err);
        next(); // Fail-safe: Allow if check fails
    }
};
