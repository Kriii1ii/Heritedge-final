const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const avatarDir = path.join(__dirname, '../public/images/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const appImgDir = path.join(__dirname, '../public/images/applications');
if (!fs.existsSync(appImgDir)) fs.mkdirSync(appImgDir, { recursive: true });

const makeStorage = (dir) => multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
        const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, u + path.extname(file.originalname));
    }
});

const uploadAvatar = multer({ storage: makeStorage(avatarDir), limits: { fileSize: 5 * 1024 * 1024 } });
const uploadAppImg = multer({ storage: makeStorage(appImgDir), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', (req, res) => {
    res.render('index', { primaryColor: '#f2b90d', user: req.session.user });
});

router.get('/events', async (req, res, next) => {
    try {
        const events = await prisma.event.findMany({
            orderBy: { eventDate: 'asc' }
        });
        res.render('events', { primaryColor: '#eead2b', events, user: req.session.user });
    } catch (err) {
        next(err);
    }
});

router.get('/about', (req, res) => {
    res.render('about', { primaryColor: '#8b0000', user: req.session.user });
});

router.get('/faq', (req, res) => {
    res.render('faq', { primaryColor: '#8b0000', user: req.session.user });
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

router.get('/become-artist', requireAuth, async (req, res, next) => {
    try {
        if (req.session.user.role === 'CREATOR') return res.redirect('/creator/home');
        if (req.session.user.role !== 'BUYER') return res.redirect('/');

        const [fullUser, application] = await Promise.all([
            prisma.user.findUnique({ where: { id: req.session.user.id } }),
            prisma.artistApplication.findFirst({
                where: { userId: req.session.user.id },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        // Sync session role if DB role changed
        if (fullUser && fullUser.role !== req.session.user.role) {
            req.session.user.role = fullUser.role;
            if (fullUser.role === 'CREATOR') return res.redirect('/creator/home');
        }

        const status = application?.status || (fullUser?.inspiration ? 'PENDING' : null);
        res.render('become-artist', {
            primaryColor: '#f2b90d',
            hasApplied: status === 'PENDING' || status === 'APPROVED',
            applicationStatus: status,
            application,
            user: req.session.user
        });
    } catch (err) {
        next(err);
    }
});

router.post('/become-artist', requireAuth, uploadAppImg.single('profileImage'), async (req, res, next) => {
    try {
        if (req.session.user.role !== 'BUYER') return res.redirect('/');

        // Block if already has an active (PENDING/APPROVED) application
        const existing = await prisma.artistApplication.findFirst({
            where: { userId: req.session.user.id, status: { in: ['PENDING', 'APPROVED'] } }
        });
        if (existing) return res.redirect('/become-artist');

        const { name, email, age, about, motivation, portfolio, socialLinks } = req.body;
        const rawArtTypes = req.body.artTypes;
        const artTypes = Array.isArray(rawArtTypes) ? rawArtTypes : (rawArtTypes ? [rawArtTypes] : []);

        // Server-side validation
        const errors = [];
        if (!name?.trim())       errors.push('Name is required.');
        if (!email?.trim())      errors.push('Email is required.');
        const ageNum = parseInt(age);
        if (!age || isNaN(ageNum) || ageNum < 16 || ageNum > 100) errors.push('A valid age (16–100) is required.');
        if (artTypes.length === 0) errors.push('Select at least one art type.');
        if (!about?.trim() || about.trim().length < 50) errors.push('About section must be at least 50 characters.');
        if (!motivation?.trim() || motivation.trim().length < 100) errors.push('Motivation must be at least 100 characters.');

        if (errors.length > 0) {
            if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
            const fullUser = await prisma.user.findUnique({ where: { id: req.session.user.id } });
            return res.render('become-artist', {
                primaryColor: '#f2b90d',
                hasApplied: false,
                applicationStatus: null,
                application: null,
                user: fullUser || req.session.user,
                formError: errors[0],
                formData: req.body
            });
        }

        const socialArr = socialLinks
            ? socialLinks.split(/[\n,]/).map(s => s.trim()).filter(Boolean)
            : [];

        const appData = {
            userId: req.session.user.id,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            age: ageNum,
            artTypes,
            about: about.trim(),
            motivation: motivation.trim(),
            portfolio: portfolio?.trim() || null,
            socialLinks: socialArr,
            profileImage: req.file ? '/images/applications/' + req.file.filename : null,
            status: 'PENDING'
        };

        await Promise.all([
            prisma.artistApplication.create({ data: appData }),
            prisma.user.update({
                where: { id: req.session.user.id },
                data: { verificationStatus: 'PENDING' }
            })
        ]);

        req.session.user.artistApplicant = true;
        res.redirect('/become-artist?submitted=1');
    } catch (err) {
        if (req.file) { try { fs.unlinkSync(req.file.path); } catch (_) {} }
        next(err);
    }
});

// Notifications API
router.get('/api/notifications', requireAuth, async (req, res, next) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json({ success: true, notifications });
    } catch (err) {
        next(err);
    }
});

router.post('/api/notifications/mark-read', requireAuth, async (req, res, next) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.session.user.id, read: false },
            data: { read: true }
        });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.get('/profile', requireAuth, async (req, res, next) => {
    try {
        const [user, orders, application, notifications] = await Promise.all([
            prisma.user.findUnique({ where: { id: req.session.user.id } }),
            prisma.order.findMany({
                where: { buyerId: req.session.user.id },
                include: { artwork: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.artistApplication.findFirst({
                where: { userId: req.session.user.id },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.notification.findMany({
                where: { userId: req.session.user.id },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);

        // Sync session if role or status changed (e.g. after admin approval)
        if (user) {
            if (user.role !== req.session.user.role) req.session.user.role = user.role;
            if (user.avatar !== req.session.user.avatar) req.session.user.avatar = user.avatar;
            if (application?.status === 'REJECTED') req.session.user.artistApplicant = false;
        }

        const preferredCategories = [...new Set(orders.map(o => o.artwork.category))];
        res.render('profile', {
            primaryColor: '#b81430', user, orders, preferredCategories,
            application, notifications,
            message: req.query.message, error: req.query.error
        });
    } catch (err) {
        next(err);
    }
});

router.post('/profile', requireAuth, uploadAvatar.single('avatar'), async (req, res, next) => {
    try {
        const { name, email, bio, region, portfolioUrl } = req.body;
        const updateData = { 
            name, 
            bio, 
            region, 
            portfolioUrl 
        };
        if (email) updateData.email = email.trim().toLowerCase();

        if (req.file) {
            updateData.avatar = '/images/avatars/' + req.file.filename;
            req.session.user.avatar = updateData.avatar; // update session
        }
        
        if (updateData.name) req.session.user.name = updateData.name;
        if (updateData.email) req.session.user.email = updateData.email;

        await prisma.user.update({
            where: { id: req.session.user.id },
            data: updateData
        });

        res.redirect('/profile?message=Profile+Updated');
    } catch (err) {
        if (err.code === 'P2002') return res.redirect('/profile?error=email_exists');
        next(err);
    }
});

router.post('/profile/remove-avatar', requireAuth, async (req, res, next) => {
    try {
        await prisma.user.update({
            where: { id: req.session.user.id },
            data: { avatar: null }
        });
        req.session.user.avatar = null;
        res.redirect('/profile?message=Avatar+Removed');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
