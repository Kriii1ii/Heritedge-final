const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creatorController');
const { requireAuth, requireCreator } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const validate = require('../middleware/validate');
const { artworkSchema } = require('../validators/artworkValidator');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'heritedge/artworks',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(requireAuth);
router.use(requireCreator);

router.get('/home', creatorController.getDashboard);
router.get('/upload', creatorController.getUploadPage);
router.post('/upload', upload.array('images', 5), validate(artworkSchema), creatorController.uploadArtwork);
router.get('/artworks', creatorController.getArtworks);
router.post('/artworks/:id/status', creatorController.changeArtworkStatus);
router.post('/artworks/:id/delete', creatorController.deleteArtwork);
router.post('/onboarding', creatorController.completeOnboarding);

module.exports = router;
