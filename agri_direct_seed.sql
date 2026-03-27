-- agri_direct_seed.sql
-- Seed data: 5 realistic rows for each business table

USE agri_direct;

SET @pwd_hash = '$2a$10$7EqJtq98hPqEX7fNZaFWoO5Y9A6vC18JNpDutLCRa14Q6gttxyP6.';

-- Categories should already exist from agri_direct.sql seed.
SET @cat_veg = (SELECT id FROM categories WHERE slug = 'vegetables' LIMIT 1);
SET @cat_fruits = (SELECT id FROM categories WHERE slug = 'fruits' LIMIT 1);
SET @cat_grains = (SELECT id FROM categories WHERE slug = 'grains' LIMIT 1);
SET @cat_pulses = (SELECT id FROM categories WHERE slug = 'pulses' LIMIT 1);
SET @cat_spices = (SELECT id FROM categories WHERE slug = 'spices' LIMIT 1);

-- ==================================
-- users (10 users to support 5 growers + 5 buyers)
-- ==================================
INSERT INTO users (
  id, name, mobile, email, user_type, county, town_city, postcode, password_hash, is_active, last_login_at
) VALUES
  (1001, 'Ramesh Reddy', '9000010001', 'ramesh.grower@agridirect.com', 'grower', 'Anantapur', 'Dharmavaram', '515671', @pwd_hash, 1, NOW()),
  (1002, 'Lakshmi Devi', '9000010002', 'lakshmi.grower@agridirect.com', 'grower', 'Guntur', 'Tenali', '522201', @pwd_hash, 1, NOW()),
  (1003, 'Mahesh Naik', '9000010003', 'mahesh.grower@agridirect.com', 'grower', 'Warangal', 'Hanamkonda', '506001', @pwd_hash, 1, NOW()),
  (1004, 'Sujatha Rao', '9000010004', 'sujatha.grower@agridirect.com', 'grower', 'Nashik', 'Sinnar', '422103', @pwd_hash, 1, NOW()),
  (1005, 'Prakash Patil', '9000010005', 'prakash.grower@agridirect.com', 'grower', 'Mysuru', 'Nanjangud', '571301', @pwd_hash, 1, NOW()),
  (1006, 'Kiran Foods Pvt Ltd', '9000011001', 'kiran.buyer@agridirect.com', 'buyer', 'Hyderabad', 'Kukatpally', '500072', @pwd_hash, 1, NOW()),
  (1007, 'Fresh Basket Retail', '9000011002', 'freshbasket.buyer@agridirect.com', 'buyer', 'Bengaluru Urban', 'Yelahanka', '560064', @pwd_hash, 1, NOW()),
  (1008, 'Metro Mart Supply', '9000011003', 'metromart.buyer@agridirect.com', 'buyer', 'Pune', 'Hinjewadi', '411057', @pwd_hash, 1, NOW()),
  (1009, 'Green Cart Chain', '9000011004', 'greencart.buyer@agridirect.com', 'buyer', 'Chennai', 'Tambaram', '600045', @pwd_hash, 1, NOW()),
  (1010, 'Urban Kitchen Stores', '9000011005', 'urbankitchen.buyer@agridirect.com', 'buyer', 'Coimbatore', 'Gandhipuram', '641012', @pwd_hash, 1, NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  county = VALUES(county),
  town_city = VALUES(town_city),
  postcode = VALUES(postcode),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- grower_profiles (5)
-- ==================================
INSERT INTO grower_profiles (
  user_id, farm_name, farm_size_acres, farming_type, certifications, experience_years, bio
) VALUES
  (1001, 'Reddy Green Fields', 14.50, 'Vegetable Farming', 'Organic India', 12, 'Focuses on seasonal vegetables and drip irrigation.'),
  (1002, 'Lakshmi Agro Farm', 11.20, 'Fruit Farming', 'APEDA', 9, 'Specializes in mango and banana produce.'),
  (1003, 'Naik Natural Farms', 8.75, 'Pulse Farming', 'NPOP', 10, 'Produces pesticide-controlled dal and legumes.'),
  (1004, 'Sujatha Harvest Hub', 16.00, 'Mixed Farming', 'FSSAI Compliant', 14, 'Runs integrated grain and spice cultivation.'),
  (1005, 'Patil Organics', 10.40, 'Spice Farming', 'Organic India', 8, 'Supplies turmeric, chili and coriander batches.')
ON DUPLICATE KEY UPDATE
  farm_name = VALUES(farm_name),
  farm_size_acres = VALUES(farm_size_acres),
  farming_type = VALUES(farming_type),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- buyer_profiles (5)
-- ==================================
INSERT INTO buyer_profiles (
  user_id, business_name, business_type, gst_number, delivery_instructions, preferred_payment_method
) VALUES
  (1006, 'Kiran Foods Pvt Ltd', 'Wholesaler', '36AAECK1006A1ZQ', 'Deliver before 9 AM at warehouse gate 2.', 'net_banking'),
  (1007, 'Fresh Basket Retail', 'Retail Chain', '29AAECF1007B1ZX', 'Call store manager before unloading.', 'upi'),
  (1008, 'Metro Mart Supply', 'Distributor', '27AAECM1008C1ZY', 'Use rear dock for bulk deliveries.', 'card'),
  (1009, 'Green Cart Chain', 'Supermarket', '33AAECG1009D1ZW', 'Maintain cold-chain for greens.', 'upi'),
  (1010, 'Urban Kitchen Stores', 'Retail Chain', '32AAECU1010E1ZU', 'Deliver only between 7-11 AM.', 'net_banking')
ON DUPLICATE KEY UPDATE
  business_name = VALUES(business_name),
  business_type = VALUES(business_type),
  preferred_payment_method = VALUES(preferred_payment_method),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- user_addresses (5)
-- ==================================
INSERT INTO user_addresses (
  id, user_id, label, line1, line2, landmark, city, county, postcode, country, is_default
) VALUES
  (2001, 1006, 'Warehouse', 'Plot 21, Food Park Road', 'Phase 2', 'Near Metro Pillar 188', 'Hyderabad', 'Hyderabad', '500072', 'India', 1),
  (2002, 1007, 'Main Store', 'No 12, Market Circle', 'Block A', 'Near Yelahanka Bus Stand', 'Bengaluru', 'Bengaluru Urban', '560064', 'India', 1),
  (2003, 1008, 'Distribution Hub', 'Sector 3 Logistics Park', NULL, 'Opp IT Park Gate 4', 'Pune', 'Pune', '411057', 'India', 1),
  (2004, 1009, 'Retail Depot', '19 Velachery Main Rd', 'Unit C', 'Near Tambaram Railway', 'Chennai', 'Chennai', '600045', 'India', 1),
  (2005, 1010, 'Central Store', '88 Cross Cut Road', '1st Floor', 'Near Gandhipuram Signal', 'Coimbatore', 'Coimbatore', '641012', 'India', 1)
ON DUPLICATE KEY UPDATE
  line1 = VALUES(line1),
  city = VALUES(city),
  county = VALUES(county),
  postcode = VALUES(postcode),
  is_default = VALUES(is_default),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- produce_listings (5)
-- ==================================
INSERT INTO produce_listings (
  id, grower_id, category_id, title, description, unit, price_per_unit, quantity_available, min_order_qty, is_organic,
  harvest_date, available_from, available_to, listing_status, county, town_city, postcode
) VALUES
  (4001, 1001, @cat_veg, 'Fresh Tomato Grade A', 'Field sorted red tomatoes, ready for wholesale.', 'kg', 24.00, 1800.00, 50.00, 1, '2026-03-20', '2026-03-26', '2026-04-15', 'active', 'Anantapur', 'Dharmavaram', '515671'),
  (4002, 1002, @cat_fruits, 'Banana Robusta', 'Uniform export-quality bunches.', 'kg', 32.00, 2200.00, 40.00, 0, '2026-03-22', '2026-03-27', '2026-04-20', 'active', 'Guntur', 'Tenali', '522201'),
  (4003, 1003, @cat_pulses, 'Toor Dal Raw', 'Cleaned raw toor suitable for milling.', 'kg', 92.00, 900.00, 30.00, 1, '2026-03-18', '2026-03-25', '2026-04-18', 'active', 'Warangal', 'Hanamkonda', '506001'),
  (4004, 1004, @cat_grains, 'Premium Wheat', 'Low moisture grain, bulk lots available.', 'kg', 36.00, 3000.00, 100.00, 0, '2026-03-15', '2026-03-24', '2026-05-01', 'active', 'Nashik', 'Sinnar', '422103'),
  (4005, 1005, @cat_spices, 'Turmeric Finger', 'Sun dried, high curcumin lot.', 'kg', 118.00, 650.00, 25.00, 1, '2026-03-10', '2026-03-23', '2026-04-25', 'active', 'Mysuru', 'Nanjangud', '571301')
ON DUPLICATE KEY UPDATE
  price_per_unit = VALUES(price_per_unit),
  quantity_available = VALUES(quantity_available),
  listing_status = VALUES(listing_status),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- listing_images (5)
-- ==================================
INSERT INTO listing_images (
  id, listing_id, image_url, is_primary, sort_order
) VALUES
  (5001, 4001, 'https://images.unsplash.com/photo-1546470427-e5ac89cd0b6d', 1, 1),
  (5002, 4002, 'https://images.unsplash.com/photo-1603833665858-e61d17a86224', 1, 1),
  (5003, 4003, 'https://images.unsplash.com/photo-1601050690597-df0568f70950', 1, 1),
  (5004, 4004, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b', 1, 1),
  (5005, 4005, 'https://images.unsplash.com/photo-1615485925873-9f4b0fd6d03d', 1, 1)
ON DUPLICATE KEY UPDATE
  image_url = VALUES(image_url),
  is_primary = VALUES(is_primary),
  sort_order = VALUES(sort_order);

-- ==================================
-- carts (5)
-- ==================================
INSERT INTO carts (
  id, buyer_id, status
) VALUES
  (6001, 1006, 'active'),
  (6002, 1007, 'active'),
  (6003, 1008, 'active'),
  (6004, 1009, 'active'),
  (6005, 1010, 'active')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- cart_items (5)
-- ==================================
INSERT INTO cart_items (
  id, cart_id, listing_id, quantity, unit_price
) VALUES
  (7001, 6001, 4001, 120.00, 24.00),
  (7002, 6002, 4002, 180.00, 32.00),
  (7003, 6003, 4003, 90.00, 92.00),
  (7004, 6004, 4004, 300.00, 36.00),
  (7005, 6005, 4005, 70.00, 118.00)
ON DUPLICATE KEY UPDATE
  quantity = VALUES(quantity),
  unit_price = VALUES(unit_price),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- orders (5)
-- ==================================
INSERT INTO orders (
  id, order_number, buyer_id, grower_id, subtotal_amount, delivery_fee, tax_amount, total_amount,
  payment_method, payment_status, order_status, notes, placed_at
) VALUES
  (8001, 'AGD-202603-0001', 1006, 1001, 2880.00, 250.00, 0.00, 3130.00, 'net_banking', 'paid', 'delivered', 'Urgent stock refill.', '2026-03-24 09:20:00'),
  (8002, 'AGD-202603-0002', 1007, 1002, 5760.00, 300.00, 0.00, 6060.00, 'upi', 'paid', 'in_transit', 'Handle with care.', '2026-03-25 10:05:00'),
  (8003, 'AGD-202603-0003', 1008, 1003, 8280.00, 350.00, 0.00, 8630.00, 'card', 'pending', 'accepted', 'Partial split allowed.', '2026-03-26 11:45:00'),
  (8004, 'AGD-202603-0004', 1009, 1004, 10800.00, 400.00, 0.00, 11200.00, 'upi', 'paid', 'packed', 'Deliver at back gate.', '2026-03-27 08:15:00'),
  (8005, 'AGD-202603-0005', 1010, 1005, 8260.00, 280.00, 0.00, 8540.00, 'net_banking', 'pending', 'placed', 'Need invoice copy.', '2026-03-27 16:40:00')
ON DUPLICATE KEY UPDATE
  subtotal_amount = VALUES(subtotal_amount),
  total_amount = VALUES(total_amount),
  payment_status = VALUES(payment_status),
  order_status = VALUES(order_status),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- order_items (5)
-- ==================================
INSERT INTO order_items (
  id, order_id, listing_id, product_title, unit, quantity, unit_price, line_total
) VALUES
  (9001, 8001, 4001, 'Fresh Tomato Grade A', 'kg', 120.00, 24.00, 2880.00),
  (9002, 8002, 4002, 'Banana Robusta', 'kg', 180.00, 32.00, 5760.00),
  (9003, 8003, 4003, 'Toor Dal Raw', 'kg', 90.00, 92.00, 8280.00),
  (9004, 8004, 4004, 'Premium Wheat', 'kg', 300.00, 36.00, 10800.00),
  (9005, 8005, 4005, 'Turmeric Finger', 'kg', 70.00, 118.00, 8260.00)
ON DUPLICATE KEY UPDATE
  quantity = VALUES(quantity),
  unit_price = VALUES(unit_price),
  line_total = VALUES(line_total);

-- ==================================
-- payments (5)
-- ==================================
INSERT INTO payments (
  id, order_id, transaction_ref, provider, amount, payment_method, payment_status, paid_at, failure_reason
) VALUES
  (10001, 8001, 'TXN-AGD-8001', 'Razorpay', 3130.00, 'net_banking', 'success', '2026-03-24 09:26:00', NULL),
  (10002, 8002, 'TXN-AGD-8002', 'PhonePe', 6060.00, 'upi', 'success', '2026-03-25 10:12:00', NULL),
  (10003, 8003, 'TXN-AGD-8003', 'Stripe', 8630.00, 'card', 'initiated', NULL, NULL),
  (10004, 8004, 'TXN-AGD-8004', 'GooglePay', 11200.00, 'upi', 'success', '2026-03-27 08:20:00', NULL),
  (10005, 8005, 'TXN-AGD-8005', 'Razorpay', 8540.00, 'net_banking', 'initiated', NULL, NULL)
ON DUPLICATE KEY UPDATE
  amount = VALUES(amount),
  payment_status = VALUES(payment_status),
  paid_at = VALUES(paid_at),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- shipments (5)
-- ==================================
INSERT INTO shipments (
  id, order_id, courier_name, tracking_number, shipment_status, estimated_delivery, delivered_at, current_location
) VALUES
  (11001, 8001, 'Delhivery', 'DLV-8001', 'delivered', '2026-03-25 14:00:00', '2026-03-25 13:25:00', 'Delivered - Kukatpally'),
  (11002, 8002, 'BlueDart', 'BLD-8002', 'in_transit', '2026-03-29 11:00:00', NULL, 'On route to Bengaluru'),
  (11003, 8003, 'EcomExpress', 'ECM-8003', 'assigned', '2026-03-31 18:00:00', NULL, 'Pickup assigned'),
  (11004, 8004, 'XpressBees', 'XPB-8004', 'picked', '2026-03-30 16:00:00', NULL, 'Picked from Sinnar'),
  (11005, 8005, 'Delhivery', 'DLV-8005', 'pending', '2026-04-01 12:00:00', NULL, 'Awaiting pickup')
ON DUPLICATE KEY UPDATE
  shipment_status = VALUES(shipment_status),
  estimated_delivery = VALUES(estimated_delivery),
  current_location = VALUES(current_location),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- shipment_events (5)
-- ==================================
INSERT INTO shipment_events (
  id, shipment_id, event_status, event_note, event_time
) VALUES
  (12001, 11001, 'Delivered', 'Consignee received in good condition.', '2026-03-25 13:25:00'),
  (12002, 11002, 'In Transit', 'Shipment departed Hyderabad hub.', '2026-03-27 21:15:00'),
  (12003, 11003, 'Assigned', 'Delivery partner assigned for pickup.', '2026-03-27 18:05:00'),
  (12004, 11004, 'Picked', 'Material picked from grower location.', '2026-03-28 07:40:00'),
  (12005, 11005, 'Pending', 'Pickup pending due to slot request.', '2026-03-28 09:10:00')
ON DUPLICATE KEY UPDATE
  event_status = VALUES(event_status),
  event_note = VALUES(event_note),
  event_time = VALUES(event_time);

-- ==================================
-- reviews (5)
-- ==================================
INSERT INTO reviews (
  id, order_id, buyer_id, grower_id, rating, review_text
) VALUES
  (13001, 8001, 1006, 1001, 5, 'Tomatoes were fresh and exactly as described.'),
  (13002, 8002, 1007, 1002, 4, 'Banana quality is good, slight delay in transit.'),
  (13003, 8003, 1008, 1003, 5, 'Clean lot and good moisture control.'),
  (13004, 8004, 1009, 1004, 4, 'Consistent grain quality in this batch.'),
  (13005, 8005, 1010, 1005, 5, 'Great turmeric quality and color.')
ON DUPLICATE KEY UPDATE
  rating = VALUES(rating),
  review_text = VALUES(review_text),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- support_tickets (5)
-- ==================================
INSERT INTO support_tickets (
  id, ticket_number, user_id, subject, description, status, priority
) VALUES
  (14001, 'SUP-2026-0001', 1006, 'Invoice Copy Required', 'Need GST invoice PDF for order AGD-202603-0001.', 'resolved', 'medium'),
  (14002, 'SUP-2026-0002', 1007, 'Delivery ETA Update', 'Need updated ETA for BLD-8002.', 'open', 'low'),
  (14003, 'SUP-2026-0003', 1003, 'Listing Visibility', 'My pulse listing is not appearing in search.', 'in_progress', 'medium'),
  (14004, 'SUP-2026-0004', 1004, 'Payment Settlement', 'Payout timeline clarification needed.', 'open', 'high'),
  (14005, 'SUP-2026-0005', 1010, 'Wrong Qty in Cart', 'Cart auto-resets quantity while checkout.', 'closed', 'low')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  priority = VALUES(priority),
  updated_at = CURRENT_TIMESTAMP;

-- ==================================
-- notifications (5)
-- ==================================
INSERT INTO notifications (
  id, user_id, title, message, notification_type, is_read
) VALUES
  (15001, 1001, 'Order Delivered', 'Order AGD-202603-0001 has been delivered successfully.', 'order', 1),
  (15002, 1002, 'Shipment In Transit', 'Order AGD-202603-0002 is now in transit.', 'delivery', 0),
  (15003, 1008, 'Payment Initiated', 'Payment flow started for order AGD-202603-0003.', 'payment', 0),
  (15004, 1009, 'Order Packed', 'Order AGD-202603-0004 has been packed.', 'order', 0),
  (15005, 1010, 'Support Ticket Closed', 'Your support ticket SUP-2026-0005 is closed.', 'system', 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  message = VALUES(message),
  notification_type = VALUES(notification_type),
  is_read = VALUES(is_read);

-- ==================================
-- audit_logs (5)
-- ==================================
INSERT INTO audit_logs (
  id, user_id, action, entity_type, entity_id, metadata
) VALUES
  (16001, 1001, 'CREATE_LISTING', 'produce_listings', 4001, JSON_OBJECT('title', 'Fresh Tomato Grade A', 'unit', 'kg')),
  (16002, 1006, 'PLACE_ORDER', 'orders', 8001, JSON_OBJECT('order_number', 'AGD-202603-0001', 'amount', 3130)),
  (16003, 1002, 'UPDATE_LISTING', 'produce_listings', 4002, JSON_OBJECT('price_per_unit', 32.00)),
  (16004, 1007, 'CREATE_TICKET', 'support_tickets', 14002, JSON_OBJECT('ticket_number', 'SUP-2026-0002')),
  (16005, 1005, 'SHIPMENT_STATUS_CHANGE', 'shipments', 11005, JSON_OBJECT('from', 'pending', 'to', 'pending'))
ON DUPLICATE KEY UPDATE
  action = VALUES(action),
  entity_type = VALUES(entity_type),
  entity_id = VALUES(entity_id),
  metadata = VALUES(metadata);

