-- 0019: Q83 — "DOWN FOR TODAY" QUICK-HOLD.
-- Mark a line as EXPECTED idle for the day (staff out / equipment down / no
-- work scheduled): the TV tile goes calm-slate with the reason, alerts stay
-- quiet, it AUTO-CLEARS when the calendar day rolls (the sweeper), and it
-- AUTO-RESUMES the moment someone clocks in (Q84: working-while-held is
-- impossible). Distinct from Q113's hard line close (refuses work + manual
-- reopen). Reasons live in an admin-editable pick list, like every list (Q77).
alter table line add column if not exists down_today boolean not null default false;
alter table line add column if not exists down_reason text;
alter table line add column if not exists down_by uuid;
alter table line add column if not exists down_at timestamptz;
insert into pick_list_item (list_key, label, sort_order)
select 'line_down_reason', v.l, v.s from (values
  ('Staff out', 1),
  ('Equipment down', 2),
  ('No work scheduled', 3)) as v(l, s)
 where not exists (select 1 from pick_list_item where list_key = 'line_down_reason');
