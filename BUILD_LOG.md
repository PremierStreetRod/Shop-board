# BUILD_LOG — Shop Board
Chronological build journal. Every work chunk gets an entry (Q99). Newest first.

## 2026-07-29 — build block 18 CLOSE: full E2E suite PASSED + two hardening patches (v18.1, v18.2)

Supabase's dashboard recovered (the outage was a local screen-saver/automation hiccup on the driving machine, not Supabase — noted for the ops record) and the whole owed suite ran:

- **Step attribution** — proven through the real tap path: started TEST-23702 step 16 as Zz → "Started by Zz · 08:22" rendered; completed it → "Done by Zz · 08:22". Steps seeded complete by SQL correctly show "?" (no tap, no actor — honest).
- **Un-complete, BOTH paths** — while clocked in (step 14, TEST-23701) and via the manager bypass while NOT clocked in (step 16, TEST-23702). Both audited as task.undo. Bonus proof of the lane interplay: un-completed step 14 reappeared in "Running long" with its original old start time; freshly-tapped step 16 did NOT (only 1 hr old) — both lanes filtering exactly as designed.
- **One-tap Switch line** — tapped from the cab screen: Line 2 → Line 3. Rows exact: clock_out_early "Switched lines" @ 15:22:38.717 + clock_in Line 3 @ 15:22:39.717 — the +1.000 s replay-determinism gap to the millisecond. clock.switch audited.
- **Force-out** — the cockpit "On the clock" panel rendered Zz (Line 2 · since 07:28), button closed the interval. ALSO: the audit trail shows the button was already exercised live at 10:56 PM Phoenix on 7/28. **CORRECTION (same day, owner-rep): that was a SONNET session going hands-on with the live system "to get to know it" — NOT the soak test — and he stopped it mid-attempt.** Off the green list: green-list verification is READ-ONLY (red line now in the model-lane rules, file 36). The button did work then too, and the trail exposed C21 — but findings don't excuse the lane breach.
- **Deactivation-close** — deactivated Zz through the real console control while clocked in → interval auto-closed with "Deactivated while on the clock", clock.force_out(cause=deactivation) audited. The block-16 carry-over is now fully proven.

**Two REAL findings, both fixed and deployed same hour:**

- **v18.1 (Q70 hardening):** the 7/28 off-lane session's trail revealed /api/login and /api/pin/set never checked `active` — the grid hides retired accounts but the API would authenticate one by id. Both endpoints now enforce `active=is.true`.
- **v18.2 (C20):** the console's Deactivate/Reactivate fired on a SINGLE tap — no arm(), unlike every other destructive control. Found the hard way: a stray automation tap deactivated a real roster row (Andrew) during the E2E; caught and reversed inside three minutes, full audit trail, zero operational impact (pre-cutover, nobody on the system). Deactivate/Reactivate now require the two-tap "Sure? Tap again" arm like Retire and Reset-PIN.

**Closing state:** Zz retired (production / inactive / PIN cleared — the unknown PIN set during the soak test is gone), 17 active names, zero open intervals, Andrew active, v18.2 = 111786 units / hash 2290481340 on main and deploying. Q99 verify ledger is CLEAR — nothing owed from blocks 16 or 18.

## 2026-07-29 — build block 18: Q107 shipped (task check-off hardening)

**server.js v18 — the Q107 package, same day it was locked.** Four pieces:

