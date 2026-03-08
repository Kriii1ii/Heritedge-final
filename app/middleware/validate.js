const logger = require('../utils/logger');
const deleteCloudinaryImage = require('../utils/deleteCloudinaryImage');

const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (err) {
        if (err.name === 'ZodError') {
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    if (file.path) deleteCloudinaryImage(file.path).catch(e => logger.error('Cleanup error', e));
                });
            }

            const errorMessage = err.errors.map(e => e.message).join(', ');
            logger.warn('Validation error', { path: req.originalUrl, errorMessage });

            if (req.originalUrl.startsWith('/api') || req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage,
                    details: err.errors
                });
            }

            // Redirect back with an error for form submissions
            if (req.originalUrl === '/login') {
                return res.redirect('/login?error=invalid_input');
            }
            if (req.originalUrl === '/register') {
                return res.redirect('/register?error=validation_failed');
            }

            const error = new Error(errorMessage);
            error.status = 400;
            next(error);
        } else {
            next(err);
        }
    }
};

module.exports = validate;
