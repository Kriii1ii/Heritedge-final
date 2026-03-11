const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireAdmin);

router.get('/', adminController.getDashboard);
router.post('/creator/:id/verify', adminController.verifyCreator);
router.post('/artwork/:id/delete', adminController.deleteArtwork);

router.get('/orders', adminController.getOrders);
router.post('/orders/:id/status', adminController.updateOrderStatus);

router.get('/users', adminController.getUsers);

module.exports = router;