- **Step attribution on the floor screens:** every In-Progress step now shows "Started by Chris · 9:14" and every completed step "Done by Aaron · 11:02" (Phoenix time), right under the step. No new capture — started_by/completed_by have been recorded on every tap since the 0001 schema; this surfaces them. Two techs sharing a cab now see each other's work.
- **Manager un-complete (the shared undo, cockpit side):** the cockpit gains a "Recently checked off" lane (last 8 on working cabs) with an Un-complete button. Goes through the same /api/task/state engine as the floor, audited as task.undo with the manager's id; the ONE new allowance is that a manager/admin doing complete→in_progress doesn't need to be clocked in (it's a correction, not floor work). Earned-value nets out automatically — earned = completed steps, so un-completing IS the reversal. Line-mates keep their existing power to just tap a completed step back (that was already live since block 4, broader than Q107's minimum — kept).
- **"Running long" lane:** any step In Progress 4+ hours with no completion shows in the cockpit with who started it and when. Zero crew taps; changes no math; feeds no alarms.
- **One-tap Switch line:** new /api/clock/switch — atomic clock-out ("Switched lines", clock_out_early) + clock-in on the target line, one audited move, claimed_at from the tap (Q103-1). The clock-in lands 1 second after the out so the time engine's event replay is deterministic. Retry-safe: a switch that dies between its two writes is finished (not doubled) by the retry. Floor UI: "Switch line" next to Clock out on the cab screen → tap the line you're walking to.

