const pool = require('../../config/db');
const { getOrCreateActiveCart } = require('./cartModel');

const toNumber = (value) => Number(value || 0);

const formatOrders = (rows) => {
  const orderMap = new Map();

  rows.forEach((row) => {
    if (!orderMap.has(row.id)) {
      orderMap.set(row.id, {
        id: row.id,
        orderNumber: row.orderNumber,
        buyerId: row.buyerId,
        buyerName: row.buyerName,
        growerId: row.growerId,
        growerName: row.growerName,
        subtotalAmount: toNumber(row.subtotalAmount),
        deliveryFee: toNumber(row.deliveryFee),
        taxAmount: toNumber(row.taxAmount),
        totalAmount: toNumber(row.totalAmount),
        paymentMethod: row.paymentMethod,
        paymentStatus: row.paymentStatus,
        orderStatus: row.orderStatus,
        notes: row.notes,
        placedAt: row.placedAt,
        shipment: row.shipmentId
          ? {
              id: row.shipmentId,
              courierName: row.courierName,
              trackingNumber: row.trackingNumber,
              shipmentStatus: row.shipmentStatus,
              estimatedDelivery: row.estimatedDelivery,
              deliveredAt: row.deliveredAt,
              currentLocation: row.currentLocation,
            }
          : null,
        payment: row.paymentId
          ? {
              id: row.paymentId,
              transactionRef: row.transactionRef,
              provider: row.provider,
              amount: toNumber(row.paymentAmount),
              paymentMethod: row.paymentMethod,
              paymentStatus: row.providerPaymentStatus,
              paidAt: row.paidAt,
            }
          : null,
        items: [],
      });
    }

    const order = orderMap.get(row.id);
    if (row.itemId) {
      order.items.push({
        id: row.itemId,
        listingId: row.listingId,
        productTitle: row.productTitle,
        unit: row.unit,
        quantity: toNumber(row.quantity),
        unitPrice: toNumber(row.unitPrice),
        lineTotal: toNumber(row.lineTotal),
      });
    }
  });

  return Array.from(orderMap.values());
};

const listBuyerOrders = async (buyerId) => {
  const [rows] = await pool.execute(
    `SELECT
      o.id,
      o.order_number AS orderNumber,
      o.buyer_id AS buyerId,
      buyer.name AS buyerName,
      o.grower_id AS growerId,
      grower.name AS growerName,
      o.subtotal_amount AS subtotalAmount,
      o.delivery_fee AS deliveryFee,
      o.tax_amount AS taxAmount,
      o.total_amount AS totalAmount,
      o.payment_method AS paymentMethod,
      o.payment_status AS paymentStatus,
      o.order_status AS orderStatus,
      o.notes,
      o.placed_at AS placedAt,
      oi.id AS itemId,
      oi.listing_id AS listingId,
      oi.product_title AS productTitle,
      oi.unit,
      oi.quantity,
      oi.unit_price AS unitPrice,
      oi.line_total AS lineTotal,
      s.id AS shipmentId,
      s.courier_name AS courierName,
      s.tracking_number AS trackingNumber,
      s.shipment_status AS shipmentStatus,
      s.estimated_delivery AS estimatedDelivery,
      s.delivered_at AS deliveredAt,
      s.current_location AS currentLocation,
      p.id AS paymentId,
      p.transaction_ref AS transactionRef,
      p.provider,
      p.amount AS paymentAmount,
      p.payment_status AS providerPaymentStatus,
      p.paid_at AS paidAt
     FROM orders o
     INNER JOIN users buyer ON buyer.id = o.buyer_id
     INNER JOIN users grower ON grower.id = o.grower_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN shipments s ON s.order_id = o.id
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.buyer_id = ?
     ORDER BY o.placed_at DESC, oi.id ASC`,
    [buyerId]
  );

  return formatOrders(rows);
};

