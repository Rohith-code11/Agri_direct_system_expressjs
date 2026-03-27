const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/userModel');
const { sendSuccess, sendError } = require('../../utils/response');

const getSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  userType: user.userType,
  county: user.county,
  townCity: user.townCity,
  postcode: user.postcode,
  createdAt: user.createdAt,
});

const getErrorDetails = (error) => {
  if (!error) {
    return 'Unknown error';
  }

  return error.sqlMessage || error.message || error.code || String(error);
};

const register = async (req, res) => {
  try {
    const { name, mobile, email, userType, county, townCity, postcode, password } = req.body;

    if (!name || !mobile || !email || !userType || !county || !townCity || !postcode || !password) {
      return sendError(
        res,
        'name, mobile, email, userType, county, townCity, postcode and password are required',
        400
      );
    }

    const cleanedName = name.trim();
    const cleanedMobile = mobile.trim();
    const cleanedUserType = userType.trim();
    const cleanedCounty = county.trim();
    const cleanedTownCity = townCity.trim();
    const cleanedPostcode = postcode.trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Match SQL column limits in agri_direct.users table.
    if (cleanedName.length > 120) {
      return sendError(res, 'Name must be 120 characters or fewer', 400);
    }
    if (cleanedMobile.length > 20) {
      return sendError(res, 'Mobile must be 20 characters or fewer', 400);
    }
    if (normalizedEmail.length > 255) {
      return sendError(res, 'Email must be 255 characters or fewer', 400);
    }
    if (!['grower', 'buyer'].includes(cleanedUserType)) {
      return sendError(res, 'User type must be either grower or buyer', 400);
    }
    if (cleanedCounty.length > 120) {
      return sendError(res, 'County must be 120 characters or fewer', 400);
    }
    if (cleanedTownCity.length > 120) {
      return sendError(res, 'Town/City must be 120 characters or fewer', 400);
    }
    if (cleanedPostcode.length > 20) {
      return sendError(res, 'Postcode must be 20 characters or fewer', 400);
    }


    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return sendError(res, 'Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      name: cleanedName,
      mobile: cleanedMobile,
      email: normalizedEmail,
      userType: cleanedUserType,
      county: cleanedCounty,
      townCity: cleanedTownCity,
      postcode: cleanedPostcode,
      password: hashedPassword,
    });

    return sendSuccess(res, getSafeUser(user), 'Registration successful', 201);
  } catch (error) {
    return sendError(res, 'Registration failed', 500, getErrorDetails(error));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'email and password are required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '1d' }
    );

    return sendSuccess(res, { token, user: getSafeUser(user) }, 'Login successful');
  } catch (error) {
    return sendError(res, 'Login failed', 500, getErrorDetails(error));
  }
};

module.exports = {
  register,
  login,
};
