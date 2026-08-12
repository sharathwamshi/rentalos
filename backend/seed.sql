-- ============================================================
-- RentalOS default data
-- Run this AFTER schema.sql has created the tables.
--
-- In phpMyAdmin: select the rental_saas database -> Import tab -> choose this file -> Go.
--
-- Creates:
--   1) Three subscription plans (Starter / Standard / Premium)
--   2) One default Super Admin login:
--        email:    admin@rentalos.app
--        password: Admin@12345
--      CHANGE THIS PASSWORD after your first login.
-- ============================================================

INSERT INTO subscription_plans (name, price_per_month, room_limit, multi_property, features, is_active)
SELECT * FROM (
    SELECT
        'Starter' AS c_name,
        20.00 AS c_price,
        5 AS c_room_limit,
        0 AS c_multi_property,
        '["Up to 5 rooms", "Tenant management", "Basic invoicing", "Email support"]' AS c_features,
        1 AS c_is_active
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Starter');

INSERT INTO subscription_plans (name, price_per_month, room_limit, multi_property, features, is_active)
SELECT * FROM (
    SELECT
        'Standard' AS c_name,
        50.00 AS c_price,
        25 AS c_room_limit,
        0 AS c_multi_property,
        '["Up to 25 rooms", "Rental agreements & PDF", "Automated reminders", "Reports & analytics", "Priority email support"]' AS c_features,
        1 AS c_is_active
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Standard');

INSERT INTO subscription_plans (name, price_per_month, room_limit, multi_property, features, is_active)
SELECT * FROM (
    SELECT
        'Premium' AS c_name,
        100.00 AS c_price,
        NULL AS c_room_limit,
        1 AS c_multi_property,
        '["Unlimited rooms", "Multi-property dashboard", "Advanced reports", "Tenant announcements", "Dedicated support", "Online payments", "WhatsApp/Telegram alerts"]' AS c_features,
        1 AS c_is_active
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Premium');

-- Default Super Admin
-- email:    admin@rentalos.app
-- password: Admin@12345   (bcrypt hash below matches this exactly)
INSERT INTO users (role, full_name, email, password_hash, phone, is_active, created_at, updated_at)
SELECT * FROM (
    SELECT
        'admin' AS c_role,
        'Super Admin' AS c_full_name,
        'admin@rentalos.app' AS c_email,
        '$2b$12$jGTRSRBSAAEIseZF4ZAcQe/.aKxGC19rLx0FIY78Dis8kItLXfA7q' AS c_password_hash,
        '' AS c_phone,
        1 AS c_is_active,
        NOW() AS c_created_at,
        NOW() AS c_updated_at
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@rentalos.app');
