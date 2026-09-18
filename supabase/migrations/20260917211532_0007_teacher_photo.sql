-- SAKALA V3 — Human Identity System: kolom foto untuk Teacher
-- "Photo when available. Premium Avatar when needed." (Bagian D.7)
alter table teacher add column if not exists photo_url text;
