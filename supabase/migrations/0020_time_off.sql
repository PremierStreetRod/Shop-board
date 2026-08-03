-- 0020: Q92 — TIME-OFF REQUESTS (block 34 MVP, part 1 of the planned-absence work).
-- A builder asks for time off from their phone (a date range + a reason); it
-- lands in the manager's "Time off — needs you" cockpit lane; one tap approves
-- or denies (with an optional note). A manager/admin can also enter time off
-- for anyone directly (added_by_manager = true, lands already approved). An
-- "upcoming — who's out and when" list shows the approved absences ahead.
--
-- DEFERRED honestly to a later block (recorded in the register): feeding an
-- approved absence into each cab's finish-date projection, a full days-ahead
-- visual coverage calendar, the on-arrival reason pre-loading, and the Meeting
-- Pack. This migration + v34 ship the request→decide loop and the upcoming
-- list only.
--
-- Delivery stays Q106-sandboxed: every push routes to the owner-rep until the
-- named NOTIFY_LIVE cutover, regardless of the feature toggle below.

create table if not exists time_off_request (
  id               uuid primary key default gen_random_uuid(),
  employee_id      uuid not null references employee(id),   -- who the time off is FOR
  start_date       date not null,
  end_date         date not null,
  reason           text,
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'denied')),
  requested_by     uuid references employee(id),            -- who submitted it (self, or a manager)
  added_by_manager boolean not null default false,          -- manager entered it for someone -> auto-approved
  decided_by       uuid references employee(id),
  decided_at       timestamptz,
  decision_note    text,
  created_at       timestamptz not null default now()
);
create index if not exists time_off_request_emp_idx    on time_off_request (employee_id);
create index if not exists time_off_request_status_idx on time_off_request (status);
create index if not exists time_off_request_dates_idx  on time_off_request (start_date, end_date);

-- Q77: the reasons live in the admin-editable pick list, like every list.
insert into pick_list_item (list_key, label, sort_order)
select 'time_off_reason', v.l, v.s from (values
  ('Vacation', 1),
  ('Personal', 2),
  ('Appointment', 3),
  ('Sick', 4),
  ('Family', 5),
  ('Other', 6)) as v(l, s)
 where not exists (select 1 from pick_list_item where list_key = 'time_off_reason');

-- The time_off_requests feature key already exists in TOGGLE_INFO (planned in
-- an earlier block). Seed its row so it appears in the admin Features panel and
-- the code can read it. ON by default — self-service requests are safe under
-- the Q106 sandbox (nothing actually leaves the building until cutover).
insert into feature_toggle (key, enabled)
select 'time_off_requests', true
 where not exists (select 1 from feature_toggle where key = 'time_off_requests');
