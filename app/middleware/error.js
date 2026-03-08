const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const details = err.errors || err.details || (process.env.NODE_ENV === 'development' ? err.stack : undefined);

    logger.error('Unhandled Exception', {
        statusCode,
        message,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        stack: err.stack
    });

    if (req.originalUrl.startsWith('/api') || req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(statusCode).json({
            success: false,
            statusCode,
            message,
            details
        });
    }

    res.status(statusCode).render('error', {
        message: statusCode === 500 ? 'Something went wrong! Please try again later.' : message,
        details,
        statusCode
    });
};

module.exports = errorHandler;
