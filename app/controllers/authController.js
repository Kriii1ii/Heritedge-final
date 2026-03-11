const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

exports.getLoginPage = (req, res) => {
    res.render('auth', {
        primaryColor: '#d42511',
        mode: 'login',
        error: req.query.error === 'invalid' ? 'Invalid credentials' : null
    });
};

exports.getRegisterPage = (req, res) => {
    res.render('auth', {
        primaryColor: '#d42511',
        mode: 'signup',
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

        if (user.role === 'CREATOR') {
            res.redirect('/creator/home');
        } else if (user.role === 'ADMIN') {
            res.redirect('/admin');
        } else {
            res.redirect('/marketplace');
        }
    } catch (err) {
        next(err);
    }
};

exports.register = async (req, res, next) => {
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
