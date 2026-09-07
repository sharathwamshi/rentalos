-- ============================================================
-- Migration: Owner Profile fields
--
-- Adds the fields shown on the new Owner > Profile page (business
-- logo, property address, GST/PAN, ownership type, invoice prefix)
-- to an existing database. Safe to run -- all columns are nullable
-- with sensible defaults, no existing data is touched.
-- ============================================================

ALTER TABLE owner_profiles
  ADD COLUMN business_logo_url VARCHAR(255) NULL,
  ADD COLUMN property_address TEXT NULL,
  ADD COLUMN ownership_type ENUM('single','joint') NOT NULL DEFAULT 'single',
  ADD COLUMN joint_level VARCHAR(20) NULL,
  ADD COLUMN invoice_prefix VARCHAR(30) NULL,
  ADD COLUMN pan_number VARCHAR(20) NULL,
  ADD COLUMN pan_upload_url VARCHAR(255) NULL;
