const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const deleteCloudinaryImage = require('../utils/deleteCloudinaryImage');

exports.getDashboard = async (req, res, next) => {
    try {
        const [totalUsers, totalArtworks, pendingCreators, recentArtworks] = await Promise.all([
            prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
            prisma.artwork.count(),
            prisma.user.findMany({
                where: { role: 'CREATOR', verificationStatus: 'PENDING' },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.artwork.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { creator: true }
            })
        ]);

        res.render('admin/dashboard', {
            primaryColor: '#000000',
            user: req.session.user,
            totalUsers,
            totalArtworks,
            pendingCreators,
            recentArtworks
        });
    } catch (err) {
        next(err);
    }
};

exports.verifyCreator = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['VERIFIED', 'REJECTED'].includes(status)) {
            const err = new Error("Invalid status");
            err.status = 400;
            return next(err);
        }

        await prisma.user.update({
            where: { id },
            data: { verificationStatus: status }
        });

        logger.info(`Admin changed creator verification status`, { adminId: req.session.user.id, targetUserId: id, status });

        res.redirect('/admin');
    } catch (err) {
        next(err);
    }
};

exports.deleteArtwork = async (req, res, next) => {
    try {
        const { id } = req.params;

        const artwork = await prisma.artwork.findUnique({ where: { id } });
        if (!artwork) {
            const err = new Error("Artwork not found");
            err.status = 404;
            return next(err);
        }

        // Delete associated Cloudinary images
        if (artwork.images && artwork.images.length > 0) {
            for (const imgUrl of artwork.images) {
                await deleteCloudinaryImage(imgUrl);
            }
        }

        await prisma.artwork.delete({ where: { id } });

        logger.info('Admin deleted artwork', { adminId: req.session.user.id, artworkId: id });

        res.redirect('/admin');
    } catch (err) {
        next(err);
    }
};
