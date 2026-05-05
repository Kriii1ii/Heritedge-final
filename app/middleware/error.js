const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const details = err.errors || err.details || (process.env.NODE_ENV === 'development' ? err.stack : undefined);

    logger.error('Unhandled Exception', {
        statusCode,
        message,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        prismaCode: err.code,       // e.g. P2021 = table not found
        prismaMeta: err.meta,       // e.g. { modelName: 'Event' }
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

    return res.status(statusCode).render('error', {
        message: statusCode === 500 ? 'Something went wrong! Please try again later.' : message,
        details,
        statusCode,
        user: req.session && req.session.user ? req.session.user : null
    });
};

module.exports = errorHandler;
