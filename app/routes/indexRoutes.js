const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

router.get('/', (req, res) => {
    res.render('index', { primaryColor: '#f2b90d' });
});

router.get('/events', async (req, res, next) => {
    try {
        const events = await prisma.event.findMany({
            orderBy: { eventDate: 'asc' }
        });
        res.render('events', { primaryColor: '#eead2b', events });
    } catch (err) {
        next(err);
    }
});

router.get('/about', (req, res) => {
    res.render('about', { primaryColor: '#8b0000' });
});

router.get('/faq', (req, res) => {
    res.render('faq', { primaryColor: '#8b0000' });
});

router.post('/api/events/:id/register', requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;

        const existing = await prisma.eventRegistration.findUnique({
            where: {
                userId_eventId: {
                    userId,
                    eventId: id
                }
            }
        });

        if (existing) {
            return res.redirect('/events?message=Already+Registered');
        }

        await prisma.eventRegistration.create({
            data: {
                userId,
                eventId: id
            }
        });

        res.redirect('/events?message=Successfully+Registered');
    } catch (err) {
        next(err);
    }
});

router.get('/become-artist', requireAuth, (req, res) => {
    if (req.session.user.role !== 'BUYER') {
        return res.redirect('/');
    }
    res.render('become-artist', { primaryColor: '#f2b90d' });
});

router.post('/become-artist', requireAuth, async (req, res, next) => {
    try {
        if (req.session.user.role !== 'BUYER') return res.redirect('/');

        const { bio, inspiration, lifeStory, portfolioUrl } = req.body;

        await prisma.user.update({
            where: { id: req.session.user.id },
            data: {
                bio,
                inspiration,
                lifeStory,
                portfolioUrl,
                verificationStatus: 'PENDING'
            }
        });

        res.redirect('/profile?message=Application+Submitted');
    } catch (err) {
        next(err);
    }
});

router.get('/profile', requireAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.session.user.id }
        });

        const orders = await prisma.order.findMany({
            where: { buyerId: req.session.user.id },
            include: { artwork: true },
            orderBy: { createdAt: 'desc' }
        });

        const preferredCategories = [...new Set(orders.map(o => o.artwork.category))];

        res.render('profile', { primaryColor: '#b81430', user, orders, preferredCategories });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
