# BUILD_LOG — Shop Board
Chronological build journal. Every work chunk gets an entry (Q99). Newest first.

## 2026-07-25 — Build block 6 — manager tools v1: the lifecycle loop closes
- /manager cockpit (manager+admin, file 07): per-line active cab + Sign off (production_complete, file 11 manager half) + Start-next from queue.
- START performs the Q97 FREEZE: template steps copied into the cab's own task list at that moment; one-active-cab-per-line guard; build.start / build.production_complete events.
- E2E live: signed off TEST-23703 -> started TEST-23705 -> API-verified 96.0 total mh = all 28 67-72 steps frozen, Day 1, waiting for first clock-in. Full loop queue->start->checklist->color->sign-off->next now in production.
- CARRY-OVERS (next block first): (1) retire test account (Zz left active w/ role admin — Supabase dashboard hung during cleanup; one-line SQL). (2) cockpit button's client click handler intermittently didn't fire (server endpoints verified perfect via direct call).
- Session closed at owner-rep's 30% warning per Q99.

## 2026-07-25 — Build block 5 — THE TIME ENGINE (Stage 2 begins)
- server.js v5: coverage pace clock rebuilt from raw clock_event history (Q103-2 — cab clock only runs under coverage; lunches never redden a cab).
- Color math crew-agnostic (Q104): behind = coverage man-hours - earned; green <1 / amber 1-4 / red >4 (Q6 defaults). Earned v1 = completed tasks at standard (in-progress partial credit joins with per-task attribution later).
- Q57 clock-driven DAY x/y: ceil(covered wall-hours / 8), floating per-cab boundaries. File-17 voice on all statuses.
- Interval math unit-tested pre-ship; LIVE verification: L1 amber 1.4 behind D3/6, L2 green 25.0 ahead D3/7, L3 red 7.0 behind D3/6, L4 neutral — all match hand computations exactly.
- Engine defensively rejected overlapping single-person coverage in my first demo seed (correct behavior; reseeded sequentially).
- Logsdons relabeled 'Admin' on grid (owner-rep). Ops note: Supabase SQL editor hides DELETE behind a confirm dialog.
- NEXT: manager tools (start build, inspection sign-off, day switch) or finish projection + on-deck tiles.

## 2026-07-25 — Build block 4 — cab task screen + full roster + test data
- Q95 AMENDED (owner-rep): ALL 17 employees + owners on the login grid w/ department subtitles (new employee.department column, Q94 model). Rob + Ross can sign in and watch.
- Migration 0003: 11 remaining roster rows + 5 TEST- builds (purge key: order # prefix) + frozen Q97 task lists (116 tasks) + believable progress.
- server.js v4: CAB TASK SCREEN (ORDER # front-center, steps by day, two-step check-off + undo — Q45/Q90/Q104, event-logged) · watcher home for owners/future departments · /board = real cab tiles (ORDER #, family, done/total mh, progress bar, names).
- E2E live: clock-in -> task screen -> completed a task -> 16.0->19.0 hrs exact -> board 40% + name. Watcher gate verified via department flip.
- TEST DATA CAUGHT A REAL BUG immediately: 55-59 totals 111.5 vs 112 — file 34 Day-1 draft summed 15.5. Fixed (Prep panels 2.5->3.0) in template + task copy + file 34. All six families verify exact: 48/112/48/96/56/80.
- NEXT: manager tools (start build from queue, inspection sign-off) or Stage-2 time engine (pace clock + colors).

## 2026-07-25 — Build block 3 — clock-in/out + TV board skeleton
- Home v2: clock-IN with Q90 one-tap layout (usual line big, others below); clock-OUT reasons pulled live from the Q77 pick list.
- clock_event rows are payroll-grade with DUAL timestamps: device claimed_at + server received_at (Q103-1) — verified in DB.
- Q52 Wi-Fi gate scaffold: SHOP_EGRESS_IP env var; UNSET during build (gate open); set at cutover to fence clock actions to shop Wi-Fi.
- /board: TV skeleton — line tiles from DB, idle vs 'Working now' + clocked-on names, 30s fetch-poll (Realtime in Stage 3).
- E2E on live domain: test account clock-in -> board flipped 'Working now / Zz' on Line 1 -> clock-out (End of shift) -> rows verified -> account deactivated.
- Q106 standing directive (register): during build/test, ALL notifications of any kind route ONLY to owner-rep — sandbox layer ships with first notification code.
- NEXT: manual build creation (frozen task list from template) + task check-off, or begin Stage-2 time engine.

## 2026-07-25 — Build block 2 — sign-in live + database seeded
- Q95 decided (hold Logsdon accounts) -> register Q1-Q105 has ZERO open items.
- Migration 0002_seed.sql run + verified: 4 lines, 6 templates, 16 products, 6 employees, 165 steps, 68 options, 23 pick items, 9 toggles. Man-hour sums match all six standards.
- server.js v2: name-grid sign-in, first-login choose-your-PIN (Q68), scrypt PIN hashes (Q22), C17 per-person lockout, HMAC session cookies, event_log writes.
- Railway env vars: SUPABASE_URL + SESSION_SECRET (me), SUPABASE_SERVICE_KEY (owner-rep pasted — new Supabase 'secret key' sb_secret_... = service_role).
- BUG FIXED via deploy logs: db 403 — tables created as postgres lacked service_role grants. Fix: GRANT all on tables/sequences + default privileges (anon gets nothing, spec s10).
- E2E TEST PASSED on shopboard.premierstreetrod.com (DNS + SSL live): test account PIN-set -> home (line lookup correct) -> logout -> wrong PIN rejected -> re-login. event_log: 5 events in order. Test account deactivated -> gone from grid (Q70 proven).
- NEXT: clock-in/out (clock_event + Q52 Wi-Fi gate) + first cab screen or TV board skeleton.

## 2026-07-24 — GO hour, part 2 — DEPLOYED: full stack live
- Railway: repo connected (fix was completing the Railway-side GitHub authorization; the app install alone showed no repos). First deploy SUCCESS, service Online, auto-deploy on push ENABLED.
- Live: shop-board-production.up.railway.app — shell page serves, /health returns {ok:true} (Q74 watchdog target).
- Custom domain shopboard.premierstreetrod.com added (port 8080). Owner-rep placed CNAME (shopboard -> 2c5tuivf.up.railway.app) + TXT (_railway-verify.shopboard) at GoDaddy; Railway auto-verifies + SSL on propagation.
- Supabase: org Premier Street Rod (PRO), project shopboard-prod (ca-central-1). Migration 0001 run in SQL Editor — Success; verified 12/12 tables present by query.
- GitHub web editor is the canonical path this session; zip/Terminal route retired. Token rotation at cutover. Railway trial: add card before 28 days/$5 runs out.
- NEXT BLOCK: kiosk name-grid sign-in + seed data (employees file 26, catalogs files 27/29/30/31/33/34). Run as 'On your computer' task for direct network.

## 2026-07-24 — GO — Stage 1 begins
- Owner-rep approved Build Spec v1.0 + SPEC-DEFAULTs and said GO.
- Repo created via GitHub web (cloud sandbox cannot push directly — see design folder 02 log).
- Files: package.json, server.js (zero-dep shell + /health for the Q74 watchdog),
supabase/migrations/0001_core.sql (core schema + append-only event log), docs/EVENT_TAXONOMY.md.
- NEXT: run 0001 in Supabase SQL editor, deploy to Railway, custom domain + GoDaddy CNAME.
- Standing note: build blocks should run as 'On your computer' tasks so pushes/deploys are direct.
