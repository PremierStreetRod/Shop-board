-- ============================================================
-- 0005: REWORK FLOW (files 11/18 — the failed-inspection path).
-- Awaiting inspection -> Rework assigned (manager only, reason-coded,
-- with a note + a TIME FRAME in hours) -> fixes checked off ->
-- back to Awaiting inspection (re-inspection required, no
-- self-certifying, file 18 rule). Rework hours live in their own
-- bucket (Q85): the fix task carries 0 standard hours so pace and
-- earned never gain from fix work; the countdown runs off
-- rework_assigned_at vs rework_hours.
-- ============================================================
alter table build add column if not exists rework_reason      text;
alter table build add column if not exists rework_note        text;
alter table build add column if not exists rework_hours       numeric;
alter table build add column if not exists rework_assigned_at timestamptz;

-- Q77: every dropdown is a live, admin-manageable pick list.
insert into pick_list_item (list_key, label, sort_order) values
  ('rework_reason','Weld quality',1),
  ('rework_reason','Panel fit / gaps',2),
  ('rework_reason','Missed step',3),
  ('rework_reason','Surface damage',4),
  ('rework_reason','Other (see note)',5)
on conflict do nothing;
