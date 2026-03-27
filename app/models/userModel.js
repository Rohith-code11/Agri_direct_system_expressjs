const pool = require('../../config/db');

const mapUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    email: row.email,
    userType: row.user_type,
    county: row.county,
    townCity: row.town_city,
    postcode: row.postcode,
    password: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    `SELECT id, name, mobile, email, user_type, county, town_city, postcode, password_hash, created_at, updated_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return mapUserRow(rows[0]);
};

const createUser = async (userData) => {
  const { name, mobile, email, userType, county, townCity, postcode, password } = userData;

  const [result] = await pool.execute(
    `INSERT INTO users (name, mobile, email, user_type, county, town_city, postcode, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, mobile, email, userType, county, townCity, postcode, password]
  );

  const [rows] = await pool.execute(
    `SELECT id, name, mobile, email, user_type, county, town_city, postcode, password_hash, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );

  return mapUserRow(rows[0]);
};

module.exports = {
  findUserByEmail,
  createUser,
};
