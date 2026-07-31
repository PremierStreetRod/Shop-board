-- 0017: Q111 part 2 — MISSED-PUNCH CORRECTIONS.
-- The physical punch clock can't retire until a forgotten punch can be
-- fixed. Punches are never deleted or silently rewritten: a MOVED punch
-- keeps its original time + who/why, a bogus punch is VOIDED (excluded
-- from every calculation, still visible struck-through in the corrector),
-- and an ADDED punch names who added it. All server-enforced + audited.
alter table clock_event add column if not exists voided boolean not null default false;
alter table clock_event add column if not exists corrected_by uuid;
alter table clock_event add column if not exists corrected_at timestamptz;
alter table clock_event add column if not exists correction_note text;
alter table clock_event add column if not exists original_claimed_at timestamptz;
alter table clock_event add column if not exists added_by uuid;
