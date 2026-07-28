-- ============================================================
-- 0006: COMPLETION PHOTOS (file 11 — the finish gate's photo half).
-- Photos are captured on the tech's PHONE (file 11 rule) and attach
-- to the cab's record. Storage: a PRIVATE Supabase Storage bucket —
-- nothing is publicly reachable; the app serves photos only to
-- signed-in people through its own authenticated route.
-- Q86 (min completion photos per product, default >= 1) becomes a
-- hard gate when per-product settings land in the admin console;
-- until then the finish gate nudges but does not block.
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('cab-photos', 'cab-photos', false)
  on conflict (id) do nothing;

create table build_photo (
  id            uuid primary key default gen_random_uuid(),
  build_id      uuid not null references build(id),
  task_id       uuid,                                -- null = finish-gate photo; set when per-task photos arrive
  uploaded_by   uuid references employee(id),
  storage_path  text not null,                       -- <build_id>/<timestamp>.jpg inside cab-photos
  kind          text not null default 'finish',      -- 'finish' | 'task' | 'rework' (future)
  created_at    timestamptz not null default now()
);
create index build_photo_build_idx on build_photo (build_id);

grant all on build_photo to service_role;
