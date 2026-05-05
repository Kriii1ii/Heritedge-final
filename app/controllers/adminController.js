const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const deleteCloudinaryImage = require('../utils/deleteCloudinaryImage');

exports.getDashboard = async (req, res, next) => {
    try {
        const [totalUsers, totalArtworks, pendingCreators, recentArtworks, totalOrders, totalEvents] = await Promise.all([
            prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
            prisma.artwork.count(),
            prisma.user.findMany({
                where: { verificationStatus: 'PENDING', role: 'BUYER' },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.artwork.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { creator: true }
            }),
            prisma.order.count(),
            prisma.event.count()
        ]);

        const completedOrders = await prisma.order.findMany({
            where: { paymentStatus: 'COMPLETED' },
            select: { amount: true }
        });
        const revenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);

        res.render('admin/dashboard', {
            primaryColor: '#000000',
            user: req.session.user,
            totalUsers,
            totalArtworks,
            totalOrders,
            totalEvents,
            revenue,
            pendingCreators,
            recentArtworks,
            csrfToken: req.csrfToken()
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
            data: {
                verificationStatus: status,
                role: status === 'VERIFIED' ? 'CREATOR' : 'BUYER'
            }
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

exports.getOrders = async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: { buyer: true, artwork: true }
        });
        res.render('admin/orders', { primaryColor: '#000000', user: req.session.user, orders, csrfToken: req.csrfToken() });
    } catch (err) {
        next(err);
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['PLACED', 'COLLECTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(status)) {
            const err = new Error("Invalid order status");
            err.status = 400;
            return next(err);
        }

        await prisma.order.update({
            where: { id },
            data: { orderStatus: status }
        });

        res.redirect('/admin/orders');
    } catch (err) {
        next(err);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id } });
        
        if (!user || user.role === 'ADMIN') {
            const err = new Error("Cannot delete this user.");
            err.status = 403;
            return next(err);
        }

        // Cleanup: remove orders, event regs, and artworks
        await prisma.order.deleteMany({ where: { buyerId: id } });
        await prisma.eventRegistration.deleteMany({ where: { userId: id } });
        
        const artworks = await prisma.artwork.findMany({ where: { creatorId: id } });
        for (const artwork of artworks) {
            await prisma.order.deleteMany({ where: { artworkId: artwork.id } });
            if (artwork.images && artwork.images.length > 0) {
                for (const imgUrl of artwork.images) {
                    await deleteCloudinaryImage(imgUrl);
                }
            }
        }
        await prisma.artwork.deleteMany({ where: { creatorId: id } });
        
        await prisma.user.delete({ where: { id } });
        logger.info('Admin deleted user', { adminId: req.session.user.id, targetUserId: id });
        
        res.redirect('/admin/users');
    } catch (err) {
        next(err);
    }
};

exports.getUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.render('admin/users', { primaryColor: '#000000', user: req.session.user, users, csrfToken: req.csrfToken() });
    } catch (err) {
        next(err);
    }
};

exports.getApplications = async (req, res, next) => {
    try {
        const statusFilter = ['PENDING', 'APPROVED', 'REJECTED'].includes(req.query.status)
            ? req.query.status : '';
        const where = statusFilter ? { status: statusFilter } : {};
        const [applications, counts] = await Promise.all([
            prisma.artistApplication.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, name: true, avatar: true, email: true, role: true } } }
            }),
            Promise.all([
                prisma.artistApplication.count({ where: { status: 'PENDING' } }),
                prisma.artistApplication.count({ where: { status: 'APPROVED' } }),
                prisma.artistApplication.count({ where: { status: 'REJECTED' } })
            ])
        ]);
        res.render('admin/applications', {
            primaryColor: '#000000',
            user: req.session.user,
            applications,
            statusFilter,
            pendingCount: counts[0],
            approvedCount: counts[1],
            rejectedCount: counts[2],
            csrfToken: req.csrfToken()
        });
    } catch (err) {
        next(err);
    }
};

exports.reviewApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, adminNote } = req.body;
        if (!['APPROVED', 'REJECTED'].includes(action)) {
            const e = new Error('Invalid action'); e.status = 400; return next(e);
        }

        const application = await prisma.artistApplication.findUnique({
            where: { id },
            include: { user: true }
        });
        if (!application) {
            const e = new Error('Application not found'); e.status = 404; return next(e);
        }

        const isApprove = action === 'APPROVED';
        const notifMessage = isApprove
            ? 'Congratulations! Your artist application has been approved. Welcome to HeritEdge as a Creator.'
            : 'Your artist application was not approved at this time. You may reapply after reviewing our guidelines.';

        await Promise.all([
            prisma.artistApplication.update({
                where: { id },
                data: { status: action, adminNote: adminNote?.trim() || null }
            }),
            prisma.user.update({
                where: { id: application.userId },
                data: {
                    role: isApprove ? 'CREATOR' : 'BUYER',
                    verificationStatus: isApprove ? 'VERIFIED' : 'REJECTED'
                }
            }),
            prisma.notification.create({
                data: {
                    userId: application.userId,
                    type: isApprove ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED',
                    message: notifMessage
                }
            })
        ]);

        logger.info('Admin reviewed artist application', {
            adminId: req.session.user.id,
            applicationId: id,
            applicantId: application.userId,
            action
        });

        res.redirect('/admin/applications?status=PENDING');
    } catch (err) {
        next(err);
    }
};

exports.getArtworks = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20;
        const skip = (page - 1) * limit;
        const statusFilter = ['PUBLISHED', 'DRAFT'].includes(req.query.status) ? req.query.status : '';
        const where = statusFilter ? { status: statusFilter } : {};
        const [artworks, total] = await Promise.all([
            prisma.artwork.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { creator: { select: { id: true, name: true } } }
            }),
            prisma.artwork.count({ where })
        ]);
        res.render('admin/artworks', {
            primaryColor: '#000000',
            user: req.session.user,
            artworks,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            statusFilter,
            csrfToken: req.csrfToken()
        });
    } catch (err) {
        next(err);
    }
};
