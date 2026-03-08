const express = require('express');
const router = express.Router();

const indexRoutes = require('./indexRoutes');
const authRoutes = require('./authRoutes');
const artworkRoutes = require('./artworkRoutes');
const creatorRoutes = require('./creatorRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');

router.use('/', indexRoutes);
router.use('/', artworkRoutes);
router.use('/', authRoutes);
router.use('/creator', creatorRoutes);
router.use('/admin', adminRoutes);
router.use('/', orderRoutes);

module.exports = router;
