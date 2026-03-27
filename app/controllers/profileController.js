const { sendSuccess, sendError } = require('../../utils/response');
const { getProfileByUserId, updateUserProfile, upsertDefaultAddress } = require('../models/profileModel');

const getErrorDetails = (error) => {
  if (!error) {
    return 'Unknown error';
  }

  return error.sqlMessage || error.message || error.code || String(error);
};

const normalizeProfile = (row) => {
  if (!row) {
    return null;
  }

  return {
    user: {
      id: row.id,
      name: row.name,
      mobile: row.mobile,
      email: row.email,
      userType: row.userType,
      county: row.county,
      townCity: row.townCity,
      postcode: row.postcode,
      createdAt: row.createdAt,
    },
    address: row.addressId
      ? {
          id: row.addressId,
          label: row.addressLabel,
          line1: row.line1,
          line2: row.line2,
          landmark: row.landmark,
          city: row.city,
          county: row.addressCounty,
          postcode: row.addressPostcode,
          country: row.country,
          isDefault: Boolean(row.isDefault),
        }
      : null,
  };
};

const validate = ({ name, mobile, county, townCity, postcode, address }) => {
  if (!name || !mobile || !county || !townCity || !postcode) {
    return 'name, mobile, county, townCity and postcode are required';
  }

  if (name.length > 120) return 'Name must be 120 characters or fewer';
  if (mobile.length > 20) return 'Mobile must be 20 characters or fewer';
  if (county.length > 120) return 'County must be 120 characters or fewer';
  if (townCity.length > 120) return 'Town/City must be 120 characters or fewer';
  if (postcode.length > 20) return 'Postcode must be 20 characters or fewer';

  if (!address?.line1 || !address?.city || !address?.county || !address?.postcode || !address?.country) {
    return 'Address line1, city, county, postcode and country are required';
  }

  if ((address.label || 'Primary').length > 50) return 'Address label must be 50 characters or fewer';
  if (address.line1.length > 150) return 'Address line1 must be 150 characters or fewer';
  if ((address.line2 || '').length > 150) return 'Address line2 must be 150 characters or fewer';
  if ((address.landmark || '').length > 120) return 'Landmark must be 120 characters or fewer';
  if (address.city.length > 120) return 'Address city must be 120 characters or fewer';
  if (address.county.length > 120) return 'Address county must be 120 characters or fewer';
  if (address.postcode.length > 20) return 'Address postcode must be 20 characters or fewer';
  if (address.country.length > 80) return 'Address country must be 80 characters or fewer';

  return null;
};

const getMyProfile = async (req, res) => {
  try {
    const row = await getProfileByUserId(req.user.id);
    if (!row) {
      return sendError(res, 'Profile not found', 404);
    }
    return sendSuccess(res, normalizeProfile(row), 'Profile fetched');
  } catch (error) {
    return sendError(res, 'Failed to fetch profile', 500, getErrorDetails(error));
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const payload = {
      name: (req.body.name || '').trim(),
      mobile: (req.body.mobile || '').trim(),
      county: (req.body.county || '').trim(),
      townCity: (req.body.townCity || '').trim(),
      postcode: (req.body.postcode || '').trim(),
      address: {
        label: (req.body.address?.label || 'Primary').trim(),
        line1: (req.body.address?.line1 || '').trim(),
        line2: (req.body.address?.line2 || '').trim(),
        landmark: (req.body.address?.landmark || '').trim(),
        city: (req.body.address?.city || '').trim(),
        county: (req.body.address?.county || '').trim(),
        postcode: (req.body.address?.postcode || '').trim(),
        country: (req.body.address?.country || '').trim(),
      },
    };

    const validationError = validate(payload);
    if (validationError) {
      return sendError(res, validationError, 400);
    }

    await updateUserProfile(req.user.id, payload);
    await upsertDefaultAddress(req.user.id, payload.address);

    const row = await getProfileByUserId(req.user.id);
    return sendSuccess(res, normalizeProfile(row), 'Profile updated');
  } catch (error) {
    return sendError(res, 'Failed to update profile', 500, getErrorDetails(error));
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};
