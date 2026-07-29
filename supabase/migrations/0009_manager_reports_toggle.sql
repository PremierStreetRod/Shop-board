-- ============================================================
-- 0009: "Managers can see Reports" switch (Q65 framework).
-- Owner-rep 2026-07-29: reports are ADMIN work; a manager only
-- sees the Reports page if an admin flips this ON. Default OFF.
-- (v19.1 reads this key on /manager and /reports.)
-- ============================================================
insert into feature_toggle (key, enabled) values ('manager_reports', false)
on conflict (key) do nothing;
