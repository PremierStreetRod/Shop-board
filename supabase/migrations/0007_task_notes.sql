-- ============================================================
-- 0007: PER-TASK NOTES (file 11 — "next to each task, a production
-- tech can add a note or upload a photo to document a problem or
-- the work"). Task PHOTOS reuse build_photo (task_id set, kind
-- 'task'); this table holds the written notes. Append-only in
-- spirit: notes are never edited or deleted from the floor.
-- ============================================================
create table task_note (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references task(id),
  build_id      uuid not null references build(id),
  author_id     uuid references employee(id),
  note          text not null,
  created_at    timestamptz not null default now()
);
create index task_note_task_idx on task_note (task_id);
create index task_note_build_idx on task_note (build_id);

grant all on task_note to service_role;
