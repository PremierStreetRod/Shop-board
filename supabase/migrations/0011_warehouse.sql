-- ============================================================
-- 0011: WAREHOUSE (Q109) — the handoff INTO production.
--   · 'Warehouse' becomes a clockable work area (line id 9,
--     enabled=false so it never appears on the TV board and the
--     engine's line-pace math never counts its hours).
--   · The kit lifecycle lands on build: three-state verify gate
--     (unverified/verified/short — SHORT is a flag; part detail
--     stays in Coyote this launch), the two-step pull stamps, and
--     queue_pos so warehouse can reorder the upcoming queue (C9:
--     priority only, clocks untouched).
-- ============================================================
insert into line (id, name, enabled) values (9, 'Warehouse', false)
on conflict (id) do nothing;

alter table build
  add column if not exists kit_status text not null default 'unverified',
  add column if not exists kit_note text,
  add column if not exists kit_verified_by uuid references employee(id),
  add column if not exists kit_verified_at timestamptz,
  add column if not exists kit_pull_started_at timestamptz,
  add column if not exists kit_pull_started_by uuid references employee(id),
  add column if not exists kit_delivered_at timestamptz,
  add column if not exists kit_delivered_by uuid references employee(id),
  add column if not exists queue_pos int;

alter table build add constraint build_kit_status_check
  check (kit_status in ('unverified','verified','short'));

-- Existing upcoming cabs keep their arrival order as the starting queue.
update build b set queue_pos = r.rn
from (select id, row_number() over (partition by line_id order by created_at) as rn
      from build where state = 'upcoming') r
where r.id = b.id;
