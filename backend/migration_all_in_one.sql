-- ============================================================
-- RentalOS — ALL-IN-ONE schema migration
--
-- Safe to run on ANY existing database, no matter which of the
-- earlier partial migrations you've already applied. Every change
-- below checks information_schema first and only runs if the
-- column/table is actually missing -- so re-running this file
-- (even multiple times) will never throw a "Duplicate column"
-- error.
--
-- Covers:
--   1) tenant_profiles.created_by_owner_id  (fixes new tenants not
--      showing up in the "Assign tenant" list)
--   2) agreements.is_uploaded               (owner-uploaded agreements)
--   3) owner_profiles: business_logo_url, property_address,
--      ownership_type, joint_level, invoice_prefix, pan_number,
--      pan_upload_url                        (Owner > Profile page)
--
-- How to run: phpMyAdmin -> select your rental database -> SQL tab
-- -> paste this whole file -> Go.  (Import tab also works.)
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS _rentalos_migrate $$
CREATE PROCEDURE _rentalos_migrate()
BEGIN
    -- ---- tenant_profiles.created_by_owner_id ----
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'tenant_profiles' AND column_name = 'created_by_owner_id'
    ) THEN
        ALTER TABLE tenant_profiles ADD COLUMN created_by_owner_id INT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE() AND table_name = 'tenant_profiles' AND constraint_name = 'fk_tenant_created_by_owner'
    ) THEN
        ALTER TABLE tenant_profiles
          ADD CONSTRAINT fk_tenant_created_by_owner
          FOREIGN KEY (created_by_owner_id) REFERENCES owner_profiles(id);
    END IF;

    -- Backfill: link tenants who already have a room assignment to
    -- whichever owner currently (or last) housed them.
    UPDATE tenant_profiles tp
    JOIN (
        SELECT ra.tenant_id, p.owner_id
        FROM room_assignments ra
        JOIN rooms r ON r.id = ra.room_id
        JOIN properties p ON p.id = r.property_id
        GROUP BY ra.tenant_id
    ) x ON x.tenant_id = tp.id
    SET tp.created_by_owner_id = x.owner_id
    WHERE tp.created_by_owner_id IS NULL;

    -- ---- agreements.is_uploaded ----
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'agreements' AND column_name = 'is_uploaded'
    ) THEN
        ALTER TABLE agreements ADD COLUMN is_uploaded TINYINT(1) NOT NULL DEFAULT 0;
    END IF;

    -- ---- owner_profiles: Profile page fields ----
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'owner_profiles' AND column_name = 'business_logo_url'
    ) THEN
        ALTER TABLE owner_profiles ADD COLUMN business_logo_url VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'owner_profiles' AND column_name = 'property_address'
    ) THEN
        ALTER TABLE owner_profiles ADD COLUMN property_address TEXT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'owner_profiles' AND column_name = 'ownership_type'
    ) THEN
        ALTER TABLE owner_profiles ADD COLUMN ownership_type ENUM('single','joint') NOT NULL DEFAULT 'single';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'owner_profiles' AND column_name = 'joint_level'
    ) THEN
        ALTER TABLE owner_profiles ADD COLUMN joint_level VARCHAR(20) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'owner_profiles' AND column_name = 'invoice_prefix'
    ) THEN
        ALTER TABLE owner_profiles ADD COLUMN invoice_prefix VARCHAR(30) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'owner_profiles' AND column_name = 'pan_number'
    ) THEN
        ALTER TABLE owner_profiles ADD COLUMN pan_number VARCHAR(20) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'owner_profiles' AND column_name = 'pan_upload_url'
    ) THEN
        ALTER TABLE owner_profiles ADD COLUMN pan_upload_url VARCHAR(255) NULL;
    END IF;

END $$

DELIMITER ;

CALL _rentalos_migrate();
DROP PROCEDURE _rentalos_migrate;
