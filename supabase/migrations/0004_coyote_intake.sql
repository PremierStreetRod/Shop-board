-- ============================================================
-- 0004: COYOTE INTAKE landing zone (file 28 §5, option 1 — HTTPS POST
-- from the FileMaker side, one full order snapshot per order event).
--
-- Design intent (plain English): this is a RAW landing zone. Every
-- accepted POST is stored exactly as received and never edited.
-- Dedup, the multi-cab auto-split (.1/.2/.3), the needs-split guard,
-- note-flag manager pass and field mapping all read FROM here in a
-- later build block (file 28 internal notes). Nothing on the floor
-- depends on this table, so Coyote can go live and start sending
-- before our mapping logic exists — "when in doubt, send" is safe.
-- ============================================================
create table coyote_intake (
  id            uuid primary key default gen_random_uuid(),
  received_at   timestamptz not null default now(),  -- server-stamped (Q82)
  order_number  text,          -- best-effort pull from the payload ("Order #" kept as TEXT, packet §4)
  payload       jsonb,         -- the parsed JSON snapshot (null only if it did not parse)
  raw_text      text,          -- the raw body, kept ONLY when JSON parsing failed (debugging his exports)
  parse_ok      boolean not null default true,
  processed_at  timestamptz    -- set by the future mapping job; null = not yet mapped
);

-- Fast at-a-glance lookups while integrating ("show me everything for 23613").
create index coyote_intake_order_idx on coyote_intake (order_number);
create index coyote_intake_received_idx on coyote_intake (received_at desc);

-- Default privileges from 0002 already cover new tables for service_role;
-- stated explicitly anyway so this file stands on its own (spec §10: anon gets nothing).
grant all on coyote_intake to service_role;
