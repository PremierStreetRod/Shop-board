-- Block 265 (2026-09-23 — the 23109 customer return, Daniel's morning):
-- THE FIX-JOB STATE WAS NEVER LEGAL. The whole returned-cab system (Q85 +
-- Blocks 125-127: the fix_job build state, the Fix-work clock bucket, the
-- Open-fixes grab lane, per-order fix hours) shipped complete — but
-- build_state_check, which predates it, was never widened to allow
-- 'fix_job'. The very first write ("Open fix job" on the manager console)
-- hit the constraint and 500'd; the feature has never once run live until
-- today's attempt proved it. This adds the ninth state. Nothing existing
-- changes; every cab keeps the state it has.
alter table build drop constraint build_state_check;
alter table build add constraint build_state_check check (state = any (array[
  'upcoming'::text, 'active'::text, 'awaiting_inspection'::text,
  'rework'::text, 'production_complete'::text, 'parked'::text,
  'on_hold'::text, 'cancelled'::text, 'fix_job'::text]));
