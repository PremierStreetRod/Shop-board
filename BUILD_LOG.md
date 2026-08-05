# BUILD_LOG — Shop Board
Chronological build journal. Every work chunk gets an entry (Q99). Newest first.

## 2026-08-05 — block 67: reports drill-downs — product→cabs, person→days (v67, no migration)

The reports page's two summary tables are now expandable. Clicking a row in "Actual vs standard — by product" opens a nested table of that product's individual signed-off cabs (order · cab# · line · std · actual · var · completed · signed-off-by); clicking a row in "Labor — clocked hours per person" opens that person's daily timecards (date · in · out · paid · shop · notes). Pure client-side toggle (dtoggle(), inline onclick — CSP unsafe-inline per blocks 45/46) over data already on the page (d.cabs grouped by part, d.timecards by name) — no new endpoint, query, write, or migration. v67 = 394,936 / 2796058343 (commit 5b0eae3; 4 hash-gated find/repl edits from v66, reversal-proven byte-exact — the reversal check caught a 2-char boundary bug in the r4 anchor before injecting, fixed + re-proved). Verified LIVE on the signed-in /reports page: a real click on PSR-6772 expanded to its 3 cabs, a second click collapsed it. Also delivered this session: a QuickBooks-export requirements PDF for accounting.

## 2026-08-05 — block 66: reports on-time trend, 6-month (v66, no migration)

New "On-time trend" lane on /reports: the last 6 Phoenix months (independent of the window picker), each month showing Shipped (throughput = cabs signed off), On-time % (inline CSS bar, green ≥90 / amber ≥75 / red) and Avg days late. Computed in reportData() from the completion + promise data already loaded — no extra queries, no new writes. v66 = 393,143 / 463784198 (commit fd9ffd8; 2 hash-gated edits from v65, reversal-proven). 11/11 unit tests (6-month window + year rollover · bucketing · per-month pct/avg-late · boundary=on-time · no-promise→null · >6mo excluded · active excluded). Verified LIVE render on /reports.

## 2026-08-05 — block 65: reports depth — on-time % + downtime-by-reason (v65, no migration)

Two new /reports lanes. On-time delivery %: of cabs signed off in the window, the % that finished on/before promised_finish (green/amber/red headline, on-time vs rated counts, avg days late, and a late-cabs table; cabs with no promised date are counted separately, not scored). Downtime by reason: production hours lost to "down for today" holds — each hold runs from when placed until a clock-in resumed that line the same day, or the shop's close if it stayed down (reuses dayEndOf + shopHours().close) — summed by reason with count + share. v65 = 390,465 / 543589994 (commit 3ea0c1a; 3 hash-gated edits from v64, reversal-proven). 15/15 unit tests (on-time on/late/no-promise/boundary/days-late/pct/avg; downtime resume-bounded/close-bounded/after-close→0/cross-line-isolation/window/reason-totals). Verified LIVE render.

## 2026-08-05 — block 64: Coyote intake inbox + order-number extractor fix (v64, no migration)

Track A of the post-caught-up game plan — the Coyote mapping job's FOUNDATION, built cadence-agnostic so the developer's change-only-vs-full-record decision won't invalidate it. (1) Fixed the intake order-number extractor in /api/coyote/order: the real payload nests the order under `order` (order.order_number); the old bare parsed.order fallback stringified that object → stored "[object Object]". Now reads the nested number and only accepts `order` when scalar. (2) New admin-only /intake page (gate mirrors /integrity): the fresh Coyote intake collapsed to the latest record per order # (change-history latest-wins), each order showing customer · status · date · cab part(s) · routed LINE (product.lines) · exception flags (needs-setup · multi-cab · check-status · blazer-top); KPI strip + a routing-map reference (family→line). Writes NOTHING — the human-in-the-loop staging view the mapper builds on; the "create the build record" write step waits for the finalized push contract. Linked from the admin console nav. v64 = 385,370 / 1117756968 (commit 513aa5e; 4 hash-gated edits from v63, reversal-proven). 18/18 inbox-reducer + 11/11 extractor unit tests. Verified LIVE render of /intake.

## 2026-08-04 — block 63: Q84 manager-integrity diagnostics — admin-only (v63, no migration)
- Owner-rep pick (the design-heavy one). Q84 (file 25): once a bonus rides on "keeping lines green," the player-coach manager — who shares the bonus AND holds the pause buttons — is inside the circle of temptation, so his integrity-sensitive actions must surface ABOVE him, to the ADMIN. Structural defenses were already built (bonus keys off the fixed promised finish, not pace color; clock-in on a held cab auto-resumes it — block 33). This block builds guards 3 + 4: the defensive-hold diagnostics + the manager-override summary. It FLAGS; humans JUDGE — never a floor-facing number, never auto-punishment (the escalation principle).
- NEW admin-only page /integrity (role must be ADMIN, not manager — the manager is inside the circle), linked from the admin console nav, reusing the reports period picker (last 7/30/90/mtd). Everything DERIVED from the append-only event log + clock events; writes nothing. No migration.
- FOUR sections: (1) Manager actions this period — per person: down-for-today holds placed, clock corrections made (punch.moved/voided/added), cabs signed off, and amber-flagged SELF-SIGNS. (2) Held then worked — a line marked "down for today" that a clock-in RESUMED the same day (the line.down_resumed event = the defensive-hold tell); each row shows the line, who HELD it (latest line.down on that line before the resume), who resumed it, and when. (3) Self-signs — sign-offs where the signer was clocked onto that cab's line DURING its build (a line runs one cab at a time, so a clock-in on the line between start and sign-off means the inspector was also a builder). (4) Hold reasons — the reason mix on holds (skew visible, share %).
- Framing copy makes the coaching-not-punishment intent explicit ("These flag; you judge. Nothing here is auto-acted on and none of it ever reaches the floor…"), + a footer naming the deferred pieces.
- CODE: v63 = 374,843 units / hash 1245633022, commit 7d290c1. 3 hash-gated editor edits from v62 (start-gate 362400/1502291826; forward-apply of 3 unique-anchor pairs = v63 exactly; b64 integrity hash checked in-editor before apply; dual-hash gate on dispatch). node --check clean. Pairs via difflib.get_grouped_opcodes, round-trip byte-exact in Node AND through the browser decode path. Inline styles only (enforcing-CSP allows style-src 'unsafe-inline').
- VERIFY: 15/15 unit tests (integrity_test.js) mirroring integrityData's EXACT aggregation shape — per-actor tallies · all three punch-correction types · role-label mapping · sort by total desc · held-then-worked (latest hold before resume wins; none → em-dash) · self-sign (clocked onto the signed cab's line inside [start,signoff]; different line = not; clock-in after sign-off = not) · reason distribution (sorted, missing → em-dash) · empty period no-throw. LIVE (owner-rep signed-in ADMIN): /integrity renders all four sections on REAL audit data — Zz T. shows 1 hold / 8 clock corrections / 4 sign-offs / 3 self-signs (amber flag); Held-then-worked shows Line 4 (K5 Blazer) held+resumed by Zz on 2026-07-31 14:22; Self-signs lists TEST-23703/23705 (Line 3) + TEST-23701 (Line 1); the self-sign join correctly flagged 3 of the 4 sign-offs (the 4th, TEST-23706, was NOT on a line Zz was clocked onto). /health green. No honest-limit gap on the render — the flags themselves are demonstrated live on real data, all GET no writes. Admin allow path confirmed live; the manager-403 deny path is code-only (no second account to exercise).
- Backup + MANIFEST → v63 (no migration). Q84 guards 3+4 BUILT (structural defense + guard 1 auto-resume were already live). DEFERRED to v2 (in the page footer + honestly): holds placed right at a green→amber turn (needs pace snapshots the app doesn't store) + per-person rates scored against a shop baseline. Zz test account still intentionally ACTIVE (do NOT retire — and it's the perfect self-sign demo). NEXT: owner-rep's pick. Coyote mapping job PREEMPTS when the dev's first REAL post lands.

