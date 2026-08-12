-- ============================================================
-- RentalOS DEMO DATA
-- 5 owners, 10 tenants, properties, rooms, assignments,
-- agreements, invoices, payments, maintenance tickets, vacate
-- requests, messages, notifications, reminder rules, documents,
-- and subscription billing history -- every feature has data to
-- demo against.
--
-- Run this AFTER schema.sql has created the tables, on a FRESH
-- (empty) database -- in phpMyAdmin: select the rental_saas
-- database -> Import tab -> choose this file -> Go.
--
-- LOGINS (all use the same password unless noted):
--   Super Admin : admin@rentalos.app     / Admin@12345
--   Owners      : owner1@rentalos.app ... owner5@rentalos.app  / Demo@12345
--   Tenants     : tenant1@rentalos.app ... tenant10@rentalos.app / Demo@12345
-- ============================================================

SET FOREIGN_KEY_CHECKS=0;

-- ---- subscription_plans (3 rows) ----
INSERT INTO `subscription_plans` (`id`, `name`, `price_per_month`, `room_limit`, `multi_property`, `features`, `is_active`) VALUES
  (1, 'Starter', 20.00, 5, 0, '["Up to 5 rooms", "Tenant management", "Basic invoicing", "Email support"]', 1),
  (2, 'Standard', 50.00, 25, 0, '["Up to 25 rooms", "Rental agreements & PDF", "Automated reminders", "Reports & analytics", "Priority email support"]', 1),
  (3, 'Premium', 100.00, NULL, 1, '["Unlimited rooms", "Multi-property dashboard", "Advanced reports", "Tenant announcements", "Dedicated support", "Online payments", "WhatsApp/Telegram alerts"]', 1);

