const pool = require('../../config/db');

const getProfileByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT
      u.id,
      u.name,
      u.mobile,
      u.email,
      u.user_type AS userType,
      u.county,
      u.town_city AS townCity,
      u.postcode,
      u.created_at AS createdAt,
      ua.id AS addressId,
      ua.label AS addressLabel,
      ua.line1,
      ua.line2,
      ua.landmark,
      ua.city,
      ua.county AS addressCounty,
      ua.postcode AS addressPostcode,
      ua.country,
      ua.is_default AS isDefault
     FROM users u
     LEFT JOIN user_addresses ua
       ON ua.id = (
         SELECT id
         FROM user_addresses
         WHERE user_id = u.id
         ORDER BY is_default DESC, id ASC
         LIMIT 1
       )
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

const updateUserProfile = async (userId, userData) => {
  const { name, mobile, county, townCity, postcode } = userData;

  await pool.execute(
    `UPDATE users
     SET name = ?, mobile = ?, county = ?, town_city = ?, postcode = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, mobile, county, townCity, postcode, userId]
  );
};

const upsertDefaultAddress = async (userId, address) => {
  const { label, line1, line2, landmark, city, county, postcode, country } = address;

  const [rows] = await pool.execute(
    `SELECT id
     FROM user_addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, id ASC
     LIMIT 1`,
    [userId]
  );

  if (rows[0]) {
    await pool.execute(
      `UPDATE user_addresses
       SET label = ?, line1 = ?, line2 = ?, landmark = ?, city = ?, county = ?, postcode = ?, country = ?, is_default = 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [label, line1, line2 || null, landmark || null, city, county, postcode, country, rows[0].id]
    );
    return rows[0].id;
  }

  const [result] = await pool.execute(
    `INSERT INTO user_addresses (user_id, label, line1, line2, landmark, city, county, postcode, country, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [userId, label, line1, line2 || null, landmark || null, city, county, postcode, country]
  );

  return result.insertId;
};

module.exports = {
  getProfileByUserId,
  updateUserProfile,
  upsertDefaultAddress,
};
