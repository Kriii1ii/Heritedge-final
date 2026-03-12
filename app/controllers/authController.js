const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

exports.getLoginPage = (req, res) => {
    let errorMsg = null;
    if (req.query.error === 'invalid') errorMsg = 'Invalid credentials';
    if (req.query.error === 'not_admin') errorMsg = 'Only administrators can access this server';
    
    res.render('auth', {
        primaryColor: process.env.ADMIN_ONLY === 'true' ? '#000000' : '#d42511',
        mode: 'login',
        error: errorMsg,
        adminOnly: process.env.ADMIN_ONLY === 'true'
    });
};

exports.getRegisterPage = (req, res) => {
    if (process.env.ADMIN_ONLY === 'true') return res.redirect('/login');
    res.render('auth', {
        primaryColor: '#d42511',
        mode: 'signup',
        adminOnly: false,
        error: req.query.error === 'exists' ? 'Email already in use.' : (req.query.error === 'password_mismatch' ? 'Passwords do not match.' : null)
    });
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            logger.warn('Failed login attempt', { email, reason: 'unrecognized_email' });
            return res.redirect('/login?error=invalid');
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            logger.warn('Failed login attempt', { email, reason: 'invalid_password' });
            return res.redirect('/login?error=invalid');
        }

        req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };

        logger.info('User login successful', { userId: user.id, email: user.email, role: user.role });

        if (process.env.ADMIN_ONLY === 'true') {
            if (user.role !== 'ADMIN') {
                logger.warn('Failed admin login attempt', { email, reason: 'not_admin' });
                return res.redirect('/login?error=not_admin');
            }
            res.redirect('/admin');
        } else {
            if (user.role === 'ADMIN') {
                return res.redirect('/admin'); // Or redirect them elsewhere since admin isn't hosted here
            } else if (user.role === 'CREATOR') {
                res.redirect('/creator/home');
            } else {
                res.redirect('/marketplace');
            }
        }
    } catch (err) {
        next(err);
    }
};

exports.register = async (req, res, next) => {
    if (process.env.ADMIN_ONLY === 'true') return res.redirect('/login');
    try {
        let { email, password, confirm_password, name } = req.body;

        if (password !== confirm_password) {
            return res.redirect('/register?error=password_mismatch');
        }

        const role = 'BUYER';

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name, role }
        });

        // Redirect to login after successful registration as requested
        res.redirect('/login');
    } catch (err) {
        if (err.code === 'P2002') {
            return res.redirect('/register?error=exists');
        }
        next(err);
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
};
