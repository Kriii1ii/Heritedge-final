const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

const requireCreator = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'CREATOR') {
        const err = new Error('Unauthorized. Creator access only.');
        err.status = 403;
        return next(err);
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'ADMIN') {
        const err = new Error('Unauthorized. Admin access only.');
        err.status = 403;
        return next(err);
    }
    next();
};

module.exports = { requireAuth, requireCreator, requireAdmin };