const listGrowerOrders = async (growerId) => {
  const [rows] = await pool.execute(
    `SELECT
      o.id,
      o.order_number AS orderNumber,
      o.buyer_id AS buyerId,
      buyer.name AS buyerName,
      o.grower_id AS growerId,
      grower.name AS growerName,
      o.subtotal_amount AS subtotalAmount,
      o.delivery_fee AS deliveryFee,
      o.tax_amount AS taxAmount,
      o.total_amount AS totalAmount,
      o.payment_method AS paymentMethod,
      o.payment_status AS paymentStatus,
      o.order_status AS orderStatus,
      o.notes,
      o.placed_at AS placedAt,
      oi.id AS itemId,
      oi.listing_id AS listingId,
      oi.product_title AS productTitle,
      oi.unit,
      oi.quantity,
      oi.unit_price AS unitPrice,
      oi.line_total AS lineTotal,
      s.id AS shipmentId,
      s.courier_name AS courierName,
      s.tracking_number AS trackingNumber,
      s.shipment_status AS shipmentStatus,
      s.estimated_delivery AS estimatedDelivery,
      s.delivered_at AS deliveredAt,
      s.current_location AS currentLocation,
      p.id AS paymentId,
      p.transaction_ref AS transactionRef,
      p.provider,
      p.amount AS paymentAmount,
      p.payment_status AS providerPaymentStatus,
      p.paid_at AS paidAt
     FROM orders o
     INNER JOIN users buyer ON buyer.id = o.buyer_id
     INNER JOIN users grower ON grower.id = o.grower_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN shipments s ON s.order_id = o.id
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.grower_id = ?
     ORDER BY o.placed_at DESC, oi.id ASC`,
    [growerId]
  );

  return formatOrders(rows);
};

