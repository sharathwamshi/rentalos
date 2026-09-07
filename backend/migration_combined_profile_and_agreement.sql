-- ============================================================
-- Combined migration: run this ONE file to fix both errors below.
--
--   1054 - Unknown column 'owner_profiles.business_logo_url'
--   1054 - Unknown column 'agreements.is_uploaded'
--
-- These happen because the backend code was updated to expect new
-- columns, but this database still has the old table structure.
-- This file adds exactly those columns. Safe to run on a database
-- that already has data -- nothing existing is touched.
--
-- If you already ran one of the two migrations sent earlier
-- (migration_add_owner_profile_fields.sql /
--  migration_add_agreement_upload.sql), running that part again
-- here will error with "Duplicate column name" -- that's fine,
-- it just means that part is already done. Comment out that
-- ALTER TABLE block below and re-run the rest.
-- ============================================================

ALTER TABLE owner_profiles
  ADD COLUMN business_logo_url VARCHAR(255) NULL,
  ADD COLUMN property_address TEXT NULL,
  ADD COLUMN ownership_type ENUM('single','joint') NOT NULL DEFAULT 'single',
  ADD COLUMN joint_level VARCHAR(20) NULL,
  ADD COLUMN invoice_prefix VARCHAR(30) NULL,
  ADD COLUMN pan_number VARCHAR(20) NULL,
  ADD COLUMN pan_upload_url VARCHAR(255) NULL;

ALTER TABLE agreements
  ADD COLUMN is_uploaded TINYINT(1) NOT NULL DEFAULT 0;
