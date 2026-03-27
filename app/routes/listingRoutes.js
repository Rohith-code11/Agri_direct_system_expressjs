const express = require('express');
const { getMarketplaceListings, createMarketplaceListing } = require('../controllers/listingController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadListingImages } = require('../../config/multer');

const router = express.Router();

router.get('/marketplace', authenticate, getMarketplaceListings);
router.post(
  '/grower',
  authenticate,
  authorizeRoles('grower'),
  uploadListingImages.array('images', 5),
  createMarketplaceListing
);

module.exports = router;