const createOrdersFromCart = async (buyer, payload = {}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const cartId = await getOrCreateActiveCart(buyer.id, connection);
    const [cartRows] = await connection.execute(
      `SELECT
        ci.id AS cartItemId,
        ci.quantity,
        pl.id AS listingId,
        pl.title,
        pl.unit,
        pl.price_per_unit AS pricePerUnit,
        pl.quantity_available AS quantityAvailable,
        pl.min_order_qty AS minOrderQty,
        pl.grower_id AS growerId,
        grower.name AS growerName
       FROM cart_items ci
       INNER JOIN produce_listings pl ON pl.id = ci.listing_id
       INNER JOIN users grower ON grower.id = pl.grower_id
       WHERE ci.cart_id = ?
       ORDER BY pl.grower_id, ci.id`,
      [cartId]
    );

    if (cartRows.length === 0) {
      throw new Error('Cart is empty');
    }

    const groupedByGrower = cartRows.reduce((acc, row) => {
      const normalizedQty = toNumber(row.quantity);
      const availableQty = toNumber(row.quantityAvailable);
      const minOrderQty = toNumber(row.minOrderQty);

      if (normalizedQty > availableQty) {
        throw new Error(`Insufficient stock for ${row.title}`);
      }

      if (normalizedQty < minOrderQty) {
        throw new Error(`Minimum order quantity not met for ${row.title}`);
      }

      if (!acc[row.growerId]) {
        acc[row.growerId] = [];
      }
      acc[row.growerId].push(row);
      return acc;
    }, {});

    const paymentMethod = ['upi', 'card', 'net_banking', 'cod'].includes(payload.paymentMethod)
      ? payload.paymentMethod
      : 'upi';
    const orderIds = [];

    for (const growerId of Object.keys(groupedByGrower)) {
      const groupItems = groupedByGrower[growerId];
      const subtotal = groupItems.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.pricePerUnit), 0);
      const deliveryFee = subtotal >= 1000 ? 0 : 40;
      const taxAmount = Number((subtotal * 0.05).toFixed(2));
      const totalAmount = Number((subtotal + deliveryFee + taxAmount).toFixed(2));
      const orderNumber = `AGD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'paid';

      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          order_number, buyer_id, grower_id, subtotal_amount, delivery_fee, tax_amount, total_amount,
          payment_method, payment_status, order_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'placed', ?)`,
        [orderNumber, buyer.id, Number(growerId), subtotal, deliveryFee, taxAmount, totalAmount, paymentMethod, paymentStatus, payload.notes || null]
      );

      const orderId = orderResult.insertId;
      orderIds.push(orderId);

      for (const item of groupItems) {
        const quantity = toNumber(item.quantity);
        const unitPrice = toNumber(item.pricePerUnit);
        const remainingQuantity = Number((toNumber(item.quantityAvailable) - quantity).toFixed(2));
        const listingStatus = remainingQuantity <= 0 ? 'inactive' : 'active';

        await connection.execute(
          `INSERT INTO order_items (order_id, listing_id, product_title, unit, quantity, unit_price, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.listingId, item.title, item.unit, quantity, unitPrice, Number((quantity * unitPrice).toFixed(2))]
        );

        await connection.execute(
          `UPDATE produce_listings
           SET quantity_available = ?, listing_status = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [remainingQuantity, listingStatus, item.listingId]
        );
      }

      const transactionRef = `TXN-${orderNumber}`;
      await connection.execute(
        `INSERT INTO payments (order_id, transaction_ref, provider, amount, payment_method, payment_status, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          transactionRef,
          paymentMethod === 'cod' ? 'Cash on Delivery' : 'AgriDirect Pay',
          totalAmount,
          paymentMethod,
          paymentMethod === 'cod' ? 'initiated' : 'success',
          paymentMethod === 'cod' ? null : new Date(),
        ]
      );

      const trackingNumber = `TRK-${orderNumber}`;
      const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const [shipmentResult] = await connection.execute(
        `INSERT INTO shipments (order_id, courier_name, tracking_number, shipment_status, estimated_delivery, current_location)
         VALUES (?, ?, ?, 'pending', ?, ?)`,
        [orderId, 'AgriDirect Logistics', trackingNumber, estimatedDelivery, buyer.townCity || buyer.county || 'Processing hub']
      );

      await connection.execute(
        `INSERT INTO shipment_events (shipment_id, event_status, event_note)
         VALUES (?, 'Pending', 'Order placed and awaiting grower confirmation.')`,
        [shipmentResult.insertId]
      );

      await connection.execute(
        `INSERT INTO notifications (user_id, title, message, notification_type)
         VALUES
         (?, 'Order placed', ?, 'order'),
         (?, 'New buyer order', ?, 'order')`,
        [
          buyer.id,
          `Your order ${orderNumber} has been placed successfully.`,
          Number(growerId),
          `A new order ${orderNumber} from ${buyer.name} requires confirmation.`,
        ]
      );
    }

    await connection.execute(`DELETE FROM cart_items WHERE cart_id = ?`, [cartId]);
    await connection.commit();

    const orders = await listBuyerOrders(buyer.id);
    return orders.filter((order) => orderIds.includes(order.id));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateGrowerOrderStatus = async (growerId, orderId, nextStatus) => {
  const allowedStatuses = ['accepted', 'packed', 'in_transit', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(nextStatus)) {
    throw new Error('Invalid order status');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT id, order_number AS orderNumber, buyer_id AS buyerId, order_status AS orderStatus
       FROM orders
       WHERE id = ? AND grower_id = ?
       LIMIT 1`,
      [orderId, growerId]
    );

    const order = rows[0];
    if (!order) {
      throw new Error('Order not found');
    }

    await connection.execute(
      `UPDATE orders
       SET order_status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextStatus, orderId]
    );

    const shipmentStatusMap = {
      accepted: 'assigned',
      packed: 'picked',
      in_transit: 'in_transit',
      delivered: 'delivered',
      cancelled: 'failed',
    };

    const shipmentStatus = shipmentStatusMap[nextStatus];
    await connection.execute(
      `UPDATE shipments
       SET shipment_status = ?,
           delivered_at = CASE WHEN ? = 'delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END,
           current_location = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE order_id = ?`,
      [
        shipmentStatus,
        nextStatus,
        nextStatus === 'delivered' ? 'Delivered successfully' : `Status updated to ${nextStatus.replace('_', ' ')}`,
        orderId,
      ]
    );

    const [shipmentRows] = await connection.execute(
      `SELECT id
       FROM shipments
       WHERE order_id = ?
       LIMIT 1`,
      [orderId]
    );

    if (shipmentRows[0]) {
      await connection.execute(
        `INSERT INTO shipment_events (shipment_id, event_status, event_note)
         VALUES (?, ?, ?)`,
        [
          shipmentRows[0].id,
          nextStatus.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          `Grower updated order ${order.orderNumber} to ${nextStatus.replace('_', ' ')}.`,
        ]
      );
    }

    if (nextStatus === 'delivered') {
      await connection.execute(
        `UPDATE orders
         SET payment_status = CASE WHEN payment_method = 'cod' THEN 'paid' ELSE payment_status END
         WHERE id = ?`,
        [orderId]
      );

      await connection.execute(
        `UPDATE payments
         SET payment_status = CASE WHEN payment_method = 'cod' THEN 'success' ELSE payment_status END,
             paid_at = CASE WHEN payment_method = 'cod' THEN CURRENT_TIMESTAMP ELSE paid_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE order_id = ?`,
        [orderId]
      );
    }

    await connection.execute(
      `INSERT INTO notifications (user_id, title, message, notification_type)
       VALUES (?, 'Order update', ?, ?)`,
      [
        order.buyerId,
        `Order ${order.orderNumber} is now ${nextStatus.replace('_', ' ')}.`,
        nextStatus === 'delivered' ? 'delivery' : 'order',
      ]
    );

    await connection.commit();
    const orders = await listGrowerOrders(growerId);
    return orders.find((item) => item.id === Number(orderId)) || null;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  listBuyerOrders,
  listGrowerOrders,
  createOrdersFromCart,
  updateGrowerOrderStatus,
};
