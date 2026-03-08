const prisma = require('../config/prisma');
const logger = require('../utils/logger');

exports.createOrder = async (req, res, next) => {
    try {
        const { artworkId } = req.body;
        const buyerId = req.session.user.id;

        const artwork = await prisma.artwork.findUnique({
            where: { id: artworkId }
        });

        if (!artwork) {
            return res.status(404).json({ success: false, message: 'Artwork not found' });
        }

        const order = await prisma.order.create({
            data: {
                buyerId,
                artworkId,
                amount: artwork.price,
                paymentStatus: 'PENDING',
                orderStatus: 'PROCESSING'
            }
        });

        logger.info('Order created successfully', { orderId: order.id, buyerId, artworkId, amount: artwork.price });

        res.json({ success: true, orderId: order.id, message: 'Order created successfully' });
    } catch (err) {
        next(err);
    }
};

exports.getOrders = async (req, res, next) => {
    try {
        const buyerId = req.session.user.id;

        const orders = await prisma.order.findMany({
            where: { buyerId },
            include: { artwork: { include: { creator: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.render('orders', {
            primaryColor: '#8b0000',
            user: req.session.user,
            orders
        });
    } catch (err) {
        next(err);
    }
};
