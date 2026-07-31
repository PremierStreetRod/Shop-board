# BUILD_LOG — Shop Board
Chronological build journal. Every work chunk gets an entry (Q99). Newest first.

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
