const express = require('express');
const router = express.Router();
const artworkController = require('../controllers/artworkController');

router.get('/marketplace', artworkController.getMarketplace);
router.get('/artwork/:id', artworkController.getArtworkDetail);
router.get('/artist/:id', artworkController.getArtistPage);

module.exports = router;
