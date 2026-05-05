const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creatorController');
const { requireAuth, requireCreator } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const validate = require('../middleware/validate');
const { artworkSchema } = require('../validators/artworkValidator');

const uploadDir = path.join(__dirname, '../public/images/artworks');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
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

router.get('/analytics', creatorController.getAnalytics);
router.get('/profile-edit', creatorController.getProfileEdit);
router.post('/profile-edit', upload.single('avatar'), creatorController.updateProfileEdit);

module.exports = router;
