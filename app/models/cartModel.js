const pool = require('../../config/db');

const toNumber = (value) => Number(value || 0);

const mapCartItem = (row) => ({
  itemId: row.itemId,
  listingId: row.listingId,
  title: row.title,
  description: row.description,
  unit: row.unit,
  quantity: toNumber(row.quantity),
  unitPrice: toNumber(row.unitPrice),
  lineTotal: toNumber(row.lineTotal),
  quantityAvailable: toNumber(row.quantityAvailable),
  minOrderQty: toNumber(row.minOrderQty),
  growerId: row.growerId,
  growerName: row.growerName,
  county: row.county,
  townCity: row.townCity,
  imageUrl: row.imageUrl,
  imagePath: row.imagePath,
});

const getOrCreateActiveCart = async (buyerId, connection = pool) => {
  const [rows] = await connection.execute(
    `SELECT id
     FROM carts
     WHERE buyer_id = ? AND status = 'active'
     LIMIT 1`,
    [buyerId]
  );

  if (rows[0]) {
    return rows[0].id;
  }

  const [result] = await connection.execute(
    `INSERT INTO carts (buyer_id, status)
     VALUES (?, 'active')`,
    [buyerId]
  );

  return result.insertId;
};

const getCartByBuyerId = async (buyerId) => {
  const cartId = await getOrCreateActiveCart(buyerId);
  const [rows] = await pool.execute(
    `SELECT
      ci.id AS itemId,
      pl.id AS listingId,
      pl.title,
      pl.description,
      pl.unit,
      ci.quantity,
      ci.unit_price AS unitPrice,
      (ci.quantity * ci.unit_price) AS lineTotal,
      pl.quantity_available AS quantityAvailable,
      pl.min_order_qty AS minOrderQty,
      pl.county,
      pl.town_city AS townCity,
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
     FROM cart_items ci
     INNER JOIN produce_listings pl ON pl.id = ci.listing_id
     INNER JOIN users u ON u.id = pl.grower_id
     WHERE ci.cart_id = ?
     ORDER BY ci.updated_at DESC`,
    [cartId]
  );

  const items = rows.map(mapCartItem);
  const summary = items.reduce(
    (acc, item) => {
      acc.itemCount += 1;
      acc.totalUnits += item.quantity;
      acc.subtotal += item.lineTotal;
      return acc;
    },
    { itemCount: 0, totalUnits: 0, subtotal: 0 }
  );

  return {
    cartId,
    items,
    summary,
  };
};

const getActiveCartItem = async (buyerId, itemId) => {
  const [rows] = await pool.execute(
    `SELECT ci.id, ci.cart_id AS cartId
     FROM cart_items ci
     INNER JOIN carts c ON c.id = ci.cart_id
     WHERE ci.id = ? AND c.buyer_id = ? AND c.status = 'active'
     LIMIT 1`,
    [itemId, buyerId]
  );

  return rows[0] || null;
};

const validateListingForCart = async (listingId) => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      title,
      grower_id AS growerId,
      price_per_unit AS pricePerUnit,
      quantity_available AS quantityAvailable,
      min_order_qty AS minOrderQty,
      listing_status AS listingStatus
     FROM produce_listings
     WHERE id = ?
     LIMIT 1`,
    [listingId]
  );

  return rows[0] || null;
};

const addCartItem = async (buyerId, listingId, quantity) => {
  const listing = await validateListingForCart(listingId);

  if (!listing || listing.listingStatus !== 'active') {
    throw new Error('Listing is not available for purchase');
  }

  const normalizedQuantity = Number(quantity);
  if (!normalizedQuantity || normalizedQuantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  if (normalizedQuantity < toNumber(listing.minOrderQty)) {
    throw new Error(`Minimum order quantity is ${listing.minOrderQty}`);
  }

  if (normalizedQuantity > toNumber(listing.quantityAvailable)) {
    throw new Error('Requested quantity exceeds available stock');
  }

  const cartId = await getOrCreateActiveCart(buyerId);
  const [existingRows] = await pool.execute(
    `SELECT id, quantity
     FROM cart_items
     WHERE cart_id = ? AND listing_id = ?
     LIMIT 1`,
    [cartId, listingId]
  );

  if (existingRows[0]) {
    const nextQuantity = toNumber(existingRows[0].quantity) + normalizedQuantity;
    if (nextQuantity > toNumber(listing.quantityAvailable)) {
      throw new Error('Total quantity in cart exceeds available stock');
    }

    await pool.execute(
      `UPDATE cart_items
       SET quantity = ?, unit_price = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextQuantity, listing.pricePerUnit, existingRows[0].id]
    );
  } else {
    await pool.execute(
      `INSERT INTO cart_items (cart_id, listing_id, quantity, unit_price)
       VALUES (?, ?, ?, ?)`,
      [cartId, listingId, normalizedQuantity, listing.pricePerUnit]
    );
  }

  return getCartByBuyerId(buyerId);
};

const updateCartItemQuantity = async (buyerId, itemId, quantity) => {
  const cartItem = await getActiveCartItem(buyerId, itemId);
  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  const normalizedQuantity = Number(quantity);
  if (!normalizedQuantity || normalizedQuantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  const [listingRows] = await pool.execute(
    `SELECT price_per_unit AS pricePerUnit, quantity_available AS quantityAvailable, min_order_qty AS minOrderQty
     FROM produce_listings pl
     INNER JOIN cart_items ci ON ci.listing_id = pl.id
     WHERE ci.id = ?
     LIMIT 1`,
    [itemId]
  );

  const listing = listingRows[0];
  if (!listing) {
    throw new Error('Listing not found for cart item');
  }

  if (normalizedQuantity < toNumber(listing.minOrderQty)) {
    throw new Error(`Minimum order quantity is ${listing.minOrderQty}`);
  }

  if (normalizedQuantity > toNumber(listing.quantityAvailable)) {
    throw new Error('Requested quantity exceeds available stock');
  }

  await pool.execute(
    `UPDATE cart_items
     SET quantity = ?, unit_price = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [normalizedQuantity, listing.pricePerUnit, itemId]
  );

  return getCartByBuyerId(buyerId);
};

const removeCartItem = async (buyerId, itemId) => {
  const cartItem = await getActiveCartItem(buyerId, itemId);
  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  await pool.execute(`DELETE FROM cart_items WHERE id = ?`, [itemId]);
  return getCartByBuyerId(buyerId);
};

module.exports = {
  getCartByBuyerId,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  getOrCreateActiveCart,
};
