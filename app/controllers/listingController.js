const { sendSuccess, sendError } = require('../../utils/response');
const {
  getListings,
  getListingFilterOptions,
  createGrowerListing,
  getGrowerListingById,
  updateGrowerListing,
  deleteGrowerListing,
} = require('../models/listingModel');
const pool = require('../../config/db');

const pickDefined = (value, fallback = '') => {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value).trim();
};

const pickNumber = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

const pickBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value === true || value === 'true' || value === '1' || value === 1;
};

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

    const payload = {
      categoryId: pickNumber(categoryId, null),
      title: pickDefined(title),
      description: pickDefined(description),
      unit: pickDefined(unit, 'kg') || 'kg',
      pricePerUnit: pickNumber(pricePerUnit, undefined),
      quantityAvailable: pickNumber(quantityAvailable, undefined),
      minOrderQty: pickNumber(minOrderQty, 1),
      isOrganic: pickBoolean(isOrganic, false),
      harvestDate: pickDefined(harvestDate, '') || null,
      availableFrom: pickDefined(availableFrom, '') || null,
      availableTo: pickDefined(availableTo, '') || null,
      county: pickDefined(county),
      townCity: pickDefined(townCity),
      postcode: pickDefined(postcode),
    };

    if (!payload.title || payload.pricePerUnit === undefined || payload.quantityAvailable === undefined || !payload.county || !payload.townCity || !payload.postcode) {
      return sendError(
        res,
        'title, pricePerUnit, quantityAvailable, county, townCity and postcode are required',
        400
      );
    }

    const listingId = await createGrowerListing(
      req.user.id,
      payload,
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

const updateMarketplaceListing = async (req, res) => {
  try {
    const {
      categoryId,
      title,
      description = '',
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
      listingStatus = 'active',
    } = req.body;

    const existingListing = await getGrowerListingById(req.user.id, Number(req.params.listingId));

    if (!existingListing) {
      return sendError(res, 'Listing not found', 404);
    }

    const payload = {
      categoryId: pickNumber(categoryId, existingListing.categoryId),
      title: pickDefined(title, existingListing.title || ''),
      description: pickDefined(description, existingListing.description || ''),
      unit: pickDefined(unit, existingListing.unit || 'kg') || 'kg',
      pricePerUnit: pickNumber(pricePerUnit, Number(existingListing.pricePerUnit)),
      quantityAvailable: pickNumber(quantityAvailable, Number(existingListing.quantityAvailable)),
      minOrderQty: pickNumber(minOrderQty, Number(existingListing.minOrderQty) || 1),
      isOrganic: pickBoolean(isOrganic, Boolean(existingListing.isOrganic)),
      harvestDate: pickDefined(harvestDate, existingListing.harvestDate || '') || null,
      availableFrom: pickDefined(availableFrom, existingListing.availableFrom || '') || null,
      availableTo: pickDefined(availableTo, existingListing.availableTo || '') || null,
      county: pickDefined(county, existingListing.county || ''),
      townCity: pickDefined(townCity, existingListing.townCity || ''),
      postcode: pickDefined(postcode, existingListing.postcode || ''),
      listingStatus: ['active', 'inactive', 'sold_out'].includes(String(listingStatus).trim())
        ? String(listingStatus).trim()
        : (existingListing.listingStatus || 'active'),
    };

    if (!payload.title || payload.pricePerUnit === undefined || payload.quantityAvailable === undefined || !payload.county || !payload.townCity || !payload.postcode) {
      return sendError(
        res,
        'title, pricePerUnit, quantityAvailable, county, townCity and postcode are required',
        400
      );
    }

    const isUpdated = await updateGrowerListing(
      req.user.id,
      Number(req.params.listingId),
      payload,
      req.files || []
    );

    if (!isUpdated) {
      return sendError(res, 'Listing not found', 404);
    }

    return sendSuccess(res, null, 'Listing updated successfully');
  } catch (error) {
    return sendError(
      res,
      'Failed to update listing',
      500,
      error.sqlMessage || error.message || 'Unknown error'
    );
  }
};

const removeMarketplaceListing = async (req, res) => {
  try {
    const isDeleted = await deleteGrowerListing(req.user.id, Number(req.params.listingId));
    if (!isDeleted) {
      return sendError(res, 'Listing not found', 404);
    }

    return sendSuccess(res, null, 'Listing deleted successfully');
  } catch (error) {
    return sendError(
      res,
      'Failed to delete listing',
      500,
      error.sqlMessage || error.message || 'Unknown error'
    );
  }
};

module.exports = {
  getMarketplaceListings,
  createMarketplaceListing,
  updateMarketplaceListing,
  removeMarketplaceListing,
};
