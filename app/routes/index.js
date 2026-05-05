const express = require('express');
const router = express.Router();

const indexRoutes = require('./indexRoutes');
const authRoutes = require('./authRoutes');
const artworkRoutes = require('./artworkRoutes');
const creatorRoutes = require('./creatorRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');

if (process.env.ADMIN_ONLY === 'true') {
    router.use('/', authRoutes);
    router.use('/admin', adminRoutes);
    router.use('/', indexRoutes);
    router.use('/', artworkRoutes);
    router.use('/', orderRoutes);
    // Remove the intercepting redirect so the actual indexRoutes can serve '/'
} else {
    router.use('/', indexRoutes);
    router.use('/', artworkRoutes);
    router.use('/', authRoutes);
    router.use('/creator', creatorRoutes);
    router.use('/', orderRoutes);
    router.use('/admin', adminRoutes);
}

module.exports = router;
