-- ============================================================
-- Shop Board - Migration 0001: core schema + append-only event log
-- Build Spec v1.0 section 3 (data model) / section 4 (time engine feeds)
-- Every design rule cites its register Q-number (Q98 code standard).
-- ============================================================

-- People. Role is what you can DO (Q94); lines are where you usually work (Q90 clock-in default).
create table employee (
id uuid primary key default gen_random_uuid(),
first_name text not null,
last_name text not null,
role text not null check (role in ('production','manager','admin')), -- Q94
pin_hash text, -- Q22: 4-digit PIN, hashed; reset-only, never viewable
mobile text, -- SMS alerts (approved A2P campaign)
email text, -- optional by design (file 07)
lines int[] default '{}', -- usual lines (Q90 smart clock-in; Q95 seeds)
active boolean not null default true, -- Q70: inactive vanishes from login grids
created_at timestamptz not null default now()
);

-- Production lines. OFF = hidden everywhere (Q66).
create table line (
id int primary key,
name text not null,
enabled boolean not null default true, -- Q66
down_today boolean not null default false, -- Q83 quick-hold, auto-clears at day end
down_reason text
);

-- Products: 10 part numbers -> 6 build templates (Mike: no variant forks; SMK = base, Q11).
create table product (
part_number text primary key,
family text not null,
template_id uuid,
is_smk boolean not null default false,
lines int[] not null default '{}' -- products map to lines (Q37)
);

-- Templates + steps: EXACTLY Mike's numbered steps (Q102), MAN-hours (Q101), admin-editable (Q97).
create table build_template (
id uuid primary key default gen_random_uuid(),
family text not null unique,
crew_note text, -- informational; engine is crew-agnostic (Q104)
total_man_hours numeric not null,
total_days int not null
);
create table step_template (
id uuid primary key default gen_random_uuid(),
template_id uuid not null references build_template(id),
display_no text not null, -- Mike's number ('18', '29*' provisional)
name text not null,
day_no int not null, -- Mike's day placement (Q96 calibrates)
man_hours numeric not null, -- Q101 seeds, files 27-34
is_background boolean not null default false, -- Q96 jig-type tasks
retired boolean not null default false, -- Q97 retire-not-purge
sort_order int not null
);
alter table product add constraint fk_product_template foreign key (template_id) references build_template(id);

-- Options: one-man added hours (Mike answer 1), mapped to parent step's day (Q10).
create table option_catalog (
id uuid primary key default gen_random_uuid(),
template_id uuid not null references build_template(id),
group_name text not null,
option_name text not null,
added_man_hours numeric, -- null = N/A (not offered)
maps_to_day int, -- Q10
coyote_string text, -- matched to Build It selections at seed reconciliation
retired boolean not null default false
);

-- Builds (cabs). ORDER # + LINE is identity (Q90); Cab # is background tally (Q39); auto-split (Q13).
create table build (
  id uuid primary key default gen_random_uuid(),
  order_number text not null, -- TEXT verbatim: 23613, W115117, 12345.1 (Q13)
coyote_root text not null, -- original Coyote order # so sync never breaks (Q40)
line_id int references line(id),
  part_number text references product(part_number),
  cab_number text, -- board-assigned tally, admin-editable (Q39/Q40)
state text not null default 'upcoming' check (state in ('upcoming','active','awaiting_inspection','rework','production_complete','parked','on_hold','cancelled')), -- Q53 lifecycle
pre_board boolean not null default false, -- C24 cutover tag
customer_name text,
  customer_display boolean not null default true, -- Q33
destination text, -- US state / US port / PICKUP (Q55)
invoice_note text, -- the yellow note, verbatim (Q11)
note_flagged boolean not null default false, -- non-empty note => manager pass
promised_finish date, -- FIXED once started (Q103-6)
started_at timestamptz, -- server-stamped; Terms s5 fact (file 18)
created_at timestamptz not null default now(),
  unique (order_number)
  );

-- Task instances: frozen copy of the template at start (Q97 as-built history).
create table task (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references build(id),
  display_no text not null,
  name text not null,
  day_no int not null,
  man_hours numeric not null,
  is_background boolean not null default false,
  source text not null default 'template', -- template | option | manager_adhoc (Q11 note pass)
state text not null default 'not_started' check (state in ('not_started','in_progress','complete')), -- Q45
started_by uuid references employee(id),
  started_at timestamptz,
  completed_by uuid references employee(id), -- ANY clocked-on tech may complete (Q104)
completed_at timestamptz,
  sort_order int not null
  );

-- Clock events: payroll-grade (C3.8). Immutable originals; amendments are new rows.
create table clock_event (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employee(id),
  build_id uuid references build(id),
  line_id int references line(id),
  kind text not null check (kind in ('clock_in','clock_out_lunch','clock_out_shift','clock_out_early','auto_clock_out')),
  reason text, -- pick-list (Q77)
claimed_at timestamptz not null, -- REAL tap time (Q103-1)
received_at timestamptz not null default now(),
  implausible boolean not null default false, -- spec s2 -> manager review, held from pay/pace
amended_by_event uuid references clock_event(id)
  );

-- THE EVENT LOG. Append-only. Everything derives from this (spec s3).
create table event_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(), -- server-stamped (Q82)
claimed_at timestamptz, -- device tap time when it differs (Q103-1)
actor_id uuid references employee(id),
  event_type text not null, -- docs/EVENT_TAXONOMY.md is the authoritative list
build_id uuid,
  payload jsonb not null default '{}'::jsonb
  );
create index on event_log (build_id, at);
create index on event_log (event_type, at);

-- Feature toggles (Q65): the rollout dial.
create table feature_toggle (
  key text primary key,
  enabled boolean not null default true,
  changed_by uuid references employee(id),
  changed_at timestamptz not null default now()
  );

-- Admin-managed pick lists (Q77): retire-not-delete.
create table pick_list_item (
  id uuid primary key default gen_random_uuid(),
  list_key text not null, -- 'clock_out_reason','blocker','hold','absence',...
label text not null,
  sort_order int not null default 0,
  retired boolean not null default false
  );
