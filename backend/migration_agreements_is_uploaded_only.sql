-- ============================================================
-- Adds ONLY the missing agreements.is_uploaded column.
-- Run this in phpMyAdmin: select your rental database -> Import -> this file -> Go.
-- ============================================================

ALTER TABLE agreements
  ADD COLUMN is_uploaded TINYINT(1) NOT NULL DEFAULT 0;
