const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const { generateEsewaSignature } = require('../utils/esewa');

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

        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const signature = generateEsewaSignature(artwork.price, order.id);

        res.json({
            success: true,
            orderId: order.id,
            message: 'Order created successfully',
            esewaPayload: {
                amount: artwork.price,
                tax_amount: 0,
                total_amount: artwork.price,
                transaction_uuid: order.id,
                product_code: 'EPAYTEST',
                product_service_charge: 0,
                product_delivery_charge: 0,
                success_url: `${appUrl}/api/order/success`,
                failure_url: `${appUrl}/api/order/failure`,
                signed_field_names: 'total_amount,transaction_uuid,product_code',
                signature: signature
            }
        });
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

exports.handleEsewaSuccess = async (req, res, next) => {
    try {
        const { data } = req.query;
        if (!data) return res.status(400).send('Invalid request');

        const decoded = Buffer.from(data, 'base64').toString('utf-8');
        const payload = JSON.parse(decoded);

        if (payload.status !== 'COMPLETE') {
            return res.redirect('/orders?error=payment_incomplete');
        }

        const order = await prisma.order.findUnique({ where: { id: payload.transaction_uuid } });
        if (!order) return res.status(404).send('Order not found');

        await prisma.order.update({
            where: { id: payload.transaction_uuid },
            data: {
                paymentStatus: 'COMPLETED',
                transactionId: payload.transaction_code
            }
        });

        logger.info('eSewa payment successful', { orderId: payload.transaction_uuid, transactionId: payload.transaction_code });
        res.redirect('/orders?success=payment_completed');
    } catch (err) {
        next(err);
    }
};

exports.handleEsewaFailure = async (req, res, next) => {
    try {
        logger.warn('eSewa payment failed', { userTokenCount: req.session?.user?.id });
        res.redirect('/orders?error=payment_failed');
    } catch (err) {
        next(err);
    }
};