**Injection integrity:** 11-patch set proven locally before touching the editor (reversing the patches reproduced v17's exact hash 101150/367550921); editor verified byte-exact v18 (111373 units / hash 1063458919) before commit; node --check clean.

**Verified live so far:** deploy ACTIVE and content-verified — POST /api/clock/switch answered with its own v18 guard ("You're not on the clock…", 400) from a not-clocked-in session. **Still owed (Q99 next-verify list):** UI E2E of switch/un-complete/lanes plus the block-16 force-out and deactivation-close paths — all blocked this session by a Supabase dashboard outage (SQL editor unresponsive ~15 min; app itself unaffected, health green throughout). The Zz seed script is written and ready; run the E2E suite first thing next SQL access.

## 2026-07-29 — decision session: Q107 locked (no code shipped)

**Shared-task check-off hardening + one-tap line switch — decided, not yet built.** Owner-rep walked a real two-person-crew scenario in a Sonnet planning thread (two techs on a firewall, one's own door task sitting open); Sonnet wrote it up and escalated per the file-36 lanes; Fable assessed; owner-rep locked. Full detail: file 10, Q107. The package for the future **"task check-off hardening"** block (Fable lane — touches earned-value netting):

- **Task attribution surfaced** ("Started by Chris, 9:14a") — display work; the event log already captures it.
- **Audited un-complete** replaces the device-local 5-second undo: line-mates within a short window, manager anytime from the cockpit, every use logged, engine nets the reversal out of pace/earned-value math.
- **No second-person confirmation** to complete (friction rejected).
- **Manager long-runner flag** — a task In Progress unusually long gets a quiet cockpit flag; zero crew taps.
- **One-tap "Switch line"** — atomic audited clock-out/in, so cross-line helping moves labor truth with the tech. (Same-cab helping needs nothing: cab color runs off clocked labor vs earned value per C15/Q103, so it self-corrects — the keystone that shaped the whole decision.)
- **Pause state DEFERRED** to Q96 calibration design; calibration will use outlier-tolerant medians so stalled spans can't skew standards. Revisit if the pilot demands it.

**Also this session: cross-session stale-read false alarm resolved.** Sonnet reported 00/02/09/36 missing blocks 15–17; fresh byte-verified pulls off the live disk proved all four current — Sonnet's session was reading its pre-commit folder snapshot (the C19 mechanism, read direction). Nothing was overwritten; the stale-stage guard held. Standing instruction for any session whose local reads contradict this log: re-stage and byte-check before believing the read, and treat THIS FILE as the source of truth for build history.

## 2026-07-28 — build block 17 (Fable)

**Wi-Fi retry layer on the floor screens — server.js v17.** The shop floor runs on Wi-Fi, and a dropped packet must never eat a tech's tap (pre-cutover requirement from the foresight sweep). Shipped:

- **sbPost(url, payload)** — shared fetch wrapper injected into the home screen and cab screen (one `netJs` template, one copy of the logic). On a network error or a 5xx it retries with backoff (1s / 2s / 4s / 8s), showing "Wi-Fi hiccup — retrying (n of 4)…" so the tech knows the board heard them. A 4xx (a real answer from the server, like "already claimed") returns immediately — no pointless retries. After 4 failed tries: "Can't reach the board — check Wi-Fi and tap again (nothing was lost)."
- **sbUpload** — same idea for photo uploads (3 tries), wired into the finish-cab photo flow and per-task attachments.
- **Keystone (Q103-1): `claimed_at` is stamped ONCE at the moment of the tap**, client-side, and carried through every retry — so even if the network flaps for 15 seconds, the recorded time is the true tap time, not the retry time. Task taps disable the button while a send is in flight (no double-fire).

**Verified live, not on faith:** pointed sbPost at a dead host (`unreachable.invalid`) from the real cab screen — watched all four ordered retry statuses fire, then the final friendly failure with nothing lost; confirmed `/home` is serving `async function sbPost`. Hash-verified the deploy (101,150 units / 367550921) and node --check clean.

**Deliberately NOT built:** a full offline queue (taps stored on-device and replayed later). That's a Stage-5 call per the C6 rules — the retry layer covers Wi-Fi hiccups; a true offline queue only earns its complexity if the pilot shows sustained outages. On the menu, not on the board.

**Next-block menu (unchanged):** Coyote mapping job (waiting on his first real posts — intake still has only our 2 test rows) · Supabase Realtime · reporting v1 (file 12) · Q83 day start/end switch · EVENT_TAXONOMY.md update for clock.auto_out / clock.force_out (docs pass, green-list). Next-session verify items (Q99): E2E the manager force-clock-out button and the deactivation-close path through the UI.

## 2026-07-28 — build block 16: engine hardening (the risk-sweep package, proven live)

- server.js v16 + migration 0008.
- Event-window fix: board engine now windows clock events from the oldest live cab's start minus 24 h (cap 10,000) instead of a flat last-2,000 read — kills the silent pace-math corruption that would have surfaced ~a month after go-live. Board verified on the new window.
- Forgotten-clock-out sweeper (Q82): boot + 10-minute ticks; closes any interval still open 4+ h past its Phoenix day end, stamped AT 4:00 PM day end (UTC-7 fixed; day-end math unit-tested on 3 edge cases pre-ship); after-hours stints get their own +8 h cap. PROVEN LIVE: seeded stale open interval -> first tick fired exactly at boot+10 min and was REJECTED by the clock_event kind check constraint (schema predated 'clock_out_auto' — the schema doing its job) -> migration 0008 extends the constraint -> next pass closed the interval at exactly 2026-07-27 23:00:00 UTC (4:00 PM Phoenix of its open day), to the second.
- Double clock-in guard: second clock-in refused with a plain message naming the current line (used to silently orphan the first interval) — proven live.
- Deactivation now closes an open interval; cockpit gains an "On the clock" panel with an audited per-person manager Clock-out button (clock.force_out). Shipped; E2E rides on next session's Q99 verify (their shared failure mode — the constraint — is fixed).
- New event types: clock.auto_out, clock.force_out — EVENT_TAXONOMY.md update rides with the next docs pass.
- Test account remained retired throughout (its still-valid session cookie served for API tests only).
- Next: Coyote mapping job (still no developer posts) · Realtime · reporting v1 · offline retry (pre-cutover requirement).

## 2026-07-28 — build block 15 (Fable): navigation restructure — the Sonnet escalation, closed

- server.js v15 closes all three escalated issues: C16 — Manager cockpit top nav with "Admin console" (admin-role only) + TV board + Sign out; C17 — Admin console sticky top tab bar (People · Build steps · Features + Manager/TV/Sign-out cross-links), visible while scrolling, built to grow toward file 21's nine sections; C18 — cab-switch links carry #steps so the ?tpl= reload lands ON the Build steps section (live-verified: scroll lands on-section, not at 0). Same top placement on both consoles per 22.4.
- Rider (risk sweep): the TV board fully reloads itself every 6 hours — long-running browser-tab hygiene.
- E2E as admin on the live domain: Manager top links render, sticky bar anchors work, cab switch verified at scrollY 1211 on-section. Test account retired via console after.
- CORRECTION to the earlier read of the Sonnet session: its file-09 notes WERE on disk — this Fable session's staged copy arrived stale, was misread as "never written," and Fable's edit overwrote Sonnet's version (caught same session by byte-count comparison; substance preserved via Sonnet's BUILD_LOG detail; C16–C18 reconstructed in file 09, incident logged as C19). New playbook guard: compare staged size vs the stage report before editing any recently-touched file.
- Model lanes verdict after their first full cycle: Sonnet found + escalated correctly, Fable fixed; the one failure was in cross-session file handling, now guarded.
- Next: engine hardening package (2,000-event window + forgotten-clock-out tools — Fable) · Coyote mapping job (still no developer posts) · Realtime · reporting v1.

## 2026-07-28 — UX debug pass: navigation issues found + escalated to Fable (Sonnet, no code changed)

- Daniel reported live navigation problems using Shop Board from his iPad as an admin-role user; asked me to reproduce and write up a to-do for Fable.
- Woke Zz Test-Account as role=admin (pin_hash was stale from earlier testing -- wrong-PIN error; cleared pin_hash, re-onboarded through the "choose your PIN" flow, set PIN 4321) to test as admin firsthand.
- Reproduced all three issues live:
  1. **No way back from Manager to Admin.** /manager's only nav links (page bottom) are "TV board" and "Sign out" -- no "Admin" link, even for an admin-role user. /admin links down to "Manager cockpit" but the reverse link doesn't exist anywhere on the page. Confirmed via a DOM read of both screens.
  2. **Admin console has no sub-navigation.** /admin is one long single-page scroll (currently People -> Build steps -> Features, in that order) with the only nav links (Manager cockpit / TV board / Sign out) buried at the very bottom, after all three sections. File 21 specs 9 admin sections total; there's no tab/sidebar to jump between them as more come online. Also violates 22.4 ("same list controls, same icons, same action placement everywhere -- learn it once, know it everywhere").
  3. **Build-steps cab switch scrolls to page top.** Clicking a different cab/product link (47-53 / 55-59 / etc.) in the Build steps section correctly loads that cab's step list (verified the data was right), but resets scroll to 0 above the People section. Confirmed via the page's own performance API -- navigation type is a full page reload to /admin?tpl=<uuid>, not an in-place update, so the browser drops scroll position. Pure scroll bug, not a data bug.
- Retired the test account cleanly after testing: active=false, role='production'; verified the login grid is back to exactly 17 real names.
- **Not fixed -- flagged for Fable per the model-check lane (36):** this is UI/navigation restructuring (a shared nav component across Home/Manager/Admin/TV-board, plus an admin sub-nav), not a small patch on an existing pattern. Full reproduction notes + fix directions logged to 09_Design_QA_and_SelfCheck.md (register C16-C18) for Fable to pick up.
- No server.js or schema changes this session -- pure QA/debug pass.

## 2026-07-28 — housekeeping (Sonnet, block-14 resume verify pass — no new build block)

- Q99 resume protocol run cold-start: pulled BUILD_LOG + last commits, re-checked live app/DB against the log -- zero drift found (server.js v14 live on Railway matching the block-14 commit; migrations 0001-0007 all present; 17 active employees with the test account correctly retired; TEST-23704 still sitting in awaiting_inspection exactly as block 12 left it; coyote_intake has only our 2 test rows -- nothing real from the developer yet).
- Mike's read-back worksheet (Cab_Build_Steps_ReadBack.pdf) has NOT come back yet -- no step-editor work this session.
- Model check: this session ran on Sonnet, not Fable 5 (00_START_HERE directive) -- stayed on the green list only. Two docs/comment-only fixes, no logic or schema touched:
  1. docs/EVENT_TAXONOMY.md had drifted since Stage 1 (still listed aspirational GO-day event names like task.completed, coyote.received, toggle.changed). Grepped every logEvent() call in server.js + queried distinct event_type in the live event_log table -> reconciled to 23 real names (20 have fired at least once; task.undo is wired but unfired live). Rewrote the doc as LIVE vs PLANNED.
  2. server.js's header comment still said "v5" -- corrected to v14 with an accurate one-line summary; verified via a CM6 doc-length diff that only that one line changed.
- Both commits auto-deployed clean (Railway showed the server.js commit ACTIVE + "Deployment successful"; /health returned ok:true/db:true throughout, before and after).
- Next real work still needs either: Mike's read-back (whenever it lands -- green-list safe) or the stronger model for the Coyote mapping job / Realtime / Q83 day switch / notification layer / reporting v1.

## 2026-07-28 — build block 14: per-task notes & photos (file 11 fully implemented)

- server.js v14 + migration 0007: task_note table; task photos reuse build_photo (task_id, kind 'task').
- Every step gets a "+ note / photo" line OUTSIDE the check-off button (documenting never moves task state) -> inline panel: existing notes (append-only, author recorded) + thumbnails + new-note box + phone-camera input (v13 JPEG normalizer applies). Attached steps read "2 attached — view / add".
- Endpoints: /api/task/note (session + clocked-in Q104, build looked up server-side, task.note_added event) and /api/photo/upload extended with task_id.
- E2E live on TEST-23701 (mid-build cab): note + photo saved through the page's own form -> count flipped, note rendered, thumbnail served from the private bucket. Rows + event verified by query; test account retired (17 grid names).
- FILE 11 SCORECARD — all in production: two-step check-off · per-task notes/photos · finish gate (final note + completion photos) · manager inspection · reason-coded rework with time frame · re-inspection rule.
- Next: Coyote intake mapping job (developer's posts expected within days) · Supabase Realtime · Q83 day start/end switch · reporting v1.

## 2026-07-28 — block 12 patch (v13): HEIC photos handled

- Owner-rep catch: iPhones shoot HEIC; desktop browsers can't show it — a raw HEIC would have made broken cockpit thumbnails.
- server.js v13: every photo normalized to JPEG ON THE PHONE before upload (canvas re-encode — the phone that took the HEIC can decode it), long edge capped at 2000 px (~7x smaller in test), rotation corrected from orientation data.
- Server backstop: a raw HEIC that still arrives gets a plain-English 415 instead of a stored-but-unviewable photo.
- Verified live: HEIC POST -> 415 with the friendly message; 3000-px PNG -> 2000-px JPEG (91 KB -> 12.5 KB). Test account retired after.

## 2026-07-28 — build block 12: completion photos (the file-11 gate is whole)

- server.js v12 + migration 0006: PRIVATE cab-photos Storage bucket (app-only access — photos served exclusively through an authenticated route; spec §10 held) + build_photo metadata table (kind finish/task/rework for later).
- Tech side: the finish gate gains a phone-camera photo input (capture=environment, multiple). Photos upload one-by-one with progress, then the finish posts. Q86 soft gate: zero-photo finish warns once, second tap sends; the hard per-product minimum ships with product settings in the admin console.
- Upload mechanics: raw image body (no multipart — zero-dependency rule), 8 MB cap, session + clocked-in required, photo.added event with byte count.
- Manager side: awaiting-inspection box shows tap-to-open thumbnails beside the final note and both inspection buttons — note + photos inspected together per file 11.
- E2E live on TEST-23704: two photos attached -> uploaded -> finish -> cockpit renders both thumbnails from the private bucket; rows + storage paths verified by query. LEFT AS A DEMO: TEST-23704 sits awaiting inspection with its photos — open /manager to see the complete gate.
- Q52 bonus: /api/my-ip echoes the caller's public IP for the on-site egress check at cutover. Candidate SHOP_EGRESS_IP recorded: 38.252.117.231 (from the owner-rep's VPN endpoint; verify via /api/my-ip on shop Wi-Fi before setting).
- Ops note: Railway's build farm had a transient rough patch — one docs-only deploy failed at 'build image' and the v12 build took ~9 min instead of ~90 s. The service stayed online on the prior deploy the whole time.
- Test account clocked out + retired via the console; lockout verified (admin API 403, login grid at 17 real names).
- Next: Coyote intake mapping job (his posts expected shortly) · Supabase Realtime · Q83 day start/end switch · per-task photos/notes.

## 2026-07-28 — build block 11: rework flow (the inspection gate's second outcome)

- server.js v11 + migration 0005: cockpit gains "Send back — rework" on awaiting-inspection cabs — Q77 reason list (rework_reason: Weld quality / Panel fit / Missed step / Surface damage / Other) + note + TIME FRAME in hours. awaiting_inspection -> rework (manager-only, file 18); reason/note/hours/assigned_at stamped on the build; an R-numbered fix task (day_no 0, source 'rework', 0 standard hours — Q85 own bucket, pace/earned untouched) lands at the top of the tech's cab screen with an orange sent-back banner.
- Board: rework tile = dashed orange border + REWORK badge + its own green/amber/red countdown vs the time frame (green <75% used, amber approaching, red over) — file 11 visuals, file 17 voice.
- Resubmit path: all fixes checked -> finish gate returns as "Fixes done — send back for re-inspection" -> back to awaiting_inspection. Rework can NEVER jump straight to production_complete — enforced in /api/build/complete's accepted-states list, not just the UI.
- Full loop E2E live (fresh TEST-23706, started via cockpit w/ Q97 freeze): finish -> sent back (Panel fit / gaps, 2 hrs, door-gap note) -> cockpit IN REWORK box + board badge/countdown + tech banner/R1 verified -> R1 two-tap -> resubmit -> awaiting -> sign-off -> production_complete. Event trail read back in one query: build.finish(active) -> build.rework_assigned -> build.finish(rework) -> build.production_complete.
- Block-10 carry-overs closed at block open: ZZ TEST STEP hard-deleted; all admin events verified (employee.updated x3, step add/move/retire x1 each, toggle.flipped x2).
- Pick-list tidy: 0002 had Q85 RETURN reasons inside rework_reason — Body Shop kickback + Customer return re-keyed to fixjob_reason (parked for the returned-cab flow), redundant 'Failed inspection' retired.
- File 11's "admin is notified of rework add-ons": event logged now; the actual send ships with the Q106-sandboxed notification layer.
- Test account retired via the admin console; login grid verified at 17 real names.
- Next: Coyote intake mapping job (developer's posts expected within days) · finish-gate photos (Storage) · Realtime board push · Q83 day start/end switch.

## 2026-07-28 — build block 10: admin console v1 (people · step editor · feature switches)

- server.js v10: /admin, admin role only. PEOPLE: dept/role/usual-lines editing, deactivate/reactivate (Q70), C18 PIN reset (clears pin_hash → Q68 choose-your-PIN re-onboard). BUILD STEPS: the Q97 editor — rename/renumber/hours/day/reorder (sort_order swap)/retire-not-delete/add, per family; template edits shape FUTURE cabs only (started cabs keep their frozen copies). FEATURES: Q65 toggles with plain-language labels, flips stamped changed_by/changed_at + event-logged.
- New events: employee.updated · pin.reset · template.step_updated / step_moved / step_retired / step_added · toggle.flipped. (EVENT_TAXONOMY.md update rides with the next docs commit.)
- Destructive buttons use a two-tap arm ("Sure? Tap again") — no browser dialogs, per kiosk/automation sturdiness rule.
- E2E live through the page's real buttons: add throwaway step to 47-53 → appears at end → move ↑ → armed retire → gone; time-off toggle OFF→ON round-trip; people-edit save persisted. Cleanup performed through the console itself (Supabase dashboard was hanging): test account deactivated + role dropped, then verified 403 "Admin only" + login grid back to 17 names.
- Pending at next SQL-editor access: hard-delete the retired 'ZZ TEST STEP' row (invisible, zero-impact) and read back the admin event rows (endpoints ok'd; logEvent is fire-and-forget) — part of the next block's resume verify.
- Same-day extras: Cab_Build_Steps_ReadBack.pdf delivered for the manager's read-back (data cross-checked against the live DB, sums exact); product→line mapping confirmed by owner-rep (5557-SM = typo for PSR-5557-SW); Railway upgraded to Hobby.
- Next: Coyote intake mapping job (intake rows → builds w/ product→line routing) · finish-gate photos (Storage) · Realtime board push · rework flow.

## 2026-07-28 — build block 9: Coyote intake endpoint live (the developer has his URL)

- The FileMaker developer picked packet delivery option 1 (HTTPS POST) and asked for the URL — the receiving side was built and shipped the same day.
- server.js v9: POST /api/coyote/order — X-Shopboard-Key secret header (COYOTE_INTAKE_KEY env var on Railway, set this session). Behavior: authenticate → store the payload exactly as received in coyote_intake → 200 OK. Malformed JSON kept raw with parse_ok=false (debug his exports, lose nothing); 2 MB cap; bad key = 401 + console log, nothing stored.
- Migration 0004: coyote_intake raw landing zone (payload jsonb, raw_text, parse_ok, processed_at, order/received indexes) — committed and run.
- Mapping / multi-cab auto-split / dedup deliberately deferred: they run OFF the stored rows in a later block, so the FileMaker side can go live before our mapping exists (packet's "when in doubt, send" stays safe — the zone is append-only).
- Live E2E, all three cases: Coyote-shaped sample (packet §4 names, TEST-23613, Status Queued, Build It selections) → 200 + row stored, payload queryable · wrong key → 401, nothing stored · malformed body + good key → 200, raw preserved. coyote.order_received events logged.
- URL + header + token handed to the owner-rep to pass to the developer privately. Token rotates at cutover with the other keys.
- Next: the intake MAPPING job (intake rows → builds, auto-split .1/.2/.3, needs-setup queue) is the natural follow-on once his test posts start landing · finish-gate photos (Storage) · admin console skeleton · Realtime · rework flow.

## 2026-07-28 — build block 8: the finish flow, live and verified

- server.js v8 deployed (auto-deploy on the v8 commit): when every non-background step is checked off, the cab screen shows the finish gate — final note + "Finished — send for inspection" -> POST /api/build/finish (guards: session, clocked-in per Q104, cab active, zero open steps) -> state awaiting_inspection + final_note stored + build.finish event (note in payload).
- Manager cockpit renders awaiting cabs in a highlighted box with the final note and "Inspected — sign off"; /api/build/complete now accepts active OR awaiting_inspection and logs from_state, so both sign-off paths work.
- TV board: a line with an awaiting cab shows a 100% tile reading "AWAITING INSPECTION — ready for sign-off", ON DECK still visible.
- DB change: `alter table build add column final_note text` (run in the SQL editor; belongs to the v8 shape).
- Full E2E on the live domain: test account -> clock in Line 3 -> finish gate rendered -> note submitted -> board showed AWAITING INSPECTION + ON DECK TEST-23706 -> clean End-of-shift clock-out (event pair verified) -> manager sign-off -> TEST-23705 production_complete, Line 3 clear. Event trail verified in event_log: build.finish + build.production_complete (from_state: awaiting_inspection).
- Mid-block interruption (session storage filled) recovered per the Q99 resume protocol: verified the prep SQL and the deploy against reality before continuing — no drift found.
- Test account retired again (inactive, role production; 17 real names on the grid).
- Deferred: finish-gate photos wait on Supabase Storage plumbing.
- Next-block menu: gate photo upload (Storage) · admin console skeleton (Q65 toggles UI, Q97 editors) · Supabase Realtime replacing the 30-s board poll · rework flow · Coyote packet handoff on GO.

## 2026-07-25 — Build block 7 — on-deck + promised dates; carry-overs cleared
- Test account retired (inactive, role production; 17 grid names verified).
- Cockpit buttons rebuilt: per-button onclick + disabled/'Working…' states + network-error message (delegated listener removed; endpoints were already proven).
- Board v7: every cab tile shows 'Promised YYYY-MM-DD · X hrs of work left' (promise FIXED per Q103-6; remaining = standard man-hours v1) + each line's ON DECK cab (C19 single-owner).
- Live-verified: L1 amber 07-29/29.0 left · L2 green 07-30/64.0 · L3 fresh 96.0 + ON DECK TEST-23706 · L4 07-30/80.0.
- NEXT: tech finish flow (note+photos -> awaiting_inspection) · admin console skeleton (Q65/Q97) · Coyote packet handoff (Stage 4) · Realtime board push.

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
