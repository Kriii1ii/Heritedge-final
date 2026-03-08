const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

router.get('/', (req, res) => {
    res.render('index', { primaryColor: '#f2b90d' });
});

router.get('/events', (req, res) => {
    res.render('events', { primaryColor: '#eead2b' });
});

router.get('/profile', requireAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.session.user.id }
        });
        res.render('profile', { primaryColor: '#b81430', user });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
