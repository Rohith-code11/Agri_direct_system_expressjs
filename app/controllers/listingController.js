const { sendSuccess, sendError } = require('../../utils/response');
const { getListings, getListingFilterOptions, createGrowerListing } = require('../models/listingModel');
const pool = require('../../config/db');

const toNumberOrUndefined = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const getMarketplaceListings = async (req, res) => {
  try {
    const filters = {
      search: (req.query.search || '').trim(),
      category: (req.query.category || '').trim(),
      county: (req.query.county || '').trim(),
      minPrice: toNumberOrUndefined(req.query.minPrice),
      maxPrice: toNumberOrUndefined(req.query.maxPrice),
    };

    const [listings, options] = await Promise.all([
      getListings(filters),
      getListingFilterOptions(),
    ]);

    const host = `${req.protocol}://${req.get('host')}`;
    const normalizedListings = listings.map((item) => ({
      ...item,
      imageUrl: item.imageUrl || (item.imagePath ? `${host}${item.imagePath}` : null),
    }));

    return sendSuccess(
      res,
      { listings: normalizedListings, filters, options },
      'Marketplace listings fetched'
    );
  } catch (error) {
    return sendError(
      res,
      'Failed to fetch marketplace listings',
      500,
      error.sqlMessage || error.message || 'Unknown error'
    );
  }
};

const createMarketplaceListing = async (req, res) => {
  try {
    const {
      categoryId,
      title,
      description,
      unit = 'kg',
      pricePerUnit,
      quantityAvailable,
      minOrderQty = 1,
      isOrganic = false,
      harvestDate,
      availableFrom,
      availableTo,
      county,
      townCity,
      postcode,
    } = req.body;

    if (!title || !pricePerUnit || !quantityAvailable || !county || !townCity || !postcode) {
      return sendError(
        res,
        'title, pricePerUnit, quantityAvailable, county, townCity and postcode are required',
        400
      );
    }

    const listingId = await createGrowerListing(
      req.user.id,
      {
        categoryId,
        title: String(title).trim(),
        description: description ? String(description).trim() : '',
        unit: String(unit).trim(),
        pricePerUnit: Number(pricePerUnit),
        quantityAvailable: Number(quantityAvailable),
        minOrderQty: Number(minOrderQty) || 1,
        isOrganic: isOrganic === true || isOrganic === 'true' || isOrganic === '1' || isOrganic === 1,
        harvestDate,
        availableFrom,
        availableTo,
        county: String(county).trim(),
        townCity: String(townCity).trim(),
        postcode: String(postcode).trim(),
      },
      req.files || []
    );

    const [rows] = await pool.execute(
      `SELECT id, title, listing_status AS listingStatus
       FROM produce_listings
       WHERE id = ?
       LIMIT 1`,
      [listingId]
    );

    return sendSuccess(res, { listing: rows[0] || null }, 'Listing created successfully', 201);
  } catch (error) {
    return sendError(
      res,
      'Failed to create listing',
      500,
      error.sqlMessage || error.message || 'Unknown error'
    );
  }
};

module.exports = {
  getMarketplaceListings,
  createMarketplaceListing,
};
