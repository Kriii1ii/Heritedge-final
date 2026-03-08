const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireAdmin);

router.get('/', adminController.getDashboard);
router.post('/creator/:id/verify', adminController.verifyCreator);
router.post('/artwork/:id/delete', adminController.deleteArtwork);

module.exports = router;
