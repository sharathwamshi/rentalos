-- ============================================================
-- Migration: link tenants to the owner who created them
--
-- Fixes: a brand-new tenant (not yet assigned to any room) was
-- invisible in the "Assign tenant" dropdown, because tenants were
-- only ever linked to an owner through a room assignment.
--
-- Safe to run on an existing database that already has data --
-- it only adds a nullable column and backfills it for tenants
-- who already have an assignment.
-- ============================================================

ALTER TABLE tenant_profiles
  ADD COLUMN created_by_owner_id INT NULL,
  ADD CONSTRAINT fk_tenant_created_by_owner
    FOREIGN KEY (created_by_owner_id) REFERENCES owner_profiles(id);

-- Backfill: for tenants who already have at least one room assignment,
-- link them to whichever owner currently houses them (or last did).
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