-- ---- users (16 rows) ----
INSERT INTO `users` (`id`, `role`, `full_name`, `email`, `password_hash`, `phone`, `photo_url`, `is_active`, `created_at`, `updated_at`, `reset_token`, `reset_token_expires`) VALUES
  (1, 'admin', 'Super Admin', 'admin@rentalos.app', '$2b$12$jGTRSRBSAAEIseZF4ZAcQe/.aKxGC19rLx0FIY78Dis8kItLXfA7q', '', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (2, 'owner', 'Ramesh Kumar', 'owner1@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 98450 11111', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (3, 'owner', 'Priya Sharma', 'owner2@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 98450 22222', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (4, 'owner', 'Arjun Reddy', 'owner3@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 98450 33333', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (5, 'owner', 'Lakshmi Iyer', 'owner4@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 98450 44444', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (6, 'owner', 'Vikram Singh', 'owner5@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 98450 55555', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (7, 'tenant', 'Anitha Rao', 'tenant1@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 90001 00001', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (8, 'tenant', 'Suresh Babu', 'tenant2@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 90001 00002', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (9, 'tenant', 'Divya Menon', 'tenant3@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 90001 00003', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (10, 'tenant', 'Rahul Nair', 'tenant4@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 90001 00004', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (11, 'tenant', 'Kavya Pillai', 'tenant5@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 90001 00005', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (12, 'tenant', 'Manoj Gupta', 'tenant6@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 90001 00006', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (13, 'tenant', 'Sneha Krishnan', 'tenant7@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 90001 00007', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (14, 'tenant', 'Arun Prasad', 'tenant8@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 90001 00008', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (15, 'tenant', 'Pooja Bhat', 'tenant9@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 90001 00009', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL),
  (16, 'tenant', 'Karthik Raja', 'tenant10@rentalos.app', '$2b$12$hcr7IEexupHjnpLh6nTVbeO9auh8QjKbnxmxtypGAJUHg6C14NeFq', '+91 90001 00010', NULL, 1, '2026-08-08 03:11:24', '2026-08-08 03:11:24', NULL, NULL);

-- ---- notifications (17 rows) ----
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `body`, `is_read`, `created_at`, `sent_sms`, `sent_whatsapp`, `sent_telegram`, `sent_email`) VALUES
  (1, 8, 'PAYMENT_OVERDUE', 'Payment overdue alert', 'Invoice INV-20260701-0002 is overdue. Please clear payment at the earliest.', 0, '2026-08-03 00:00:00', 0, 1, 0, 0),
  (2, 8, 'RENT_DUE', 'Rent due reminder', 'Invoice INV-20260801-0002 is due on 05 Aug 2026.', 0, '2026-08-05 00:00:00', 0, 1, 0, 0),
  (3, 12, 'PAYMENT_OVERDUE', 'Payment overdue alert', 'Invoice INV-20260701-0006 is overdue. Please clear payment at the earliest.', 0, '2026-08-02 00:00:00', 1, 1, 0, 0),
  (4, 12, 'VACATE_UPDATE', 'Vacate request update', 'Your vacate request has been approved.', 1, '2026-08-02 00:00:00', 0, 1, 0, 0),
  (5, 14, 'VACATE_UPDATE', 'Vacate request update', 'Your vacate request has been rejected.', 1, '2026-08-04 00:00:00', 0, 1, 0, 0),
  (6, 9, 'TICKET_UPDATE', 'Maintenance update: WiFi router issue', 'Your request is now marked \'open\'.', 0, '2026-08-07 00:00:00', 0, 1, 0, 0),
  (7, 16, 'TICKET_UPDATE', 'Maintenance update: Intercom not working', 'Your request is now marked \'open\'.', 0, '2026-08-06 00:00:00', 0, 1, 0, 0),
  (8, 11, 'AGREEMENT_RENEWAL', 'Lease renewal proposed', 'Your owner proposed a renewal at Rs.23000/month. Please review and respond.', 0, '2026-08-01 00:00:00', 0, 1, 1, 0),
  (9, 7, 'MESSAGE', 'New message from your owner', 'Sure, I\'ve generated it — you can download it from Invoices & Billing.', 1, '2026-06-09 00:00:00', 0, 0, 0, 0),
  (10, 2, 'MAINTENANCE_TICKET', 'New maintenance request: Water leakage in bathroom', 'Suresh Babu raised a high priority ticket for 102.', 0, '2026-08-05 00:00:00', 0, 1, 0, 0),
  (11, 2, 'VACATE_REQUEST', 'Vacate notice received', 'Suresh Babu intends to vacate 102 on 2026-09-30.', 0, '2026-08-06 00:00:00', 0, 1, 0, 0),
  (12, 3, 'MAINTENANCE_TICKET', 'New maintenance request: WiFi router issue', 'Divya Menon raised a low priority ticket for 201.', 0, '2026-08-07 00:00:00', 0, 1, 0, 0),
  (13, 3, 'PAYMENT_RECEIVED', 'Rent received online', 'Divya Menon paid Rs.27700 for INV-20260701-0003 via Razorpay.', 1, '2026-07-05 00:00:00', 0, 1, 0, 0),
  (14, 4, 'MAINTENANCE_TICKET', 'New maintenance request: Geyser not working', 'Manoj Gupta raised an urgent priority ticket for 102.', 0, '2026-08-08 00:00:00', 0, 1, 1, 0),
  (15, 5, 'VACATE_REQUEST', 'Vacate notice received', 'Arun Prasad intends to vacate 102 on 2026-08-31.', 1, '2026-08-03 00:00:00', 0, 1, 0, 0),
  (16, 6, 'MESSAGE', 'New message from tenant', 'Raised a ticket for the intercom, just flagging it here too since it\'s been a couple of days.', 0, '2026-08-06 00:00:00', 0, 1, 0, 0),
  (17, 6, 'MAINTENANCE_TICKET', 'New maintenance request: Intercom not working', 'Karthik Raja raised a medium priority ticket for 102.', 1, '2026-08-06 00:00:00', 0, 1, 0, 0);

-- ---- owner_profiles (5 rows) ----
INSERT INTO `owner_profiles` (`id`, `user_id`, `company_name`, `gst_number`, `plan_id`, `subscription_status`, `subscription_renews_at`, `telegram_chat_id`) VALUES
  (1, 2, 'Kumar Properties', '29AAAAA0002A1Z5', 2, 'active', '2026-08-20', '500002'),
  (2, 3, 'Sharma Residency', '29AAAAA0003A1Z5', 3, 'active', '2026-08-16', '500003'),
  (3, 4, 'Reddy Estates', '29AAAAA0004A1Z5', 1, 'trialing', NULL, NULL),
  (4, 5, 'Iyer Homes', '29AAAAA0005A1Z5', 2, 'active', '2026-08-28', '500005'),
  (5, 6, 'Singh Properties', '29AAAAA0006A1Z5', 3, 'past_due', '2026-08-05', NULL);

-- ---- tenant_profiles (10 rows) ----
INSERT INTO `tenant_profiles` (`id`, `user_id`, `age`, `father_name`, `occupation`, `company_name`, `gst_number`, `pan_number`, `pan_upload_url`, `current_address`, `permanent_address`, `id_proof_type`, `id_proof_number`, `id_proof_upload_url`, `police_verification`, `police_verification_upload_url`, `emergency_contact_name`, `emergency_contact_phone`, `telegram_chat_id`) VALUES
  (1, 7, 29, 'Ramaswamy Rao', 'Software Engineer', 'Infotech Solutions', NULL, NULL, NULL, '12, 4th Cross, Koramangala, Bengaluru', '12, 4th Cross, Koramangala, Bengaluru', 'Aadhaar', '4512 7788 9932', NULL, 1, NULL, 'Ramaswamy Rao', '+91 90001 90001', '600007'),
  (2, 8, 34, 'Babu Nataraj', 'Accountant', 'Nataraj & Co', NULL, NULL, NULL, 'Whitefield, Bengaluru', 'Native place: Mysuru', 'PAN', 'BXPPS1234K', NULL, 1, NULL, 'Babu Nataraj', '+91 90001 90002', '600008'),
  (3, 9, 26, 'Krishnan Menon', 'UX Designer', 'PixelCraft Studio', NULL, NULL, NULL, 'Indiranagar, Bengaluru', 'Kochi, Kerala', 'Aadhaar', '3321 5544 7789', NULL, 1, NULL, 'Krishnan Menon', '+91 90001 90003', '600009'),
  (4, 10, 31, 'Suresh Nair', 'Product Manager', 'Bright Apps', NULL, NULL, NULL, 'HSR Layout, Bengaluru', 'Thrissur, Kerala', 'Passport', 'N1234567', NULL, 0, NULL, 'Suresh Nair', '+91 90001 90004', NULL),
  (5, 11, 28, 'Mohan Pillai', 'Data Analyst', 'InsightWorks', NULL, NULL, NULL, 'Gachibowli, Hyderabad', 'Trivandrum, Kerala', 'Aadhaar', '5567 8899 1122', NULL, 1, NULL, 'Mohan Pillai', '+91 90001 90005', '600011'),
  (6, 12, 37, 'Ramesh Gupta', 'Sales Manager', 'MarketMax India', NULL, NULL, NULL, 'Gachibowli, Hyderabad', 'Jaipur, Rajasthan', 'Voter ID', 'HYD9988776', NULL, 0, NULL, 'Ramesh Gupta', '+91 90001 90006', NULL),
  (7, 13, 25, 'Krishnan Iyer', 'Research Associate', 'MedLife Labs', NULL, NULL, NULL, 'Adyar, Chennai', 'Coimbatore, Tamil Nadu', 'Aadhaar', '6678 9911 2233', NULL, 1, NULL, 'Krishnan Iyer', '+91 90001 90007', '600013'),
  (8, 14, 30, 'Prasad Venkat', 'Civil Engineer', 'BuildRight Infra', NULL, NULL, NULL, 'Adyar, Chennai', 'Madurai, Tamil Nadu', 'PAN', 'AZPPA5566L', NULL, 0, NULL, 'Prasad Venkat', '+91 90001 90008', NULL),
  (9, 15, 27, 'Suresh Bhat', 'Marketing Executive', 'AdWave Media', NULL, NULL, NULL, 'Andheri West, Mumbai', 'Udupi, Karnataka', 'Aadhaar', '7789 2233 4455', NULL, 1, NULL, 'Suresh Bhat', '+91 90001 90009', '600015'),
  (10, 16, 33, 'Raja Subramaniam', 'IT Consultant', 'NexGen Systems', NULL, NULL, NULL, 'Andheri West, Mumbai', 'Salem, Tamil Nadu', 'Aadhaar', '8890 3344 5566', NULL, 1, NULL, 'Raja Subramaniam', '+91 90001 90010', '600016');

-- ---- documents (5 rows) ----
INSERT INTO `documents` (`id`, `owner_id`, `tenant_id`, `category`, `title`, `file_url`, `uploaded_by_user_id`, `created_at`) VALUES
  (1, 1, 1, 'id_proof', 'Anitha Rao — Aadhaar copy', '/uploads/id_proof/anitha_aadhaar.pdf', 2, '2026-08-08 03:11:24'),
  (2, 1, 2, 'police_verification', 'Suresh Babu — Police verification pending', '/uploads/police/suresh_pending.pdf', 2, '2026-08-08 03:11:24'),
  (3, 3, 5, 'id_proof', 'Kavya Pillai — Aadhaar copy', '/uploads/id_proof/kavya_aadhaar.pdf', 4, '2026-08-08 03:11:24'),
  (4, 5, 9, 'id_proof', 'Pooja Bhat — Aadhaar copy', '/uploads/id_proof/pooja_aadhaar.pdf', 6, '2026-08-08 03:11:24'),
  (5, 2, 3, 'agreement', 'Divya Menon — Signed agreement scan', '/uploads/agreements/divya_scan.pdf', 3, '2026-08-08 03:11:24');

-- ---- message_threads (4 rows) ----
INSERT INTO `message_threads` (`id`, `owner_id`, `tenant_id`, `subject`, `created_at`, `last_message_at`) VALUES
  (1, 1, 1, 'Rent receipt query', '2026-08-08 03:11:24', '2026-06-05 10:30:00'),
  (2, 2, 4, 'Parking space', '2026-08-08 03:11:24', '2026-07-15 19:10:00'),
  (3, 3, 5, 'Renewal terms', '2026-08-08 03:11:24', '2026-08-01 15:45:00'),
  (4, 5, 10, 'Intercom issue', '2026-08-08 03:11:24', '2026-08-06 12:20:00');

-- ---- properties (6 rows) ----
INSERT INTO `properties` (`id`, `owner_id`, `name`, `property_type`, `location`, `created_at`) VALUES
  (1, 1, 'Kumar Residency', 'Residential', 'Koramangala, Bengaluru', '2026-08-08 03:11:24'),
  (2, 2, 'Sharma Towers', 'Residential', 'Indiranagar, Bengaluru', '2026-08-08 03:11:24'),
  (3, 2, 'Sharma Annex', 'Residential', 'HSR Layout, Bengaluru', '2026-08-08 03:11:24'),
  (4, 3, 'Reddy Enclave', 'Residential', 'Gachibowli, Hyderabad', '2026-08-08 03:11:24'),
  (5, 4, 'Iyer Nest', 'Residential', 'Adyar, Chennai', '2026-08-08 03:11:24'),
  (6, 5, 'Singh Heights', 'Residential', 'Andheri West, Mumbai', '2026-08-08 03:11:24');

-- ---- reminder_rules (5 rows) ----
INSERT INTO `reminder_rules` (`id`, `owner_id`, `days_before_due`, `days_after_due_for_overdue`, `channel_sms`, `channel_whatsapp`, `channel_telegram`, `channel_inapp`, `late_fee_flat`, `late_fee_pct`) VALUES
  (1, 1, 3, 1, 0, 1, 0, 1, 200.00, 0.00),
  (2, 2, 5, 2, 1, 1, 1, 1, 0.00, 2.00),
  (3, 3, 3, 1, 0, 0, 0, 1, 0.00, 0.00),
  (4, 4, 4, 1, 0, 1, 1, 1, 150.00, 0.00),
  (5, 5, 2, 1, 1, 1, 1, 1, 500.00, 1.50);

-- ---- subscription_invoices (6 rows) ----
INSERT INTO `subscription_invoices` (`id`, `owner_id`, `plan_id`, `amount`, `period_start`, `period_end`, `status`, `gateway_payment_id`, `created_at`) VALUES
  (1, 1, 2, 50.00, '2026-06-01', '2026-06-30', 'paid', 'pay_sub_1001', '2026-08-08 03:11:24'),
  (2, 1, 2, 50.00, '2026-07-01', '2026-07-31', 'paid', 'pay_sub_1002', '2026-08-08 03:11:24'),
  (3, 2, 3, 100.00, '2026-06-01', '2026-06-30', 'paid', 'pay_sub_2001', '2026-08-08 03:11:24'),
  (4, 2, 3, 100.00, '2026-07-01', '2026-07-31', 'paid', 'pay_sub_2002', '2026-08-08 03:11:24'),
  (5, 4, 2, 50.00, '2026-07-01', '2026-07-31', 'paid', 'pay_sub_4001', '2026-08-08 03:11:24'),
  (6, 5, 3, 100.00, '2026-07-01', '2026-07-31', 'failed', NULL, '2026-08-08 03:11:24');

-- ---- messages (8 rows) ----
INSERT INTO `messages` (`id`, `thread_id`, `sender_user_id`, `body`, `is_read`, `created_at`) VALUES
  (1, 1, 7, 'Hi, could you share the receipt for June\'s rent payment?', 1, '2026-06-05 09:00:00'),
  (2, 1, 2, 'Sure, I\'ve generated it — you can download it from Invoices & Billing.', 1, '2026-06-05 10:30:00'),
  (3, 2, 10, 'Is there a dedicated parking spot available for my car?', 1, '2026-07-15 18:00:00'),
  (4, 2, 3, 'Yes, spot B-12 in the basement is assigned to unit 301.', 1, '2026-07-15 19:10:00'),
  (5, 3, 4, 'Hi Kavya, I\'d like to propose renewing your lease at Rs.23,000/month starting September. Let me know your thoughts.', 1, '2026-08-01 11:00:00'),
  (6, 3, 11, 'Thanks for the heads up, I\'ll review the renewal request and get back to you shortly.', 1, '2026-08-01 15:45:00'),
  (7, 4, 16, 'Raised a ticket for the intercom, just flagging it here too since it\'s been a couple of days.', 1, '2026-08-06 08:00:00'),
  (8, 4, 6, 'Got it, electrician is booked for tomorrow morning.', 1, '2026-08-06 12:20:00');

-- ---- rooms (22 rows) ----
INSERT INTO `rooms` (`id`, `property_id`, `unit_number`, `rent_type`, `unit_type`, `floor`, `monthly_rent`, `advance_amount`, `electricity_charge`, `water_charge`, `maintenance_charge`, `bhk_1`, `bhk_2`, `bhk_3`, `bhk_4`, `amenities`, `status`, `notes`, `created_at`) VALUES
  (1, 1, '101', 'Rent', '1BHK', '1', 14000.00, 28000.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": true, "ups_battery": true, "chimney": false}', 'occupied', NULL, '2026-08-08 03:11:24'),
  (2, 1, '102', 'Rent', '1BHK', '1', 13500.00, 27000.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'occupied', NULL, '2026-08-08 03:11:24'),
  (3, 1, '103', 'Rent', 'Studio', '2', 11000.00, 22000.00, 300.00, 150.00, 400.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'vacant', NULL, '2026-08-08 03:11:24'),
  (4, 1, '104', 'Rent', '1BHK', '2', 14000.00, 28000.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": true, "ups_battery": true, "chimney": false}', 'vacant', 'Previously occupied by Anitha Rao; vacated after lease end.', '2026-08-08 03:11:24'),
  (5, 2, '201', 'Rent', '2BHK', '2', 26000.00, 52000.00, 600.00, 300.00, 800.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": true, "ups_battery": true, "chimney": false}', 'occupied', NULL, '2026-08-08 03:11:24'),
  (6, 2, '202', 'Rent', '2BHK', '2', 26000.00, 52000.00, 600.00, 300.00, 800.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": true, "ups_battery": true, "chimney": false}', 'vacant', NULL, '2026-08-08 03:11:24'),
  (7, 2, '203', 'Rent', '1BHK', '3', 17000.00, 34000.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'maintenance', 'Bathroom re-tiling in progress.', '2026-08-08 03:11:24'),
  (8, 2, '204', 'Rent', '1BHK', '3', 17000.00, 34000.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'vacant', NULL, '2026-08-08 03:11:24'),
  (9, 3, '301', 'Rent', '1BHK', '3', 19500.00, 39000.00, 450.00, 220.00, 600.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": true, "ups_battery": true, "chimney": false}', 'occupied', NULL, '2026-08-08 03:11:24'),
  (10, 3, '302', 'Rent', '1BHK', '3', 19500.00, 39000.00, 450.00, 220.00, 600.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'vacant', NULL, '2026-08-08 03:11:24'),
  (11, 4, '101', 'Rent', '2BHK', '1', 21000.00, 42000.00, 500.00, 250.00, 700.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": true, "ups_battery": true, "chimney": false}', 'close_to_expire', NULL, '2026-08-08 03:11:24'),
  (12, 4, '102', 'Rent', '1BHK', '1', 15500.00, 31000.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'occupied', NULL, '2026-08-08 03:11:24'),
  (13, 4, '103', 'Rent', '1BHK', '2', 15500.00, 31000.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'vacant', NULL, '2026-08-08 03:11:24'),
  (14, 5, '101', 'Rent', '2BHK', '1', 23000.00, 46000.00, 550.00, 280.00, 750.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": true, "ups_battery": true, "chimney": false}', 'occupied', NULL, '2026-08-08 03:11:24'),
  (15, 5, '102', 'Rent', '1BHK', '2', 16500.00, 33000.00, 400.00, 200.00, 550.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'occupied', NULL, '2026-08-08 03:11:24'),
  (16, 5, '103', 'Rent', '1BHK', '2', 16500.00, 33000.00, 400.00, 200.00, 550.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'vacant', NULL, '2026-08-08 03:11:24'),
  (17, 5, '104', 'Rent', 'Studio', '3', 12500.00, 25000.00, 300.00, 150.00, 400.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'maintenance', 'Electrical rewiring scheduled.', '2026-08-08 03:11:24'),
  (18, 6, '101', 'Rent', '2BHK', '3', 38000.00, 76000.00, 800.00, 400.00, 1200.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": true, "ups_battery": true, "chimney": false}', 'occupied', NULL, '2026-08-08 03:11:24'),
  (19, 6, '102', 'Rent', '1BHK', '4', 26000.00, 52000.00, 600.00, 300.00, 900.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": true, "ups_battery": true, "chimney": false}', 'occupied', NULL, '2026-08-08 03:11:24'),
  (20, 6, '103', 'Rent', '1BHK', '4', 26000.00, 52000.00, 600.00, 300.00, 900.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'vacant', NULL, '2026-08-08 03:11:24'),
  (21, 6, '104', 'Rent', 'Studio', '5', 19000.00, 38000.00, 500.00, 250.00, 700.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'vacant', NULL, '2026-08-08 03:11:24'),
  (22, 6, '105', 'Rent', '1BHK', '5', 26000.00, 52000.00, 600.00, 300.00, 900.00, 0.00, 0.00, 0.00, 0.00, '{"fan": true, "light": true, "geyser": false, "ups_battery": false, "chimney": false}', 'maintenance', 'Fresh paint & deep clean before next tenant.', '2026-08-08 03:11:24');

-- ---- agreements (11 rows) ----
INSERT INTO `agreements` (`id`, `agreement_number`, `room_id`, `tenant_id`, `owner_id`, `rent_type`, `monthly_rent`, `security_deposit`, `start_date`, `end_date`, `next_billing_date`, `status`, `auto_renew_pct`, `pdf_url`, `tenant_signed_at`, `tenant_signature_name`, `owner_signed_at`, `owner_signature_name`, `created_at`) VALUES
  (1, 'AGM-20250301-0001', 4, 1, 1, 'Rent', 13500.00, 27000.00, '2025-03-01', '2026-01-31', NULL, 'expired', 10.00, NULL, '2025-03-01 06:00:00', 'Anitha Rao', '2025-03-01 00:00:00', 'Ramesh Kumar', '2026-08-08 03:11:24'),
  (2, 'AGM-20260701-0001', 1, 1, 1, 'Rent', 14000.00, 28000.00, '2026-07-01', '2027-06-01', NULL, 'active', 10.00, NULL, '2026-07-01 06:00:00', 'Anitha Rao', '2026-07-01 00:00:00', 'Ramesh Kumar', '2026-08-08 03:11:24'),
  (3, 'AGM-20260415-0001', 2, 2, 1, 'Rent', 13500.00, 27000.00, '2026-04-15', '2027-03-15', NULL, 'active', 10.00, NULL, NULL, NULL, '2026-04-15 00:00:00', 'Ramesh Kumar', '2026-08-08 03:11:24'),
  (4, 'AGM-20260201-0001', 5, 3, 2, 'Rent', 26000.00, 52000.00, '2026-02-01', '2027-01-01', NULL, 'active', 10.00, NULL, '2026-02-01 06:00:00', 'Divya Menon', '2026-02-01 00:00:00', 'Priya Sharma', '2026-08-08 03:11:24'),
  (5, 'AGM-20260510-0001', 9, 4, 2, 'Rent', 19500.00, 39000.00, '2026-05-10', '2027-04-10', NULL, 'active', 10.00, NULL, NULL, NULL, '2026-05-10 00:00:00', 'Priya Sharma', '2026-08-08 03:11:24'),
  (6, 'AGM-20250901-0001', 11, 5, 3, 'Rent', 21000.00, 42000.00, '2025-09-01', '2026-08-31', NULL, 'active', 10.00, NULL, '2025-09-01 06:00:00', 'Kavya Pillai', '2025-09-01 00:00:00', 'Arjun Reddy', '2026-08-08 03:11:24'),
  (7, 'AGM-20260120-0001', 12, 6, 3, 'Rent', 15500.00, 31000.00, '2026-01-20', '2026-12-20', NULL, 'active', 10.00, NULL, '2026-01-20 06:00:00', 'Manoj Gupta', '2026-01-20 00:00:00', 'Arjun Reddy', '2026-08-08 03:11:24'),
  (8, 'AGM-20260305-0001', 14, 7, 4, 'Rent', 23000.00, 46000.00, '2026-03-05', '2027-02-05', NULL, 'active', 10.00, NULL, '2026-03-05 06:00:00', 'Sneha Krishnan', '2026-03-05 00:00:00', 'Lakshmi Iyer', '2026-08-08 03:11:24'),
  (9, 'AGM-20260715-0001', 15, 8, 4, 'Rent', 16500.00, 33000.00, '2026-07-15', '2027-06-15', NULL, 'active', 10.00, NULL, NULL, NULL, '2026-07-15 00:00:00', 'Lakshmi Iyer', '2026-08-08 03:11:24'),
  (10, 'AGM-20251101-0001', 18, 9, 5, 'Rent', 38000.00, 76000.00, '2025-11-01', '2026-10-01', NULL, 'active', 10.00, NULL, '2025-11-01 06:00:00', 'Pooja Bhat', '2025-11-01 00:00:00', 'Vikram Singh', '2026-08-08 03:11:24'),
  (11, 'AGM-20260601-0001', 19, 10, 5, 'Rent', 26000.00, 52000.00, '2026-06-01', '2027-05-01', NULL, 'active', 10.00, NULL, '2026-06-01 06:00:00', 'Karthik Raja', '2026-06-01 00:00:00', 'Vikram Singh', '2026-08-08 03:11:24');

-- ---- invoices (26 rows) ----
INSERT INTO `invoices` (`id`, `invoice_number`, `room_id`, `tenant_id`, `owner_id`, `billing_month`, `due_date`, `paid_date`, `rent_type`, `rent`, `electricity`, `water`, `maintenance`, `other_charges`, `late_fee`, `sgst_pct`, `cgst_pct`, `total`, `paid_amount`, `status`, `pdf_url`, `created_at`) VALUES
  (1, 'INV-20260601-0001', 1, 1, 1, 'June 2026', '2026-06-05', '2026-06-04', 'Rent', 14000.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, 15100.00, 15100.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (2, 'INV-20260701-0001', 1, 1, 1, 'July 2026', '2026-07-05', '2026-07-03', 'Rent', 14000.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, 15100.00, 15100.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (3, 'INV-20260801-0001', 1, 1, 1, 'August 2026', '2026-08-05', NULL, 'Rent', 14000.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, 15100.00, 0.00, 'pending', NULL, '2026-08-08 03:11:24'),
  (4, 'INV-20260601-0002', 2, 2, 1, 'June 2026', '2026-06-05', '2026-06-06', 'Rent', 13500.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, 14600.00, 14600.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (5, 'INV-20260701-0002', 2, 2, 1, 'July 2026', '2026-07-05', NULL, 'Rent', 13500.00, 400.00, 200.00, 500.00, 0.00, 270.00, 0.00, 0.00, 14870.00, 0.00, 'overdue', NULL, '2026-08-08 03:11:24'),
  (6, 'INV-20260801-0002', 2, 2, 1, 'August 2026', '2026-08-05', NULL, 'Rent', 13500.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, 14600.00, 0.00, 'pending', NULL, '2026-08-08 03:11:24'),
  (7, 'INV-20260601-0003', 5, 3, 2, 'June 2026', '2026-06-05', '2026-06-02', 'Rent', 26000.00, 600.00, 300.00, 800.00, 0.00, 0.00, 0.00, 0.00, 27700.00, 27700.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (8, 'INV-20260701-0003', 5, 3, 2, 'July 2026', '2026-07-05', '2026-07-04', 'Rent', 26000.00, 600.00, 300.00, 800.00, 0.00, 0.00, 0.00, 0.00, 27700.00, 27700.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (9, 'INV-20260801-0003', 5, 3, 2, 'August 2026', '2026-08-05', NULL, 'Rent', 26000.00, 600.00, 300.00, 800.00, 0.00, 0.00, 0.00, 0.00, 27700.00, 0.00, 'pending', NULL, '2026-08-08 03:11:24'),
  (10, 'INV-20260701-0004', 9, 4, 2, 'July 2026', '2026-07-10', NULL, 'Rent', 19500.00, 450.00, 220.00, 600.00, 0.00, 0.00, 0.00, 0.00, 20770.00, 10000.00, 'partially_paid', NULL, '2026-08-08 03:11:24'),
  (11, 'INV-20260801-0004', 9, 4, 2, 'August 2026', '2026-08-10', NULL, 'Rent', 19500.00, 450.00, 220.00, 600.00, 0.00, 0.00, 0.00, 0.00, 20770.00, 0.00, 'pending', NULL, '2026-08-08 03:11:24'),
  (12, 'INV-20260601-0005', 11, 5, 3, 'June 2026', '2026-06-01', '2026-05-30', 'Rent', 21000.00, 500.00, 250.00, 700.00, 0.00, 0.00, 0.00, 0.00, 22450.00, 22450.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (13, 'INV-20260701-0005', 11, 5, 3, 'July 2026', '2026-07-01', '2026-06-29', 'Rent', 21000.00, 500.00, 250.00, 700.00, 0.00, 0.00, 0.00, 0.00, 22450.00, 22450.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (14, 'INV-20260801-0005', 11, 5, 3, 'August 2026', '2026-08-01', NULL, 'Rent', 21000.00, 500.00, 250.00, 700.00, 0.00, 0.00, 0.00, 0.00, 22450.00, 0.00, 'pending', NULL, '2026-08-08 03:11:24'),
  (15, 'INV-20260601-0006', 12, 6, 3, 'June 2026', '2026-06-20', NULL, 'Rent', 15500.00, 400.00, 200.00, 500.00, 0.00, 310.00, 0.00, 0.00, 16910.00, 0.00, 'overdue', NULL, '2026-08-08 03:11:24'),
  (16, 'INV-20260701-0006', 12, 6, 3, 'July 2026', '2026-07-20', NULL, 'Rent', 15500.00, 400.00, 200.00, 500.00, 0.00, 310.00, 0.00, 0.00, 16910.00, 0.00, 'overdue', NULL, '2026-08-08 03:11:24'),
  (17, 'INV-20260801-0006', 12, 6, 3, 'August 2026', '2026-08-20', NULL, 'Rent', 15500.00, 400.00, 200.00, 500.00, 0.00, 0.00, 0.00, 0.00, 16600.00, 0.00, 'pending', NULL, '2026-08-08 03:11:24'),
  (18, 'INV-20260601-0007', 14, 7, 4, 'June 2026', '2026-06-05', '2026-06-03', 'Rent', 23000.00, 550.00, 280.00, 750.00, 0.00, 0.00, 0.00, 0.00, 24580.00, 24580.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (19, 'INV-20260701-0007', 14, 7, 4, 'July 2026', '2026-07-05', '2026-07-02', 'Rent', 23000.00, 550.00, 280.00, 750.00, 0.00, 0.00, 0.00, 0.00, 24580.00, 24580.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (20, 'INV-20260801-0007', 14, 7, 4, 'August 2026', '2026-08-05', NULL, 'Rent', 23000.00, 550.00, 280.00, 750.00, 0.00, 0.00, 0.00, 0.00, 24580.00, 0.00, 'pending', NULL, '2026-08-08 03:11:24'),
  (21, 'INV-20260801-0008', 15, 8, 4, 'August 2026', '2026-08-15', NULL, 'Rent', 16500.00, 400.00, 200.00, 550.00, 0.00, 0.00, 0.00, 0.00, 17650.00, 0.00, 'pending', NULL, '2026-08-08 03:11:24'),
  (22, 'INV-20260601-0009', 18, 9, 5, 'June 2026', '2026-06-01', '2026-05-29', 'Rent', 38000.00, 800.00, 400.00, 1200.00, 0.00, 0.00, 0.00, 0.00, 40400.00, 40400.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (23, 'INV-20260701-0009', 18, 9, 5, 'July 2026', '2026-07-01', '2026-06-28', 'Rent', 38000.00, 800.00, 400.00, 1200.00, 0.00, 0.00, 0.00, 0.00, 40400.00, 40400.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (24, 'INV-20260801-0009', 18, 9, 5, 'August 2026', '2026-08-01', NULL, 'Rent', 38000.00, 800.00, 400.00, 1200.00, 0.00, 0.00, 0.00, 0.00, 40400.00, 0.00, 'pending', NULL, '2026-08-08 03:11:24'),
  (25, 'INV-20260701-0010', 19, 10, 5, 'July 2026', '2026-07-06', '2026-07-05', 'Rent', 26000.00, 600.00, 300.00, 900.00, 0.00, 0.00, 0.00, 0.00, 27800.00, 27800.00, 'paid', NULL, '2026-08-08 03:11:24'),
  (26, 'INV-20260801-0010', 19, 10, 5, 'August 2026', '2026-08-06', NULL, 'Rent', 26000.00, 600.00, 300.00, 900.00, 0.00, 0.00, 0.00, 0.00, 27800.00, 0.00, 'pending', NULL, '2026-08-08 03:11:24');

-- ---- maintenance_tickets (7 rows) ----
INSERT INTO `maintenance_tickets` (`id`, `room_id`, `tenant_id`, `owner_id`, `title`, `description`, `category`, `priority`, `status`, `photo_url`, `created_at`, `updated_at`, `resolved_at`) VALUES
  (1, 1, 1, 1, 'AC not cooling properly', 'The bedroom AC only blows warm air, checked filters already.', 'appliance', 'medium', 'resolved', NULL, '2026-07-27 00:00:00', '2026-08-08 03:11:24', '2026-07-28 00:00:00'),
  (2, 2, 2, 1, 'Water leakage in bathroom', 'Leak under the wash basin, getting worse each day.', 'plumbing', 'high', 'in_progress', NULL, '2026-08-05 00:00:00', '2026-08-08 03:11:24', NULL),
  (3, 5, 3, 2, 'WiFi router issue', 'Router keeps disconnecting every few hours.', 'electrical', 'low', 'open', NULL, '2026-08-07 00:00:00', '2026-08-08 03:11:24', NULL),
  (4, 12, 6, 3, 'Geyser not working', 'No hot water since yesterday morning.', 'electrical', 'urgent', 'open', NULL, '2026-08-08 00:00:00', '2026-08-08 03:11:24', NULL),
  (5, 14, 7, 4, 'Broken window latch', 'Latch on the living room window is broken, doesn\'t lock.', 'other', 'low', 'closed', NULL, '2026-07-19 00:00:00', '2026-08-08 03:11:24', '2026-07-20 00:00:00'),
  (6, 18, 9, 5, 'Pest control needed', 'Seeing ants in the kitchen regularly.', 'other', 'medium', 'resolved', NULL, '2026-07-31 00:00:00', '2026-08-08 03:11:24', '2026-08-01 00:00:00'),
  (7, 19, 10, 5, 'Intercom not working', 'Building intercom panel in the unit is dead.', 'electrical', 'medium', 'open', NULL, '2026-08-06 00:00:00', '2026-08-08 03:11:24', NULL);

-- ---- room_assignments (11 rows) ----
INSERT INTO `room_assignments` (`id`, `room_id`, `tenant_id`, `assigned_at`, `vacated_at`, `notes`, `is_active`) VALUES
  (1, 4, 1, '2025-03-01', '2026-06-30', 'Moved to unit 101 for a better view.', 0),
  (2, 1, 1, '2026-07-01', NULL, NULL, 1),
  (3, 2, 2, '2026-04-15', NULL, NULL, 1),
  (4, 5, 3, '2026-02-01', NULL, NULL, 1),
  (5, 9, 4, '2026-05-10', NULL, NULL, 1),
  (6, 11, 5, '2025-09-01', NULL, NULL, 1),
  (7, 12, 6, '2026-01-20', NULL, NULL, 1),
  (8, 14, 7, '2026-03-05', NULL, NULL, 1),
  (9, 15, 8, '2026-07-15', NULL, NULL, 1),
  (10, 18, 9, '2025-11-01', NULL, NULL, 1),
  (11, 19, 10, '2026-06-01', NULL, NULL, 1);

-- ---- lease_renewal_requests (1 rows) ----
INSERT INTO `lease_renewal_requests` (`id`, `agreement_id`, `proposed_rent`, `proposed_start`, `proposed_end`, `status`, `created_at`, `responded_at`) VALUES
  (1, 6, 23000.00, '2026-09-01', '2027-08-31', 'pending', '2026-08-08 03:11:24', NULL);

-- ---- payments (13 rows) ----
INSERT INTO `payments` (`id`, `invoice_id`, `amount`, `method`, `reference`, `notes`, `paid_at`, `gateway`, `gateway_order_id`, `gateway_payment_id`, `gateway_status`) VALUES
  (1, 1, 15100.00, 'upi', 'UPI-88213', NULL, '2026-06-04 10:15:00', 'manual', NULL, NULL, NULL),
  (2, 2, 15100.00, 'bank_transfer', 'NEFT-77621', NULL, '2026-07-03 09:40:00', 'manual', NULL, NULL, NULL),
  (3, 4, 14600.00, 'cash', NULL, NULL, '2026-06-06 18:00:00', 'manual', NULL, NULL, NULL),
  (4, 7, 27700.00, 'razorpay', 'pay_Kx9291Aa', NULL, '2026-06-02 11:05:00', 'razorpay', NULL, NULL, 'captured'),
  (5, 8, 27700.00, 'razorpay', 'pay_Kx9302Bb', NULL, '2026-07-04 08:55:00', 'razorpay', NULL, NULL, 'captured'),
  (6, 10, 10000.00, 'upi', 'UPI-55210', NULL, '2026-07-09 14:20:00', 'manual', NULL, NULL, NULL),
  (7, 12, 22450.00, 'bank_transfer', 'IMPS-33218', NULL, '2026-05-30 16:00:00', 'manual', NULL, NULL, NULL),
  (8, 13, 22450.00, 'bank_transfer', 'IMPS-33990', NULL, '2026-06-29 12:10:00', 'manual', NULL, NULL, NULL),
  (9, 18, 24580.00, 'cash', NULL, NULL, '2026-06-03 19:30:00', 'manual', NULL, NULL, NULL),
  (10, 19, 24580.00, 'cash', NULL, NULL, '2026-07-02 20:00:00', 'manual', NULL, NULL, NULL),
  (11, 22, 40400.00, 'bank_transfer', 'NEFT-90021', NULL, '2026-05-29 10:00:00', 'manual', NULL, NULL, NULL),
  (12, 23, 40400.00, 'bank_transfer', 'NEFT-90850', NULL, '2026-06-28 09:45:00', 'manual', NULL, NULL, NULL),
  (13, 25, 27800.00, 'razorpay', 'pay_Mz8811Cc', NULL, '2026-07-05 17:25:00', 'razorpay', NULL, NULL, 'captured');

-- ---- vacate_requests (3 rows) ----
INSERT INTO `vacate_requests` (`id`, `assignment_id`, `tenant_id`, `owner_id`, `requested_vacate_date`, `reason`, `status`, `created_at`, `responded_at`) VALUES
  (1, 3, 2, 1, '2026-09-30', 'Relocating for a new job in Pune.', 'pending', '2026-08-06 00:00:00', NULL),
  (2, 7, 6, 3, '2026-07-31', 'Family relocating back to Jaipur.', 'approved', '2026-07-01 09:00:00', '2026-07-02 11:00:00'),
  (3, 9, 8, 4, '2026-08-31', 'Found a place closer to office.', 'rejected', '2026-08-03 00:00:00', '2026-08-04 00:00:00');

SET FOREIGN_KEY_CHECKS=1;