const pool = require('../../config/db');

const buildFilters = (filters) => {
  const conditions = [`pl.listing_status = 'active'`];
  const params = [];

  if (filters.search) {
    conditions.push('(pl.title LIKE ? OR pl.description LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters.category) {
    conditions.push('c.slug = ?');
    params.push(filters.category);
  }

  if (filters.county) {
    conditions.push('pl.county = ?');
    params.push(filters.county);
  }

  if (typeof filters.minPrice === 'number') {
    conditions.push('pl.price_per_unit >= ?');
    params.push(filters.minPrice);
  }

  if (typeof filters.maxPrice === 'number') {
    conditions.push('pl.price_per_unit <= ?');
    params.push(filters.maxPrice);
  }

  return { whereClause: conditions.join(' AND '), params };
};

const getListings = async (filters = {}) => {
  const { whereClause, params } = buildFilters(filters);

  const [rows] = await pool.execute(
    `SELECT
      pl.id,
      pl.title,
      pl.description,
      pl.unit,
      pl.price_per_unit AS pricePerUnit,
      pl.quantity_available AS quantityAvailable,
      pl.min_order_qty AS minOrderQty,
      pl.is_organic AS isOrganic,
      pl.county,
      pl.town_city AS townCity,
      pl.postcode,
      pl.available_to AS availableTo,
      pl.updated_at AS updatedAt,
      c.name AS categoryName,
      c.slug AS categorySlug,
      u.id AS growerId,
      u.name AS growerName,
      (
        SELECT li.image_url
        FROM listing_images li
        WHERE li.listing_id = pl.id
        ORDER BY li.is_primary DESC, li.sort_order ASC, li.id ASC
        LIMIT 1
      ) AS imageUrl,
      (
        SELECT li.image_path
        FROM listing_images li
        WHERE li.listing_id = pl.id
        ORDER BY li.is_primary DESC, li.sort_order ASC, li.id ASC
        LIMIT 1
      ) AS imagePath
     FROM produce_listings pl
     INNER JOIN users u ON u.id = pl.grower_id
     LEFT JOIN categories c ON c.id = pl.category_id
     WHERE ${whereClause}
     ORDER BY pl.updated_at DESC
     LIMIT 100`,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    unit: row.unit,
    pricePerUnit: Number(row.pricePerUnit || 0),
    quantityAvailable: Number(row.quantityAvailable || 0),
    minOrderQty: Number(row.minOrderQty || 0),
    isOrganic: Boolean(row.isOrganic),
    county: row.county,
    townCity: row.townCity,
    postcode: row.postcode,
    availableTo: row.availableTo,
    updatedAt: row.updatedAt,
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    growerId: row.growerId,
    growerName: row.growerName,
    imageUrl: row.imageUrl,
    imagePath: row.imagePath,
  }));
};

const getListingFilterOptions = async () => {
  const [categories] = await pool.execute(
    `SELECT slug, name
     FROM categories
     WHERE is_active = 1
     ORDER BY name ASC`
  );

  const [counties] = await pool.execute(
    `SELECT DISTINCT county
     FROM produce_listings
     WHERE listing_status = 'active'
     ORDER BY county ASC`
  );

  return {
    categories,
    counties: counties.map((row) => row.county),
  };
};

const createGrowerListing = async (growerId, listingData, files = []) => {
  const {
    categoryId,
    title,
    description,
    unit,
    pricePerUnit,
    quantityAvailable,
    minOrderQty,
    isOrganic,
    harvestDate,
    availableFrom,
    availableTo,
    county,
    townCity,
    postcode,
  } = listingData;

  const [result] = await pool.execute(
    `INSERT INTO produce_listings (
      grower_id, category_id, title, description, unit, price_per_unit, quantity_available, min_order_qty, is_organic,
      harvest_date, available_from, available_to, listing_status, county, town_city, postcode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    [
      growerId,
      categoryId || null,
      title,
      description || null,
      unit,
      pricePerUnit,
      quantityAvailable,
      minOrderQty,
      isOrganic ? 1 : 0,
      harvestDate || null,
      availableFrom || null,
      availableTo || null,
      county,
      townCity,
      postcode,
    ]
  );

  const listingId = result.insertId;

  if (files.length > 0) {
    const values = [];
    const placeholders = [];

    files.forEach((file, index) => {
      placeholders.push('(?, ?, ?, ?, ?, ?, ?)');
      values.push(
        listingId,
        null,
        `/uploads/listings/${file.filename}`,
        file.originalname,
        file.mimetype,
        file.size,
        index === 0 ? 1 : 0
      );
    });

    await pool.execute(
      `INSERT INTO listing_images (
        listing_id, image_url, image_path, file_name, mime_type, file_size, is_primary
      ) VALUES ${placeholders.join(', ')}`,
      values
    );
  }

  return listingId;
};

module.exports = {
  getListings,
  getListingFilterOptions,
  createGrowerListing,
};
