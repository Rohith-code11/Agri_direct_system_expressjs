const pool = require('../../config/db');

const getGrowerSummary = async (growerId) => {
  const [[listings]] = await pool.execute(
    `SELECT COUNT(*) AS activeListings
     FROM produce_listings
     WHERE grower_id = ? AND listing_status = 'active'`,
    [growerId]
  );

  const [[incomingOrders]] = await pool.execute(
    `SELECT COUNT(*) AS incomingOrders
     FROM orders
     WHERE grower_id = ?
       AND order_status IN ('placed', 'accepted', 'packed', 'in_transit')`,
    [growerId]
  );

  const [[payout]] = await pool.execute(
    `SELECT COALESCE(SUM(total_amount), 0) AS expectedPayout
     FROM orders
     WHERE grower_id = ?
       AND payment_status IN ('pending', 'paid')
       AND order_status <> 'cancelled'`,
    [growerId]
  );

  const [[latestOrder]] = await pool.execute(
    `SELECT order_number AS orderNumber, order_status AS orderStatus, placed_at AS placedAt
     FROM orders
     WHERE grower_id = ?
     ORDER BY placed_at DESC
     LIMIT 1`,
    [growerId]
  );

  return {
    activeListings: Number(listings.activeListings || 0),
    incomingOrders: Number(incomingOrders.incomingOrders || 0),
    expectedPayout: Number(payout.expectedPayout || 0),
    latestOrder: latestOrder || null,
  };
};

const getBuyerSummary = async (buyerId) => {
  const [[openOrders]] = await pool.execute(
    `SELECT COUNT(*) AS openOrders
     FROM orders
     WHERE buyer_id = ?
       AND order_status IN ('placed', 'accepted', 'packed', 'in_transit')`,
    [buyerId]
  );

  const [[inTransit]] = await pool.execute(
    `SELECT COUNT(*) AS inTransitOrders
     FROM orders
     WHERE buyer_id = ?
       AND order_status = 'in_transit'`,
    [buyerId]
  );

  const [[monthlySpend]] = await pool.execute(
    `SELECT COALESCE(SUM(total_amount), 0) AS monthlySpend
     FROM orders
     WHERE buyer_id = ?
       AND payment_status = 'paid'
       AND YEAR(placed_at) = YEAR(CURRENT_DATE())
       AND MONTH(placed_at) = MONTH(CURRENT_DATE())`,
    [buyerId]
  );

  const [[latestDelivery]] = await pool.execute(
    `SELECT s.tracking_number AS trackingNumber, s.shipment_status AS shipmentStatus, s.estimated_delivery AS estimatedDelivery
     FROM shipments s
     INNER JOIN orders o ON o.id = s.order_id
     WHERE o.buyer_id = ?
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [buyerId]
  );

  return {
    openOrders: Number(openOrders.openOrders || 0),
    inTransitOrders: Number(inTransit.inTransitOrders || 0),
    monthlySpend: Number(monthlySpend.monthlySpend || 0),
    latestDelivery: latestDelivery || null,
  };
};

const getGrowerInventory = async (growerId) => {
  const [rows] = await pool.execute(
    `SELECT
      pl.id,
      pl.title,
      pl.description,
      pl.category_id AS categoryId,
      c.name AS categoryName,
      pl.unit,
      pl.price_per_unit AS pricePerUnit,
      pl.quantity_available AS quantityAvailable,
      pl.min_order_qty AS minOrderQty,
      pl.is_organic AS isOrganic,
      pl.harvest_date AS harvestDate,
      pl.available_from AS availableFrom,
      pl.listing_status AS listingStatus,
      pl.county,
      pl.town_city AS townCity,
      pl.postcode,
      pl.available_to AS availableTo,
     pl.updated_at AS updatedAt
     FROM produce_listings pl
     LEFT JOIN categories c ON c.id = pl.category_id
     WHERE pl.grower_id = ?
     ORDER BY pl.updated_at DESC
     LIMIT 50`,
    [growerId]
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    unit: row.unit,
    pricePerUnit: Number(row.pricePerUnit || 0),
    quantityAvailable: Number(row.quantityAvailable || 0),
    minOrderQty: Number(row.minOrderQty || 0),
    isOrganic: Boolean(row.isOrganic),
    harvestDate: row.harvestDate,
    availableFrom: row.availableFrom,
    listingStatus: row.listingStatus,
    county: row.county,
    townCity: row.townCity,
    postcode: row.postcode,
    availableTo: row.availableTo,
    updatedAt: row.updatedAt,
  }));
};

const getActiveCategories = async () => {
  const [rows] = await pool.execute(
    `SELECT id, name
     FROM categories
     WHERE is_active = 1
     ORDER BY name ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
};

module.exports = {
  getGrowerSummary,
  getBuyerSummary,
  getGrowerInventory,
  getActiveCategories,
};
