-- 0014: Q112 — AFTER-HOURS WORK SESSIONS (the governance around the clock).
-- The time machinery already handles evenings and weekends; this table is
-- the record: who approved it, why, the plan going in, the wrap-up note
-- coming out, and whether anyone CONFIRMED the approval claim.
create table if not exists after_hours_session (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employee(id),
  line_id int,
  approved_by uuid references employee(id),
  reason text not null,
  plan text not null,
  wrap_note text,
  confirmed_by uuid references employee(id),
  confirmed_at timestamptz,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ah_open on after_hours_session (employee_id) where ended_at is null;

-- The owner-rep's five reasons (editable pick list, like every other list).
insert into pick_list_item (list_key, label, sort_order)
select 'after_hours_reason', v.l, v.s from (values
  ('Making up hours', 1),
  ('Cab behind — catching up', 2),
  ('Deadline push', 3),
  ('Company project', 4),
  ('Overtime — approved extra hours', 5)) as v(l, s)
 where not exists (select 1 from pick_list_item where list_key = 'after_hours_reason');