## 2026-08-04 — block 62: Q86 admin sign-off tag — who passed steel (v62, no migration)
- The last open Q86 piece. Q86's manager-out decision: when the one manager is out his duties flow UP to Admin, and "admin-performed sign-offs are tagged 'admin sign-off' in the cab record ... so the record always shows who passed steel." Duties-flow-up is already covered (admin is a manager superset); this block builds the explicit tag + shows WHO signed off.
- /api/build/complete now records `by_role: me.role` on the build.production_complete event (the signer's role, captured AT sign-off). actor_id (WHO) was already stored by logEvent. So going forward each sign-off knows both who and their role at the time. No migration — by_role rides the existing JSON event payload.
- Resolution (shared shape in reportData + the /meeting route): the signer = the actor on the LATEST production_complete event per cab (same last-wins rule as the sign-off timestamp). Role = the captured by_role, FALLING BACK to the signer's CURRENT role for events logged before this block. byAdmin = (role === 'admin').
- SURFACES — the two places completed cabs are reviewed: (1) Reports "Signed-off cabs — the detail" gains a "By" column (signer name; an amber "admin sign-off" chip when byAdmin); the cabs CSV gains "Signed off by" + "Admin sign-off" columns. (2) Meeting Pack "Completed — last 7 days" — each row now reads "· by <name>" + the chip when an admin signed it. Manager sign-offs (the norm) just show the name — the chip is the exception flag (same spirit as a self-signed marker).
- CODE: v62 = 362,400 units / hash 1502291826, commit 6c15962. 8 hash-gated editor edits from v61 (start-gate 360707/1522249140; forward-apply of 8 unique-anchor pairs = v62 exactly; b64 integrity hash checked in-editor before apply; dual-hash gate on dispatch). node --check clean. Pairs via difflib.get_grouped_opcodes, round-trip byte-exact in Node AND through the browser decode path before injection.
- VERIFY: 12/12 unit tests (signoff_test.js) mirroring the EXACT reportData signerOf/cabs shape + the /meeting completed shape — manager name+no-tag · admin tagged · no by_role → fallback to current role · signed twice (rework loop) → LAST wins · unknown build em-dash · missing employee row still tags by by_role · meeting name/empty resolution. LIVE (owner-rep signed-in admin): /health green + db:true; Reports "Signed-off cabs" shows the new By column with the signer on all 3 signed-off TEST cabs ("Zz T."); Meeting Pack completed shows "· by Zz T."; CSV header carries the two new columns. Honest limit: every signed-off cab was signed by Zz (current role Team Member/production → a pre-block-62 event, resolves via fallback to a non-admin role → correctly shows NAME + NO tag), so the "admin sign-off" CHIP couldn't be shown live — no cab has been signed off by an admin and I did not fabricate a sign-off (a write). Admin branch unit-proven; manager/name path confirmed live on all three surfaces. (Good illustration of why by_role is captured at sign-off going forward — a signer's role can change, as Zz's evidently did.)
- Backup + MANIFEST → v62 (no migration). Q86 is now FULLY BUILT (photo-min v49 · phone hand-off v50-v52 · TV sleep v59 · admin sign-off tag v62). Zz test account still intentionally ACTIVE (do NOT retire). NEXT buildable-now: Q84 manager-integrity diagnostics (design-heavy) — or owner-rep's pick. Coyote mapping job PREEMPTS when the dev's first REAL post lands.

## 2026-08-04 — block 61: finish projections on the floor + cockpit (Q92 pt 2, v61, no migration)
- Owner-rep pick from the block-60 menu: take the block-57 projected-finish dates OFF the coverage page alone and put them where a manager actually looks — the Meeting Pack floor + the manager cockpit. The projection was already trusted (block 57, shipped + live-verified); this block is reach, not new math.
- NEW shared helper cabProjections(board) — the ONE source of truth. Given the live board it does its own light reads (shop calendar, approved time off, per-line crew) and returns each in-progress cab's projection (coverage-page shape) + a byOrder map keyed by order number, using projFinish for the math. Every horizon day object carries `date` (the v58 regression: a missing date made projFinish return undefined — guarded + unit-tested).
- /coverage REFACTORED to call the helper (was ~30 lines of inline projection), so the coverage page, the Meeting Pack floor, and the cockpit are now guaranteed identical — no drift. The 14-day coverage grid is untouched.
- Meeting Pack floor (/meeting): each active line reads "… day 3/6 · finishes Fri Aug 7" (coverage wording for pushed/at-risk). Awaiting-inspection / fix-job / idle lines show nothing (no remaining build-days) — correct.
- Manager cockpit (/manager): each ACTIVE line card gains "· finishes <date>" after "· active" (amber "· pushed N days by time off", muted "· N at-risk days ahead"). One extra internal board read on the cockpit (it didn't fetch the board before); /meeting reuses the board it already had.
- NEW pure projPhrase(p) renders the compact phrase (wrapping up / beyond the horizon / finishes DATE + pushed/at-risk), reused by both surfaces. Server-generated values only (formatted date + ints) → safe un-escaped.
- CODE: v61 = 360,707 units / hash 1522249140, commit c44b5e9. 8 hash-gated editor edits from v60 (start-gate 357292/3940953020; forward-apply of 8 unique-anchor pairs = v61 exactly; b64 integrity hash checked in-editor before apply; dual-hash gate on dispatch). node --check clean. Pairs via difflib.get_grouped_opcodes, round-trip byte-exact in Node AND through the browser decode path before injection. NO migration.
- VERIFY: 22/22 unit tests (proj3_test.js) — projPhrase all branches + cabProjections core (byOrder keying · fix_job/idle/awaiting excluded · whole-crew-off = lost day pushes date · partial crew = at-risk not lost · holiday override shifts date · empty/null board no-throw · date-shape v58 guard). Block-57 proj_test 15/15 + cov_test still green (refactor didn't change the math). LIVE (owner-rep signed-in admin): /health green + db:true; all THREE surfaces render the SAME projections for the 3 active TEST cabs — Fri Aug 7 / Mon Aug 10 / Tue Aug 11 (remaining 3/4/5 build-days over open shop days, weekend skipped); cockpit on each active card, Meeting Pack floor inline, and the awaiting-inspection cab (Line 4) correctly shows NO projection. No honest-limit gap on the render — all GET, confirmed live.
- Backup + MANIFEST → v61 (no migration this block). Q92 pt-2 planning views now reach the two surfaces owner-rep uses most. Zz test account still intentionally ACTIVE (do NOT retire). NEXT buildable-now: Q86 admin sign-off tag · Q84 manager-integrity diagnostics — or owner-rep's pick. Coyote mapping job PREEMPTS when the dev's first REAL post lands.

## 2026-08-04 — block 60: Q85 fix job — returned / kicked-back cabs (v60, migration 0026)
- Owner-rep: "do the q85 fix." Q85 = a cab that was ALREADY signed off (production_complete) has to come BACK — a Body Shop kickback or a customer return. It now re-opens its ORIGINAL record in a new first-class state fix_job (never a new build, so history is kept and pace isn't double-counted). AskUserQuestion (floor model): "Runs alongside (simpler)" — a fix job shows on its line's cab screen next to normal work, it does not seize the line.
- A fix job is reason-coded (kickback / customer_return + a fixjob_reason pick), carries its OWN wall-clock deadline (fix_hours) and its OWN 0-standard-hour bucket (source='fix' task — line pace / earned-hours never gain from fix work, same discipline as rework), and must pass RE-INSPECTION (the normal manager sign-off) to close; closing clears all fix_* fields + logs build.fixjob_closed and re_inspection:true on the production_complete event.
- Manager cockpit: new blue "Returned for fix — kickbacks & customer returns" lane (#fixjob) — open fix jobs + an "Open a fix job on a returned cab" form (pick a recently signed-off cab, kind, reason, line [defaults to the cab's original line], fix-within hrs, note → POST /api/build/fixjob). Endpoint manager/admin only, guards state==='production_complete', logs a "sign-off escape", notifies the chosen line's techs (Q106 sandbox still routes notifies to owner-rep).
- Cab screen: blue "⟲ RETURNED FOR FIX — [kickback/customer return] · reason · within N hrs" banner, "FIX — do these first" day-0 header, "Fixes done — send back for re-inspection" finish button. Tech cab-query surfaces a fix_job cab non-displacingly (an active/rework build still wins the slot).
- TV board (board-state): fix_job cab gets badge "FIX JOB", countdown = ELAPSED wall-time since the fix opened vs fix_hours (green/amber/red), status "Returned for fix — …", kept OUT of pace math (done/total/remaining shown "—"/"0.0", day 0).
- Reports: new "Sign-off escapes (N in period)" lane — build.fixjob_opened in the window, split kickback vs customer return + by reason.
- Migration 0026 adds fix_kind/fix_reason/fix_note (text), fix_hours (numeric), fix_assigned_at (timestamptz) to build + seeds the fixjob_reason pick list. Ran in Supabase FIRST (columns SELECT-verified).
- CODE: v60 = 357,292 units / hash 3940953020, commit 493af8d. 18 hash-gated editor edits from v59 (start-gate 344259/3753838255; forward-apply of 18 unique-anchor pairs = v60 357292/3940953020 exactly; dual-hash gate on dispatch). node --check clean. Pairs via difflib.get_grouped_opcodes, round-trip byte-exact in Node before injection.
- VERIFY: fix-job logic unit-tested 15/15 (open guards state/kind/reason · 0-hour own bucket · elapsed-vs-frame countdown color · re-inspection close clears fields + logs escape · non-displacing surfacing · pace excludes fix). LIVE (owner-rep signed-in admin): /health green + db:true; /api/build/fixjob route EXISTS + passes auth/role, 400 on bad build_id (old code would 404) — no write; manager cockpit renders the blue lane + working open-form (order picker lists signed-off cab TEST-23706, kind kickback/customer_return, reason, line defaults, fix-within hrs, note, "Open fix job"); Reports shows "Sign-off escapes (0 in period)". Did NOT submit a test fix job (read-only). Honest limit: a real kickback→fix→re-inspection cycle on the floor is owner-rep's to walk; state machine unit-proven + every surface confirmed rendering live.
- Backup + MANIFEST + migrations → v60/0026. Stage-2 deferred: forced line-interruption auto-hold (needs a cab-pause state) + precise fix-hours own-bucket reporting. Zz test account still intentionally ACTIVE (do NOT retire). NEXT buildable-now: Q86 admin sign-off tag · Q84 manager-integrity diagnostics · finish projections on Meeting Pack floor + cockpit — or owner-rep's pick. Coyote mapping job PREEMPTS when the dev's first REAL post lands.

## 2026-08-04 — block 58: Q86 TV sleep schedule (v59, migration 0025)
- An owner-decided (2026-07-23) but still-unbuilt Q86 default: the shop-floor TV board should DIM/SLEEP outside working hours and on closed days (screen burn-in + power) and WAKE when the shop opens. Picked as a clean "keep building while we wait for Coyote" block — self-contained, reuses the shop hours + the block-53 shop calendar, no engine touch. (Chosen after confirming Q107's parts — attribution display, un-complete, long-runner flag — are already built.)
- board-state now returns tv:{asleep,message}. asleep = the tv_sleep toggle is ON AND it's NOT (a work day AND within shop open→close hours) AND nobody's on an approved after-hours session. Uses isWorkDay (calendar-aware — sleeps on holidays too) + the admin shop hours. Message: "Shop closed today" (non-work day) · "Opens H:00 AM" (before open) · "Closed for the day" (after close). Never sleeps on a toggle-read error.
- The TV board (/board) gained a near-black full-screen SLEEP overlay (z-9999) with a dim, slowly-drifting clock (burn-in-safe) + the wake message + "SHOP BOARD — asleep · tap to peek". The client shows/hides it off s.tv.asleep on every refresh (SSE + 30s poll, so it sleeps/wakes within ~30s of the boundary). TAP anywhere = peek for 20s then it re-sleeps.
- Admin control: a new tv_sleep feature toggle (default ON) — added to TOGGLE_INFO ("Sleep the TV after hours") so it renders in Admin → Features; turning it OFF keeps the board always on. board-state treats a MISSING row as ON, so the code is safe even before the seed. Migration 0025 seeds tv_sleep=true (idempotent not-exists insert).
- CODE: v59 = 344,259 units / hash 3753838255, commit 2b94f8f. Deployed as 4 hash-gated editor edits from the v58 baseline (byte-verified: reconstructed v58 = 4273196445, forward-apply = v59 3753838255; dual-hash gate on inject). node --check clean. Migration 0025 ran in Supabase FIRST (SELECT-verified: tv_sleep=true, 1 row).
- VERIFY: the asleep decision unit-tested 10/10 (weekday in-hours → awake; before open → asleep "Opens 7:00 AM"; after close → "Closed for the day"; exactly 4:00pm → asleep [close exclusive]; exactly 7:00am → awake; holiday/non-work day → "Shop closed today"; after-hours session → awake; toggle OFF → awake; custom hours + AM/PM formatting). LIVE: /health green; board-state returns tv.asleep=false right now (≈1:00pm Phoenix, work day, shop open — correct); the /board overlay + client wiring deployed. The dark overlay only shows outside hours, so I forced it on the LIVE board via the console (DOM-only, zero writes) to confirm the render — it shows the dim clock + "Opens 7:00 AM" + tap-to-peek exactly as designed — then restored the board. Honest limit: the automatic sleep/wake at the real 4:00pm / 7:00am boundary + a physical-TV tap-to-peek are owner-rep's to see on the actual TV.
- Q86 TV-sleep done. CARRIED: server.js header comment still says (v50) — cosmetic. NEXT: Q123 pre-cutover security break-pass, or owner-rep's pick. Coyote mapping job preempts when the dev's first REAL post lands.

## 2026-08-04 — block 57: Q92 pt 2 — finish-date projections (v57→v58, no migration)
- The last Q92 pt-2 planning piece: each in-progress cab now shows a PROJECTED FINISH DATE on the coverage page, and an approved absence of the cab's line crew pushes that date out — so a manager sees a slip coming instead of at 7am. Design set with owner-rep (2026-08-04): base = remaining build-days counted forward over OPEN shop days (skips weekends/holidays via the shop calendar; the app had NO computed finish date before — promised_finish is fixed at start, Q103-6); absence impact = "whole lost days only" — a day the cab's LINE crew is ENTIRELY off is a lost day (+1), a day where only SOME are off is flagged "at risk" but does NOT move the date.
- NEW pure helper projFinish(days, remaining): walks the cab's line horizon (tomorrow onward); an open day where the whole assigned crew is off is a LOST day (no progress); any other open day is productive; the (remaining)-th productive open day is the finish. Returns {finish, lostDays, atRiskDays, ranOut} — pure + testable.
- The /coverage route gained a "Cabs in progress — projected finish" section: reads the live board (internal /api/board-state), and per active/rework cab computes remaining = total_days − day, maps the line's assigned crew (employee.lines, role production), builds a 180-day horizon of open/lost/at-risk days, and projects the finish. Renders order · line · family — <finish>, with "· pushed N days by time off" (amber) when an absence moved it or "· N at-risk days ahead" (muted) for partial-coverage days in the window. Lines with no assigned crew get a pure-calendar projection. Coverage queries widened 14ᆒ180 days. Read-only, outside the Q106 sandbox, no toggle.
- CODE: v58 = 341,131 units / hash 4273196445, commit 04dcccb. v57 (341,122 / 1376932051, f87cadb) = the feature (4 hash-gated edits from v56, byte-verified); v58 = a one-line fix. node --check clean. No migration.
- BUG CAUGHT LIVE (reason for v58): v57's route built each horizon day as {open, allOut, someOut} but OMITTED `date`, so projFinish returned finish:undefined and every cab rendered "beyond the horizon". The unit test PASSED because its day objects DID include `date` — a test/route shape mismatch node --check can't see. The live signed-in E2E surfaced it (all 3 cabs "beyond the horizon" despite remaining 3/4/5). Fix: add `date: d` to the route's day object (v58). Lesson: unit tests must mirror the EXACT object shape the route builds.
- VERIFY: projFinish unit-tested 15/15 (base calendar count over weekends/holidays; whole-crew lost days pushing the date; partial at-risk days NOT moving it; worked-Saturday override adds a day; remaining-0 "wrapping up"; no-crew pure calendar; unrelated absence no effect) + a regression test proving the route-shape day object resolves. LIVE signed-in admin E2E (pure GET, no writes): after v58, /coverage projects the three active TEST cabs at Fri Aug 7 / Mon Aug 10 / Tue Aug 11 — exactly remaining 3/4/5 build-days counted forward over open shop days (weekend skipped), all green (no time off scheduled); 0 "beyond the horizon"; /health green. No honest-limit gap on the render this block.
- Q92 pt-2 planning views COMPLETE (Meeting Pack 55 · coverage calendar 56 · finish projections 57). Only the OPTIONAL Monday auto-push of the Meeting Pack remains under Q92 (notification-layer, waits for cutover / NOTIFY_LIVE). CARRIED: server.js header comment still says (v50) — cosmetic. Coyote mapping job preempts when the dev's first REAL post lands.

## 2026-08-04 — block 56: Q92 pt 2 — the coverage calendar (v56, no migration)
- Continues Q92 pt 2 (block 55 shipped the Meeting Pack). This builds the days-ahead visual COVERAGE CALENDAR owner-rep asked for — so a manager sees a thin day coming instead of finding out at 7am. Reuses the block-53 shop-calendar work-day rule + the Q92 pt-1 approved-time-off data. Pure read view, no migration.
- NEW /coverage page (manager+admin, same liveSession + must-change-pin gate as /meeting; "Coverage" nav link added to BOTH the manager cockpit and the Meeting Pack). Shows the next 14 days: each day a colored dot + weekday/date, and either the coverage line ("N of M builders in" + who's out with their reason, or "full crew in") or "Closed — <reason>" for a non-work day. Today's row is highlighted.
- Work-day rule is the shared shop-calendar primitive: a shop_calendar override wins (holiday CLOSED / worked-Saturday OPEN, shown with its reason), else Mon-Fri open, weekend closed ("Weekend"). The calendar the admin already manages drives this view.
- Coverage math: builders = active employees with role 'production'; present = builders − production people approved off that day. Dot: green full crew · amber someone out · red thin coverage (present < half the crew, or nobody in) · slate closed. A manager out shows in the day's out-list but doesn't change the builder count (the count is explicitly "builders in"). Prints cleanly (@media print).
- Read-only — nothing goes out, outside the Q106 sandbox, no toggle (always available to manager+admin). Same shape as the Meeting Pack.
- meetingPage-style coveragePage(now, days, builderCount) is a pure render; the /coverage route does the gather (role gate, build 14 Phoenix dates, shop_calendar overrides+reasons, approved time_off_request overlapping the window, active roster names+roles, assemble each day).
- CODE: v56 = 336,421 units / hash 4064865896, commit c02faa1. Four hash-gated editor edits (reconstructed v55 = 863210913 exactly, forward-apply = v56 byte-for-byte; the inject gated on BOTH the start hash v55 and the result hash v56 before commit). node --check clean. No migration.
- VERIFY: unit-tested the day/coverage assembly 22/22 (builder count excludes managers; override CLOSED wins on a weekday holiday; override OPEN turns a Saturday into a work day; weekend default closed with "Weekend"; time-off overlap by date range; present/thin math incl. the exactly-half boundary; today flag; weekday labels). THEN a real LIVE click-through (the browser held a signed-in ADMIN session; a pure GET, no writes): /coverage returned 200 and rendered the full 14-day page ("13 of 13 builders in" on work days, "Closed — Weekend" on all four weekend days, today highlighted); the "Coverage" nav link is present on both /manager and /meeting; a bogus path 404s; /health green. No honest-limit gap on the render this block.
- STILL Q92 pt 2: the absence-fed finish-date projections (adjust a cab's projected finish when a builder is out — touches the board's date math, its own careful block) + the optional Monday auto-push of the Meeting Pack. CARRIED: server.js header comment still says (v50) — cosmetic. Coyote mapping job preempts when the dev's first REAL post lands.

## 2026-08-04 — block 55: Q92 pt 2 — the Meeting Pack (v55, no migration)
- Continues Q92 (pt 1 = the time-off request→decide loop). Owner-rep's Q92 note wanted an on-demand, always-current "Meeting Pack" for the sometimes-floating Monday meeting — a button you pull up when the meeting starts, not a scheduled artifact. This builds that. No migration.
- NEW /meeting page (manager+admin; "Meeting Pack" link added to the cockpit header; liveSession + must-change-pin gated like /manager). It reads the SAME live board the TV uses (internal fetch to /api/board-state — zero drift with the floor) and lays out four plain sections: (1) Right now — the floor: every line, its cab (order # · line), pace color, % done. (2) Finishing — awaiting sign-off: the awaiting_inspection cabs. (3) Completed — last 7 days: production_complete events over the last 7 Phoenix days, each with order # + product family (joins the build row). (4) Who's out — upcoming: approved time_off_request rows with end_date >= today (reuses Q92 pt-1 data).
- Prints cleanly — an @media print block strips the chrome so it drops straight into a meeting handout / PDF.
- Read-only: nothing goes OUT, so it's outside the Q106 sandbox and needs no toggle. The optional Monday auto-push is deliberately NOT built — owner-rep said the button IS the feature.
- meetingPage(now, board, awaiting, completed, out) is a pure render; the /meeting route does the gather (role gate, board-state fetch, familyOf, the awaiting slice, the last-7-days production_complete query, the approved-and-current time-off query). No new event types, tables, or toggles.
- CODE: v55 = 329,218 units / hash 863210913, commit 5a8fe44. Hash-gated editor edits (reconstructed v54 = 336582976 exactly, forward-apply = v55 byte-for-byte). node --check clean. No migration.
- VERIFY: /health green after deploy (new route + meetingPage booted clean). Reuses the TV's own board engine + the block-19/34/49 queries. HONEST LIMIT: /meeting is login-gated (manager/admin PIN the harness won't type), so the rendered page wasn't click-tested through a signed-in session — proven at the code+data layer, deploy healthy.
- CARRIED: server.js header comment still says (v50) — cosmetic. STILL Q92 pt 2: the days-ahead visual coverage calendar + the absence-fed finish-date projections (both reuse the shop calendar + this time-off data); the Monday auto-push is a third future option. Coyote mapping job preempts when the dev's first REAL post lands.

## 2026-08-04 — block 54: Q91 block 2 — the four proactive touches (v54, no migration)
- Completes Q91. Block 53 built the shop calendar + day-start nudge (and the daily-scheduler pattern); this block wires the four smart touches owner-rep chose, all reusing that scheduler + isWorkDay, all OFF by default (toggles already seeded), all Q106-sandboxed to the owner-rep until go-live.
- MORNING PRE-BRIEF (morning_prebrief, ~6:55): a one-line floor summary to managers before the day — "N cabs in progress · M awaiting inspection · K out today."
- INSPECT-BEFORE-CLOSE (inspect_before_close_nudge, ~3:45): a nudge to sign off any awaiting-inspection cab before the 4:00 close so none sleeps overnight. Silent if none is waiting.
- LINE-FREES-SOON (line_frees_soon_alert): event-triggered in /api/build/finish — when a cab heads to inspection, a manager-facing "line frees up soon" heads-up, distinct from the existing warehouse "pull the next kit" push.
- EARLY-RED STANDARDS GUARD (early_red_standards_guard): folded into the pace patrol. On a red crossing, if the cab is <30% done (went red EARLY — the hour standard is likely too tight, not the crew), it pings managers "check the standard on <order>" instead of the normal "needs help" pace warning. The patrol now reads both toggles and gates each branch; with the guard OFF, pace warnings behave exactly as before.
- Structure: a small shared dailyTouch(eventType, toggleKey, HH:MM, buildMsg) helper (toggle-gate + isWorkDay + 2-hour window + notification_log dedup + builder-veto) drives the two time-based touches, each on a 5-min interval like the day-start nudge. New event types: touch.prebrief, touch.inspect, touch.linefrees, pace.standards.
- Deploy: server.js v54 = 321,960 units / hash 336582976, commit 2ef412e, applied as 3 hash-gated editor edits (reconstructed v53 = 1580491759 exactly, forward-apply = v54 byte-for-byte). No migration (all four toggles already exist). /health green after deploy.
- Verify: logic unit-tested — toggle parsing (pace default-on, early default-off), the red-crossing branch decision (including that pace behavior is unchanged when the guard's off), pre-brief body assembly, inspect veto-at-0 + it/them wording, and the fire windows. HONEST LIMIT: the live pushes need the toggles ON + real triggers (a real early-red crossing, a real finish, a work-day morning) and route to the owner-rep under the sandbox — owner-rep's to exercise; mechanism unit-proven + deploy-healthy.
- Q91 COMPLETE (blocks 53+54). NEXT: Q92 pt 2 (coverage calendar + finish projections + Meeting Pack — reuses the shop calendar), Q123 cutover items, or Q120 pt 2. Coyote mapping job preempts when the dev's first REAL post lands.

## 2026-08-04 — block 53: Q91 shop calendar + day-start nudge (v53 + migration 0024)
- Owner-rep picked Q91 (smart alerts). It's two blocks: the day-start nudge needs to know "is today a work day," and the app had no work-day/holiday calendar (shop hours were only open/close times). So this block built that calendar primitive + the nudge; the four proactive touches are the next block.
- SHOP CALENDAR: a new shop_calendar table + admin "Shop calendar — open & closed days" panel. Default week is Mon-Fri 7-4; mark a date CLOSED (holiday) or OPEN (a worked Saturday). Pre-seeded Thanksgiving 11/26, Christmas 12/25, New Year 1/1 (admin manages the rest). isWorkDay()/calendarOverrides() are the first shared "is this a work day?" primitive — Q92 pt 2 (coverage calendar + finish projections) will reuse them.
- DAY-START NUDGE: dayStartNudge() on a 5-min patrol (same pattern as the pace patrol) fires ONE quiet good-morning to active production+manager on a work day at the set time (Mon 7:35, Tue-Fri 7:05, admin-editable), calendar-aware, restart-safe dedup via notification_log, never nags (skips if >2h late). Ships OFF (day_start_nudge toggle); Q106-sandboxed to the owner-rep until go-live. Endpoints /api/admin/calendar + /api/admin/nudge-times, both admin-only and audited.
- Migration 0024 also flipped early_red_standards_guard OFF (0002 seeded it ON by mistake; it's inert and gets wired next block).
- Deploy: server.js v53 = 316,156 units / hash 1580491759, commit 72c5bde, applied as 9 hash-gated editor edits (reconstructed v52 = 3607755328 exactly, forward-apply = v53 byte-for-byte). Migration ran in Supabase first (Success), then a SELECT confirmed all 10 seeds. /health green after deploy.
- Verify: logic unit-tested vs known dates (weekday math, override precedence, fire window, restart dedup = Phoenix midnight 07:00Z, HH:MM validation); panel render-tested with the seeds. HONEST LIMIT: /admin is login-gated (needs a PIN the harness won't type), so the panel + endpoints weren't click-tested through a signed-in session, and the nudge's live morning fire needs the toggle ON on a real work-day morning — both owner-rep's to exercise; mechanism unit-proven + deploy-healthy.
- NEXT: Q91 block 2 = the four proactive touches (morning pre-brief, line-frees-soon, inspect-before-close, early-red guard), reusing this scheduler + isWorkDay. Coyote mapping job preempts when the dev's first REAL post lands.

## 2026-08-04 — block 52: hand-off stage 3 = per-task-step "send from a phone" (v52, no migration)
- Completes the Q86 phone photo hand-off. Stages 1-2 put it on the finish screen (completion photos); stage 3 puts the same hand-off on EVERY task step, so a worker on the shared tablet can pass a photo from their phone for a specific step too. Optional (kind='task') — it never counts toward the completion-photo gate.
- The backend already carried task_id and stored kind = task_id ? 'task' : 'finish' (v50), so this was purely UI: phoneHandoff() generalized to render into any target (default "hoff") and restore the button's own label on error; each task's note/photo panel gains a "📱 From a phone" button + its own QR/code container. The phone's photo attaches to that cab as a task photo and shows in that step's panel on reload.
- Deploy: server.js v52 = 305,904 units / hash 3607755328, commit 7e76871. Three programmatic editor edits gated on the live v51 start hash (2459282991) and target hash; validated locally first (reconstructed v51 reproduced its hash exactly, forward-apply reproduced v52 byte-for-byte). /health green after deploy.
- Same honest limit as v51: the per-step button + QR render only for a clocked-in tech on a real cab, so the live on-screen render wasn't staged from here; the mechanism is pre-existing/proven and the deployed bytes match the verified v52. Code-comment version header still reads (v50) — cosmetic, still to bump.
- NEXT: Q86 hand-off is feature-complete (stages 1-3 shipped). Open: Q123 cutover (SHOP_EGRESS_IP wifi gate, SESSION_SECRET rotation, full break-pass), Q91 smart alerts. Coyote mapping job preempts when the dev's first REAL post lands.

## 2026-08-04 — block 51: hand-off stage 2 = scannable QR on the finish screen (v51, no migration)
- The tablet finish screen now shows a QR ("Scan with a phone camera") that opens /h?c=CODE in one scan; the /h address + 8-char code stay as the fallback below it. Photos still land on that one cab; 20-min TTL, single-cab guard, and the finish photo-count are all unchanged from v50.
- QR built from scratch — the build sandbox has npm AND pip blocked (no jsQR/qrcode). Byte-mode encoder, EC level L, versions 1-5, auto-picking the smallest fitting version, rendered server-side as a plain inline SVG so it works under the enforcing CSP with no external library.
- Verified against THREE independent decoders before shipping: OpenCV, zbar 0.23 (ctypes binding), and the qrcode-terminal npm library's own encoder as a reference matrix. Found + fixed 3 encoder bugs; the decisive one was a transposed format-info placement (bits ran along a row where the spec runs them down a column), caught by diffing against the reference. 28/28 varied codes/lengths decode on both zbar and cv2.
- Deploy: server.js v51 = 305,545 units / hash 2459282991, commit 8bd5412. Applied to the editor via 3 programmatic edits (QR block insert + 2 small changes) gated on before/after hashes, then committed to main. /health green and stable across the deploy window.
- The code-comment version header still reads (v50) — cosmetic only; bump next block. HONEST LIMIT: the on-screen QR renders only after a clocked-in tech mints a code (needs a real cab + clock-in), so the live end-to-end scan was not staged; the encoder + SVG are proven correct and the deployed bytes are byte-identical to the sandbox-verified v51.
- NEXT: stage 3 = the per-task-step "send from a phone" button (mechanism already carries task_id -> kind='task'). Coyote mapping job preempts when the dev's first REAL post lands.

## 2026-08-04 — build block 50: Q86 PHONE PHOTO HAND-OFF, stage 1 (server.js v50, no migration)

- Owner-rep's edge case: a worker who won't sign in on their own phone works a cab on the shared tablet, but taking photos on the tablet is awkward. Chosen (AskUserQuestion): the QR/link hand-off, because devices are MIXED and the tablet is NOT Apple (AirDrop unavailable). Clarified: completion photos REQUIRED at finish (v49); photos AND notes OPTIONAL at any task step / finish — notes already typeable on-device; the hand-off is about PHOTOS.
- STAGED: stage 1 = working hand-off for COMPLETION photos (code + link, no QR yet); stage 2 = QR one-scan; stage 3 = per-task-step. The mechanism already carries task_id so stage 3 is small.
- WHAT (v50, stage 1): in-memory hand-off (code -> {build_id, task_id, created_by, exp, count}), 20-min TTL, 8-char ambiguity-free code (no 0/O/1/I/L), max 20 photos/code. Routes: /api/handoff/new (auth'd + clocked-in, isUuid-guarded), /h (NO-LOGIN phone page: code-entry form or upload page), /api/handoff/upload?code (NO-LOGIN: validates the code, mirrors the existing photo-storage path, attaches to that ONE cab kind='finish', uploaded_by = the code's creator). SECURITY: the code can ONLY add a photo to its one cab - no read, no change, no other cab, no sign-in; capped, 20-min expiry. /h added to the bell skip-list. Finish screen gains a "Send photos from a phone" button; the finish gate now counts completion photos ALREADY on the cab (incl. hand-off ones) via data-have so a tablet worker who received photos isn't wrongly blocked. No migration.
- CODE: v50 = 294,162 / 1845077193 (10 pairs; forward AND reversal proven - new->old reproduced v49 exactly at 283,545 / 2957991451). node --check clean. Editor hash gate matched v50. Commit SHA 96209dcbb4, raw-verified byte-exact.
- VERIFY: helpers unit-tested (code format; case-insensitive lookup; bad/empty/null->null; expiry+purge; 1000 codes distinct); handoffPage renders both branches without throwing. LIVE (zero writes): /health 200; /h renders the no-login "Send photos to a cab" entry page; /h?c=BADCODE -> 200 entry form (graceful); /api/handoff/upload?code=BAD -> 410 BEFORE any storage; /api/handoff/new via a non-clocked-in session -> 403 "Clock in first" (mint gated). HONEST LIMIT: the full happy path (clocked-in tech -> real code -> phone upload -> attaches -> counts at finish) needs a real cab + clock-in and would write test data, so it's owner-rep's to exercise; the guards + page + helpers are proven.
- NEXT (feature): stage 2 = QR one-scan (vendor + sandbox-TEST a QR encoder; code/link stays the fallback); stage 3 = the per-task-step "send from phone" button (mechanism already supports task_id -> kind='task'). Coyote preempts when the dev's first REAL post lands.

## 2026-08-04 — build block 49: Q86 HARD completion-photo gate + product settings (server.js v49 + migration 0023)

- Owner-rep: "im good to move to q86 now." (Naming note: Q86 in the register is "manager-out → duties up to Admin", already DECIDED; the piece meant here is Q86's decided sub-item — completion-photo minimum = per-product setting, default >= 1. Block 12 shipped it SOFT; 0006_photos.sql deferred the HARD gate "until per-product settings land in the admin console." This lands them.)
- CONFIRMED with owner-rep first (AskUserQuestion): gate at the BUILDER'S FINISH (not manager sign-off); admin can set a product's min to 0 (= exempt). Default stays 1.
- WHAT (v49 + migration 0023): 0023 adds product.photo_min int not null default 1 (CHECK 0..20; all 16 products at 1). HARD gate in /api/build/finish — after the open-steps check, look up the product's photo_min via the cab's part_number, count completion photos (build_photo kind='finish'); if fewer, clean 400 (0 skips = exempt). New admin "Product settings — completion photos" panel (products · family · editable min · Save) + /api/admin/product endpoint (admin-only, validates 0..20 + product exists, encodeURIComponent-safe, audited). Phone Finish button carries data-min and the client blocks early with a clear count; the photos label shows "at least N required" / "optional".
- CODE: v49 = 283,545 / 2957991451 (13 pairs; forward AND reversal proven — new→old reproduced v48 exactly at 279,236 / 3661352623). Editor hash gate matched v49. Commit SHA e6a0a2cbbe, raw-verified byte-exact. Migration 0023 run + verified (16 products, all photo_min=1).
- VERIFY: gate logic unit-tested (min>0 & shots<min → block; min=0 exempt — 7/7) + client check unit-tested. LIVE: /health 200; /admin 200 AND the new "Product settings — completion photos" panel RENDERS (Daniel's admin session) — proves the migration column is live/readable and the panel works end-to-end; /api/admin/product validation POST-tested (bad photo_min 99 → 400, nonexistent product → 404, no mutations). HONEST LIMIT: the finish-gate BLOCK through a live signed-in tech finish isn't staged (needs a real finishable cab) — unit-proven + deploy-healthy.
- NEXT: Coyote preempts when the dev's first REAL post lands; else Q91 (smart alerts) or another feature. Remaining Q123 items stay cutover/feature-complete.

## 2026-08-04 — build block 48: Q123 input-validation sweep pt 2 — sweep COMPLETE (server.js v48, no migration)

- Owner-rep "continue with part 2." Completed the sweep across the MANAGER/ADMIN-gated write endpoints + the reports template param.
- AUDIT: line/down + line/closed already had integer guards (block-30/Q115); push/subscribe already encodeURIComponent-s its endpoint before the dedup DELETE (safe). Gap: build rework/complete/start (build_id), afterhours/confirm (session_id), admin/employee (id), admin/cab-number (build_id), and /admin tplId query param (template_id=eq.${tplId}).
- WHAT (v48): 7 guards — isUuid for build_id/session_id/employee-id, and a graceful "tplId && isUuid(tplId)" on the admin page (invalid tplId → no steps, not a bad query). Clean 400 on bad input. No migration.
- CODE: v48 = 279,236 / 3661352623 (8 pairs incl. header; forward AND reversal proven — new→old reproduced v47 exactly at 278,079 / 1534023461). Editor hash gate matched v48. Commit SHA fc09c08c6a, raw-verified byte-exact.
- VERIFY (LIVE E2E, Daniel's session active; all probes 400/404, ZERO writes): same isUuid logic unit-proven in v47. Deploy: /health 200; POST /api/afterhours/confirm with injection payload session_id "x&or=(id.not.is.null)" → 400 (blocked before Postgres); valid-format nonexistent uuid → 404 "Session not found" (guard PASSED, no mutation).
- SWEEP COMPLETE (pt 1 v47 tech/warehouse + pt 2 v48 manager/admin): every user-supplied id at a write endpoint is validated (isUuid/integer) before the DB — PostgREST filter-injection closed app-wide.
- Q123 status: v42 session-revocation + v43 headers + v44 login rate-limit + v45/46 CSP enforcing + v47/48 input-validation sweep DONE. Remaining is all cutover/feature-complete: Q52 Wi-Fi/IP gate go-live decision (set SHOP_EGRESS_IP), SESSION_SECRET rotation at cutover, + a full break-pass when feature-complete.
- (Housekeeping: this entry was committed 2026-08-04 after a brief Chrome-extension disconnect delayed it; the v48 code itself shipped + was verified live the prior session.)
- NEXT: Coyote preempts when the dev's first REAL post lands; else Q86 (product settings + hard photo gate) or Q91 (smart alerts).

## 2026-08-03 — build block 47: Q123 input-validation sweep pt 1 (server.js v47, no migration)

- Owner-rep "keep going" → continued Q123 with the input-validation sweep. THE REAL RISK (not just ugly 500s): user-supplied ids are interpolated straight into PostgREST query strings (?id=eq.${id}), so an unvalidated id like "<uuid>&or=(id.not.is.null)" could inject an extra filter and WIDEN a PATCH to every row. block-30 already guarded punch/correct + timeoff + picklist; the gap was the many build_id sites, task_id, line_id, approved_by, session_id, admin id, tplId.
- WHAT (v47, pt 1): guarded the TECH- and WAREHOUSE-reachable write endpoints (lowest privilege = biggest escalation risk) — validate ids BEFORE the DB (isUuid for cab/step/approver ids, Number.isInteger for line ids), clean 400 on bad input. 10 guards: task/state (task_id), clock/in (line_id int + approved_by uuid optional), clock/switch (line_id int), build/finish (build_id), kit status/move/pull/deliver (build_id), task/note (task_id). Manager/admin-gated write endpoints + tplId get pt 2. No migration.
- CODE: v47 = 278,079 / 1534023461 (10 pairs; forward AND reversal proven — new→old reproduced v46 exactly at 276,432 / 3476865399). Anchors = body-extraction line + the endpoint's unique first query, so each is unique despite several endpoints sharing a destructure. Editor hash gate matched v47. Commit SHA ca7545bd3b, raw-verified byte-exact.
- VERIFY (STRONGEST yet — a real LIVE E2E, because this browser still held Daniel's signed-in session, so authenticated probes reached the guards; every probe 400/404 with ZERO writes): unit-tested first (valid uuid accepted; "&or=(...)" injection rejected; bare number rejected; line_id "3"/3 ok, "3&or=(x)"/"abc" rejected; optional approved_by undefined/null skips). Then LIVE: POST /api/task/state task_id "x" → 400; build_id "x" to kit/deliver → 400; a valid-format nonexistent uuid → 404 "Task not found" (guard PASSED, no over-rejection, no mutation); the actual attack payload task_id "<uuid>&or=(id.not.is.null)" → 400 (injection blocked before Postgres). No honest-limit gap on guard behavior this block.
- Q123 status: v42 session-revocation + v43 headers + v44 login rate-limit + v45/46 CSP enforcing + v47 input-validation sweep pt 1 DONE. Remaining: sweep pt 2 (manager/admin write endpoints + tplId), Q52 Wi-Fi/IP gate decision, SESSION_SECRET rotation at cutover, + a full break-pass when feature-complete.
- NEXT: Coyote preempts when the dev's first REAL post lands; else input-validation sweep pt 2, or Q86/Q91.

## 2026-08-03 — build block 46: Q123 CSP flipped to ENFORCING (server.js v46, no migration)

- Daniel's signed-in browser-console check came back clean: the only red was GET /api/inbox/unread 401 (the notifications bell checking for messages on a signed-out page and hiding itself — NOT a CSP violation), and his cab photo opened fine. So flipped the v45 report-only CSP to enforcing.
- WHAT (v46): header name Content-Security-Policy-Report-Only → Content-Security-Policy (same policy string), + comments updated. Policy unchanged (default-src 'self'; script/style self+unsafe-inline; img self+data:; connect/font/worker self; object-src none; base-uri self; form-action self; frame-ancestors none). No behavior change, no migration. Full revert = one-word change back to -Report-Only.
- CODE: v46 = 276,432 / 3476865399 (3 pairs; forward AND reversal proven — new→old reproduced v45 exactly at 275,817 / 58758895). Commit SHA 4ad4e36859, raw-verified byte-exact (enforcing setHeader present).
- INJECTION HICCUP (recorded): the browser window had been resized to 1316px wide between blocks, so the first commit attempt's cached click coordinates missed and dirtied the editor (+2 chars, hash 4036098421). Caught BEFORE committing (post-commit API check showed the PRIOR commit; a screenshot showed still-in-edit-mode). Fixed: re-navigated the edit URL to discard, re-applied the v46 chunks (hash gate → v46 exact), screenshotted to read the ACTUAL button coordinates, then committed. Lesson: after any gap, screenshot to confirm viewport before reusing click coordinates — the hash gate + screenshot both caught the miss, nothing bad shipped.
- VERIFY (header is observable, so also confirms the deploy): LIVE /board → content-security-policy PRESENT, content-security-policy-report-only ABSENT (flip is live); board still renders (logo present, body populated); a securitypolicyviolation listener caught 0 violations while exercising the board's EventSource(/api/board-stream) + fetch(/api/board-state) UNDER enforcement — nothing broke. The signed-in pages were confirmed clean by Daniel under report-only (same policy). HONEST NOTE: verified the board directly under enforcement; did not re-drive the signed-in pages under enforcement (no PIN) — any failure there is a one-word revert.
- Q123 status: v42 session-revocation + v43 headers + v44 login rate-limit + v45/46 CSP (now ENFORCING) DONE. Remaining pre-cutover: input-validation sweep, Q52 Wi-Fi/IP gate decision, SESSION_SECRET rotation at cutover, + a full break-pass when feature-complete.
- NEXT: Coyote preempts when the dev's first REAL post lands; else the input-validation sweep, or Q86/Q91.

## 2026-08-03 — build block 45: Q123 Content-Security-Policy, report-only (server.js v45, no migration)

- Owner-rep (AskUserQuestion): "Finish security — start CSP." Did it the safe way: INVENTORY → REPORT-ONLY → (later) ENFORCE.
- INVENTORY: the app is fully first-party. Every client fetch() is same-origin (/api/*); EventSource → /api/board-stream (self); cab photos → /photo/<id> proxy (self); worker → /sw.js (self); push subscribe → /api/push/subscribe (self). No external scripts/fonts, zero data: URIs. Decisive: the UI uses inline onclick handlers throughout — which NONCES cannot cover — so script-src MUST keep 'unsafe-inline' (nonce-only would break every button). connect-src 'self' still stops off-origin exfiltration = the meaningful protection.
- WHAT (v45): a Content-Security-Policy-Report-Only header (in the same setHeader block as the v43 headers, so it rides every response). Report-only = browser reports would-be blocks to its console but blocks NOTHING, so we prove it clean before enforcing. Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'self'. No behavior change, no migration.
- CODE: v45 = 275,817 / 58758895 (2 pairs: header + CSP setHeader line; forward AND reversal proven — new→old reproduced v44 exactly at 273,969 / 3292714944). Editor hash gate matched v45. Commit SHA 21588dd97e, raw-verified byte-exact.
- VERIFY (header is observable, so also confirms the deploy): LIVE on /board (view-only, no login, exercises inline scripts + EventSource + fetch + inline styles): content-security-policy-report-only present, no enforcing CSP; page load = ZERO console messages; a runtime securitypolicyviolation listener while exercising the board's EventSource(/api/board-stream) + fetch(/api/board-state) caught 0 violations → connect-src 'self' clean. HONEST LIMIT: signed-in pages (cockpit/admin/a cab photo) need a PIN the harness won't type — covered by the inventory (all same-origin) and, being report-only, any surprise reports to console WITHOUT breaking anything.
- NEXT (v46 enforce): once the signed-in pages are confirmed clean under report-only (Daniel clicks through + checks the console), flip the header name Content-Security-Policy-Report-Only → Content-Security-Policy. One-word change = enforce; report-only until then = zero UI-break risk.
- Q123 status: v42 session-revocation + v43 headers + v44 login rate-limit + v45 CSP(report-only) DONE. Remaining: the enforce flip, an input-validation sweep, the Q52 Wi-Fi/IP gate decision, SESSION_SECRET rotation at cutover, + a full break-pass when feature-complete.
- NEXT: Coyote preempts when the dev's first REAL post lands; else the CSP enforce-flip (after Daniel's console check), the input-validation sweep, or Q86/Q91.

## 2026-08-03 — build block 44: Q123 login rate-limit (server.js v44, no migration)

- Owner-rep: "go ahead" — approving login rate-limit next (then CSP).
- DESIGN PROBLEM: a naive per-IP attempt cap is dangerous — the shop almost certainly sits behind ONE shared public IP, so counting raw attempts (or a low distinct threshold) could lock out the whole shop on a busy or temp-code-launch morning.
- FIX (v44): count DISTINCT employee ids that FAIL a login from a given client IP inside a rolling 10-min window — never raw attempt volume. Trip a 15-min 429 cooldown only at 20 distinct failed ids. 20 is deliberately > the ~17 real names: a legit person only fails against their OWN name, so even all 17 fumbling can't reach 20 — only an attacker spraying bogus ids can. The per-person 5-try lockout still handles single-name brute force; this adds "one source, many names" coverage. Both failure branches feed it (unknown-id/404 + wrong-PIN). Client IP via X-Forwarded-For (Railway), remoteAddress fallback; in-memory like the per-person lockout. No migration. Known limit: X-Forwarded-For spoofing can spread across fake IPs to evade — but the per-person lockout still applies, so defense-in-depth, not the primary control.
- CODE: v44 = 273,969 / 3292714944 (5 pairs: header, guard-helpers insert, login IP-block check, 404-path note, wrong-PIN note; forward AND reversal proven — new→old reproduced v43 exactly at 271,176 / 216380449). Editor hash gate matched v44 before commit. Commit SHA ca71b4e59b, raw-verified byte-exact.
- VERIFY: guard unit-tested 5/5 — 17 distinct real-name fails → NOT blocked (no legit lockout); 20 distinct → blocked; clean IP unaffected; window rolls over and resets; cooldown expires and unblocks. DEPLOY: /health 200 ok/db; a POST /api/login with a bogus nonexistent UUID → normal 404 "No PIN on file" (route healthy, one attempt doesn't trip the threshold, no real account touched). HONEST LIMITS: no external signal distinguishes v44 from v43 (both 404 a bogus id) and I deliberately did NOT trigger the 20-fail block on the live system — but the commit is byte-verified and Railway auto-deploys; the guard is unit-proven.
- Q123 status: security headers (v43) + login rate-limit (v44) DONE. Remaining pre-cutover: a Content-Security-Policy (own sub-block — inline inventory + nonces + Supabase image/connect origins), a full input-validation sweep, the Q52 Wi-Fi/IP gate decision, SESSION_SECRET + key rotation at cutover, + a fresh full-system break-pass when feature-complete.
- NEXT: Coyote preempts when the dev's first REAL post lands; else the CSP sub-block, or Q86/Q91.

## 2026-08-03 — build block 43: Q123 security response headers (server.js v43, no migration)

- Owner-rep: "move on to 123." Started the Q123 hardening pass with the safest high-value item — security response headers — and left CSP as its own careful sub-block (the app leans on inline styles/scripts).
- WHAT (v43): four headers on EVERY response, set once via res.setHeader() at the top of the request handler (before routing) so they apply whether a route ends via send(), json(), a redirect, SSE, the CSV download, or the photo proxy (Node merges setHeader with each route's writeHead). Headers: Strict-Transport-Security (max-age=31536000; includeSubDomains — safe, Railway is HTTPS-only, no sub-subdomains under shopboard), X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN (click-jacking; nothing embeds the app cross-origin), Referrer-Policy: strict-origin-when-cross-origin. No behavior change, no migration.
- CODE: v43 = 271,176 / 216380449 (2 pairs: header + the setHeader block; forward AND reversal proven — new→old reproduced v42 exactly at 269,828 / 3845956799). Editor hash gate matched v43 before commit. Commit SHA 4908914898, raw-verified byte-exact.
- VERIFY (strongest yet — headers are externally observable, so this ALSO confirms the deploy swapped in, the signal v42 lacked): local Node test proved the four headers survive writeHead on plain/JSON/redirect; LIVE /health (JSON) = 200 with all four present, /board (HTML) = 200 with all four, nothing broke. (/home read 0 headers only because fetch hides them on an opaque manual-redirect; the redirect response itself carries them.) No honest-limit gap this block.
- Q123 remaining pre-cutover: a Content-Security-Policy (own sub-block — inline inventory + nonces + Supabase image/connect origins), a login rate-limit beyond the per-person PIN lockout (per-IP on /api/login), a full input-validation sweep, the Q52 Wi-Fi/IP gate decision, SESSION_SECRET + key rotation at cutover, + a fresh full-system break-pass when feature-complete.
- NEXT: Coyote preempts when the dev's first REAL post lands; else login rate-limit, then CSP, or Q86/Q91.

## 2026-08-03 — build block 42: Q122 session lockout on deactivation (server.js v42, no migration)

- Resume after a session reset (model Fable 5). Verified live first: /health ok; coyote_intake = 2 leftover TEST rows only ("this is not { json" + order "TEST-23613", both unprocessed) → no real dev posts, Coyote does NOT preempt. Proceeded to the deferred Q122/Q123 security block.
- THE GAP (Q122): readSession() validated only the cookie signature + 12h expiry. Staff READ routes re-checked active, but the role-gated MUTATING routes + requireAdmin re-read the actor with select=role and NOT active — so a deactivated manager/admin holding a still-valid cookie kept its powers until the cookie lapsed. (Role changes were already safe: role is re-read fresh every request, never trusted from the cookie.)
- THE FIX (v42): one shared chokepoint — new async liveSession(req) = readSession + a single indexed `employee?select=active&id=eq.<id>` lookup; returns the id only if still active, else null. Converted ALL 32 authed route entries (31 empId + 1 meId) from readSession to await liveSession(req). A deactivated person now yields null empId, so every route funnels them into the SAME null-handling it already had for signed-out users (401 / redirect) — no new crash surface. Public TV board / SSE never sign in, so untouched. No migration (employee.active already exists).
- CODE: v42 = 269,828 / 3845956799 (4 pairs: header, liveSession insert, empId ×31 replace-all, meId ×1; forward AND reversal proven — new→old reproduced v41 exactly at 268,821 / 1985109061). Editor hash gate matched v42 before commit. Commit SHA 1510fefbe9, raw-verified byte-exact (helper present, 32 liveSession calls).
- VERIFY: liveSession unit-tested 5/5 (active→id; signed-out / inactive / missing-row / null-active → null). DATA: employee.active cleanly splits 17 active staff (keep access) from 1 retired test account (rejected) — teeth without locking out live staff. DEPLOY: /health 200; /api/inbox/unread signed-out = clean 401 (chokepoint doesn't crash on no-cookie); /api/board-state 200 (public board unaffected). HONEST LIMITS: no signed-in deactivated click-test (PIN the harness won't type) and no external signal to confirm the v42 build swapped in — but the commit is byte-verified on main and Railway auto-deploys on push.
- Q122 → code CLOSED (remaining: a docs offboarding step in file 07/15). Q123 → session-revocation piece done; remaining pre-cutover: security headers, a login rate-limit, an input-validation sweep, the Q52 Wi-Fi gate decision, SECRET rotation, + a fresh full-system break-pass.
- NEXT: Coyote preempts when the dev's first REAL post lands; else finish Q123 hardening, or Q86/Q91.

## 2026-08-03 — build block 41: Q118 admin toggle plain-language pass (server.js v41, no migration) + Q124 backups verified

- Owner-rep's approved 20-min plan was Q124 + Q118; Q122/Q123 held back as their own careful security block.
- Q124 (records only, no code): verified in the Supabase dashboard — Pro plan, automated DAILY physical backups (one restorable per day, 27 Jul–02 Aug listed) + point-in-time recovery + restore-to-new-project. With GitHub holding schema+code, the live DB data is well protected. ⚠ GAP flagged to the cutover checklist: "Storage objects are NOT included" in DB backups — the cab-photos Storage bucket isn't covered; decide the photo-durability plan before real photos matter at go-live.
- Q118 (v41, TEXT ONLY, no behavior change, no migration): a light plain-language pass on the Features switches — "cutover" → "until we go live" (text/email switches); "Early-red standards guard" → "Cab went red too early" with a plainer line; "Pace early-warning pushes / …Sandboxed to the owner-rep until cutover" → "Pace early-warning heads-up" / "…Until we go live, these come only to you". The rest of the toggle copy was already clear.
- CODE: v41 = 268,821 / 1985109061 (5 pairs, forward AND reversal proven — new→old reproduced v40 exactly at 268,512 / 1896038506). Editor hash gate matched v41 before commit. Commit SHA 2dec6b9a42, raw-verified byte-exact via the GitHub API at that SHA ("cutover" gone, new pace label present).
- VERIFY: deploy healthy (/health ok:true, db:true). HONEST LIMIT (standing): the on-screen toggle text wasn't re-checked through a signed-in admin session (login needs a PIN the harness won't type) — proven at the source+commit layer. Code backup + records refreshed to v41 and synced to the owner-rep's machine.
- NEXT: Coyote mapping preempts the moment the developer's first post lands; else the Q122/Q123 security block, or Q86/Q91.

## 2026-08-03 — build block 40: Q120 notification inbox part 1 (server.js v40 + migration 0022)

- Owner-rep said "keep working"; picked the notification center — the highest-value backlog item
  and buildable now (notification_log already stores every message per intended recipient).
- WHAT (part 1): an in-app INBOX at /inbox rendering a person's own notification_log rows newest
  first, unread (read_at null) ringed red; opening it marks them read. A universal unread BELL — a
  small clock-face with a red count, top-right on every app screen — injected ONCE via the shared
  head snippet (the `style` const, with a skip-list for /board, /login, /, /change-pin, /inbox), so
  no per-page footer edits (the staff-page footers are near-identical, which would have made seven
  fragile anchors). Endpoints: /api/inbox/unread (count for the bell) and /inbox (render + mark-read).
- Q106 stance (recorded): this is PULL-ONLY — it shows a person their OWN notifications when THEY
  sign in; nothing is sent out, and push/text/email delivery stays sandboxed. No staff sign in
  during the build phase and the sandbox test rows are purged at cutover, so it surfaces nothing to
  staff pre-launch; it goes live with the rest of the app.
- CODE: v40 = 268,512 / 1896038506 (4 pairs, forward AND reversal proven to v39). Commit SHA
  2ab1af69, raw-verified. Migration 0022 (notification_log.read_at + a (intended_employee_id,
  read_at) index) run + verified.
- VERIFY: deploy healthy (/health ok:true,db:true; /api/inbox/unread answers 401 unauth = route
  present — it was 404 in v39, so the deploy is confirmed live; /inbox 302 → login). Data-layer E2E
  on the Zz test account (rows deleted after): inserted 2 notifications → the exact unread-count
  query returned them → the mark-read UPDATE set read_at → still-unread 0 → deleted (0 test rows
  left). HONEST LIMIT: the rendered inbox page + the bell's on-screen appearance weren't checked
  through a signed-in session (login needs a PIN the harness won't type); the query + mark-read
  logic is proven at the data layer.
- STILL TO DO (Q120 part 2): the per-user TEXT/EMAIL on-off toggles in the admin console — deferred
  because those channels don't exist yet (web-push only until the cutover email/SMS providers are
  wired); the toggle settings + notify() honoring them come with those channels.
- Q121 code backup refreshed to v40 (+ migration 0022). No Zz employee account touched (only
  notification_log test rows, deleted).
- RECORD-INJECTION NOTE: gzip for record injection is now done with mtime=0 (deterministic) after a
  mid-inject re-encode produced a different gzip header last block — no recurrence.
- NEXT: Coyote mapping preempts the moment the developer's first post lands; otherwise the backlog
  (Q118 admin copy, Q122 ex-employee session lockout, Q123 security, Q124 backups) or Q86.

## 2026-08-03 — build block 38: Q119 reports periods — clear labels + custom date ranges (server.js v38, no migration)

- Owner-rep flagged (weekend notes) that the reports period picker was unclear: "Week/Month/
  Quarter/Year" were actually rolling last-N-days windows, and he'd guessed year = year-to-date.
- WHAT: replaced the picker with a grouped, explicit one — ROLLING (Last 7 / 30 / 90 days),
  TO DATE (This week / month / year, calendar-anchored in Phoenix), and CUSTOM (From/To date
  pickers). Every view now shows a "<label> · showing <start> → <end> (Phoenix dates)" subtitle so
  it's unambiguous what's being searched. CSV filenames carry the period.
- UNDER THE HOOD: new reportPeriod(params) parses the query into a window [startMs, endMs), a label,
  the exact range text, and the querystring carried on links + CSV. reportData(days) became
  reportData(startMs, endMs): sinceMs=startMs, winEnd=endMs; every window filter (finished cabs,
  labor, rework, timecards, after-hours) now uses winEnd. This FIXED A LATENT GAP — the old code
  only lower-bounded the window (fine when it always ended "now", wrong for a past custom range).
  The live snapshots (open intervals via workIntervals, open-cab aging) correctly still use real now.
- CODE: v38 = 263,317 / 634216072 (14 pairs, forward AND reversal proven to v37). Commit SHA
  6fc6dcbd, raw-verified. No migration.
- INJECTION LESSON (recorded): the CM6 apply loop replaces a single occurrence, but pair 13 was a
  replace-ALL (the four CSV `&days=${d.days}` links, count 4). The precheck counted 4 but apply
  replaced only the first; the v38 hash gate CAUGHT the mismatch (units off by 21 = 3×7), and a
  corrective replace-all loop fixed the remaining three → hash matched exactly. (Injector should
  handle count>1 pairs with a loop going forward.)
- VERIFY: reportPeriod() unit-tested locally, 11/11 — each preset's Phoenix window (last7/30/90,
  wtd/mtd/ytd, default last30), custom From/To, swap-safe From>To, single-day range, and
  week-to-date landing on the correct Monday from a mid-week "now". Deploy healthy (/health
  ok:true,db:true; /reports and /reports.csv with the new params redirect to /login unauth = routes
  intact). The core report math (variance %, labor, timecards) is UNCHANGED from the block-19 build
  that was E2E-proven. HONEST LIMIT: the rendered page's numbers weren't re-checked through a
  signed-in admin session (login needs a PIN the harness won't type) — owner-rep can spot-check by
  exporting a CSV for a known range (CSV parity with the page is the point).
- Q121 code backup refreshed to v38 (server.js + MANIFEST). No Zz account touched this block.
- NEXT: Coyote mapping preempts the moment the developer's first post lands; otherwise the weekend
  backlog (Q118 admin copy, Q120 notification center, Q122–Q124 security/backups/ex-employees) or
  Q91/Q86.

## 2026-08-03 — build block 36/37: Q77 reason-list editor + Q121 code backup started (server.js v36→v37, no migration)

- Owner-rep said "build the next block"; chose the pick-list editor — self-contained, admin-only,
  and immediately useful (he manages every reason list himself instead of me running SQL).
- WHAT: a new admin-console "Reason lists" panel, modeled on the proven Build-steps editor. It
  groups every pick_list_item by list_key and shows all NINE admin-managed lists (clock_out_reason,
  rework_reason, after_hours_reason, line_down_reason, time_off_reason, absence, blocker, hold,
  fixjob_reason), each with a friendly display name (PICK_LIST_INFO). Per list: ADD (deduped,
  appended, only to a list that already exists — code owns which lists exist), RENAME, REORDER
  up/down (swap sort_order with the neighbour), RETIRE/RESTORE (retire-not-delete keeps history and
  just drops the choice off new menus). Admin-only endpoint /api/admin/picklist with isUuid guards;
  every change event-logged (picklist.added/renamed/moved/retired/restored). Client JS reuses the
  admin post()/v()/arm() helpers.
- CODE: v36 = 258,464 / 1800504917 (8 pairs, forward AND reversal proven to v35). Then a v37 polish
  (2 pairs): the assembly read surfaced 4 lists I hadn't named (absence/blocker/hold/fixjob) that
  would have shown raw DB keys — added friendly names for them (the Q118 "plain descriptions" spirit).
  v37 = 258,831 / 2086803348, commit SHA b9b80ddf, raw-verified at that SHA. No migration
  (pick_list_item has existed since 0001).
- VERIFY: deploy healthy (/health 200; /api/admin/picklist answers 401 admin-gated — it was 404 in
  v35, so the new route confirms the deploy is live). The exact assembly read returned all 9 lists
  grouped + ordered as the panel renders. A throwaway list (zz_test_list, deleted after) proved
  rename (AAA→AAA-renamed), retire (CCC→retired), and the move-swap (BBB↔AAA sort_order) all behave
  — real reason lists untouched. HONEST LIMIT unchanged: not click-tested through a signed-in admin
  session (login needs a PIN the harness won't type); the endpoint mirrors the block-10-proven
  /api/admin/step structurally.
- Q121 CODE BACKUP STARTED (owner-rep's standing ask): created Shop-Board-CODE-BACKUP/ in the Cab
  Build Board folder with the COMPLETE code — server.js (v37), package.json, README,
  docs/EVENT_TAXONOMY.md, all 18 migration files, and a MANIFEST.txt (version · hash · GitHub commit
  · restore-from-scratch notes). It refreshes at each block's records step so it always mirrors the
  build; a full snapshot again at build's end.
- NEXT: Coyote mapping preempts the moment the developer's first post lands; otherwise the weekend
  backlog (Q118–Q124) or the independent menu (smart alerts Q91, product/photo gate Q86, reports
  depth Q119).

## 2026-08-03 — block 34 follow-up (owner-rep): Q92 same-day revisions (server.js v35 + migration 0021)

- Owner-rep reviewed the time-off flow and made three calls; all shipped the same day:
  1. APPROVAL IS ADMIN-ONLY (not manager). /api/timeoff/decide and /api/timeoff/add are now
     admin-only (were manager+admin). In the cockpit the "Time off — needs you" lane and the
     "Add for someone" control render only for admins; managers keep the read-only "who's out,
     upcoming" list for floor planning. The new-request heads-up now targets admins.
  2. OPTIONAL REQUESTER NOTE. The home-screen panel gains a note field → request_note column →
     shown to the admin in the needs-you lane.
  3. TOGGLE OFF BY DEFAULT. Migration 0021 flips the "Time-off requests" row that 0020 seeded
     ON; the request panel stays hidden and /api/timeoff/request refuses until an admin turns it
     on in Admin → Features.
- CODE: v35 = 250,439 / 471473873. 12 edit pairs, forward AND reversal proven (new→old
  reproduced v34 = 248,960 / 2277737846 exactly). Transfer note: one base64 chunk was mis-typed
  on the way into CM6 and its per-chunk checksum caught it → resent → clean. Commit SHA 2c5e07da,
  raw-verified at that SHA. Migration 0021 (request_note text column + `update feature_toggle set
  enabled=false where key='time_off_requests'`) run + verified (column present, toggle=false).
- VERIFY: deploy healthy (/health 200; the three /api/timeoff/* routes still answer 401
  unauthenticated). Data-layer E2E on the Zz test account (deleted after): a request WITH a note
  round-tripped through the exact v35 pending read — request_note came back verbatim ("Dentist at
  2pm, back by 3"); table left empty, toggle off, Zz clean. HONEST LIMIT unchanged from block 34:
  the admin-only 403-for-managers, the note-in-lane render, and the toggle-off panel-hide are
  proven at the code + data layer, not by a signed-in HTTP click-through (login needs a PIN the
  build harness does not type).
- OPEN ITEM — EMAIL TO info@premierstreetrod.com ON EACH REQUEST: owner-rep asked for this; NOT
  built. It needs (a) an email provider wired — an API key he sets on Railway; the app is
  web-push-only today and I never handle keys — and (b) a Q106 go/no-go, since email delivery is
  deliberately held until cutover ("no emails until go-live"). info@ is his company inbox, so it
  is arguably consistent with Q106 (test notifications go to him, not staff), but lifting the email
  hold is his call. Raised for his decision; nothing was sent.

## 2026-08-03 — build block 34: Q92 TIME-OFF REQUESTS, part 1 (server.js v34 + migration 0020)

- WHAT: the first slice of the planned-absence work. A builder can request time off from
  their phone (a date range + a reason from the admin pick list); it lands in the manager's
  new "Time off — needs you" cockpit lane; one tap approves or denies (a denial can carry a
  short note). A manager/admin can also enter time off for anyone directly — that lands
  already approved. The manager cockpit shows a "who's out, upcoming" list; the builder's
  home screen shows "your requests" with each status. Every action is audited
  (timeoff.requested / approved / denied / added) and Q106-sandboxed (all pushes reroute to
  the owner-rep until the NOTIFY_LIVE cutover). Gated by the existing "Time-off requests"
  admin toggle (seeded ON).
- DB: migration 0020 — new table time_off_request (id, employee_id, start/end date, reason,
  status pending/approved/denied [checked], requested_by, added_by_manager, decided_by/at,
  decision_note, created_at) + 3 indexes; a time_off_reason pick list (Vacation, Personal,
  Appointment, Sick, Family, Other); a feature_toggle row for time_off_requests (ON).
- CODE: server.js v34 (248,960 units / hash 2277737846). Ten edit pairs — homePage gains the
  request panel + its own-requests list; managerPage gains the needs-you lane, the
  add-for-anyone control and the upcoming list; three endpoints — /api/timeoff/request
  (toggle-gated), /decide (manager+admin, optional note, guards an already-decided request)
  and /add (manager+admin, lands approved). Same pipeline as always: local edit -> node
  --check -> reversal proof (new->old reproduces v33 exactly) -> CM6 inject with per-pair
  count precheck + v34 hash gate -> commit (SHA 1676372b) -> raw verify at that SHA ->
  migration -> deploy probe -> E2E.
- VERIFY: deploy probe — all three new routes answer 401 (auth gate) unauthenticated, and a
  nonexistent path answers 404, so the routes are genuinely live. E2E at the data layer (only
  the Zz test account touched, then deleted): request->approve, request->deny (with note),
  manager-add (added_by_manager=true, approved), and one left pending; the three route reads
  returned exactly the right rows (pending queue = the pending one; upcoming = the two future
  approved; home-mine = all four); the status CHECK rejected a bogus value. Table left empty,
  seed intact, Zz row clean (active=false, no PIN).
- HONEST LIMIT: the happy path was verified at the data + query layer, not by a signed-in HTTP
  click-through — logging in needs a PIN, which the build harness does not type. The three
  handlers reuse the exact auth/validation/notify/logEvent patterns already proven in blocks
  27–33. Worth a 2-minute manual click-through by the owner-rep once signed in.
- DEFERRED (recorded in the register under Q92): feeding an approved absence into each cab's
  finish-date projection, a full days-ahead visual coverage calendar, the on-arrival reason
  pre-loading, and the Meeting Pack (its own block).
- NEXT: the Coyote mapping job preempts everything when the developer's first post lands;
  otherwise the independent menu (smart-alerts wiring Q91, product settings + photo gate Q86,
  pick-list editor Q77, reports depth).

## 2026-07-31 — build block 33: Q83 "DOWN FOR TODAY" QUICK-HOLD (server.js v33 + migration 0019)

- NAMING CORRECTION (honest): this was queued loosely as a "day-switch / midnight-span
  time-engine edge case." Reading the register, Q83 is actually the decided-but-unbuilt
  "Down for today" quick-hold. Built THAT (it IS Q83). No midnight-span change was needed —
  the interval/timecard "dayed by its start" behaviour is already sweeper-guarded (block 26).
- WHAT SHIPPED: one tap in the cockpit marks a line as EXPECTED idle (Staff out /
  Equipment down / No work scheduled). Effect: the TV tile goes calm-slate ("Down for
  today — <reason>" + a slate DOWN TODAY badge) instead of a bare "Idle line", so an
  intentionally-empty line stops reading as a problem. AUTO-CLEARS when the calendar day
  rolls (the day-end sweeper), and AUTO-RESUMES the instant someone clocks into the line
  (Q84: working-while-held is impossible — the hold releases itself, logged). Manager +
  admin (the everyday quiet tool — NO toggle gate, unlike the hard Q113 close). Reason
  from an admin-editable pick list (Q77). Every transition audited (line.down /
  line.down_cleared / line.down_resumed).
- DISTINCT FROM Q113 line-close: close is HARD (refuses clock-ins/switches/starts, manual
  reopen, "CLOSED" badge); down is SOFT (expected idle, auto-resume on clock-in, auto-clear
  at day roll, reason-coded slate). They coexist cleanly; the cockpit only offers "Down for
  today" on a line with no active cab that isn't hard-closed.
- PACE MONITOR (block 31): no change needed — a down line has no active cab, so the pace
  patrol already skips it. (Future "uncovered line" alerts should also honour down_today.)
- FILES: server.js v33 = 233,036 / 425995571 (13 pairs, 16 occurrences, forward + reversal
  proven; committed via find-ref dialog clicks — no stray char this time). migration 0019
  (line.down_today/down_reason/down_by/down_at + line_down_reason pick list) run + verified
  (4 cols, 3 reasons).
- E2E (live, Zz admin): /api/line/down 401 signed-out (deployed + gated) · bad reason →
  400 "Pick a reason" · marked Line 4 down (Equipment down) → 200, board-state carries
  down:{reason}, cockpit shows the DOWN marker, line.down logged · clocked into Line 4 →
  the hold RELEASED (board down back to null), line.down_resumed logged · day-roll
  auto-clear proven by predicate: a hold backdated 2 days is caught by the sweeper's exact
  stale-down query (true), while a today hold correctly persists. HONEST NOTE: the visible
  slate TILE wasn't shown on the TV because all four test lines currently hold a cab (no
  idle line to render the idle-branch); the board-state DATA proof + the tile being the
  same render path as the block-27-proven CLOSED badge cover it — exercise the visible
  slate when an idle line exists.
- Zz retired clean; 17 names, 0 down lines, 0 closed lines. Q83 BUILT.
- NEXT: Coyote push preempts (Mon/Tue); else more notification events / reports depth.

## 2026-07-31 — build block 32: Q117 LIVE BOARD via server-sent events (server.js v32, no migration)

- WHAT SHIPPED: the TV board updates within ~2-3s of any change instead of on the
old 30-second poll. The server holds an EventSource per screen (/api/board-stream);
a 3-second tick (boardTick) watches ONE cheap signal — the newest event_log id —
and bumps every connected screen the instant it moves. Because EVERY board-affecting
mutation (clock in/out/switch, task check-off, build start/finish/rework, kit, line
close/reopen, cab #, after-hours) writes an event_log row, that one index read on the
pk catches them all. On a bump the client re-fetches board-state and re-renders — the
exact same proven render path, just triggered by push instead of a timer.
- WHY SSE (owner-rep chose it over Supabase Realtime): keys stay SERVER-SIDE. Realtime
would have needed the anon key + row-level-security rules exposed in the browser — a
departure from this app's server-only-keys design. SSE keeps the whole model intact.
- EFFICIENCY: when nobody is watching the TV (no clients) boardTick does zero work; one
shared signal replaces N client polls; the server pushes ONLY on real change (proven:
4s idle = 0 bumps). A 30s fallback poll + EventSource auto-reconnect (retry:3000) keep
the board correct through any Wi-Fi/proxy drop; pure time-drift in pace colours rides
that fallback. 25s keepalive comments survive idle-proxy timeouts.
- SINGLE CAVEAT (recorded): the in-memory client set assumes ONE server instance — true
for this shop. If Railway ever scales to 2+ instances, a client on instance A wouldn't
get bumps from a mutation served by instance B (the 30s fallback still covers it). Note
for any future scale-out.
- SCOPE: the TV board (the passive display that benefits). The manager cockpit was left
on reload-on-action deliberately — auto-reloading it while a manager is typing a rework
note would destroy their input; live-updating it cleanly would need a JSON re-render
rewrite, not worth it now.
- FILES: server.js v32 = 227,013 / 1442734318 (4 pairs forward+reversal proven). One
stray em-dash slipped into the first commit attempt (1316x901 viewport moved the dialog
coords) — caught by the editor hash pre-commit, removed, committed clean. No migration.
- E2E (live): /api/board-stream returns text/event-stream with "retry: 3000" + initial
"event: board / data: hello" · on /board the EventSource connected (readyState OPEN) and
got the connect bump · closed line 2 (real change) → the board received the bump in
~1.6s AND repainted the CLOSED badge on its own · reopened → bump + badge cleared · 4s
idle → NO extra bumps (pushes only on change, no spam). Zz retired clean; 17 names, 0
closed lines.
- NEXT: Coyote push preempts (Mon/Tue); else Q83 day switch, or more notification events.

## 2026-07-31 — build block 31: Q116 PACE EARLY-WARNING PUSHES live (server.js v31 + migration 0018)

- WHAT SHIPPED: the board's own RED now reaches OUT. A background patrol
(pacePatrol, setInterval 10 min — same cadence as the day-end sweeper) reads the
board's own /api/board-state internally (zero duplicate pace math — the alert fires
exactly when the TV shows red) and, when an active/rework cab CROSSES into red,
sends one Q106-sandboxed push to managers + admins ("Line X: ORDER needs help ·
promised …"). EDGE-TRIGGERED: build.pace_alert_color remembers the last colour per
cab, so one push per crossing, silence while it stays red, and it re-arms once the
cab recovers. Survives a redeploy (state is in the DB, not memory).
- CONTROLS: a "Pace early-warning pushes" admin toggle (feature_toggle pace_warnings,
seeded ON) pauses the whole patrol; an admin-only /api/admin/pace-run runs it on
demand (a "check now" button + the E2E hook) and reports which cabs are red.
- Q106 SANDBOX HOLDS: every push reroutes to the owner-rep with the [TEST] stamp;
notification_log records the true intended recipients (managers+admins) with
sandboxed=true. Nothing reaches staff until cutover.
- FILES: server.js v31 = 224,094 / 3363324359 (4 pairs, forward + reversal proven;
no stray). migration 0018 (build.pace_alert_color + pace_warnings toggle) run +
verified (col present, toggle true).
- E2E (live, as Zz admin) — all six proofs:
  1. CROSSING → PUSH: TEST-23701 (genuinely red, 6.4h behind) → one pace.warn event,
     6 notification_log rows (the 6 managers+admins), ALL sandboxed=true, status
     "sent" (the push actually delivered to the owner-rep's desktop).
  2. EDGE-TRIGGER: a 2nd run while it stayed red added NO new event.
  3. DELIBERATE CROSSING: reset TEST-23701 to null, ran → event count 1→2 (pushed again).
  4. RECOVERY/RESET: armed a GREEN cab (TEST-23702) as 'red', ran → it reset to
     'green', NO push (green isn't a red-crossing).
  5. TOGGLE OFF: paused pace_warnings, re-armed TEST-23701 null, ran → red_now empty
     (monitor returned early, cab left unprocessed); flipped back ON, ran → red_now
     [TEST-23701] again (re-engaged).
  6. GATES: /api/admin/pace-run 401 signed-out, admin-only; the toggle shows in the
     admin Features panel.
- The monitor's stored colours now mirror reality (TEST-23701 red, TEST-23702 green) —
  left as-is (accurate). NOTE: E2E fired 3 real sandboxed pushes to the owner-rep's
  desktop ("[TEST] Line 1: TEST-23701 needs help") — expected test artifacts.
- Zz retired clean (deactivated via the app admin API when the Supabase editor briefly
  blanked — the screen-saver quirk — then pin fields nulled via SQL once it recovered:
  active=false / pin=null / temp=null). 17 names on the grid. Q116 BUILT.
- NEXT: Coyote push preempts (Mon/Tue); else Supabase Realtime or Q83 day switch.

## 2026-07-31 — block 30 ADDENDUM: Q115 fixes SHIPPED (server.js v30) — owner-rep chose "fix both now"

- v30 = 220,356 / 4041918570 (5 pairs, forward + reversal proven; no migration). Adds a
  shared isUuid() helper + three guards: /api/punch/correct rejects a non-UUID punch_id
  (move/void) or employee_id (add) and a non-integer line_id with a clean 400; shop-hours
  rejects non-number types (the {open:[7]} coercion); /api/line/closed rejects a
  non-integer line_id. All the guards sit AFTER the existing auth/role checks.
- LIVE-VERIFIED on the deployed build (Zz admin): non-uuid punch → 400 "That punch
  reference isn't valid" (was 500) · {open:[7]} → 400 (was 200) · line_id "abc" → 400
  "Pick a valid line" (was 500) · add with bad employee_id → 400. Regressions clean:
  valid 7/16 hours → 200, close+reopen line 2 → 200/200 (no over-blocking).
- Zz retired clean; final state 17 names · 15 temp codes · 0 no-PIN holes · 0 closed
  lines · 7/16 hours. Q115 CLOSED. Blocks 27-30 all shipped, verified, and hardened.

## 2026-07-31 — build block 30: STAGE-5 ADVERSARIAL BREAK-PASS on blocks 27-29 (verification block; no code shipped)

- CONTEXT: mid-break-pass, Fable 5's (deliberately broad) safeguard auto-switched the
session to another model — the break-pass IS cybersecurity work (privilege-escalation
probes, injection fuzzing), exactly what the classifier flags. Owner-rep caught it,
switched back to Fable 5, and asked for a verify-don't-trust sweep of anything that
could have run under the other model BEFORE continuing. Did that first.
- VERIFY-DON'T-TRUST SWEEP (authoritative DB read, not the chat log): shop hours still
7/16 (2 setting rows, no dupes) · 0 lines manually_closed · manager_line_control false ·
exactly 15 real temp codes with the same block-28 names · 0 correction columns on any
REAL employee (block-29 punch work was Zz-only) · GitHub server.js byte-identical to
v29.2 (218,586 / 2156037302) · last 5 commits all mine, no rogue commits. THE ONLY
residue was on the disposable Zz test account (left active-as-admin from the fuzz, and
it had picked up one stray temp code / changed pin_hash at some point in the switch
window — mechanism not fully reconstructable, but isolated to the test account; NO real
staff row affected). Cleaned by the standard retire.
- BREAK-PASS RESULTS (all as live probes):
  · Signed-out probes on every new endpoint (line/closed, shop-hours, temp-pins,
    punch/correct, pin/change, admin/employee) → 401; gated GET pages redirect to /login. PASS.
  · Privilege probes as a production/Team-Member role → every admin/manager endpoint 403
    (line/closed, shop-hours, temp-pins, punch/correct, admin/employee); /admin redirects
    to /home; /manager returns the 403 body. No escalation. PASS.
  · Q114 hole re-verify → /api/pin/set 404, no set-path/choose-PIN copy in the login page. PASS.
  · temp-pins backfill idempotency → 2nd run count 0 (no active emp has a null pin_hash). PASS.
  · C17 lockout regression → 5 wrong PINs → "Locked for 5 minutes" then 429. PASS.
  · Closed-line guards lnGateB (build/start) + lnGateD (kit/deliver): verified by CODE
    IDENTITY against the deployed source — the four guards (lnGate, lnGateS, lnGateB,
    lnGateD) are the identical db(line?select=manually_closed)+refuse pattern; lnGate &
    lnGateS were live-proven in block 27. Not live-exercised (would need moving a test cab
    to line 4 + closing a real line; not worth the switch-mid-mutation risk for a
    copy-identical guard).
- TWO INPUT-VALIDATION FINDINGS (both admin/manager-gated, no data corruption, low
  severity — documented as Q115, fix deferred to a calmer session per owner-rep's call):
  (1) /api/punch/correct with a NON-UUID punch_id → 500 "Server error" (the bad id
      reaches Postgres and throws) instead of a clean 400. The UI only ever sends real
      ids, so no user path hits it. Fix: uuid/int-shape validation before the DB call.
  (2) /api/admin/shop-hours with a single-element array e.g. {open:[7]} coerces through
      Number() and passes (200) — still lands on a valid integer, so cosmetic. Fix: a
      typeof-number guard.
- FINAL STATE (re-verified post-retire): 17 active names · 15 temp codes · 0 no-PIN holes ·
  7/16 hours · 0 closed lines · Zz inactive/null. Everything matches the clean post-block-29
  baseline. No code changed this block.

## 2026-07-31 — block 29 ADDENDUM: both honest gaps closed (owner-rep woke the machine)

- The blank Supabase editor was exactly the recorded screen-saver quirk — owner-rep
confirmed his screen saver had come on; the editor initialized normally once woken.
- MANAGER 14-DAY LOOK-BACK: now exercised live. Zz woken as a MANAGER → an add
20 days back returned 403 "Older than 14 days — that one belongs to an admin"
(no data touched — the guard fires before any insert) · the cockpit's Time
corrections lane renders for the manager role · a same-day request passed the role
gate and reached the note check. Every block-29 code path is now proven.
- ZZ RETIRED CLEAN, the full standard way: active=false · role=production ·
pin_hash=null · temp_pin=null · must_change_pin=false, verified in the returning
row. 17 real names on the grid. No deviations outstanding.

## 2026-07-31 — build block 29: Q111 pt 2 MISSED-PUNCH CORRECTIONS live (server.js v29/.1/.2 + migration 0017)

- WHY: the physical punch clock can't retire until a forgotten punch can be fixed.
This was the flagged "own careful time-engine block." Owner-rep defaults used (he
waved off the questions — stated for review): managers + admins can correct;
corrections VISIBLE on the timecard row; managers reach back 14 days, admins anytime.
- WHAT SHIPPED: cockpit "Time corrections" lane — pick a person + Phoenix day, see
every punch (voided ones struck-through), MOVE a punch (time input + armed button),
VOID one, or ADD a forgotten IN/OUT pair (OUT may be blank only for today). A note is
REQUIRED on every change; events punch.moved / punch.voided / punch.added; the
timecard row wears CORRECTED/ADDED PUNCH stamps with the note — nothing silent.
- THE TANGLE GUARD: any correction must leave the day's punches alternating IN/OUT
when sorted by time (a day may open with an OUT or close with an IN — overnight
spans carry across midnight — but never the same kind twice adjacent). Server
simulates the day before writing; refusals are plain English.
- VOIDED = GONE EVERYWHERE: all 14 clock_event reads (timecards, sweeper, board
coverage engine, on-clock checks, home state, cockpit) now filter voided=is.false.
Moves keep original_claimed_at + corrected_by/at/note; nothing is ever deleted.
- FILES: 0017 (six correction columns on clock_event) run + verified (6 cols);
server.js v29 = 218,339 / 339148895 (17 pairs incl. two REPLACE-ALL pairs with
exact-count prechecks — the harness grew a count field this block; forward AND
reversal proven, v28 reconstruction matched exactly).
- TWO HONEST STUMBLES, BOTH CAUGHT BY THE PROCESS: (1) a stray em-dash landed at
position 0 of the v29 commit (keystrokes aimed at the commit dialog hit the editor
— raw-verify caught it; v29.1 removed it; Railway never served the bad build).
(2) the ADD action's closing punch used kind "clock_out" — the DB's check
constraint (0001: out-kinds are _shift/_lunch/_early/_auto) refused it mid-E2E,
leaving an orphan IN; v29.2 uses clock_out_shift; the orphan was voided through
the corrector itself and the pair re-added cleanly.
- E2E (live, as Zz admin): real punch pair made via the floor endpoints · corrector
lane rendered both · note-required refusal verbatim · VOID ok (audited) · ADD pair
refused while the orphan tangled the day (the guard fired on REAL bad data), then
passed after the orphan was voided · MOVE 08:00→07:30 ok · MOVE past its OUT →
tangle refusal · MOVE to 23:59 → "Can't punch the future" · timecard row read
07:30/09:00/1.5 hrs with the full correction story in flags · cleanup voids passed
in alternation-safe order · timecard row disappeared once all punches were voided ·
board-state healthy throughout · corrector still shows all voided rows struck.
- NOT EXERCISED (honest): the manager 14-day look-back refusal (needs a manager
role; the Supabase SQL editor went blank — screen-saver quirk — so no role flip).
It is a one-line role comparison beside proven code. Exercise it in a future block.
- ZZ RETIRE DEVIATION: retired via the app's audited admin API (dept/role/active
one patch, off the grid, 17 names, login refused via the active filter) — but the
SQL editor outage means Zz's pin_hash/temp fields still hold values on the INACTIVE
row. NEXT SESSION: run the standard null-out SQL (pin_hash, temp_pin, must_change_pin).
- NEXT: Coyote mapping job when his push lands (Mon/Tue, preempts all); menu
otherwise (notification events, Realtime, Q83 day switch, Stage-5 break pass).

## 2026-07-31 — build block 28: Q114 TEMPORARY PASSCODES live — the open-onboarding hole is CLOSED (server.js v28 + migration 0016)

- THE HOLE (owner-rep's catch, mid-block-27): the Q68 "first tap chooses the PIN"
onboarding meant anyone who found shopboard.premierstreetrod.com could tap a
never-signed-in name, pick a PIN, and be inside. Fifteen of seventeen active names
were still open. As of this block the hole is closed IN PRODUCTION.
- WHAT SHIPPED: /api/pin/set is GONE (404) and the sign-in pad only ever ASKS for a
PIN. The server assigns unique 4-digit TEMP codes (scrypt-hashed for login + kept
plain in employee.temp_pin ONLY until replaced, so the launch-day printed sheet and
texts can be produced on the owner-rep's command — Q106 sandbox; codes never touch
the event log). A temp-code login is parked at /change-pin (home/manager/admin all
redirect there) until the person picks their own PIN — which may not equal the temp
code; on success temp_pin is wiped and must_change_pin clears. Admin "Reset PIN" now
issues a fresh temp code (shown on the button) instead of nulling the hash; a
one-tap backfill button covers every active name without a PIN; roster shows
outstanding codes to admins. Events: pin.temp_assigned / pin.temp_backfill /
pin.changed / pin.reset.
- BACKFILL RUN FOR REAL: 15 unique temp codes assigned to the 15 active no-PIN
names, verified unique on the roster. The two who already own PINs kept them.
- E2E (live, as Zz): /api/pin/set → 404 · login page carries no set-a-PIN path or
"choose a 4-digit PIN" copy · reset → temp code returned · OLD pin refused · temp
login ok + change_required:true · /home 302→/change-pin · re-using the temp code as
the new PIN refused with the plain-English message · real change ok · temp code
DEAD afterward (login refused), new PIN works, roster shows Zz's temp wiped ·
the actual /change-pin pad exercised BY TAPPING (4-2-4-2 twice → landed on /home).
- FILES: server.js v28 (203,391 chars / 1247703677, node --check clean; 17 pairs
extracted from the live files, forward AND reversal proven — reconstruction of v27
matched its exact hash 3841021750 before injection), 0016_temp_pins.sql (temp_pin +
must_change_pin columns; run with in-script verification: both columns present,
15 active names without a PIN at run time).
- PROTOCOL NOTE (file-36 relevant): the Zz test cycle can no longer use
/api/pin/set. New wake recipe: compute the scrypt hash LOCALLY (same algorithm:
salt + scryptSync(pin,salt,32), stored "salt:hash") and set pin_hash directly in
the wake SQL. Used this block; works.
- DEFERRED TO CUTOVER (on the owner-rep's explicit command only): text each person
their temp code (needs an SMS provider decision — the app is web-push-only today)
and generate the printable PDF of outstanding codes. Both read from temp_pin.
- NEXT: Q111 part 2 (missed-punch correction) unless the Coyote push lands first
(his word: Monday/Tuesday).

## 2026-07-31 — build block 27: Q113 SHOP HOURS & LINE CONTROL live (server.js v27 + migration 0015)

- WHAT SHIPPED: the 7-to-4 day stops being hardcoded — shop open/close hours are now
admin settings (shop_setting table, 60-second cache, Phoenix time). Everything derives
from the two numbers: the day-end sweeper, Q112 after-hours detection, and the TV board.
- LINE CONTROL: every line gains a manual OPEN/CLOSE switch in the cockpit (two-tap armed
button). Admins always; managers only when the new "Managers can open/close lines"
feature toggle is ON (seeded OFF). A closed line refuses clock-ins, switches, cab starts,
and kit deliveries with a plain-English message. line.closed / line.reopened audited.
- TV BOARD: master chip under the logo — SHOP OPEN (green) / AFTER HOURS with who's-on-what
(amber) / SHOP CLOSED (gray) — plus a CLOSED badge on any manually-closed line tile and
"Line closed" idle text.
- SWEEPER (block-26 nit fixed): when the sweeper auto-clocks-out a forgotten after-hours
punch, it now also ends the open after_hours_session with "(auto-closed — no wrap-up left)"
and logs afterhours.auto_end — so the cockpit lane and timecards tell the truth.
- ADMIN CONSOLE: new "Shop hours" panel (open/close, 24-hour numbers) + nav link;
/api/admin/shop-hours is admin-only, range-checked (0-23, open before close), audited
as shop.hours_set; the cache refreshes immediately after a save.
- FILES: server.js v27 (196,367 chars, checksum 3841021750, node --check clean, pairs
extracted-from-file + reversal-proven to v26 before injection), migration
0015_shop_hours.sql (shop_setting + seeds 7/16, line.manually_closed, manager_line_control
toggle) — committed, raw-verified, migration run with in-script verification select
(2 settings rows · 7/16 · column present · toggle false).
- E2E (live, as Zz): board chip showed SHOP OPEN during work hours · closed Line 2 as
admin → CLOSED badge on the TV tile + clock-in AND switch both refused with "That line is
closed right now — see the manager" · reopened clean, no stray state · shop-hours
validation: 18/5 → 400, 7.5/16 → 400, 7/16 → ok, line 99 → 404 · flipped Zz to MANAGER
with the toggle OFF → /api/line/closed returned 403 with the share-it message, the Close
buttons disappeared from the cockpit, and /api/admin/shop-hours refused 403 · admin page
shows the panel with 7/16 · Zz signed out (/logout confirmed) and retired.
- HONEST NOTE: the build/start and kit/deliver closed-line guards were NOT exercised
end-to-end — every line in test data carries an active or awaiting cab, so their earlier
"line still has an active cab" guards fire first. They are the identical three-line
pattern as the two guards proven above; exercise them in a later E2E when an idle line
with a queued cab exists.
- NEXT: owner-rep added Q114 mid-block (temporary passcodes for never-signed-in names,
forced change at first login, launch-day text + printable PDF on his command only —
Q106 sandbox holds). Q114 is the next build block.

## 2026-07-31 — build block 26: Q112 AFTER-HOURS SESSIONS live (server.js v26 + migration 0014)

**The governance around the clock — built and E2E-proven the same day it was locked, with the enforcement demonstrated by trying to break it.**

- **Shipped:** isAfterHours() (before 7 / after 4 / weekends, Phoenix — Q113 makes the hours settings later) · the AFTER HOURS panel on the clock-in screen (appears by itself outside shop hours; a line tap opens it: WHO approved — roster grid of managers/admins/owners — WHY — the owner-rep's five reasons, pick list — and the one-line plan) · SERVER-side enforcement of all three plus approver-role validation (a curl can't skip the record) · after_hours_session table (0014) · the claim-then-confirm push to the named approver + admins (Q106-sandboxed) · required wrap-up note at clock-out (photos ride the normal task-photo flow) · cockpit lane "After hours — needs a confirm" with one-tap Confirm · timecard rows wear AFTER HOURS: reason — appr. name (UNCONFIRMED) until someone owns the claim, then ✓.
- **E2E, evening-stamped (last night 7–9 pm), enforcement proven by refusal:** governance-less clock-in → refused with the plain-language error · bogus approver (a Team Member) → refused · proper claim (Daniel approved · Deadline push · "Finish welding the doors on 23701") → session opened AND the push landed on the owner-rep's desktop naming line, reason, approver, and plan · clock-out without the wrap → refused · with the wrap → closed clean · cockpit lane showed the full story including the wrap note · timecard row: 2.0 paid evening hours flagged (UNCONFIRMED) · **Confirm tapped → lane cleared, flag flipped to ✓** · Zz retired through the app's own audited admin API, 17 on the grid.
- **Known nit, queued for the Q113 block:** the day-end sweeper auto-closes a forgotten after-hours PUNCH but leaves the SESSION open with no wrap note — the sweeper should end open sessions with wrap_note "(auto-closed — no wrap-up left)" so the cockpit lane tells the truth about forgetful nights.
- **Pipeline:** v26 = 186,380 units / 3084330029 · 15 pairs extracted from the live file, proven by reversal to v25.2's exact hash · byte-exact in the editor first pass · node --check clean · fast deploy.
- The owner-rep can watch the screen change by itself after 4 PM today — the governance panel appears on the floor clock-in with no deploy, no toggle, nothing to remember.

## 2026-07-31 — block 25 amendment: UPGRADES & OPTIONS box + navigation polish (server.js v25.2)

**Owner-rep's follow-up notes on the fresh order page, shipped within the hour.** (1) The order page gains a **prominent UPGRADES & OPTIONS box directly under the owner info** — "THIS is what the production department NEEDS to see so they know what they are building." It reads the cab's option-source tasks, so when the Coyote link goes live options populate automatically; until then it shows the honest "STOCK BUILD — no upgrade options on file" with a plain note about where options will come from. The Coyote mapping block inherits a hard requirement: options MUST land as option-source tasks so this box fills itself. (2) Step-by-day progress moved below the options box. (3) "← Back to the board" added at the TOP of the order page (bottom link kept). (4) The board dropped the now-redundant family text after the order number (the tile title carries it) and gained a **← Back** control in the footer beside Sign out. v25.2 = 174,713 units / 3645765236, 5 pairs reversal-proven to v25.1, byte-exact first pass, verified live by screenshot.

## 2026-07-31 — build block 25: BOARD & CONSOLE POLISH — the owner-rep's nine notes, live (server.js v25 + v25.1)

**The board finally reads the way the owner-rep sees the shop.** All nine of his notes shipped and were E2E-proven the same morning:

- **TV board:** color LEGEND (green / amber / red / idle / rework, spelled out) + the missing SIGN OUT · ON DECK on EVERY line, with an honest "— nothing queued" empty state (it had only appeared where a queue existed) · tile titles now show the cab family actually ON the line ("Line 1 — 64-66" while a 64-66 is on it; idle lines keep the capability list, his pick) · "Nobody on the clock" instead of silence · every order number is a LINK.
- **NEW: the order detail page (/order/<number>)** — PUBLIC by owner-rep call: cab #, family, line, status, kit state with the short-note, promised/started dates, customer (see v25.1), destination, invoice note, and the full frozen step list day-by-day with ✓/⏳ marks and a progress bar. Upcoming cabs get a plain-language explainer of when their task list will exist. Unknown orders get a friendly 404.
- **v25.1 same hour:** the first render showed "Customer: true" — customer_display turned out to be a per-cab PRIVACY FLAG, not a name. Page now shows customer_name and HONORS the flag (a false hides the name on this public page). One pair, reversal-proven.
- **Console:** the everyday role now displays as **"Team Member"** everywhere (option value stays 'production' — the fix that doesn't break anything) · **add-a-step RENUMBERS**: adding as #7 shifts numeric 7,8,9… down and takes that spot in the running order; **retire pulls them back up** (the symmetry that stops gaps); non-numeric numbers (rework R1…) never touched; Q97 future-cabs-only untouched.
- **E2E:** board screenshot-verified (all four tiles: titles, ON DECK states, nobody-on-clock, legend, sign-out) · /order pages for the active cab (24 post-read-back steps by day), the SHORT-kit upcoming cab ("brake brace box" note rendered), and a 404 · **the renumber round-trip proven by MD5**: 64-66 template snapshotted (24 steps), probe added at #7 → clean 1..25 with old 7 now 8 → probe retired → **template hash byte-identical to the snapshot**. Mike's numbering cannot be corrupted by this tool. Zz woken/retired clean, 17 active.
- **Pipeline:** v25 = 173,564 / 921307737 then v25.1 = 173,552 / 92837640 · 11+1 pairs extracted from the live file, both proven by reversal · byte-exact in the editor on the first pass, twice · deploys clean (the platform incident is over).

## 2026-07-31 — decisions: Q112 AFTER-HOURS SESSIONS + Q113 SHOP-HOURS CONTROL (record only, no code yet)

**The after-hours brainstorm, verified against the engine before designing.** The time machinery already handles evenings and weekends — any-hour clock-ins pay correctly, evening labor lands on the cab's actuals, and the sweeper has given after-day-end sessions their own +8h window since the risk sweep. So the owner-rep's Option B locked: an approved after-hours session IS the normal clock — same line buttons, same cab screen, same tasks.

- **Q112 adds the missing governance:** outside shop hours the clock-in screen asks three things first — WHO approved (roster grid of managers/admins/owners), WHY (editable pick list: Making up hours · Cab behind, catching up · Deadline push · Company project · Overtime), one line on the plan. **Claim-then-confirm** approval (over a hard pre-approval gate — no Saturday tech stuck waiting on an owner's phone): clocking in fires a one-tap-Confirm push to the named approver + owners (Q106-sandboxed until cutover); unconfirmed sessions wear a visible flag on timecards + cockpit. Clock-out wrap-up: note REQUIRED, photos optional. Timecards flag after-hours rows with reason / claimed approver / confirmation. Working through lunch needs nothing — stay clocked in.
- **Q113, record corrected first:** the app never had a manual morning line-start (Start starts a CAB; the day is engine shop-hours — DAY_END_HOUR_PHX=16, hardcoded with "admin-adjustable later" in the comment). Locked: shop open/close hours become admin-console settings (7:00–16:00 default) feeding the sweeper, engine, and Q112's after-hours detection · manual per-line open/close override (admin always) · "Managers can open/close lines" as a Q65 toggle, default OFF.
- Build order on the menu: Q112 → Q113 → Q111 part 2 (missed-punch tool). The Coyote mapping job preempts everything when the developer's first post lands (his word: Monday/Tuesday).

## 2026-07-30 — build block 24: Q111 part 1 — SHOP TIME + TIMECARDS live (server.js v24 + migration 0013)

**The Monday-morning-meeting problem is solved and payroll has its first report — E2E-proven through the real flow the same day the decision was locked.**

- **Shipped:** "Shop time" work area (line 10, warehouse pattern — paid from the first tap, invisible to the TV, structurally unable to charge any cab; covers meetings, cleanup, and the owner-rep's expansion: in-house fabrication as a visible NON-BILLABLE bucket) · Shop time button on the clock-in screen with plain-language subtitle · one-tap SWITCH straight from the clock screen (meeting ends → tap your line; the clock screen finally has the switch control the cab screen already had) · Shop time joins the cab screen's switch picker · TIMECARDS lane on /reports + CSV (per person per Phoenix day: first in, last out, paid hrs, Shop-time column, notes with auto-closed flags + non-routine reasons) · "Sick" clock-out reason (migration 0013) · v23.1 fix: await serviceWorker.ready before subscribing (the first-tap race from block 23's E2E).
- **E2E live, the real floor flow:** Zz woken as Production/lines{1} → clocked in via Shop time → header read "ON THE CLOCK · Shop time", Sick button present, switch section offered Line 1 and correctly did NOT offer Shop time → one-tap switch to Line 1 → cab screen (TEST-23701) with Shop time in the picker → switch back to Shop time → clocked out Sick → Timecards lane rendered the day's row ("10:17 in · 10:18 out · Sick") AND reconstructed the whole test week with auto-closed flags from history; CSV matched → Zz retired through the app's own audited admin API (PIN reset + role/dept/active in one patch — cleaner than SQL), 17 on the grid.
- **Field note:** automation outran the time engine once — a clock-out fired inside the switch's deliberate 1-second replay gap, leaving the switch's clock-in as the latest event. No human can tap that fast; a second clock-out cleared it. Not a bug: the deterministic-replay design behaving exactly as specified under superhuman input.
- **Pipeline:** v24 = 165,111 units / 4018712652 · 14 pairs EXTRACTED FROM THE LIVE FILE (no retyping — the v23 lesson applied) and proven by reversal to v23's exact hash · byte-exact in the editor on the first pass · node --check clean · deploy rode out the tail of the Railway/GitHub incident.
- **Q111 part 2 still owed, its own block:** the missed-punch correction tool (manager, audited) — it touches time-engine replay everywhere, so it gets a single-purpose pass. Required before the physical punch clock retires.

## 2026-07-30 — build block 23: NOTIFICATIONS v1 LIVE under the Q106 SANDBOX (server.js v23 + migration 0012)

**The sandbox is now structural, and a real push landed on the owner-rep's desktop the same afternoon.** His reaffirmed order — "no emails, no NOTHING until we are ready to go live" — is enforced in code, not policy: every message funnels through one notify() chokepoint, and unless the Railway variable NOTIFY_LIVE is exactly "yes" (a NAMED cutover step, deliberately not an admin switch), delivery is rewritten to him alone with a stamp naming who it WOULD have reached. notification_log records true intent either way.

- **Shipped:** zero-dependency WEB PUSH (VAPID JWT per RFC 8292 via JWK-imported P-256 key; payload sealed per RFC 8291 aes128gcm — both proven by local round-trips BEFORE commit) · /sw.js service worker · 🔔 device opt-in + admin "Send a test push" on the watcher page · first three matrix events: heading-to-inspection → warehouse (Q109-7), line-clear → warehouse, rework-assigned → the line's usual techs · channel choice (owner-rep): push only during the build, email/SMS unbuilt until a provider is connected · expired subscriptions (404/410) retire themselves · a notification failure can never break a floor tap.
- **Migration 0012:** push_subscription + notification_log + employee email/phone (owner-rep's contact seeded). Railway vars: VAPID keypair + SANDBOX_EMPLOYEE_ID.
- **E2E, live:** subscribed the owner-rep's Chrome (permission granted by him personally) → /api/push/test → **"[TEST] Shop Board test … (would have gone to: Zz T.)" displayed on his desktop** — chokepoint, sandbox rewrite, sealing, push service, service worker, screen. Then a REAL event: sign-off fired build.line_clear → **"[TEST] Line 1 … is CLEAR … (would have gone to: Eric F., Jonathan A., Scott L.)" also displayed** — the warehouse crew named as intended, delivery to owner-rep only. notification_log: 4 rows, all sandboxed:true, statuses sent. Zz retired full, 17 active.
- **Honest notes for the record:** (1) the first 🔔 tap hit a service-worker startup race ("no active Service Worker") — second tap succeeded; queue a v23.1 nit: await serviceWorker.ready before subscribing. (2) The real-event sign-off hit the WRONG cab — my page-scrape took the first Sign-off button (TEST-23701, active on Line 1) instead of TEST-23704's inspection box, the same first-match class of error as the C20 Andrew incident, this time consequence-free on test data; TEST-23701 reverted to active by SQL, and the console-targeting playbook rule stands re-learned. (3) Deploy sat ~25 min behind a GitHub/Railway incident (both platforms bannered it) — patience, not failure.
- **Pipeline:** v23 = 159,835 units / 3379809398 · 14 pairs proven by reversal to v22's exact hash (the reversal proof itself caught a 6-char pair-extraction over-reach before injection; the editor hash check caught one retyped-comment drift — both guards earned their keep) · node --check clean · main byte-exact.
- **Cutover checklist gains the explicit step: set NOTIFY_LIVE=yes.** Until then, staff receive nothing, ever, no matter who subscribes.

## 2026-07-30 — Q94 refined: roles are GRANTS, not positions (server.js v22)

**Owner-rep pushback that turned out to be the design working as intended — plus the one cosmetic fix it deserved.** He proposed that manager shouldn't be a position; admin should ELECT people into management tools. The live roster already works exactly that way (Q94: department = position, role = granted tools — Mike is Production/manager today; electing Jason in Body Shop someday is one dropdown flip in the People panel, audited, revocable).

- **The leak:** the sign-in grid showed Mike's chip as "Manager" — presenting a grant as a position. Fixed to his exact spec: **chip = name, then POSITION with ROLE in parentheses** — "Michael Hull / Production (Manager)", "Ross Logsdon / Owner (Admin)"; plain production roles just show the department.
- **Departments Owner + Marketing added** to the list, and live positions corrected: Ross / Rob / Kerry → Owner, Daniel → Marketing (all keep the Admin role — access rides the role dial, so nothing about what anyone can do changed).
- **Watcher greeting** now keys on role=admin too, so a Marketing-dept admin reads as a watcher instead of "your board is coming."
- **Pipeline:** 4 pairs proven by reversal to v21's exact 146,087 / 3689149976; v22 = **146,292 units / 4129630201**; node --check clean; main verified byte-exact after commit.
- **Deploy note:** Railway queued the v22 deploy behind an upstream GitHub incident ("Deployment queued due to upstream GitHub issues"). The DB position changes were verified live through v21 code (grid already read Ross=Owner, Daniel=Marketing). The parenthesized chips need one look once the queue clears — carry to next session if unconfirmed.

## 2026-07-30 — build block 22: CAB NUMBERS LIVE (server.js v21)

**Q110 built, deployed and E2E-proven the same morning it was locked.** The wall's cab # now shows everywhere an order is looked at — and nowhere else (the TV stays clean, per the owner-rep call).

- **Shipped:** cab # on the manager cockpit (active / awaiting / rework / queue rows) · warehouse board (working-now line + upcoming queue rows) · reports (signed-off detail + open-cabs aging get a Cab # column; cabs CSV gains cab_number) · the cab screen has shown it since v1 (build.cab_number existed from migration 0001 — zero DB work this block).
- **New admin panel "Cab numbers":** every open cab (upcoming through rework) with an editable field — until cutover the WALL owns the counter and admins type what the board says — plus a per-family "next up" readout (highest number seen per letter + 1, computed across ALL cabs ever; the counter never rewinds) to compare against the whiteboard at a glance.
- **New endpoint /api/admin/cab-number:** admin-gated · format checked (digits + 1-2 letters, like 244T; lower-case input is uppercased) · duplicates REFUSED (numbers are never shared or reused) · blank clears · every set audited as build.cab_number_set with old and new values.
- **E2E live (Zz cycle):** woke Zz as admin → PIN set → admin panel rendered with the empty-state note → bad format "abc" refused with the plain-language error → set 9901t on TEST-23708 (stored 9901T) → duplicate on TEST-23707 refused → next-up readout showed 9902T → cockpit shows "ORDER TEST-23708 · Cab #9901T" → reports page + CSV header carry the column (CSV rows correctly empty — the signed-off test cabs have no numbers) → flipped Zz to Warehouse dept: warehouse board shows "Working now: ORDER TEST-23708 · Cab #9901T (active)" → audit row confirmed (to=9901T, actor=Zz, n=1) → Zz retired FULL (inactive / production / Production / no PIN), 17 active. The 9901T stays on TEST-23708 as a visible demo; it purges with the TEST data at cutover (Q87).
- **Pipeline:** 21 edit pairs, PROVEN BY REVERSAL locally (v21 with new→old reproduces v20's exact 141,415 / 3471363342) before injection; editor verified at exactly v21 = **146,087 units / 3689149976** pre-commit; node --check clean; deploy watched to ACTIVE on Railway.
- **Still ahead for cab numbers (rides the Coyote mapping block):** auto-assign at order arrival + the wall-photo backfill with the signed read-back sheet. Both wait on the developer's first push (his word: Monday/Tuesday).

## 2026-07-30 — decision: Q110 CAB NUMBERS join the app (record only, no code yet)

**The whiteboard's internal Cab # (244T, 144B, 305A…) is app-owned going forward — locked with owner-rep from a photo of the wall board.**

- **Letter key:** T = 55-59 (Taskforce) · A = 47-53 (Advance Design) · C = 67-72 C10 · F = 67-72 Ford · B = 69-72 Blazer · D = 64-66 (the letter means nothing — staff's pick). BT = Blazer Top — outsourced, its own sequence, NOT in the app; top-only orders in a Coyote push are ignored entirely.
- **Per-family counters**, proven by the wall itself (T at 239–245 · A 303–308 · B 143–148 · C 162–167 · D 15–16 · F 7–10 · BT its own 63–68 run). Demo cabs consume numbers too (12D · 7F · 148B) — the counter counts cabs BUILT.
- **Rules (structured Q&A, all recommended options):** numbers BURN on cancellation, never reused · assigned THE MOMENT an order arrives (at Coyote mapping — matches wall practice) · the WALL owns the counter until cutover (audited admin field mirrors it; the app takes over at the verified high-water marks — one master at a time).
- **Display (easy to find, NOT the TV — owner-rep call):** cab screen under the order number ("PSR-23708 · Cab #246T") · cockpit rows + sign-off detail · warehouse queue rows · reports cab detail + CSVs · admin editable audited field + a per-family "next up" readout.
- **Storage:** build.cab_number has existed since migration 0001 — zero migration needed. The build block = counter logic + display + backfill.
- **Backfill:** the first push (existing 2026 orders to current) arrives WITHOUT cab numbers — transcribe the wall photo (archived in the working folder as Whiteboard_CabNumbers_2026-07-30.png), then a signed read-back sheet confirming every order#↔cab# pair before any DB write.

## 2026-07-29 — build block 21: WAREHOUSE IS LIVE (server.js v20 + migration 0011)

**Q109 built and E2E-proven the same day it was locked.** The warehouse board is real: sign in with a Warehouse-department account and /home is the whole job on one screen.

- **Shipped:** warehousePage (per-line state + upcoming queues + the amber "AWAITING INSPECTION — pull the next kit now" trigger + green "LINE CLEAR") · three-state kit verify with optional short-note · queue reorder (▲▼, upcoming only, audited) · two-step pull task with ARMED Delivered · **/api/kit/status, /kit/move, /kit/pull, /kit/deliver** (all gated warehouse-dept-or-manager/admin, all audited) · **freezeAndStart() is now the ONE start path** — warehouse Delivered is the normal way a cab begins; the manager Start button rides the same code as an override · Warehouse work area (line 9, enabled=false — invisible to the TV board and the pace engine by construction) with clock in/out on the board · manager cockpit queue now shows KIT ✓ / SHORT chips and follows warehouse's queue order.
- **E2E, live through the real buttons:** clock in — Warehouse ✓ · marked TEST-23707 SHORT w/ note "brake brace box" ✓ · verified TEST-23708 ✓ · moved it to the front ✓ · Pull started ✓ · armed Delivered ✓ → **TEST-23708 went ACTIVE on Line 3 with 24 frozen tasks — the post-read-back template, so this also E2E-proved migration 0010's freeze path** · full kit audit trail (kit.status ×2, kit.queue_move, kit.pull_started, kit.delivered w/ pull_minutes) · clock out End of shift ✓ · Zz retired FULL cycle incl. department, 17 active.
- **Also proven en route:** the 4-second arm window resets correctly (automation that waited too long between taps got re-armed instead of fired — the safety doing its job). Note for the taxonomy pass: clock-out rows carry no line_id (pairing is by employee) — fine for the engine, noted for reports.
- **v20 = 141415 units / 3471363342**, 9-pair injection proven by reversal to v19.1 first; node --check clean; migrations now 0001–0011.

**Launch scope now includes warehouse.** Remaining external gate: Coyote posts. Next-block menu: Coyote mapping (delivers straight into the warehouse queue) · notification layer (Q106 sandbox; awaiting-inspection push + line-frees-soon) · Realtime · Q83 day switch · reports lane for kit pulls.

## 2026-07-29 — decision session: Q109 locked — WAREHOUSE joins the launch (no code shipped)

**Owner-rep expanded the launch scope: the warehouse role ships in Phase 1**, centered on the handoff INTO production. Full detail in register Q109; the shape for the next build block (21):

- **Warehouse board:** all upcoming orders + per-line on-deck (first real consumer of the Coyote queue; manual orders until his posts land).
- **Three-state kit verify** per order: unverified → VERIFIED-COMPLETE → SHORT (flag only — part-level detail stays in Coyote this launch; optional note). **Hard gate: no pull, no delivery, no clock start without green.**
- **Warehouse reorders the upcoming queue** (per-line next-up) — never active/awaiting cabs; C9 rules; audited. A short order gets slid past, visibly, with zero line idle.
- **Two-step pull task** ("Pull started" → armed "Delivered"), attributed + timestamped; pull duration is a tracked metric (~1 h expected).
- **DELIVERED = the production clock start** — replaces the manager's manual "Start next build" as the normal path (task freeze Q97 + promised date Q103-6 anchor to delivery; manager override kept). Engine edge owned by the build: coverage attribution if the previous cab returns to rework after the next one starts on the same line.
- **Trigger: the awaiting-inspection event** is the firm "go pull" signal; the shelved line-frees-soon toggle (Q65) becomes the forecast heads-up when the notification layer ships — all Q106-sandboxed until cutover. V1 signal renders on the auto-refreshing warehouse board.
- **"Warehouse" becomes a clockable work area** — morning/lunch/evening clock habit for the accounting future; warehouse hours excluded from line-pace math.
- **Staffing from the existing roster by department**; warehouse sign-ins land on the warehouse board instead of the "your board is coming" page.

Future crating/shipping duties extend the same state machine later (file 08) — nothing in this block is throwaway.

## 2026-07-29 — build block 20: MIKE'S READ-BACK LOCKED IN (migration 0010)

**The gating input landed: Mike's signed read-back sheets for all six cab families (dated 7/29), applied the same day** — plus the owner-rep step combines decided in the same conversation. Migration 0010, proven by simulation before it ran (mapping completeness, clean 1..N numbering, hour conservation), then run and verified live.

- **Combines (fewer floor taps, zero hours moved):** receive/organize/prep panel kit -> ONE step, all six cabs · latches + hang LH + hang RH -> ONE "Hang doors" step everywhere · Blazer rocker boxes+plates and tailgate hang+latch each -> one · 64-66 inner+outer cowl -> one. **165 live steps -> 138** (~27 fewer taps per full fleet pass).
- **Mike's marks applied:** days all HOLD as printed (his word via owner-rep); in-day sequences per his renumbering; floor pan goes on the BASE (not the jig) on five families — 47-53 additionally runs outer-rear-sections -> pan -> jig; the 64-66 "28*" mystery = Set & square A-pillars, Day 1 (owner-rep's "run it up the ladder" answered); Blazer "Fit toe board & transmission tunnel" -> "Fit transmission tunnel"; both starred provisionals resolved into clean numbering — no gaps, no stars anywhere.
- **Deliberately unchanged:** 47-53 "Check window openings" stays 1.75 h — Mike flagged MORE HOURS (door fit) but gave no number; owner-rep call: let the first live weeks (Q96 calibration) set it. Register note kept.
- **Verified:** per-family live counts/hours exactly as simulated (21/48h · 25/112h · 24/48h · 24/96h · 20/56h · 24/80h); 64-66 full list spot-checked in floor order. Q97 respected: template edits shape FUTURE cabs only; frozen lists untouched; absorbed rows retired, never deleted. **Option->day mappings (Q10) unaffected by construction** — options anchor to DAYS and days did not move.
- **Records:** signed sheets archived (Mike_ReadBack_Signed_2026-07-29/ in the working folder, HEIC decoded via a purpose-built container pipeline) · clean FINAL step-list PDF regenerated for the shop (Cab_Build_Steps_FINAL.pdf).

**This closes the "await Mike's sheets" gate.** Still waiting on the outside world: Coyote developer's first posts (intake listening, zero real rows). Open flag: Q101 — confirm Blazer OPTION hours are 2-man numbers.

## 2026-07-29 — block 19 amendment: Reports are ADMIN-first (owner-rep call, same day)

**Owner-rep flagged it within the hour: reports are ADMIN work — the manager runs the floor, admins run the numbers.** Fix shipped as **v19.1** + **migration 0009**, the Q65 toggle framework doing exactly what it was built for:

- New switch in the admin console Features section: **"Managers can see Reports"** — default **OFF**.
- OFF: a manager gets a polite refusal on /reports (with directions to the switch) and the Reports link disappears from the cockpit nav. Admins always have full access.
- ON: manager gets the page + the nav link — one flip, no redeploy.

**E2E proven both directions live** (Zz-as-manager: OFF → 403 + hidden link · ON → 200 + link back), then the switch restored to OFF and Zz retired clean (17 active). v19.1 = 126895 units / 3360811429, injection proven by reversal to v19 first.

## 2026-07-29 — build block 19: REPORTS v1 live (file 12 first slice)

**server.js v19 — the reporting suite's first real page, owner-picked as the block.** `/reports` (+ `/reports.csv`), manager/admin only, linked from the cockpit nav and the admin sticky bar. Five lanes, all computed from data the app already captures — zero new data entry (file 12's core promise):

- **Actual vs standard by product** — "the money report" (suite 2). Actual = clocked man-hours on the cab's line from start to sign-off (C15/Q103: clock truth, never task timers). This is the table that trues Mike's standards up over time and later feeds Q96 auto-tune.
- **Signed-off cabs detail** — per-cab std/actual/variance with sign-off timestamps (Phoenix).
- **Open cabs aging** (suite 1) — days open, done/std man-hours, promised date, state.
- **Labor per person** (suite 3 basics) — clocked hours + days present for the period; page carries the file-12 privacy note (coaching view, never the floor).
- **Rework in period** (suite 5 basics) — count + reasons from the audit trail.

Period buttons Week/Month/Quarter/Year; **CSV export** on products/cabs/labor (file 12 universal controls) with proper quoting + attachment headers. New shared helpers: `workIntervals()` (clock stream → closed work intervals) and `overlapHrs()` — one clipping rule for every report.

**Verified live:** role gate proven (retired-production session → 403 before wake), all five lanes rendering real test data (3 signed-off PSR-6772 cabs · aging list with done/std · Zz 75.4 h/6 days · rework "Panel fit / gaps — 1"), CSVs byte-checked against the page numbers. Injection proven (5-pair set reversed to v18.2's exact hash first); v19 = 125818 units / 3673713268 on main; node --check clean. Zz cycle: woken manager → viewed → retired full (inactive/production/no PIN), 17 active.

**Deliberately deferred to later report blocks:** on-time % (needs promised-date history), downtime split by reason, auto-tune suggestions, forecasting, email digests (waits on the Q106-sandboxed notification layer), drill-down links.

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
