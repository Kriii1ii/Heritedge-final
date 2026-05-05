const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const orderController = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { orderSchema } = require('../validators/orderValidator');

const orderLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many attempts from this IP, please try again after a minute"
});

router.post('/api/order', requireAuth, orderLimiter, validate(orderSchema), orderController.createOrder);
router.get('/orders', requireAuth, orderController.getOrders);

router.get('/api/order/success', requireAuth, orderController.handleEsewaSuccess);
router.get('/api/order/failure', orderController.handleEsewaFailure);

module.exports = router;
