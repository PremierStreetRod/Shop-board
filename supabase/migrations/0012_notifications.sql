-- 0012: NOTIFICATION LAYER (block 23) — Q106 sandbox stays on until cutover.
-- In the owner-rep's words (2026-07-30): "i dont want any push text
-- notifications going out to ANYONE, no emails, no NOTHING until we are
-- ready to go live." Delivery is rerouted in server code (NOTIFY_LIVE env);
-- these tables just give the engine memory.

-- Where a person's future email/SMS channels will live (stubs today).
alter table employee add column if not exists email text;
alter table employee add column if not exists phone text;
update employee set email = 'marketing@premierstreetrod.com', phone = '928-208-5586'
 where id = '6e1fbc35-2452-4328-9ed3-83014efff9a4';  -- owner-rep (the Q106 sandbox target)

-- One row per device somebody turned notifications on for.
create table if not exists push_subscription (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employee(id),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Every notification the system ever WANTED to send. The intended
-- recipient is recorded even while the sandbox reroutes actual delivery —
-- so at cutover we can prove exactly what the matrix would have done.
create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  intended_employee_id uuid references employee(id),
  channel text not null,
  title text not null,
  body text not null,
  sandboxed boolean not null default true,
  status text not null default 'queued',
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists notification_log_at on notification_log (created_at desc);
