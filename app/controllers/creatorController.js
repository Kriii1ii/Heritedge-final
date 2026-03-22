const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
exports.getDashboard = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.session.user.id }
        });

        const artworks = await prisma.artwork.findMany({
            where: { creatorId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const totalArtworks = await prisma.artwork.count({
            where: { creatorId: user.id }
        });

        const orders = await prisma.order.findMany({
            where: {
                artwork: { creatorId: user.id },
                paymentStatus: 'COMPLETED'
            },
            include: { artwork: true }
        });

        const totalSales = orders.length;
        const revenueSum = orders.reduce((sum, order) => sum + parseFloat(order.amount), 0);

        res.render('creator/dashboard', {
            primaryColor: '#b81430',
            user,
            artworks,
            totalArtworks,
            totalSales,
            revenueSum
        });
    } catch (err) {
        next(err);
    }
};

exports.getUploadPage = (req, res) => {
    res.render('creator/upload', {
        primaryColor: '#b81430',
        user: req.session.user,
        error: req.query.error
    });
};

exports.uploadArtwork = async (req, res, next) => {
    try {
        const { title, description, price, category, region, story } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).send('At least one image is required.');
        }

        const imagePaths = req.files.map(file => '/images/artworks/' + file.filename); // Local disk path mapped to public relative URL

        try {
            const newArtwork = await prisma.artwork.create({
                data: {
                    title,
                    description,
                    price: parseFloat(price),
                    category: category || 'Uncategorized',
                    region: region || 'Global',
                    images: imagePaths,
                    story,
                    status: 'PUBLISHED',
                    creatorId: req.session.user.id
                }
            });

            logger.info('Artwork uploaded', { artworkId: newArtwork.id, creatorId: req.session.user.id });
            res.redirect('/creator/artworks');
        } catch (dbErr) {
            // Delete images from disk if database insertion fails
            for (const file of req.files) {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
            throw dbErr;
        }
    } catch (err) {
        // Cleanup local files on error
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }
        
        // If validation error from Zod (passed via next(error) from validate middleware usually, 
        // but here we are in the controller after validation)
        // Let's render the form again with the error
        res.render('creator/upload', {
            primaryColor: '#b81430',
            user: req.session.user,
            error: err.message || 'Something went wrong during upload'
        });
    }
};

exports.getArtworks = async (req, res, next) => {
    try {
        const artworks = await prisma.artwork.findMany({
            where: { creatorId: req.session.user.id },
            orderBy: { createdAt: 'desc' }
        });

        res.render('creator/artworks', {
            primaryColor: '#b81430',
            user: req.session.user,
            artworks
        });
    } catch (err) {
        next(err);
    }
};

exports.changeArtworkStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        await prisma.artwork.update({
            where: {
                id: req.params.id,
                creatorId: req.session.user.id
            },
            data: { status }
        });
        res.redirect('/creator/artworks');
    } catch (err) {
        next(err);
    }
};

exports.deleteArtwork = async (req, res, next) => {
    try {
        const artwork = await prisma.artwork.findUnique({
            where: {
                id: req.params.id,
                creatorId: req.session.user.id
            }
        });

        if (!artwork) {
            return res.status(404).send('Artwork not found.');
        }

        // Delete associated local images
        if (artwork.images && artwork.images.length > 0) {
            for (const imgUrl of artwork.images) {
                const basename = path.basename(imgUrl);
                const localPath = path.join(__dirname, '../public/images/artworks', basename);
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
            }
        }

        await prisma.artwork.delete({
            where: {
                id: req.params.id,
                creatorId: req.session.user.id // Double safety
            }
        });
        res.redirect('/creator/artworks');
    } catch (err) {
        next(err);
    }
};

exports.completeOnboarding = async (req, res, next) => {
    try {
        const { bio, region, story } = req.body;
        await prisma.user.update({
            where: { id: req.session.user.id },
            data: { bio: story || bio, region }
        });
        res.redirect('/creator/home');
    } catch (err) {
        next(err);
    }
};
