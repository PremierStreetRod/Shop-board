-- ============================================================
-- 0008: allow kind 'clock_out_auto' on clock_event.
-- The 0001 check constraint predates the v16 forgotten-clock-out
-- sweeper — its first live tick (2026-07-28 14:06 MST) was correctly
-- REJECTED by Postgres (constraint 23514), which is the schema doing
-- its job. 'clock_out_auto' covers: the day-end sweeper, the manager
-- "Clock out" correction button, and deactivation-while-on-the-clock.
-- ============================================================
alter table clock_event drop constraint clock_event_kind_check;
alter table clock_event add constraint clock_event_kind_check
  check (kind in ('clock_in','clock_out_lunch','clock_out_shift','clock_out_early','clock_out_auto'));
