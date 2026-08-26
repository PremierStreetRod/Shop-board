// ============================================================
// SHOP BOARD — server.js (v50, 2026-08-04: Q86 PHONE PHOTO HAND-OFF (stage 1) — for the rare case where someone works a cab on the shared tablet, they can now get photos off their phone without AirDrop or undocking the tablet: a "Send photos from a phone" button on the finish screen mints a short code (good 20 min), the worker opens /h on ANY phone with NO login, enters the code, and the photos attach straight to that cab as completion photos (they count toward the required minimum). The code is single-cab, add-a-photo-only, capped, and time-limited — it can't read or change anything else. QR one-scan opening + the per-step version come next. No migration. Previous: v49 Q86 HARD COMPLETION-PHOTO GATE — the per-product completion-photo minimum is now a HARD gate (block 12 shipped photos + a soft nudge; this makes it real). A new product.photo_min (migration 0023, default 1) is tunable in a new admin "Product settings — completion photos" panel; a builder can't send a cab to inspection until at least that many completion photos are attached (0 = exempt that product). Enforced server-side in /api/build/finish and mirrored on the phone Finish button. No behavior change for cabs that already meet the minimum. Previous: v48 Q123 INPUT-VALIDATION SWEEP pt 2 — completes the sweep: the same id guards now cover the manager/admin-gated write endpoints (build rework/complete/start, admin employee, admin cab-number, after-hours confirm) and the reports template param, so a crafted id can't inject PostgREST filter syntax anywhere a write happens. (The line endpoints already had integer guards from block-30/Q115, and push/subscribe already encodeURIComponent-s its endpoint.) No behavior change for valid input, no migration. Previous: v47 Q123 INPUT-VALIDATION SWEEP pt 1 — the tech- and warehouse-reachable write endpoints now validate their id inputs (isUuid for cab/step/approver ids, integer for line ids) BEFORE those ids reach the database, so a crafted id cannot inject PostgREST filter syntax (e.g. widening a PATCH to every row) and malformed input gets a clean 400 instead of a 500. Covers task state/note, build finish, kit status/move/pull/deliver, and clock in/switch. The manager/admin-gated write endpoints get the same in pt 2. Extends the block-30 isUuid guards. No behavior change for valid input, no migration. Previous: v46 CONTENT-SECURITY-POLICY (ENFORCING) — the CSP shipped report-only in v45 is now ENFORCED (the header name flipped from Content-Security-Policy-Report-Only to Content-Security-Policy). It was confirmed clean first — no violations on the board, the manager cockpit, an order page, or an opened cab photo (the only console red was an unrelated benign 401 from the notifications bell on a signed-out page). If some page ever needs an origin this policy omits, the fix is to add it to the directive; a full revert is the one-word change back to report-only. No behavior change for legitimate use, no migration. Previous: v45 Q123 CONTENT-SECURITY-POLICY (report-only) — a CSP is now sent in REPORT-ONLY mode: the browser reports what WOULD be blocked (to its console) but blocks NOTHING, so the policy can be proven clean on every real page before it is enforced. Inventory confirmed the app is fully first-party (same-origin fetch/SSE/photos/worker, no external scripts/fonts/data-images), so the policy is default-src self, with self + unsafe-inline for script/style (the UI relies on inline scripts, inline styles, AND inline onclick handlers, which nonces cannot cover), self for connect/img/worker/font, plus object-src none, base-uri self, form-action self, frame-ancestors none. Enforcing mode follows once report-only is confirmed clean. No behavior change, no migration. Previous: v44 Q123 LOGIN RATE-LIMIT — a shared-IP-safe guard against name-enumeration / credential-stuffing at the sign-in screen. The existing per-person lockout (5 wrong PINs -> 5 min) already caps brute force on ONE name; this adds a per-source guard that trips only when ONE client IP fails logins against MANY DISTINCT names in a 10-minute window (threshold 20 — deliberately above the ~17 real names, so legitimate shop use behind one shared public IP can never trip it), pausing that IP for 15 minutes. Defense-in-depth: a determined attacker can spoof X-Forwarded-For to evade it, but still hits the per-person lockout. No migration. Previous: v43 Q123 SECURITY HEADERS — every response now carries HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, and a Referrer-Policy, set once before routing so they apply to every response type (pages, JSON, redirects, SSE, CSV, the photo proxy). A Content-Security-Policy is deliberately deferred to its own pass since the app leans on inline styles/scripts. No behavior change for users, no migration. Previous: v42 Q122 SESSION LOCKOUT ON DEACTIVATION — a deactivated employee's existing signed-in session is now rejected on their very next request, not only when their 12-hour cookie finally lapses. Every authenticated route resolves its session through one shared liveSession() chokepoint that re-checks the person is still ACTIVE, so removing someone (or an ex-employee with a still-valid cookie) loses ALL access at once — floor actions, the manager cockpit, and the admin console alike. Closes the Q122 hole where the role gates checked role but not active. No migration (employee.active already exists). Previous: v41 Q118 ADMIN TOGGLE PLAIN-LANGUAGE — a light copy pass so the Features switches read clearly for a non-technical human: "cutover" becomes "until we go live", and the pace-warning and early-red descriptions are plainer. Text only, no behavior change. Previous: v40 Q120 NOTIFICATION INBOX — every person now has an in-app inbox at /inbox showing their own notification history (newest first, unread highlighted), and a small unread "bell" appears top-right on every app screen so a NEW notification is visible even when push/text/email are off. Opening the inbox marks them read. Q106-safe: it only shows a person their own notifications when they sign in — nothing is sent out, and the sandbox still governs push/text/email delivery. Migration 0022 adds notification_log.read_at. Previous: v39 Q119 REPORTS CSV HEADERS — the CSV exports now carry plain, human-readable column titles (Title Case + units — "Order #", "Standard hours", "Variance %", "Paid hours", etc.) instead of snake_case keys, so a spreadsheet reads clearly. Same data, friendlier headers. Previous: v38 Q119 REPORTS PERIODS — the reports period picker is now clearly labelled and far more flexible. The old Week/Month/Quarter/Year buttons were actually rolling "last N days" windows (misleading); they are now grouped as ROLLING ("Last 7 / 30 / 90 days") and TO-DATE ("This week / month / year"), plus a CUSTOM From/To date range, and every view shows a "showing <start> → <end> (Phoenix dates)" subtitle so it is unambiguous what is being searched. Under the hood reportData() takes an explicit [start,end) window instead of a day count (adds the missing upper bound, so a past custom range is exact); the live snapshots — open intervals and open-cab aging — still use real now. CSV filenames carry the period. Previous: v37 Q77 REASON-LIST EDITOR polish — friendly display names added for the remaining admin-managed lists (absence/attendance, blocker, hold, fix-job) so the editor shows plain labels, not raw keys (Q118 spirit). Previous: v36 Q77 REASON-LIST EDITOR — the admin console gains a "Reason lists" panel that manages the choices in every admin-editable pick list (clock-out reasons, rework reasons, after-hours reasons, down-for-today reasons, time-off reasons): rename, reorder (up/down), add, and retire (retire-not-delete keeps history and just drops the choice off new menus) — the same pattern as the Build-steps editor, admin-only, fully audited (picklist.added/renamed/moved/retired/restored), no migration. Previous: v35 Q92 TIME-OFF FOLLOW-UP (owner-rep) — (a) approving/denying a request AND the direct "add time off for anyone" are now ADMIN-ONLY (were manager+admin); managers keep only the read-only "who's out, upcoming" list. (b) the requester may leave an OPTIONAL note with the request (shown to the admin in the needs-you lane). (c) the new-request heads-up goes to admins now. (d) the "Time-off requests" toggle ships OFF by default (migration 0021 flips it; the panel stays hidden and /api/timeoff/request refuses until an admin turns it on). Previous: v34 Q92 TIME-OFF REQUESTS — a builder asks for time off from their phone (a date range + a reason); it lands in the manager's "Time off — needs you" cockpit lane; one tap approves or denies (optional note); the person sees the decision and their own pending/upcoming requests on the home screen. A manager or admin can also enter time off for anyone directly (lands already approved). An "upcoming — who's out and when" list shows approved absences ahead. Q106-sandboxed (every push reroutes to the owner-rep until the NOTIFY_LIVE cutover); gated by the "Time-off requests" admin toggle; fully audited (timeoff.requested/approved/denied/added). DEFERRED honestly to a later block: feeding an absence into each cab's finish-date projection, a days-ahead visual calendar, on-arrival reason pre-loading, and the Meeting Pack. Previous: v33 Q83 "DOWN FOR TODAY" QUICK-HOLD — one tap in the cockpit marks a line as EXPECTED idle (staff out / equipment down / no work scheduled): its TV tile goes calm-slate with the reason instead of a bare "Idle line", alerts stay quiet, it AUTO-CLEARS when the day rolls, and it AUTO-RESUMES the instant someone clocks in (Q84: working-while-held is impossible). Manager + admin, reason from an admin-editable pick list, fully audited. Distinct from the Q113 hard line-close (which refuses work and needs a manual reopen). Previous: v32 Q117 LIVE BOARD (server-sent events) — the TV board updates within ~3 seconds of any change instead of on the old 30-second poll. The server holds an EventSource per screen and bumps it the instant a new event_log row lands (every board-affecting action writes one), then the client re-fetches board-state and re-renders (same proven path). Keys stay server-side — no browser DB access. One shared cheap signal replaces N client polls; when nobody is watching the TV it does no work; a 30s fallback poll + EventSource auto-reconnect keep the board correct through any drop. Previous: v31 Q116 PACE EARLY-WARNING PUSHES — a background patrol turns the board's own RED into a push, so the owner-rep hears that a cab needs help instead of having to watch the TV. Edge-triggered (one push when a cab crosses into red, silence while it stays red, re-arms on recovery), reuses the board engine's exact math via an internal read of /api/board-state (zero drift with the TV), Q106-sandboxed (all delivery reroutes to the owner-rep until cutover), gated by a "Pace early-warning pushes" admin toggle, and runnable on demand from the console. Previous: v30 Q115 BREAK-PASS HARDENING — three input-validation guards the block-30 adversarial pass surfaced (all admin/manager-gated, no data risk, but a 500 is ugly): a non-UUID punch id, a non-integer line id, and an array smuggled into shop-hours now all get a clean 400 instead of reaching Postgres or coercing through Number(). Shared isUuid() helper. Previous: v29 Q111 pt 2 MISSED-PUNCH CORRECTIONS — the last piece before the physical punch clock retires. Cockpit gains a "Time corrections" lane: pick a person + Phoenix day, MOVE a punch to the right time, VOID a bogus one, or ADD a forgotten pair. Managers + admins (managers reach back 14 days, admins anytime); every change requires a note, lands in the event log (punch.moved/voided/added), and stamps the person's timecard row — nothing is silent. A correction must leave the day's punches alternating in/out (the tangle guard). Voided punches vanish from EVERY read — timecards, sweeper, board coverage, on-clock checks — but stay visible struck-through in the corrector. Previous: v28 Q114 TEMPORARY PASSCODES — the Q68 "first tap chooses the PIN" onboarding is GONE (it let any stranger who found the site claim a never-signed-in name). Every active name now carries a PIN: real or a unique server-assigned 4-digit TEMP code (stored hashed for login AND plain in employee.temp_pin — kept only until replaced, so the launch-day printed sheet + texts can be produced on the owner-rep's command). A temp-code login is parked at /change-pin until the person picks their own (new PIN may not equal the temp code; on success temp_pin is wiped). Admin "Reset PIN" now issues a fresh temp code instead of opening the old hole; a one-tap backfill covers everyone without a PIN. Launch texts + PDF stay DEFERRED per Q106. Previous: v27 Q113 SHOP HOURS & LINE CONTROL — the 7-to-4 day becomes ADMIN SETTINGS (shop_setting table, cached reads, everything derives from them: sweeper, after-hours detection, the board), per-line manual OPEN/CLOSE from the cockpit behind the "Managers can open/close lines" toggle (admins always; clock-in, switch, start, and kit-deliver all respect a closed line), the TV board gains the master SHOP OPEN / AFTER HOURS / CLOSED chip plus CLOSED tile badges, and the day-end sweeper now closes an abandoned after-hours SESSION honestly with an "(auto-closed)" wrap. See BUILD_LOG.md.)
// ZERO npm dependencies on purpose (cloud-session constraint,
// BUILD_LOG 2026-07-24): plain Node http + crypto + fetch.
// Q-numbers cited throughout per the Q98 code standard.
//
// WHAT THIS FILE DOES (plain English):
//  1. Serves the sign-in screen: a big-button NAME GRID (Q90 —
//     tap your name, no typing) + a PIN pad (Q22: 4-digit PIN).
//  2. First tap ever = that person CHOOSES their PIN (Q68
//     onboarding: PINs are picked at first login, never issued).
//  3. After sign-in you land on a simple "you're in" home page —
//     the real cab screen arrives later in Stage 3.
//  4. Every sign-in and PIN event is written to the append-only
//     event_log table (spec §3: everything derives from events).
//
// TALKING TO THE DATABASE: Supabase's REST interface, using two
// environment variables set on Railway (never in code):
//   SUPABASE_URL          e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY  the server-side key (rotate at cutover)
//   SESSION_SECRET        random string that signs login cookies
//   COYOTE_INTAKE_KEY     secret the Coyote/FileMaker POST must present
//                         in its X-Shopboard-Key header (file 28 §5, opt 1)
//   VAPID_PUBLIC_KEY      web-push keypair (block 23); the public half is
//   VAPID_PRIVATE_KEY     also handed to the browser at subscribe time
//   SANDBOX_EMPLOYEE_ID   Q106: while building, EVERY notification is
//                         rerouted to this one person (the owner-rep)
//   NOTIFY_LIVE           unset = SANDBOX ON (the safe default). Set to
//                         exactly "yes" at cutover — a NAMED checklist
//                         step, deliberately not an admin-console switch.
//   SMTP_USER             block 116: outbound EMAIL — the Microsoft 365
//   SMTP_PASS             mailbox (info@premierstreetrod.com) and its
//                         app/SMTP password. Host and port default to
//                         smtp.office365.com : 587 (override with
//                         SMTP_HOST / SMTP_PORT only if the mailbox moves).
//   TWILIO_SID            block 116: outbound SMS — Twilio account SID,
//   TWILIO_TOKEN          auth token, and the shop's Twilio number
//   TWILIO_FROM           in +1XXXXXXXXXX form.
// ============================================================
const http = require("http");
const crypto = require("crypto");
const zlib = require("zlib");   // Block 212 (v201 SPEED): gzip — stdlib only, zero-dep rule intact
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-secret";
const DB_READY = Boolean(SUPABASE_URL && SUPABASE_KEY);
// Block 23 (Q106): notification plumbing. Sandbox is the DEFAULT state.
const VAPID_PUB = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIV = process.env.VAPID_PRIVATE_KEY || "";
const SANDBOX_EMPLOYEE_ID = process.env.SANDBOX_EMPLOYEE_ID || "";
const NOTIFY_LIVE = process.env.NOTIFY_LIVE === "yes";
// Block 116: outbound channels — email (Microsoft 365 SMTP) + SMS (Twilio).
// Credentials live ONLY in Railway env vars the owner pastes himself;
// EMAIL_READY / SMS_READY just mean "credentials are present".
const net = require("net");
const tls = require("tls");
const SMTP_HOST = process.env.SMTP_HOST || "smtp.office365.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const TWILIO_SID = process.env.TWILIO_SID || "";
const TWILIO_TOKEN = process.env.TWILIO_TOKEN || "";
const TWILIO_FROM = process.env.TWILIO_FROM || "";
const EMAIL_READY = Boolean(SMTP_USER && SMTP_PASS);
const SMS_READY = Boolean(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM);
// Q111: "Shop time" — the clockable NON-PRODUCTION work area (line 10,
// same pattern as Warehouse's line 9). Monday meetings, cleanup, and
// in-house fabrication (rolling bases, show fixtures) happen ON the clock
// here: paid from the first tap, invisible to the TV board, and never
// charged to any cab's pace math — no cab ever lives on this line.
const SHOP_LINE_ID = 10;
// Block 125 (M3): "Fix work" — the clockable NON-PRODUCTION bucket for returned/
// kickback cabs (line 15, same disabled-line pattern as Shop time 10; ids 9-14
// were already taken). Paid, invisible to the TV board, never charged to a cab's
// pace — and each punch is stamped with the order it was for
// (clock_event.fix_build_id) so the hours roll up per order. Any tech can grab a
// fix; grabbing one moves the clock here.
const FIX_LINE_ID = 15;

// ---------- tiny helpers ----------
// Ask Supabase for rows. `path` is the REST query string.
async function db(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.method === "POST" ? "return=representation" : "return=minimal",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`db ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Block 215 (Daniel): the Zz Test-Account stays ACTIVE (he pokes the app with
// it) but must never cloud pay or reports — payrollData and reportData filter
// it out by name. Matches "Zz ..." first name or a "Test-Account"-ish last name.
const isTestAcct215 = (e) => Boolean(e && (String(e.first_name || "").trim().toLowerCase() === "zz" || /test[ -]?account/i.test(String(e.last_name || ""))));

// Append to the event log (spec §3 — append-only, never updated).
// Failures here must never block the floor: log to console and move on.
function logEvent(event_type, actor_id, payload = {}) {
  db("event_log", { method: "POST", body: JSON.stringify({ event_type, actor_id, payload }) })
    .catch((e) => console.error("event_log write failed:", e.message));
}

// PIN hashing (Q22: stored hashed, reset-only, never viewable).
// scrypt with a per-person random salt; stored as "salt:hash".
function hashPin(pin, salt = crypto.randomBytes(16).toString("hex")) {
  const h = crypto.scryptSync(String(pin), salt, 32).toString("hex");
  return `${salt}:${h}`;
}
function checkPin(pin, stored) {
  const [salt, h] = String(stored).split(":");
  const candidate = crypto.scryptSync(String(pin), salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(candidate, "hex"));
}

// Q114: temporary passcodes. The server owns the hash, so the server
// assigns the codes: unique 4 digits, stored BOTH hashed (so login just
// works) and plain in temp_pin — the plain copy exists ONLY so the
// launch-day printed sheet and texts can be produced when the owner-rep
// commands it, and it is wiped the moment the person picks their own PIN.
async function assignTempPin(empId) {
  const taken = (await db(`employee?select=temp_pin&temp_pin=not.is.null`)).map((r) => r.temp_pin);
  let code;
  do { code = String(crypto.randomInt(0, 10000)).padStart(4, "0"); } while (taken.includes(code));
  await db(`employee?id=eq.${empId}`, { method: "PATCH", body: JSON.stringify({
    temp_pin: code, pin_hash: hashPin(code), must_change_pin: true }) });
  logEvent("pin.temp_assigned", null, { employee_id: empId }); // the code itself never hits the event log
  return code;
}

// Q115 (block-30 break-pass): a shape check for ids that flow into DB
// queries. A malformed id used to reach Postgres and throw a 500; now the
// endpoint rejects it cleanly first. The UI never sends bad ids — this is
// defense-in-depth for hand-crafted requests.
const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v));

// Signed session cookie: "employeeId.expiresMs.signature".
// The signature (HMAC) means a phone can't forge someone else's login.
function makeSession(empId, ttlMs = 12 * 60 * 60 * 1000) {
  const exp = Date.now() + ttlMs; // default 12 h (phones/day); shared tablets pass 30 min
  const body = `${empId}.${exp}`;
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("hex");
  return `${body}.${sig}`;
}
function readSession(cookieHeader = "") {
  const m = /sb_session=([^;]+)/.exec(cookieHeader);
  if (!m) return null;
  const [empId, exp, sig] = m[1].split(".");
  const good = crypto.createHmac("sha256", SESSION_SECRET).update(`${empId}.${exp}`).digest("hex");
  if (sig !== good || Number(exp) < Date.now()) return null;
  return empId;
}
// Q122: a signed cookie is only good while the person is still ACTIVE. Every
// authenticated route resolves its session through here, so deactivating
// someone (or an ex-employee holding a still-valid cookie) is rejected on the
// very next request — not when the 12h cookie finally lapses. One extra indexed
// lookup per authed request; the public TV board never signs in, so it is
// unaffected. Returns the employee id, or null if signed out OR deactivated.
async function liveSession(req) {
  const sid = readSession(req.headers.cookie);
  if (!sid) return null;
  const [me] = await db(`employee?select=active&id=eq.${sid}`);
  return me && me.active === true ? sid : null;
}

// PIN lockout (SPEC-DEFAULT C17: per-PERSON, never the kiosk device —
// 5 wrong tries locks that person for 5 minutes). Kept in memory: a
// restart clears it, which is acceptable for a 5-minute gate.
const pinStrikes = new Map(); // empId -> {count, lockedUntil}
function strike(empId) {
  const s = pinStrikes.get(empId) || { count: 0, lockedUntil: 0 };
  s.count += 1;
  if (s.count >= 5) { s.lockedUntil = Date.now() + 5 * 60 * 1000; s.count = 0; }
  pinStrikes.set(empId, s);
  return s;
}
function locked(empId) {
  const s = pinStrikes.get(empId);
  return s && s.lockedUntil > Date.now();
}

// Q123: a SHARED-IP-safe login guard against name ENUMERATION / credential
// stuffing. The per-person lockout above already caps brute force on ONE name;
// this catches ONE source hammering MANY distinct names. It counts DISTINCT
// employee ids that FAILED a login from a given client IP inside a rolling
// window — never raw attempt volume — so the whole shop behind one shared
// public IP is safe: there are only ~17 real names and a legit person only ever
// fails against their OWN, so the distinct-fail count can't reach the threshold
// without bogus ids (i.e. an attacker sweeping). Client IP via X-Forwarded-For
// (Railway's edge), remoteAddress fallback. In-memory, cleared on restart —
// fine for a minutes-scale gate, same as the per-person lockout. (A determined
// attacker can spoof X-Forwarded-For to spread across fake IPs and slip this,
// but they still hit the per-person 5-try lockout, so brute force stays
// impractical — this is defense-in-depth, not the primary control.)
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_DISTINCT_MAX = 20; // > the ~17 real names, so legit use never trips
const LOGIN_COOLDOWN_MS = 15 * 60 * 1000;
const loginGuard = new Map(); // ip -> { winStart, ids:Set, blockedUntil }
function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()
    || req.socket.remoteAddress || "unknown";
}
function loginIpBlocked(req) {
  const g = loginGuard.get(clientIp(req));
  return Boolean(g && g.blockedUntil > Date.now());
}
function noteLoginFail(req, id) {
  const ip = clientIp(req), now = Date.now();
  let g = loginGuard.get(ip);
  if (!g || now - g.winStart > LOGIN_WINDOW_MS) { g = { winStart: now, ids: new Set(), blockedUntil: 0 }; loginGuard.set(ip, g); }
  g.ids.add(String(id));
  if (g.ids.size >= LOGIN_DISTINCT_MAX) g.blockedUntil = now + LOGIN_COOLDOWN_MS;
}

// Q86 PHONE PHOTO HAND-OFF: a worker on the shared tablet mints a SHORT-LIVED,
// single-cab, add-a-photo-only code. The phone opens /h with NO login, enters
// the code, and its photos attach to THAT cab. In-memory (a restart just
// invalidates open hand-offs, which expire in 20 min anyway). A code can ONLY
// add a photo to its one cab — it can't read, change, or reach anything else,
// and it can't sign anyone in.
const HANDOFF_TTL_MS = 20 * 60 * 1000;
const HANDOFF_MAX_PHOTOS = 20;
const handoffs = new Map(); // code -> { build_id, task_id, created_by, exp, count }
function newHandoff(build_id, task_id, created_by) {
  const A = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/I/L — easy to read/type
  const r = crypto.randomBytes(8); let code = "";
  for (let i = 0; i < 8; i++) code += A[r[i] % A.length];
  handoffs.set(code, { build_id, task_id: task_id || null, created_by, exp: Date.now() + HANDOFF_TTL_MS, count: 0 });
  return code;
}
function getHandoff(code) {
  const key = String(code || "").toUpperCase();
  const h = handoffs.get(key);
  if (!h) return null;
  if (h.exp < Date.now()) { handoffs.delete(key); return null; }
  return h;
}

// ---- QR encoder (byte mode, EC level L, versions 1-5) + SVG renderer.
// Self-contained, zero-dependency. Verified against zbar + OpenCV decoders.
const qrSvg = (function () {
// Self-contained byte-mode QR encoder. Zero dependencies.
// Scope kept deliberately small: EC level L, single EC block, versions 1..5.
// That range covers our ~51-char handoff URL (lands at v3-L, capacity 55 data
// codewords) while avoiding multi-block interleaving (>=6-L) and version-info
// modules (>=7). Auto-picks the smallest fitting version.

// ---- GF(256) tables (primitive 0x11D) ----
const EXP = new Array(512), LOG = new Array(256);
(function () {
  let x = 1;
  for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
function gmul(a, b) { if (a === 0 || b === 0) return 0; return EXP[LOG[a] + LOG[b]]; }

function rsGenPoly(n) {
  let poly = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gmul(poly[j], 1);
      next[j + 1] ^= gmul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}
function rsEncode(data, ecLen) {
  const gen = rsGenPoly(ecLen);
  const res = new Array(ecLen).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.shift(); res.push(0);
    // gen is monic (gen[0]===1); skip the leading term, use gen[j+1]
    if (factor !== 0) for (let j = 0; j < ecLen; j++) res[j] ^= gmul(gen[j + 1], factor);
  }
  return res;
}

// ---- Per-version (level L, single block) capacity table ----
// [version]: {size, dataCW, ecCW, align:[positions]}
const VER = {
  1: { dataCW: 19, ecCW: 7,  align: [] },
  2: { dataCW: 34, ecCW: 10, align: [6, 18] },
  3: { dataCW: 55, ecCW: 15, align: [6, 22] },
  4: { dataCW: 80, ecCW: 20, align: [6, 26] },
  5: { dataCW: 108, ecCW: 26, align: [6, 30] },
};

function pickVersion(byteLen) {
  // byte mode: 4 (mode) + 8 (count, v1..9) + byteLen*8 bits
  const bitsNeeded = 4 + 8 + byteLen * 8;
  for (let v = 1; v <= 5; v++) {
    if (VER[v].dataCW * 8 >= bitsNeeded) return v;
  }
  throw new Error("payload too large for v1..5-L: " + byteLen + " bytes");
}

function buildDataCodewords(bytes, version) {
  const cfg = VER[version];
  const bits = [];
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(0b0100, 4);           // byte mode
  push(bytes.length, 8);     // char count (8 bits for v1..9)
  for (const b of bytes) push(b, 8);
  // terminator
  const cap = cfg.dataCW * 8;
  for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0);
  // pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);
  // to codewords
  const cw = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    cw.push(b);
  }
  // pad codewords 0xEC / 0x11 alternating
  const pads = [0xEC, 0x11];
  let p = 0;
  while (cw.length < cfg.dataCW) { cw.push(pads[p & 1]); p++; }
  return cw;
}

// ---- Matrix construction ----
function makeMatrix(version, allCodewords) {
  const size = 17 + version * 4;
  const m = Array.from({ length: size }, () => new Array(size).fill(null)); // null=unset
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  function place(r, c, val, isFn) { m[r][c] = val ? 1 : 0; if (isFn) reserved[r][c] = true; }

  // finder pattern at (r,c) top-left corner
  function finder(tr, tc) {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const rr = tr + r, cc = tc + c;
      if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
      let v = 0;
      if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
        const inRing = (r === 0 || r === 6 || c === 0 || c === 6);
        const inCore = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        v = (inRing || inCore) ? 1 : 0;
      } else v = 0; // separator
      place(rr, cc, v, true);
    }
  }
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

  // timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (m[6][i] === null) place(6, i, i % 2 === 0 ? 1 : 0, true);
    if (m[i][6] === null) place(i, 6, i % 2 === 0 ? 1 : 0, true);
  }

  // alignment patterns
  const ap = VER[version].align;
  const centers = [];
  for (const r of ap) for (const c of ap) centers.push([r, c]);
  for (const [cr, cc] of centers) {
    // skip if overlaps a finder region
    const overlapFinder =
      (cr <= 8 && cc <= 8) ||
      (cr <= 8 && cc >= size - 9) ||
      (cr >= size - 9 && cc <= 8);
    if (overlapFinder) continue;
    for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) {
      const ring = Math.max(Math.abs(r), Math.abs(c));
      const v = (ring === 1) ? 0 : 1; // center=1, ring1=0, ring2=1
      place(cr + r, cc + c, v, true);
    }
  }

  // dark module
  place(size - 8, 8, 1, true);

  // reserve format info areas (fill later)
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === null) reserved[8][i] = true;
    if (m[i][8] === null) reserved[i][8] = true;
  }
  // Second format copy (matches placeFormat): row 8 holds 8 modules
  // (cols size-1..size-8), col 8 holds 7 (rows size-7..size-1). The
  // dark module (size-8,8) is reserved separately above.
  for (let i = 0; i < 8; i++) reserved[8][size - 1 - i] = true;  // row 8 right: 8
  for (let j = 0; j < 7; j++) reserved[size - 7 + j][8] = true;  // col 8 bottom: 7

  // ---- place data bits, zig-zag ----
  const bitstream = [];
  for (const cw of allCodewords) for (let b = 7; b >= 0; b--) bitstream.push((cw >> b) & 1);
  let bi = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip timing column
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (m[row][c] === null && !reserved[row][c]) {
          m[row][c] = bi < bitstream.length ? bitstream[bi] : 0;
          bi++;
        }
      }
    }
    upward = !upward;
  }

  return { m, size, reserved };
}

// ---- masking ----
const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r, c) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyMask(m, size, reserved, maskIdx) {
  const out = m.map(row => row.slice());
  const fn = MASKS[maskIdx];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (!reserved[r][c] && m[r][c] !== null) {
      if (fn(r, c)) out[r][c] ^= 1;
    }
  }
  return out;
}

// format info: EC level L = bits 01, mask 3 bits. BCH(15,5) + mask 0x5412
function formatBits(maskIdx) {
  const ecBits = 0b01; // L
  let data = (ecBits << 3) | maskIdx; // 5 bits
  let rem = data << 10;
  const g = 0b10100110111;
  for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= g << (i - 10);
  let bits = ((data << 10) | (rem & 0x3FF)) ^ 0b101010000010010;
  return bits & 0x7FFF; // 15 bits
}

function placeFormat(m, size, maskIdx) {
  const f = formatBits(maskIdx);
  const bit = i => (f >> i) & 1;
  // Mirrors the reference setupTypeInfo exactly.
  // Vertical (col 8): bits 0-5 in rows 0-5, bit6 row7, bit7 row8, bits 8-14 rows size-7..size-1
  for (let v = 0; v <= 5; v++) m[v][8] = bit(v);
  m[7][8] = bit(6); m[8][8] = bit(7);
  for (let v = 8; v <= 14; v++) m[size - 15 + v][8] = bit(v);
  // Horizontal (row 8): bits 0-7 cols size-1..size-8, bit8 col7, bits 9-14 cols 5..0
  for (let h = 0; h <= 7; h++) m[8][size - 1 - h] = bit(h);
  m[8][7] = bit(8);
  for (let h = 9; h <= 14; h++) m[8][15 - h - 1] = bit(h);
  m[size - 8][8] = 1; // dark module stays
}

// penalty scoring for mask selection
function penalty(m, size) {
  let p = 0;
  // rule 1: runs of 5+
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (m[r][c] === m[r][c - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p += 1; }
      else run = 1;
    }
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (m[r][c] === m[r - 1][c]) { run++; if (run === 5) p += 3; else if (run > 5) p += 1; }
      else run = 1;
    }
  }
  // rule 2: 2x2 blocks
  for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) {
    const v = m[r][c];
    if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) p += 3;
  }
  // rule 3: finder-like patterns 1011101 with 4 light
  const pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const check = (arr) => {
    for (let i = 0; i + 11 <= arr.length; i++) {
      let m1 = true, m2 = true;
      for (let k = 0; k < 11; k++) { if (arr[i + k] !== pat1[k]) m1 = false; if (arr[i + k] !== pat2[k]) m2 = false; }
      if (m1 || m2) p += 40;
    }
  };
  for (let r = 0; r < size; r++) check(m[r]);
  for (let c = 0; c < size; c++) { const col = []; for (let r = 0; r < size; r++) col.push(m[r][c]); check(col); }
  // rule 4: dark ratio
  let dark = 0; for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) dark += m[r][c];
  const ratio = dark / (size * size) * 100;
  p += Math.floor(Math.abs(ratio - 50) / 5) * 10;
  return p;
}

function encode(text) {
  const bytes = Array.from(Buffer.from(text, "utf8"));
  const version = pickVersion(bytes.length);
  const cfg = VER[version];
  const dataCW = buildDataCodewords(bytes, version);
  const ecCW = rsEncode(dataCW, cfg.ecCW);
  const all = dataCW.concat(ecCW);
  const { m, size, reserved } = makeMatrix(version, all);

  // try all masks, pick lowest penalty
  let best = null, bestP = Infinity, bestMask = 0;
  for (let mk = 0; mk < 8; mk++) {
    const masked = applyMask(m, size, reserved, mk);
    placeFormat(masked, size, mk);
    const p = penalty(masked, size);
    if (p < bestP) { bestP = p; best = masked; bestMask = mk; }
  }
  return { matrix: best, size, version, mask: bestMask, penalty: bestP };
}
// SVG renderer (server-side, CSP-safe: no scripts). Dark modules as one <path>.
function qrSvg(text, opts) {
  opts = opts || {};
  const mod = opts.module || 8;
  const quiet = opts.quiet == null ? 4 : opts.quiet;
  const { matrix, size } = encode(text);
  const dim = (size + quiet * 2) * mod;
  let d = "";
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (matrix[r][c]) {
      const x = (c + quiet) * mod, y = (r + quiet) * mod;
      d += "M" + x + " " + y + "h" + mod + "v" + mod + "h-" + mod + "z";
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + dim + '" height="' + dim +
    '" viewBox="0 0 ' + dim + ' ' + dim + '" shape-rendering="crispEdges"' +
    ' style="width:100%;height:auto;display:block">' +
    '<rect width="' + dim + '" height="' + dim + '" fill="#fff"/>' +
    '<path d="' + d + '" fill="#000"/></svg>';
}
return qrSvg;
})();

// Q52 SHOP-WI-FI GATE for clock actions: if SHOP_EGRESS_IP is set on Railway,
// clock in/out only works from that public IP (the shop's connection).
// UNSET during the build phase = gate open, so testing works from anywhere.
// At cutover: set SHOP_EGRESS_IP to the shop's IP and the fence goes up.
function wifiGate(req) {
  const shopIp = process.env.SHOP_EGRESS_IP;
  if (!shopIp) return null; // build phase — gate open
  const from = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return from === shopIp ? null : "Clock actions only work on shop Wi-Fi";
}
// Block 173 (C1 login gate + TV network-lock): true if the request is from the
// shop network — or an internal loopback read (pace monitor/manager pages, always
// trusted). SHOP_EGRESS_IP unset = build phase → true (every gate inert until the
// owner captures the shop IP via /api/my-ip and sets it on Railway).
function onShopNetwork(req) {
  const shopIp = process.env.SHOP_EGRESS_IP;
  if (!shopIp) return true; // build phase — every gate inert until the IP is set
  // Block 174 (Fable-5 audit of block 173): TRUST the internal branch ONLY when
  // there is NO X-Forwarded-For header — the app's own server-to-127.0.0.1 reads
  // (pace monitor, manager pages) have none, and Railway's edge ALWAYS sets XFF on
  // real external traffic. This makes the internal-trust path unreachable via a
  // spoofed "X-Forwarded-For: 127.0.0.1", independent of how the edge sanitizes it.
  const xff = req.headers["x-forwarded-for"];
  if (xff === undefined || xff === null || xff === "") {
    const r = (req.socket && req.socket.remoteAddress) || "";
    return r === "127.0.0.1" || r === "::1" || r === "::ffff:127.0.0.1";
  }
  // External traffic: Railway controls XFF so the leftmost hop is the genuine
  // client IP (confirmed with Railway) — compare it to the shop's egress IP.
  return String(xff).split(",")[0].trim() === shopIp;
}
// Block 173: the off-network notice shown in place of the wall board.
function offNet173() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board"><meta name="robots" content="noindex, nofollow"><title>Shop Board</title><style>body{margin:0;background:#000;color:#8e8e93;font-family:system-ui;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px}h1{color:#fff;font-size:1.3rem;margin:0 0 8px}</style></head><body><div><h1>This board shows on the shop network</h1><p>Connect to the shop Wi-Fi to see the live board.</p></div></body></html>`;
}

// ---------- FORGOTTEN-CLOCK-OUT SWEEPER (risk sweep 2026-07-28) ----------
// The human truth: someone WILL walk out at 4:00 without tapping clock-out,
// and an interval left open accrues coverage all night and corrupts pace
// math. Q82's answer: the day auto-stops at 4:00 as a backup. Phoenix time
// is UTC-7 year-round (no DST — Q82 America/Phoenix), so the math is plain.
const PHX_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_END_HOUR_PHX = 16;   // 4:00 PM shop day end (Q82; admin-adjustable later)
// Block 109 (owner-rep): the shop day ENDS at close. Anyone still on the
// clock gets swept out on the first pass ~15 min later — backdated to the
// close minute, flagged "auto-closed" for manager eyes. Working later is
// fine: clock back IN through the after-hours questionnaire (the sanctioned
// overtime door, with its own wrap-up + admin sign-off). The old 4-hour
// grace predates that flow and let punches idle open past close.
const SWEEP_GRACE_MS = 15 * 60 * 1000; // sweep begins ~15 min past day end
// 4:00 PM Phoenix on the same Phoenix DAY as the given timestamp, in ms UTC.
function dayEndOf(ms, closeHour = DAY_END_HOUR_PHX) {
  const phxMidnight = Math.floor((ms - PHX_OFFSET_MS) / 86400000) * 86400000 + PHX_OFFSET_MS;
  return phxMidnight + closeHour * 3600000;
}
// Q113: the shop day is now an ADMIN SETTING (shop_setting table), read
// through a 60-second cache so the sweeper and every request stay cheap.
// Defaults match the shop's real day: 7:00 AM open, 4:00 PM close.
const DAY_START_HOUR_PHX = 7;
const SHOP_HOURS = { open: DAY_START_HOUR_PHX, close: DAY_END_HOUR_PHX, loadedAt: 0 };
async function shopHours() {
  if (Date.now() - SHOP_HOURS.loadedAt < 60000 || !DB_READY) return SHOP_HOURS;
  try {
    const rows = await db(`shop_setting?select=key,value&key=in.(shop_open_hour,shop_close_hour)`);
    for (const r of rows) {
      if (r.key === "shop_open_hour") SHOP_HOURS.open = Math.min(23, Math.max(0, Number(r.value) || DAY_START_HOUR_PHX));
      if (r.key === "shop_close_hour") SHOP_HOURS.close = Math.min(23, Math.max(1, Number(r.value) || DAY_END_HOUR_PHX));
    }
    SHOP_HOURS.loadedAt = Date.now();
  } catch (e) { /* settings table not there yet — defaults hold */ }
  return SHOP_HOURS;
}
// Q112: before open, after close, or a weekend = AFTER HOURS — the clock
// still works exactly like a normal day, it just carries its governance.
// Block 187 (owner ruling, day 2): a 5-MINUTE GRACE runs before open.
// Real world: Andrew was at the door minutes before 7:00 and the clock-in
// was refused (after-hours questionnaire) — Monday 7:00 AM team meetings
// mean the crew NEEDS to punch in a few minutes early to be on time. Inside
// the grace window a clock-in is a normal shift punch, no questionnaire.
// The close side and weekends are unchanged; the check is now minute-level
// (it was hour-level, so grace was impossible to express).
const OPEN_GRACE_MIN_187 = 5;
// Block 205 (owner ruling, Sat 8/22): EVERYONE may clock in from an hour
// before open — "let them BE able to clock in at 6am, or 5:55 with the
// grace period." The shop FLOOR still opens at 7 (TV chip, day math, and
// the board's day counter all keep the plain 7-to-4 clock) — this only
// widens when a punch is a NORMAL punch instead of the after-hours
// questionnaire. Clocking onto a line early simply opens that line's
// clock (a down-hold already auto-resumes on clock-in). This generalizes
// Block 195's warehouse-only 6:00 rule to the whole roster.
const EARLY_MIN_205 = 60;
function isAfterHours(ms, hrs = SHOP_HOURS) {
  const phx = new Date(ms - PHX_OFFSET_MS);
  const dow = phx.getUTCDay(), mins = phx.getUTCHours() * 60 + phx.getUTCMinutes();
  return dow === 0 || dow === 6 || mins < hrs.open * 60 - OPEN_GRACE_MIN_187 - EARLY_MIN_205 || mins >= hrs.close * 60;
}
// Block 195 (owner ruling, day 3): WAREHOUSE starts earlier than the floor —
// "make the warehouse department able to clock in at 6am." Their pre-open
// window widens by an hour (6:00 + the standing 5-min grace = 5:55); every
// other department keeps the 7:00 open. Weekends + the close side unchanged,
// and the TV's shop chip still runs on the plain 7-to-4 clock.
const WAREHOUSE_EARLY_MIN_195 = 60;   // Block 205: superseded — kept for the record
// Block 205: the warehouse-only hour is now EVERYONE's hour; the dept
// distinction is moot. Signature kept for call-site compatibility.
function isAfterHoursDept(ms, hrs, dept) {
  void dept;
  const phx = new Date(ms - PHX_OFFSET_MS);
  const dow = phx.getUTCDay(), mins = phx.getUTCHours() * 60 + phx.getUTCMinutes();
  const openMin = hrs.open * 60 - OPEN_GRACE_MIN_187 - EARLY_MIN_205;
  return dow === 0 || dow === 6 || mins < openMin || mins >= hrs.close * 60;
}

// Q91: the SHOP CALENDAR. Default work week is Mon-Fri; a shop_calendar row
// OVERRIDES one date open or closed (holidays, or a rare worked Saturday).
// Read through a 5-minute cache so the morning scheduler stays cheap. If the
// table isn't there yet, the plain weekday rule holds.
const SHOP_CAL = { rows: {}, loadedAt: 0 };
async function calendarOverrides() {
  if (SHOP_CAL.loadedAt && Date.now() - SHOP_CAL.loadedAt < 5 * 60000) return SHOP_CAL.rows;
  if (!DB_READY) return SHOP_CAL.rows;
  try {
    const rows = await db(`shop_calendar?select=cal_date,is_open`);
    const map = {};
    for (const r of rows) map[String(r.cal_date).slice(0, 10)] = r.is_open === true;
    SHOP_CAL.rows = map; SHOP_CAL.loadedAt = Date.now();
  } catch (e) { /* table not there yet — weekday default holds */ }
  return SHOP_CAL.rows;
}
// Is a given Phoenix date (YYYY-MM-DD) a WORK day? A calendar override wins;
// otherwise Mon-Fri is a work day, Sat/Sun are not. (Noon-UTC avoids any
// date-boundary drift when reading the weekday of a bare date string.)
async function isWorkDay(phxDateStr) {
  const ov = await calendarOverrides();
  if (phxDateStr in ov) return ov[phxDateStr];
  const dow = new Date(phxDateStr + "T12:00:00Z").getUTCDay();
  return dow >= 1 && dow <= 5;
}
// The day-start nudge time for a weekday (0=Sun..6=Sat), from shop_setting,
// defaulting to Mon 07:35 / others 07:05. Returns "HH:MM".
const NUDGE_KEYS = ["nudge_sun", "nudge_mon", "nudge_tue", "nudge_wed", "nudge_thu", "nudge_fri", "nudge_sat"];
async function nudgeTimeFor(dow) {
  try {
    const [row] = await db(`shop_setting?select=value&key=eq.${NUDGE_KEYS[dow]}`);
    if (row && /^\d{1,2}:\d{2}$/.test(row.value)) return row.value;
  } catch (e) { /* fall through to default */ }
  return dow === 1 ? "07:35" : "07:05";
}
// Close every interval still open long past its day end. Runs at boot (catches
// anything that happened while the server was down) and every 10 minutes.
// Block 206 (owner ruling, Sat 8/22): LONG-DAY check — "if anyone is on the
// clock from clock in to end of day in which they are working more than 8
// hours, a notification should be sent to admin and accounting managers to
// VERIFY if they did or did not take a lunch that day." Block 219 (Daniel,
// 8/25, after two end-of-days of alert floods): the trigger is over 8h AND
// NO LUNCH PUNCH on the day. "it should only push when they work more than
// 8 hours AND DIDNT clock out for lunch... thats a flag THAT they forgot to
// clock out for lunch. i dont want to be notified any time anyone works
// more than 8 and DID take a lunch legitimately." A lunch = any mid-day
// off-clock gap of 15+ minutes between a clock-out and the next clock-in
// (the 15-minute floor keeps accidental double-taps — out/in seconds apart,
// Michael's 8/22 pattern — from masquerading as a lunch and muting a real
// flag). Still: runs after any clock-out including the sweeper's auto-outs,
// hourly people only, ONE notice per person per Phoenix day, 3-minute
// cushion so an 8h01m punch doesn't nag anybody.
async function longDayCheck206(empId, outIso) {
  try {
    const dayMs = new Date(outIso).getTime();
    const d0 = phxDayStart(phxDate(dayMs));
    const evs = await db(`clock_event?select=kind,claimed_at&voided=is.false&employee_id=eq.${empId}&claimed_at=gte.${new Date(d0).toISOString()}&claimed_at=lt.${new Date(d0 + 86400000).toISOString()}&order=claimed_at.asc`);
    let open206 = null, mins = 0, lastOut219 = null, lunch219 = false;
    for (const ev of evs) {
      const t = new Date(ev.claimed_at).getTime();
      if (ev.kind === "clock_in") {
        if (lastOut219 != null && t - lastOut219 >= 15 * 60000) lunch219 = true;
        open206 = t;
      } else if (open206 != null) { mins += (t - open206) / 60000; open206 = null; lastOut219 = t; }
    }
    if (mins <= 8 * 60 + 3) return;
    if (lunch219) return;   // Block 219: they punched a real lunch — a long day WITH a lunch is not a flag
    const [who] = await db(`employee?select=first_name,last_name,pay_type&id=eq.${empId}`);
    if (!who || ["salary", "na"].includes(who.pay_type)) return;
    const dup = await db(`event_log?select=id&event_type=eq.timecard.long_day&payload->>employee_id=eq.${empId}&at=gte.${new Date(d0).toISOString()}&limit=1`);
    if (dup.length) return;
    logEvent("timecard.long_day", null, { employee_id: empId, minutes: Math.round(mins), day: phxDate(dayMs) });
    const admins206 = await db(`employee?select=id&active=is.true&role=eq.admin`);
    const acct206 = await db(`employee?select=id&active=is.true&role=eq.manager&department=eq.Accounting`);
    const hrs206 = Math.round(mins / 6) / 10;
    notify("timecard.long_day", [...new Set([...admins206.map((a) => a.id), ...acct206.map((a) => a.id)])],
      `${who.first_name} ${((who.last_name || "")[0] || "")}. logged ${hrs206}h today — no lunch punch`,
      `Over 8 hours with no lunch clock-out on the day. Speak with them, then verify or correct the day in Edit timecards — an unpunched lunch reads as overtime.`,
      `/manager?tc_emp=${empId}`);
  } catch (e) { console.error("long-day check failed:", e.message); }
}
// Block 221 (Daniel, 8/26 — accounting notifications, all three approved):
// #1 PAY-PERIOD-END REMINDER — the morning a new period begins (the 11th and
// the 26th), the accounting managers get one notice: the ended period's
// range, how many punch-oddity days are still flagged, and any after-hours
// sessions awaiting admin sign-off (those hold hours out of the export).
// Edge-triggered per period via event_log; fires any time after 6:30 AM
// Phoenix on the first day, so a server nap can't swallow it.
async function periodEndCheck221() {
  try {
    if (!DB_READY) return;
    const now = Date.now();
    const phx = new Date(now - PHX_OFFSET_MS);
    if (phx.getUTCHours() * 60 + phx.getUTCMinutes() < 390) return;   // before 6:30 AM Phoenix
    const today = phxDate(now);
    const cur = periodFor221(+today.slice(0, 4), +today.slice(5, 7), +today.slice(8, 10));
    if (cur.f !== today) return;                                      // only a period's FIRST day
    const pd = phxDate(phxDayStart(cur.f) - 86400000);
    const prev = periodFor221(+pd.slice(0, 4), +pd.slice(5, 7), +pd.slice(8, 10));
    const dup = await db(`event_log?select=id&event_type=eq.payroll.period_end&payload->>period=eq.${prev.f}&limit=1`);
    if (dup.length) return;
    const acct221 = await db(`employee?select=id&active=is.true&role=eq.manager&department=eq.Accounting`);
    const startMs = phxDayStart(prev.f), endMs = phxDayStart(prev.t) + 86400000;
    const d221 = await payrollData(startMs, endMs);
    const pend221 = (d221.ahNotes || []).filter((n) => !n.declined).length;
    // Oddity count over the ended period — the same flags as the console lane.
    const emps221 = await db(`employee?select=id,first_name,last_name,pay_type&active=is.true`);
    const evs221 = await db(`clock_event?select=employee_id,kind,claimed_at,corrected_by,added_by&voided=is.false&claimed_at=gte.${new Date(startMs).toISOString()}&claimed_at=lt.${new Date(endMs).toISOString()}&order=claimed_at.asc&limit=20000`);
    const byED221 = {};
    for (const ev of evs221) { const dsO = phxDate(new Date(ev.claimed_at).getTime());
      ((byED221[ev.employee_id] = byED221[ev.employee_id] || {})[dsO] = byED221[ev.employee_id][dsO] || []).push(ev); }
    let oddN221 = 0;
    for (const eO of emps221) {
      if (isTestAcct215(eO) || ["salary", "na"].includes(eO.pay_type)) continue;
      const daysO = byED221[eO.id] || {};
      for (const dsO in daysO) {
        let openP = null, flag = false;
        for (const pO of daysO[dsO]) {
          if (pO.kind === "clock_in") { if (openP) flag = true; openP = pO; }
          else { if (pO.kind === "clock_out_auto" && !pO.corrected_by && !pO.added_by) flag = true; if (!openP) flag = true; openP = null; }
        }
        if (openP && dsO !== today) flag = true;
        if (flag) oddN221++;
      }
    }
    logEvent("payroll.period_end", null, { period: prev.f, to: prev.t, oddities: oddN221, pending_ah: pend221 });
    if (acct221.length) notify("payroll.period_end", acct221.map((a) => a.id),
      "Pay period ended — worksheet ready",
      `${prev.f} → ${prev.t} closed yesterday.` +
      (oddN221 ? ` ${oddN221} punch day${oddN221 === 1 ? "" : "s"} still flagged in the oddities lane.` : " No open punch oddities.") +
      (pend221 ? ` ${pend221} after-hours session${pend221 === 1 ? "" : "s"} awaiting admin sign-off — those hours are held out until ruled on.` : "") +
      " Review and export when ready.",
      "/payroll?preset=last");
  } catch (e) { console.error("period-end check failed:", e.message); }
}
setInterval(periodEndCheck221, 10 * 60 * 1000);

// #2 CROSSED-40-HOURS HEADS-UP — Arizona weekly OT means the moment someone's
// WORKED hours pass 40 inside a period-aligned week, overtime starts
// accruing. Runs after any clock-out (sweeper auto-outs included), hourly
// people only, one notice per person per week. Sick/vacation never count
// (worked punches only — same rule as the worksheet's weekly-OT math).
async function week40Check221(empId, outIso) {
  try {
    const dayMs = new Date(outIso).getTime();
    const ds = phxDate(dayMs);
    const cur = periodFor221(+ds.slice(0, 4), +ds.slice(5, 7), +ds.slice(8, 10));
    const pStart = phxDayStart(cur.f);
    const wk = Math.floor((phxDayStart(ds) - pStart) / (7 * 86400000));
    const wStart = pStart + wk * 7 * 86400000;
    const wEnd = Math.min(wStart + 7 * 86400000, phxDayStart(cur.t) + 86400000);
    const evs = await db(`clock_event?select=kind,claimed_at&voided=is.false&employee_id=eq.${empId}&claimed_at=gte.${new Date(wStart).toISOString()}&claimed_at=lt.${new Date(wEnd).toISOString()}&order=claimed_at.asc`);
    let open221 = null, mins = 0;
    for (const ev of evs) {
      const t = new Date(ev.claimed_at).getTime();
      if (ev.kind === "clock_in") open221 = t;
      else if (open221 != null) { mins += (t - open221) / 60000; open221 = null; }
    }
    if (mins < 40 * 60) return;
    const [who] = await db(`employee?select=first_name,last_name,pay_type&id=eq.${empId}`);
    if (!who || isTestAcct215(who) || ["salary", "na"].includes(who.pay_type)) return;
    const wkKey = phxDate(wStart);
    const dup = await db(`event_log?select=id&event_type=eq.payroll.week40&payload->>employee_id=eq.${empId}&payload->>week=eq.${wkKey}&limit=1`);
    if (dup.length) return;
    logEvent("payroll.week40", null, { employee_id: empId, week: wkKey, minutes: Math.round(mins) });
    const adminsW = await db(`employee?select=id&active=is.true&role=eq.admin`);
    const acctW = await db(`employee?select=id&active=is.true&role=eq.manager&department=eq.Accounting`);
    notify("payroll.week40", [...new Set([...adminsW.map((a) => a.id), ...acctW.map((a) => a.id)])],
      `${who.first_name} ${((who.last_name || "")[0] || "")}. crossed 40h this week`,
      `Worked hours passed 40 for the week starting ${wkKey} — overtime accrues from here (Arizona weekly rule). The Pay Worksheet handles the math automatically.`,
      "/payroll");
  } catch (e) { console.error("week-40 check failed:", e.message); }
}

// #3 PAY DATA CHANGED BY SOMEONE ELSE — whenever anyone who is NOT an
// accounting manager touches pay-bearing data (adds/cancels sick or vacation
// time, corrects punches), the accounting managers get a one-line heads-up
// so the numbers never move under them silently. The actor is excluded, so
// Kailey's own edits stay quiet — today this fires only when an admin does it.
async function acctEditNotice221(actorId, what221, whoId221, day221, link221) {
  try {
    const acctE = (await db(`employee?select=id&active=is.true&role=eq.manager&department=eq.Accounting`)).map((a) => a.id).filter((id) => id !== actorId);
    if (!acctE.length) return;
    const ids221 = [...new Set([actorId, whoId221].filter(Boolean))];
    const ppl = await db(`employee?select=id,first_name,last_name&id=in.(${ids221.join(",")})`);
    const nm = (id) => { const p = ppl.find((x) => x.id === id); return p ? `${p.first_name} ${((p.last_name || "")[0] || "")}.` : "someone"; };
    notify("payroll.edited", acctE, `Pay data changed — ${nm(whoId221)}`,
      `${nm(actorId)} ${what221} for ${nm(whoId221)}${day221 ? ` (${day221})` : ""}. Already on the timecard and worksheet — worth a glance if it changes pay.`,
      link221 || "/manager#timecorrections");
  } catch (e) { console.error("acct-edit notice failed:", e.message); }
}
async function sweepForgottenClockOuts() {
  if (!DB_READY) return;
  try {
    const recent = await db("clock_event?select=employee_id,kind,line_id,claimed_at&voided=is.false&order=claimed_at.desc&limit=400");
    const latest = {};
    for (const ev of recent) if (!latest[ev.employee_id]) latest[ev.employee_id] = ev;
    const now = Date.now();
    const hrsS = await shopHours();   // Q113: the sweep follows the CONFIGURED day end
    for (const ev of Object.values(latest)) {
      if (ev.kind !== "clock_in") continue;
      const inMs = new Date(ev.claimed_at).getTime();
      const end = dayEndOf(inMs, hrsS.close);
      // Clock-in AFTER day end (opt-in Saturday / evening, Q82): give that
      // stint its own day-end at +8h so it can never run forever either.
      // v148 (owner-rep): NOBODY crosses midnight — an evening stint closes at
      // +8h OR 11:59 PM of its own Phoenix day, whichever comes first, so no
      // punch pair can ever straddle a day and the timecard math never sees an
      // overnight span (M2 closed structurally).
      const mid148 = Math.floor((inMs - PHX_OFFSET_MS) / 86400000) * 86400000 + PHX_OFFSET_MS + (23 * 60 + 59) * 60000;
      // Block 205 (owner ruling, Sat 8/22): the floor closes at 4 but people
      // legitimately run late (late deliveries — Ross). The old sweep cut a
      // 4-o'clock stamp at 4:15, silently shorting anyone still working.
      // Now: a normal day session is left alone until the HARD STOP (close
      // + 1h = 5:00), and the auto-out stamps AT the hard stop — if the
      // system must guess, it guesses high and the notice below tells
      // admins + accounting to verify the true time and trim. Anyone who
      // leaves at 4:10 just clocks out normally (outs are never blocked).
      // Evening opt-in sessions keep their own +8h cap; nobody crosses midnight.
      const hardStop205 = end + 3600000;
      const closeAt = Math.min(inMs >= end ? inMs + 8 * 3600000 : hardStop205, mid148);
      if (now < closeAt + SWEEP_GRACE_MS) continue; // still plausibly working — leave it
      await db("clock_event", { method: "POST", body: JSON.stringify({
        employee_id: ev.employee_id, line_id: ev.line_id, kind: "clock_out_auto",
        reason: "Auto — day end (no clock-out recorded)",
        claimed_at: new Date(closeAt).toISOString() }) });
      logEvent("clock.auto_out", null, { employee_id: ev.employee_id, line_id: ev.line_id,
        opened_at: ev.claimed_at, closed_at: new Date(closeAt).toISOString() });
      await longDayCheck206(ev.employee_id, new Date(closeAt).toISOString());   // Block 206: an auto-closed long day still gets the lunch-verify notice
      void week40Check221(ev.employee_id, new Date(closeAt).toISOString());   // Block 221: the auto-close can be the punch that crosses 40
      // Q113 (block-26 nit): a forgotten after-hours punch used to leave its
      // SESSION open forever — close it honestly so the cockpit lane and the
      // timecards tell the truth about forgetful nights.
      const [ahSweep] = await db(`after_hours_session?select=id,approved_by&employee_id=eq.${ev.employee_id}&ended_at=is.null&limit=1`);
      if (ahSweep) {
        await db(`after_hours_session?id=eq.${ahSweep.id}`, { method: "PATCH", body: JSON.stringify({
          ended_at: new Date(closeAt).toISOString(), wrap_note: "(auto-closed — no wrap-up left)" }) });
        logEvent("afterhours.auto_end", null, { session_id: ahSweep.id, employee_id: ev.employee_id });
        // Block 107: an auto-closed session still needs its sign-off — tell
        // the people who'd give it; the hours stay HELD until someone does.
        try {
          const [whoAh107] = await db(`employee?select=first_name&id=eq.${ev.employee_id}`);
          const adminsAh107 = await db(`employee?select=id&active=is.true&role=eq.admin`);
          notify("afterhours.wrapped", [...new Set([ahSweep.approved_by, ...adminsAh107.map((a) => a.id)])],
            `After hours auto-closed — ${whoAh107 ? whoAh107.first_name : "?"} left no wrap-up`,
            "The session closed itself at day end with no wrap-up note. Its hours are HELD off the timecard until an ADMIN signs off in the Admin console.", "/manager");
        } catch (e) { console.error("ah sweep notify failed:", e.message); }
      } else {
        // v148 (owner-rep): EVERY system clock-out tells the admins — the machine
        // closed the day, a human should glance before payroll. (An after-hours
        // auto-close already sends its own held-hours notice above.)
        try {
          const [whoA148] = await db(`employee?select=first_name,last_name,pay_type&id=eq.${ev.employee_id}`);
          // Block 201 (owner, day 4, Jason's text): a SALARIED person or an
          // OWNER forgetting to clock out is not a payroll problem — "him and
          // other salaried people, like myself DO NOT need to clock in or
          // out." The punch above still auto-closes for EVERYONE (data
          // hygiene; their ability to clock in/out is untouched), but only an
          // HOURLY person's forgotten punch buzzes the admins' phones.
          if (!whoA148 || !["salary", "na"].includes(whoA148.pay_type)) {
            // Block 205: accounting managers join the admins on this notice —
            // "notify admin and accounting so they know to speak to that
            // staff member AND correctly get their clock out time."
            const admins148 = await db(`employee?select=id&active=is.true&role=eq.admin`);
            const acct205 = await db(`employee?select=id&active=is.true&role=eq.manager&department=eq.Accounting`);
            notify("clock.auto_out", [...new Set([...admins148.map((a) => a.id), ...acct205.map((a) => a.id)])],
              `System clocked out ${whoA148 ? whoA148.first_name + " " + ((whoA148.last_name || "")[0] || "") + "." : "someone"}`,
              `No clock-out was recorded — the day closed it at ${phxHHMM(new Date(closeAt).toISOString())}. Worth a glance before payroll; fix the punches if the time is wrong.`,
              `/manager?tc_emp=${ev.employee_id}&tc_date=${phxDate(new Date(ev.claimed_at).getTime())}#timecorrections`);
          }
        } catch (e) { console.error("auto-out notify failed:", e.message); }
      }
      console.log("sweeper: auto clock-out", ev.employee_id, "opened", ev.claimed_at);
    }
    // Block 133 (logic audit L9): a down is now a TIMED, reasoned hold that
    // persists until a manager lifts it or a production role clocks in — it no
    // longer auto-clears at the day roll (it PAUSES overnight and resumes at open,
    // computed from shop hours). Only an ORPHAN hold with no open timed record
    // (e.g. a legacy quick-hold from before this change) still gets the old
    // stale-clear, so nothing can stick silently forever.
    const phxMidToday = Math.floor((Date.now() - PHX_OFFSET_MS) / 86400000) * 86400000 + PHX_OFFSET_MS;
    const staleDown = await db(`line?select=id&down_today=is.true&down_at=lt.${new Date(phxMidToday).toISOString()}`);
    for (const ln of staleDown) {
      const openRec133 = await db(`line_down?select=id&line_id=eq.${ln.id}&up_at=is.null&limit=1`);
      if (openRec133.length) continue;   // a live timed hold — leave it up across the roll
      await db(`line?id=eq.${ln.id}`, { method: "PATCH", body: JSON.stringify({
        down_today: false, down_reason: null, down_by: null, down_at: null }) });
      logEvent("line.down_cleared", null, { line_id: ln.id, cause: "day_roll" });
    }
  } catch (e) { console.error("sweeper failed (will retry):", e.message); }
}
sweepForgottenClockOuts();                       // boot sweep
setInterval(sweepForgottenClockOuts, 10 * 60 * 1000); // steady sweep

// Read a JSON request body (small, so no streaming worries).
function body(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); } });
  });
}

// ---------- shared floor-network resilience (risk sweep 2026-07-28) ----------
// A metal building full of welders is Wi-Fi's natural enemy. Every floor
// tap posts through sbPost: network drops and 5xx retry automatically with
// backoff (1s/2s/4s/8s) and a plain status line; rule answers (4xx) surface
// immediately. claimed_at is stamped at the ORIGINAL tap and rides through
// every retry (Q103-1), so a delayed landing still records the true time.
const netJs = `
  async function sbPost(url, payload, onStatus) {
    const delays = [1000, 2000, 4000, 8000];
    for (let i = 0; ; i++) {
      try {
        const r = await fetch(url, { method: "POST",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (r.status >= 500) throw new Error("server " + r.status);
        return await r.json();
      } catch (e) {
        if (i >= delays.length)
          return { ok: false, error: "Can't reach the board — check Wi-Fi and tap again (nothing was lost)" };
        if (onStatus) onStatus("Wi-Fi hiccup — retrying (" + (i + 1) + " of " + delays.length + ")…");
        await new Promise((res) => setTimeout(res, delays[i]));
      }
    }
  }
  async function sbUpload(url, blob, ctype, onStatus) {
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": ctype }, body: blob });
        if (r.status >= 500) throw new Error("server " + r.status);
        return await r.json();
      } catch (e) {
        if (i === 2) return { ok: false, error: "Photo didn't make it — check Wi-Fi and try again" };
        if (onStatus) onStatus("Wi-Fi hiccup — retrying the photo…");
        await new Promise((res) => setTimeout(res, 2000 * (i + 1)));
      }
    }
  }
`;

// ---------- shared look (file 24: dark, Premier monochrome + red) ----------
const style = `<style>
  :root{--red:#C8102E;--bg:#111;--card:#1c1c1e;--line:#2c2c2e}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:#fff;min-height:100vh}
  /* Block 208 (owner, Sat 8/22): TAP FEEDBACK — the instant-press flash.
     Transform+filter+outline only: zero layout shift, works on any element. */
  .tapfx208{outline:1.5px solid #0a84ff!important;outline-offset:2px;filter:brightness(1.35);transform:scale(.965);transition:transform .06s ease,filter .06s ease}   /* Block 210: border halved per owner */
  .wrap{max-width:640px;margin:0 auto;padding:24px 16px}
  /* Block 196 (owner, day 3): PHONES GET BIGGER. Staff with glasses on small
     screens couldn't read the two-column grids or 13px links. On phone-width
     screens: larger base type, roomier tap targets, 16px+ inputs so iOS
     never zoom-jumps, and generous nav link padding. Tablets/desktops are
     untouched. This is the site-wide floor; per-page fixes ride on top. */
  @media (max-width:480px){
    body{font-size:1.08em}
    .wrap{padding:18px 12px}
    input,select,textarea,button{font-size:16px}
    a{padding-top:2px;padding-bottom:2px}
  }
  .logo{font-weight:800;letter-spacing:.05em;font-size:1.6rem;text-align:center;margin:8px 0 20px}
  .logo span{color:var(--red)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
  .name{display:block;width:100%;padding:26px 12px;font-size:1.35rem;font-weight:700;
        background:var(--card);border:1px solid var(--line);border-radius:14px;color:#fff;
        text-align:center;cursor:pointer}
  .name:active{background:#2a2a2c}
  .name small{display:block;font-weight:400;opacity:.55;font-size:.85rem;margin-top:6px}
  .pinpad{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:340px;margin:18px auto}
  .key{padding:24px 20px;font-size:1.9rem;font-weight:700;background:var(--card);
       border:1px solid var(--line);border-radius:14px;color:#fff;cursor:pointer;
       touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}   /* Block 214: taps land on finger-DOWN; double-tap zoom can no longer eat a digit */
  .key:active,.key.hit214{background:#2a2a2c;transform:scale(.96);border-color:#0a84ff}
  .key.spacer214{visibility:hidden;pointer-events:none}
  .dots{text-align:center;font-size:2rem;letter-spacing:.5rem;min-height:2.6rem}
  .msg{text-align:center;opacity:.75;min-height:1.4rem}
  .err{color:#ff6b6b}
  .back{background:none;border:none;color:#8e8e93;font-size:1rem;cursor:pointer;padding:10px}
  h2{text-align:center;font-weight:600}
</style>
<script>
// Q120: the notifications bell. On every APP screen (not the TV board, login,
// PIN, or the inbox itself) a small clock-face links to /inbox and shows the
// unread count, so a new notification is visible even with push/text/email off.
(function(){
  // Block 208 (owner, Sat 8/22): TAP FEEDBACK on EVERY page this script
  // reaches — on the shop's slow Wi-Fi a tap could land with no visible
  // response, so people tapped again ("staff will press it multiple times
  // thinking the first push didn't take"). Now every button, link, and
  // task flashes the instant a finger lands — pressed-in + blue glow for
  // a beat — so "did it take?" is answered before the server responds.
  // Runs BEFORE the bell's skip list on purpose: the login screen and
  // inbox get the feedback too, just not the bell.
  // Block 210 (owner tune-up): quicker — flash and GONE (450ms, was 1.2s),
  // and the PIN screens are skipped entirely (typing a 4-digit code left a
  // trail of lingering glows — "the blue border sticks around WAY too long").
  if (["/login", "/", "/change-pin"].indexOf(location.pathname) === -1)
    document.addEventListener("pointerdown", function(e){
      var el = e.target && e.target.closest ? e.target.closest("button, a, [onclick]") : null;
      if (!el || el.disabled) return;
      el.classList.add("tapfx208");
      setTimeout(function(){ el.classList.remove("tapfx208"); }, 450);
    }, true);
  // Block 214 (Daniel): SHARED-TABLET WALK-AWAY LOGOUT. A marked tablet
  // (Tools -> Tablet setup) signs out after 2 QUIET minutes — the timer only
  // counts while the screen is visible and untouched, so working a checklist
  // or shooting end-of-day photos in the camera app never trips it. The
  // sliding server session (send()) stays as the 10-minute backstop.
  if (/(^|; )sb_shared_ui=1/.test(document.cookie || "") &&
      ["/tv", "/login", "/", "/h"].indexOf(location.pathname) === -1) {
    var last214 = Date.now();
    var poke214 = function(){ last214 = Date.now(); };
    document.addEventListener("pointerdown", poke214, true);
    document.addEventListener("keydown", poke214, true);
    document.addEventListener("visibilitychange", poke214, true);
    setInterval(function(){
      if (!document.hidden && Date.now() - last214 > 120000) location.replace("/logout");
    }, 10000);
  }
  var skip = ["/tv","/login","/","/change-pin","/inbox","/h"];
  if (skip.indexOf(location.pathname) !== -1) return;
  document.addEventListener("DOMContentLoaded", function(){
    fetch("/api/inbox/unread").then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      if (!d || !d.ok) return;
      var a = document.createElement("a");
      a.href = "/inbox"; a.title = "Notifications";
      a.style.cssText = "position:fixed;top:10px;right:12px;z-index:60;text-decoration:none;background:#1c1c1e;border:1px solid #2c2c2e;border-radius:20px;padding:6px 12px;color:#fff;font-size:1.05rem;line-height:1";
      a.textContent = "\uD83D\uDD14";
      if (d.count > 0) {
        var b = document.createElement("span");
        b.textContent = d.count > 99 ? "99+" : d.count;
        b.style.cssText = "background:#C8102E;color:#fff;border-radius:10px;padding:1px 7px;margin-left:6px;font-size:.8rem;font-weight:700;vertical-align:top";
        a.appendChild(b);
      }
      document.body.appendChild(a);
      // Block 154 (owner-rep D8): the ⚙ gear rides beside the bell on every
      // app screen — the text "My settings" links are gone.
      var g = document.createElement("a");
      g.href = "/settings"; g.title = "My settings";
      g.style.cssText = "position:fixed;top:10px;right:64px;z-index:60;text-decoration:none;background:#1c1c1e;border:1px solid #2c2c2e;border-radius:20px;padding:6px 12px;color:#fff;font-size:1.05rem;line-height:1";
      g.textContent = "\u2699\uFE0F";
      document.body.appendChild(g);
      // Block 154 (owner-rep D7 + B4): PUSH IS AUTOMATIC. A device that
      // already allowed notifications re-subscribes silently on every visit
      // (harmless upsert). A brand-new device gets ONE small banner — the tap
      // is the permission gesture the browser demands — then never again
      // (once answered, permission is no longer "default"). Denied = quiet;
      // the bell inbox catches every notice regardless.
      try {
        // Block 224 (Daniel, 8/26): SHARED TABLETS NEVER CARRY PUSH — push
        // pop-ups belong on someone's PERSONAL phone, never the shared iPad
        // (whoever walks past would read them). A device marked shared
        // (Tools -> Tablet setup) skips the subscribe entirely AND, if push
        // was ever enabled on it before this rule, quietly unsubscribes and
        // deactivates that subscription server-side. The bell inbox still
        // works exactly the same on the tablet — this is push-only.
        var shared224 = /(^|; )sb_shared_ui=1/.test(document.cookie || "");
        if (shared224 && "serviceWorker" in navigator && "PushManager" in window) {
          navigator.serviceWorker.getRegistration("/sw.js")
            .then(function(reg){ return reg && reg.pushManager.getSubscription(); })
            .then(function(sb){ if (!sb) return; var ep224 = sb.endpoint;
              return sb.unsubscribe().then(function(){
                return fetch("/api/push/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ endpoint: ep224 }) }); }); })
            .catch(function(){});
        }
        var NP154 = "${VAPID_PUB}";
        if (!shared224 && NP154 && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window) {
          var sub154 = function(){
            var pad = "=".repeat((4 - NP154.length % 4) % 4);
            var raw = atob((NP154 + pad).replace(/-/g, "+").replace(/_/g, "/"));
            var key = Uint8Array.from(raw.split("").map(function(c){ return c.charCodeAt(0); }));
            navigator.serviceWorker.register("/sw.js").then(function(){ return navigator.serviceWorker.ready; })
              .then(function(reg){ return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }); })
              .then(function(sb){ var j = sb.toJSON();
                return fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }) }); })
              .catch(function(){});
          };
          if (Notification.permission === "granted") sub154();
          else if (Notification.permission === "default" && !sessionStorage.getItem("push154later")) {
            // Block 226 (Daniel, 8/26): the enable bar stays on every home
            // screen but QUIETER — bottom of the page, muted colors, smaller
            // type. It only ever shows on a personal device that has never
            // answered the permission question (shared tablets never see it,
            // Block 224); "Not now" hides it for the visit.
            var bar = document.createElement("div");
            bar.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:70;background:#161618;border-top:1px solid #2c2c2e;padding:7px 12px;text-align:center;color:#8e8e93;font-size:.85rem";
            var go = document.createElement("button");
            go.textContent = "\uD83D\uDD14 Turn on notifications";
            go.style.cssText = "background:#2c2c2e;border:1px solid #3a3a3c;border-radius:9px;color:#e8e8ed;padding:7px 13px;font-weight:600;cursor:pointer;font-size:.85rem";
            var no = document.createElement("button");
            no.textContent = "Not now";
            no.style.cssText = "background:none;border:none;color:#8e8e93;padding:10px 12px;cursor:pointer;margin-left:8px";
            go.onclick = function(){ Notification.requestPermission().then(function(pm){ if (pm === "granted") sub154(); bar.remove(); }); };
            no.onclick = function(){ sessionStorage.setItem("push154later", "1"); bar.remove(); };
            bar.appendChild(go); bar.appendChild(no); document.body.appendChild(bar);
          }
        }
      } catch(e){}
    }).catch(function(){});
  });
})();
</script>`;

const loginPage = (employees) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><!-- Q48 -->
<title>Sign in — Shop Board</title>${style}</head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>

  <!-- SCREEN 1: the name grid (Q90 — tap your name, zero typing).
       Inactive employees never appear here (Q70). -->
  <div id="who">
    <h2>Who's working?</h2>
    <div class="grid">
      ${employees.map((e) => `
        <button class="name" data-id="${e.id}" data-haspin="${e.has_pin}"
                data-name="${e.first_name}">
          ${e.first_name} ${e.last_name}
          <small>${e.dept_label}</small>
        </button>`).join("")}
    </div>
  </div>

  <!-- SCREEN 2: the PIN pad. Q114: everyone ENTERS a PIN (temp codes
       replaced the Q68 choose-your-own). 5 wrong tries = 5-min lock (C17). -->
  <div id="pin" style="display:none">
    <button class="back" id="backBtn">&larr; not you? go back</button>
    <h2 id="pinTitle"></h2>
    <div class="dots" id="dots"></div>
    <div class="msg" id="msg"></div>
    <div class="pinpad">
      ${[1,2,3,4,5,6,7,8,9].map((n)=>`<button class="key" data-k="${n}">${n}</button>`).join("")}
      <button class="key" data-k="back">&#9003;</button>
      <button class="key" data-k="0">0</button>
      <button class="key spacer214" tabindex="-1"></button>
    </div>
  </div>
</div>
<script>
  // Plain-English note: this is deliberately simple phone/kiosk JS —
  // pick a name, tap digits, submit. No framework until Stage 3.
  // Block 214 (Daniel: "make those numbers MORE touchable... it's very
  // fickle"): digits register on POINTERDOWN — the instant the finger
  // lands — instead of a full down-and-up "click" a sliding finger could
  // cancel; touch-action:manipulation (in .key) stops double-tap zoom from
  // eating fast repeat digits. The 4th digit AUTO-SUBMITS (checkmark
  // retired — a wrong PIN clears the dots and you just type again).
  let who=null, entered="", busy214=false;
  const q=(s)=>document.querySelector(s);
  q("#who").addEventListener("click",(ev)=>{
    const b=ev.target.closest(".name"); if(!b) return;
    // Q114: choose-your-own onboarding is gone — every name has a PIN
    // (real or temporary), so the pad only ever ASKS for one.
    who=b.dataset.id; entered="";
    q("#who").style.display="none"; q("#pin").style.display="block";
    q("#pinTitle").textContent = "Hi "+b.dataset.name+" — enter your PIN";
    paint("");
  });
  q("#backBtn").onclick=()=>{ q("#pin").style.display="none"; q("#who").style.display="block"; };
  function paint(msg,isErr){ q("#dots").textContent="•".repeat(entered.length);
    const m=q("#msg"); m.textContent=msg||""; m.className="msg"+(isErr?" err":""); }
  function key214(v){
    if(busy214) return;
    if(v==="back"){ entered=entered.slice(0,-1); return paint(""); }
    if(entered.length<4){ entered+=v; paint("");
      if(entered.length===4){ busy214=true; send("/api/login",{id:who,pin:entered}); } }
  }
  q(".pinpad").addEventListener("pointerdown",(ev)=>{
    const k=ev.target.closest(".key"); if(!k||!k.dataset.k) return;
    ev.preventDefault();
    k.classList.add("hit214"); setTimeout(()=>k.classList.remove("hit214"),160);
    key214(k.dataset.k);
  });
  q(".pinpad").addEventListener("click",(ev)=>ev.preventDefault());   // pointerdown already handled it
  document.addEventListener("keydown",(ev)=>{   // physical keyboards work too
    if(q("#pin").style.display==="none") return;
    if(/^[0-9]$/.test(ev.key)) key214(ev.key);
    else if(ev.key==="Backspace"){ ev.preventDefault(); key214("back"); }
  });
  async function send(url,payload){
    paint("Checking…");
    try {
      const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)});
      const out=await r.json();
      if(out.ok){ location.href = out.change_required ? "/change-pin" : "/home"; return; }
      entered=""; busy214=false; paint(out.error||"Something went wrong",true);
    } catch(e){ entered=""; busy214=false; paint("Network hiccup — try again",true); }
  }
</script></body></html>`;

// Q114: the forced first-login stop — you arrived on a temporary code,
// you leave owning your PIN. Same pad as sign-in; two-stage confirm; the
// server refuses the temp code itself as the new PIN.
const changePinPage = (first) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>New PIN — Shop Board</title>${style}</head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a> &nbsp; <a href="/logout" style="color:#8e8e93;font-size:.9rem;text-decoration:none">Sign out</a></p>   <!-- Block 187: wrong person mid-PIN-change can bail out; the change is still required on next login -->
  <h2 id="pinTitle">Hi ${first} — that code was temporary. Choose YOUR 4-digit PIN</h2>
  <div class="dots" id="dots"></div>
  <div class="msg" id="msg"></div>
  <div class="pinpad">
    ${[1,2,3,4,5,6,7,8,9].map((n)=>`<button class="key" data-k="${n}">${n}</button>`).join("")}
    <button class="key" data-k="back">&#9003;</button>
    <button class="key" data-k="0">0</button>
    <button class="key spacer214" tabindex="-1"></button>
  </div>
</div>
<script>
  // Block 214: same instant-tap pad as the login screen — pointerdown entry,
  // no zoom-eaten digits, and the 4th digit auto-advances each stage.
  let entered="", stage="set1", firstPin="", busy214=false;
  const q=(s)=>document.querySelector(s);
  function paint(msg,isErr){ q("#dots").textContent="•".repeat(entered.length);
    const m=q("#msg"); m.textContent=msg||""; m.className="msg"+(isErr?" err":""); }
  async function full214(){
    if(stage==="set1"){ firstPin=entered; entered=""; stage="set2";
      q("#pinTitle").textContent="Type it once more to confirm"; return paint(""); }
    if(entered!==firstPin){ stage="set1"; entered=""; firstPin="";
      q("#pinTitle").textContent="They didn't match — choose YOUR 4-digit PIN";
      return paint("Try again",true); }
    busy214=true; paint("Saving…");
    try {
      const r=await fetch("/api/pin/change",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({pin:entered})});
      const out=await r.json();
      if(out.ok){ location.href="/home"; return; }
      stage="set1"; entered=""; firstPin=""; busy214=false;
      q("#pinTitle").textContent="Choose YOUR 4-digit PIN"; paint(out.error||"Something went wrong",true);
    } catch(e){ stage="set1"; entered=""; firstPin=""; busy214=false;
      q("#pinTitle").textContent="Choose YOUR 4-digit PIN"; paint("Network hiccup — try again",true); }
  }
  function key214(v){
    if(busy214) return;
    if(v==="back"){ entered=entered.slice(0,-1); return paint(""); }
    if(entered.length<4){ entered+=v; paint(""); if(entered.length===4) full214(); }
  }
  q(".pinpad").addEventListener("pointerdown",(ev)=>{
    const k=ev.target.closest(".key"); if(!k||!k.dataset.k) return;
    ev.preventDefault();
    k.classList.add("hit214"); setTimeout(()=>k.classList.remove("hit214"),160);
    key214(k.dataset.k);
  });
  q(".pinpad").addEventListener("click",(ev)=>ev.preventDefault());
  document.addEventListener("keydown",(ev)=>{
    if(/^[0-9]$/.test(ev.key)) key214(ev.key);
    else if(ev.key==="Backspace"){ ev.preventDefault(); key214("back"); }
  });
</script></body></html>`;

// THE HOME SCREEN, v2 — clock-in / clock-out (the floor's first real tool).
// Q90: your USUAL lines are the big one-tap buttons; other lines sit below.
// Clock-out asks WHY from the admin-managed reason list (Q77).
// `state` = { clockedIn: bool, lineName } derived from the latest clock event.
const homePage = (emp, state, usualLines, otherLines, reasons, ah = { now: false, approvers: [], reasons: [], open: false }, timeoff = { on: false, reasons: [], mine: [] }, lineStat = null, fixLane = { open: [] }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board</title>${style}</head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${nav196(emp)}   <!-- Block 196: the ONE shared nav -->
  <div id="hi" style="text-align:center;margin:4px auto 14px;max-width:560px;padding:14px 18px;border-radius:14px;font-size:1.25rem;font-weight:800;letter-spacing:.02em;${state.clockedIn ? "background:#1d5a2d;color:#fff;border:2px solid #30d158" : "background:#2c2c2e;color:#9a9aa0;border:2px solid #3a3a3c"}">${emp.first_name} · ${state.clockedIn ? `&#9679; ON THE CLOCK — ${state.lineName}` : "&#9675; NOT CLOCKED IN"}</div>
  ${state.clockedIn && fixLane.open && fixLane.open.length ? `<div style="background:var(--card);border:1px solid #4a90d9;border-radius:14px;padding:14px 16px;margin:10px 0 0;text-align:left">
    <div style="font-weight:700;color:#4a90d9;margin-bottom:6px">Open fixes — grab one when you can</div>
    ${fixLane.open.map((f) => `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:5px 0">
      <span><b>ORDER ${f.order}</b>${f.cab ? ` · Cab #${f.cab}` : ""} · ${f.kind === "kickback" ? "kickback" : "return"}${f.reason ? " · " + f.reason : ""}${f.hours ? ` · ${f.hours} hr frame` : ""}</span>
      <button class="name" data-fixclaim="${f.build_id}" style="margin-left:auto;width:auto;padding:8px 16px;background:#12233a;border-color:#4a90d9">Work this fix</button>
    </div>`).join("")}
  </div>` : ""}

  <!-- Block 98b (owner-rep): ONE general CLOCK IN — company time first, same
       habit as warehouse/Body/Build. It lands on the disabled "Production
       time" line (14; warehouse-9 pattern: clockable, never on the TV, never
       in any cab's pace math). Lines are worked via on/off taps AFTER the
       punch — the line tap is no longer the paycheck punch. Shop time stays,
       reachable from the work-a-line picker. -->
  <div id="in" style="display:${state.clockedIn ? "none" : "block"}">
    <div style="text-align:center">
      <button class="name" data-line="14" style="display:inline-block;width:auto;background:#1d5a2d;border-color:#30d158;font-size:1.3rem;padding:18px 44px">CLOCK IN<small>start your work day — then tap onto a line</small></button>
    </div>
  </div>

  <!-- Q112: AFTER HOURS — same clock, plus its governance. This panel only
       exists outside shop hours; a line tap opens it instead of clocking
       straight in. Three quick things, then a completely normal session. -->
  ${ah.now && !state.clockedIn ? `
  <div id="ahp" style="display:none;background:var(--card);border:1px solid #7a5900;border-radius:14px;padding:16px;margin-top:14px">
    ${ah.reasons.length ? `
    <p class="msg" style="color:#ffd60a">AFTER HOURS — <span id="ahline"></span>. One quick tap${ah.lastReason ? " (your last answer is pre-picked)" : ""}:</p>
    <p class="msg" style="margin-top:10px">What's it for?</p>
    <div class="grid">${ah.reasons.map((r) => `<button class="name ahre" data-ahreason="${r}" style="${r === ah.lastReason ? "opacity:1;outline:2px solid #30d158" : "opacity:.75"}">${r}</button>`).join("")}</div>
    <input id="ahplan" maxlength="200" placeholder="Anything to add? (optional)" style="width:100%;margin-top:12px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:12px;font-size:16px">
    <p class="msg" style="opacity:.55;font-size:.85rem;margin-top:8px">The office approves or denies the hours after you wrap up — that's the OK, nothing else to answer here.</p>
    <p style="text-align:center;margin-top:12px">
      <button class="name" id="ahgo" style="display:inline-block;background:#1d5a2d">Clock in — after hours</button>
      <button class="back" id="ahback" style="margin-left:12px">cancel</button>
    </p>` : `
    <!-- Block 129 (logic audit L3) → Block 215: the questionnaire is down to
         ONE required answer (the reason); if the reason list is empty,
         EXPLAIN instead of a dead blank panel. -->
    <p class="msg" style="color:#ffd60a">AFTER HOURS — <span id="ahline"></span>. Not set up yet.</p>
    <p class="msg" style="margin-top:8px">Clocking in after hours needs an after-hours reason list. Ask an admin to set that up in the console (Reason lists), then try again.</p>
    <p style="text-align:center;margin-top:12px"><button class="back" id="ahback">back</button></p>`}
  </div>` : ""}

  <!-- Block 98c (owner-rep nav hard pass): if you're ON a line whose cab just
       left (finished / awaiting inspection), SAY SO — the bare clock-out page
       read as "I can't get back onto my line." The card explains the line's
       state and the screen re-checks itself; the moment a cab lands, the task
       list appears on the next refresh. -->
  ${lineStat ? `<div style="background:var(--card);border:1px solid #30d158;border-radius:14px;padding:14px 16px;margin:0 0 14px;text-align:center">
    <b>You're ON ${lineStat.name}.</b> No cab to work right now${lineStat.awaiting ? ` — ORDER ${lineStat.awaiting} is awaiting the manager's inspection` : ""}${lineStat.ondeck ? `. Next up: ORDER ${lineStat.ondeck} — it starts the moment warehouse delivers the kit` : ""}.
    <div style="opacity:.55;font-size:.85rem;margin-top:6px">This screen checks again on its own — when a cab lands on your line, the task list appears here.</div>
  </div><script>setInterval(() => { const f = document.activeElement, wp = document.getElementById("wrap107");
    if (f && (f.tagName === "INPUT" || f.tagName === "TEXTAREA")) return;
    if (wp && wp.style.display !== "none") return;
    // Block 124 (logic audit L2): don't wipe a half-entered time-off request —
    // hold the refresh while any of its fields carry text.
    const tof124 = ["to-start","to-end","to-note"].map((id) => document.getElementById(id)).filter(Boolean);
    if (tof124.some((el) => el.value && el.value.trim())) return;
    location.reload(); }, 45000);</script>` : ""}
  <!-- CLOCK OUT: shown when on the clock. Reason list = Q77 pick list. -->
  <div id="out" style="display:${state.clockedIn ? "block" : "none"}">
    <!-- Block 195 (owner): clock-out kinds come FIRST — same shape as the
         warehouse/body/build pages he likes. Line switching moved BELOW. -->
    ${ah.open ? `<div id="wrap107" style="display:none;border:1px solid #7a5900;border-radius:12px;padding:14px;margin:6px 0 12px;text-align:left">
      <p class="msg" style="color:#ffd60a;font-weight:700;margin:0 0 6px">AFTER-HOURS wrap-up — last step, then you're out:</p>
      <input id="wrapnote" maxlength="200" placeholder="What did you get done? (required)" style="width:100%;box-sizing:border-box;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:12px;font-size:16px">   <!-- Block 169: 16px stops iOS Safari's auto-zoom-on-focus (it zooms any input under 16px) -->
      <div style="margin-top:8px;opacity:.8;font-size:.9rem">Photos of the work — optional:</div>
      <input type="file" id="wrapph107" accept="image/*" multiple style="margin-top:4px;color:#8e8e93">
      <div id="wrapmsg107" style="color:#ffd60a;font-size:.85rem;margin-top:6px;min-height:1em"></div>
      <button class="name" id="wrapgo107" style="display:inline-block;width:auto;padding:12px 22px;margin-top:10px;border-color:#30d158">Submit wrap-up &amp; clock out</button>
    </div>
    <p class="msg" style="color:#ffd60a">AFTER HOURS — clocking out asks for a one-line wrap-up (+ photos if you like).</p>` : ""}
    <p class="msg">Clocking out — what kind?</p>
    <!-- Block 168 (owner-rep): the two everyday outs — LUNCH and END OF DAY —
         stand alone, big and first. Every other reason folds behind ONE
         "Other reason…" tap as smaller secondary choices. Same admin-managed
         reason list, same click handler — only the layout changed. -->
    <div class="grid">
      ${reasons.some((r) => r.label === "Lunch") ? `<button class="name" data-reason="Lunch">Lunch</button>` : ""}
      <button class="name" data-reason="End of day">End of day</button>
      ${reasons.filter((r) => r.label !== "Lunch" && r.label !== "End of day").length ? `<button class="name" style="opacity:.8" onclick="var m168=document.getElementById('more168');m168.style.display=m168.style.display==='none'?'':'none'">Other reason&hellip;</button>` : ""}
    </div>
    <!-- Block 169: display:none inline, NOT the hidden attribute — the .grid
         class sets display:grid, which out-ranks [hidden]'s display:none, so
         the fold never actually folded (Daniel caught it). Toggling the
         inline style wins over the class either way. -->
    <div id="more168" class="grid" style="display:none;margin-top:8px">
      ${reasons.filter((r) => r.label !== "Lunch" && r.label !== "End of day").map((r) => `<button class="name" style="font-size:.85em;opacity:.85;padding:12px" data-reason="${r.label}">${r.label}</button>`).join("")}
    </div>
    <div id="hoth97" style="display:none;margin-top:10px;text-align:center"><input id="hothn97" maxlength="120" placeholder="quick note — why / what kind" style="background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:10px;width:60%;font-size:16px"> <button class="name" id="hothgo97" style="display:inline-block;width:auto;padding:12px 22px">Clock out</button></div>
    <!-- Q111: meeting over, or shop work done? One tap moves you — the
         server does the out+in as a single audited second (Q107). -->
    <p class="msg" style="margin-top:18px">${state.lineId === 14 ? "&hellip;or pick a line to start working" : "&hellip;or work a line — tap to jump on"}</p>
    <div class="grid">
      ${[...usualLines, ...otherLines].filter((l) => l.id !== state.lineId).map((l) => `<button class="name" ${state.lineId === 14 ? "" : 'style="opacity:.8"'} data-switch="${l.id}">${l.name}</button>`).join("")}
      ${state.lineId === 10 ? "" : `<button class="name" style="opacity:.8" data-switch="10">Shop time</button>`}
      ${state.lineId === 14 ? "" : `<button class="name" style="opacity:.8;border-color:#7a5900" data-switch="14">&#9208; Off the line — stay on the clock</button>`}
    </div>
  </div>

  <!-- Q92: request time off — a date range + a reason, right from the phone.
       It goes to the manager's "needs you" queue; the person sees their own
       pending + upcoming-approved requests below. Hidden when the admin
       "Time-off requests" switch is off. -->
  ${timeoff.on ? `
  <div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:18px;text-align:left">
    <p class="msg" style="margin:0 0 8px">Request time off</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <label style="opacity:.7">From <input type="date" id="to-start" style="background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px"></label>
      <label style="opacity:.7">To <input type="date" id="to-end" style="background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px"></label>
      <select id="to-reason" style="background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px">${timeoff.reasons.map((r) => `<option>${r}</option>`).join("")}</select>
      <button class="name" id="to-send" style="display:inline-block;margin:0;padding:10px 16px">Send request</button>
    </div>
    <input id="to-note" maxlength="200" placeholder="Add a note (optional)" style="width:100%;margin-top:8px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px">
    <div class="msg err" id="to-err" style="margin-top:8px"></div>
    ${timeoff.mine.length ? `<div style="margin-top:12px;font-size:.9rem">
      <div style="opacity:.55;margin-bottom:4px">Your requests</div>
      ${timeoff.mine.map((t) => `<div style="padding:3px 0">${t.dates} · ${t.reason || "—"} · <b style="color:${t.status === "approved" ? "#30d158" : t.status === "denied" ? "#ff453a" : "#ffd60a"}">${t.status}</b>${t.note ? ` <span style="opacity:.6">— ${t.note}</span>` : ""}</div>`).join("")}
    </div>` : ""}
  </div>` : ""}

  <div class="msg err" id="err" style="margin-top:14px"></div>
  <p style="text-align:center;margin-top:22px">
    ${emp.role === "manager" || emp.role === "admin" ? `<a href="/manager" style="color:#8e8e93;margin-right:24px">Manager console</a>` : ""}<a href="/shopboard" style="color:#8e8e93;margin-right:24px">Shop board</a>
    <a href="/logout" style="color:#8e8e93">Sign out</a>
  </p>
</div>
<script>${netJs}
  // claimed_at rides with every tap (Q103-1: the REAL tap time governs;
  // the server separately stamps received_at) — and it is stamped ONCE at
  // the tap, so Wi-Fi retries still land the true time.
  // Block 199 (Michael's triple-tap, 8/18): three rapid taps on CLOCK IN
  // fired three simultaneous requests — all read "not on the clock" before
  // any insert landed, so the server's double-clock-in guard couldn't see
  // them, and 3 duplicate punches landed in one second. One action in
  // flight at a time now; the flag clears on failure so retries still work.
  let busy199 = false;
  async function act(url, payload){
    if (busy199) return; busy199 = true;
    const err = document.getElementById("err");
    const out = await sbPost(url, {...payload, claimed_at:new Date().toISOString()},
      (m) => { err.textContent = m; });
    busy199 = false;
    // Block 163 (owner-rep): a successful switch must LAND on the new line's
    // screen. location.reload() kept ?clockout=1 alive, so tapping a line on
    // the clock screen just redrew the clock screen — Daniel hit this live.
    if(out.ok) return location.href = "/home";
    // Block 163: leaving a line with steps you started still open — soft
    // heads-up, OK leaves anyway (a teammate can tap them done).
    if(out.nudge163){
      if(confirm(out.error + "\\n\\nOK leaves anyway — the steps stay open for a teammate to finish.")){
        const out2 = await sbPost(url, {...payload, claimed_at:new Date().toISOString(), confirm163:true},
          (m) => { err.textContent = m; });
        if(out2.ok) return location.href = "/home";
        err.textContent = out2.error||"Something went wrong";
      } else { err.textContent = ""; }
      return;
    }
    err.textContent = out.error||"Something went wrong";
  }
  // Q112: outside shop hours a line tap opens the governance panel first.
  const AH = ${ah.now && !state.clockedIn ? "true" : "false"};
  let ahLine = 0, ahReason = "${(ah.lastReason || "").replace(/"/g, '\\"')}";   // Block 214/215: last reason pre-picked; approver question retired
  document.getElementById("in").addEventListener("click",(e)=>{
    const b=e.target.closest("[data-line]"); if(!b) return;
    if (AH) { ahLine = Number(b.dataset.line);
      document.getElementById("ahline").textContent = ahLine === 10 ? "Shop time" : "clocking into a line";
      document.getElementById("in").style.display = "none";
      document.getElementById("ahp").style.display = "block"; return; }
    act("/api/clock/in",{line_id:Number(b.dataset.line)});
  });
  const ahp = document.getElementById("ahp");
  if (ahp) ahp.addEventListener("click",(e)=>{
    const r=e.target.closest(".ahre"); if(r){ ahReason=r.dataset.ahreason;
      ahp.querySelectorAll(".ahre").forEach(x=>{x.style.opacity=".75";x.style.outline="none";});
      r.style.opacity="1"; r.style.outline="2px solid #30d158"; }
    if (e.target.id==="ahback"){ ahp.style.display="none"; document.getElementById("in").style.display="block"; }
    if (e.target.id==="ahgo") act("/api/clock/in",{line_id:ahLine, ah_reason:ahReason, ah_plan:document.getElementById("ahplan").value});
  });
  // Block 107: after hours, ANY reason tap opens the WRAP-UP step (required
  // note + optional photos) — and THAT submits the clock-out.
  async function wrapGo107(){
    const w = document.getElementById("wrapnote"), m = document.getElementById("wrapmsg107");
    if (!w.value.trim()) { m.textContent = "One line on what got done — required."; w.focus(); return; }
    const files = (document.getElementById("wrapph107") || {}).files || [];
    const go = document.getElementById("wrapgo107"); go.disabled = true;
    for (let i = 0; i < files.length; i++) {
      m.textContent = "Sending photo " + (i + 1) + " of " + files.length + "…";
      try {
        const r = await fetch("/api/afterhours/photo", { method: "POST", headers: { "Content-Type": files[i].type || "image/jpeg" }, body: files[i] });
        const o = await r.json();
        if (!o.ok) { m.textContent = (o.error || "Photo upload failed") + " — fix or clear the photos, then tap again."; go.disabled = false; return; }
      } catch (e2) { m.textContent = "Network hiccup on a photo — try again."; go.disabled = false; return; }
    }
    m.textContent = "";
    const rH = window.__wrapReason107 || "End of day";
    act("/api/clock/out", { reason: rH, note: rH.indexOf("Other") === 0 ? w.value.trim() : undefined, wrap_note: w.value.trim() });
    go.disabled = false;
  }
  document.getElementById("out").addEventListener("click",(e)=>{
    const b=e.target.closest("[data-reason]"); if(b){
      const wp=document.getElementById("wrap107");
      if (wp) { window.__wrapReason107 = b.dataset.reason; wp.style.display = "block";
        document.getElementById("wrapnote").focus(); return; }
      // Block 97: "Other (add note)" opens the note row first.
      if (b.dataset.reason.indexOf("Other") === 0) { window.__hoth97 = b.dataset.reason;
        const r97 = document.getElementById("hoth97"); if (r97) { r97.style.display = "block"; document.getElementById("hothn97").focus(); return; } }
      act("/api/clock/out",{reason:b.dataset.reason}); }
    if (e.target.id === "hothgo97") { act("/api/clock/out",{reason:window.__hoth97, note:document.getElementById("hothn97").value || undefined}); }
    if (e.target.id === "wrapgo107") wrapGo107();
    const s=e.target.closest("[data-switch]"); if(s) act("/api/clock/switch",{line_id:Number(s.dataset.switch)});
  });
  // Q92: submit a time-off request. Client sanity only — the server re-checks.
  const toSend = document.getElementById("to-send");
  if (toSend) toSend.addEventListener("click", async () => {
    const err = document.getElementById("to-err"); err.textContent = "";
    const start = document.getElementById("to-start").value,
          end = document.getElementById("to-end").value,
          reason = document.getElementById("to-reason").value,
          note = (document.getElementById("to-note") || {}).value || "";
    if (!start) { err.textContent = "Pick a start date"; return; }
    if (end && end < start) { err.textContent = "The end date is before the start"; return; }
    toSend.disabled = true; toSend.textContent = "Sending…";
    const out = await sbPost("/api/timeoff/request", { start_date: start, end_date: end || start, reason, note },
      (m) => { err.textContent = m; });
    if (out.ok) location.reload();
    else { toSend.disabled = false; toSend.textContent = "Send request"; err.textContent = out.error || "Something went wrong"; }
  });
  // Block 126 (M3): grab an open fix from the lane above (act() reloads on success).
  document.addEventListener("click", (e) => { const fx = e.target.closest("[data-fixclaim]"); if (fx) act("/api/fix/claim", { build_id: fx.dataset.fixclaim }); });
</script></body></html>`;

// Block 138 (owner-rep ruling, B1): THE FLOOR NEVER SEES MONEY. A Coyote
// order note is split on its own line breaks (and dot/semicolon separators)
// and any clause carrying a money signal is dropped before a production
// surface renders it. Managers/admins and the canFull tier (Warehouse /
// Accounting / office) always see the verbatim note. When money is welded
// into the same line as shop info, the whole line dies — leak-proof default.
const SPLIT138 = /[\n\r]+|\s*[\u00b7;|]\s*/;
const MONEY138 = /\$|\b(deposit|discount|fee|fees|savings|payment|payments|pay|paid|prepaid|owes?|owed|balance|bill|billing|invoice|invoiced|price|priced|pricing|cost|costs|charge|charged|charges|quote|quoted|refund|refunded|wire|financed?|financing)\b|\d+\s*%\s*down\b|\bdown\s+payment\b/i;
function scrubMoney138(text) {
  if (!text) return "";
  return String(text).split(SPLIT138).map((s) => s.trim()).filter((s) => s && !MONEY138.test(s)).join(" \u00b7 ");
}
// Block 138 (owner-rep, B1): NOTE TRIAGE — each non-money line of the order
// note becomes a needs-a-ruling item (option_flag kind 'note') a manager
// routes with one tap: production hours, Body/Build push-along, or no
// action. Money lines are office matter and never prompt. Idempotent per
// line — a re-push or note edit only surfaces NEW lines; ruled lines keep
// their ruling.
async function noteTriage138(buildId, noteText, orderNumber) {
  const lines = String(noteText || "").split(SPLIT138).map((s) => s.trim()).filter((s) => s && !MONEY138.test(s));
  if (!lines.length) return 0;
  const have = await db(`option_flag?select=flag_text&build_id=eq.${buildId}&kind=eq.note`);
  const seen = new Set(have.map((f) => f.flag_text));
  let added = 0;
  for (const ln of lines) {
    if (seen.has(ln)) continue;
    await db("option_flag", { method: "POST", body: JSON.stringify({ build_id: buildId, kind: "note", flag_text: ln.slice(0, 300) }) });
    added++;
  }
  if (added) {
    const adm = await adminIds225();   // Block 225: admin-console ruling, not floor work
    notify("note.triage", adm, `Order ${orderNumber}: ${added} order-note item${added === 1 ? "" : "s"} need a ruling`,
      "The order note has lines a human should route — production hours, Body/Build push-along, or no action. Open the order to rule on them.", "/order/" + encodeURIComponent(orderNumber), { urgent: await urgent226(buildId) });
    logEvent("note.triage", null, { build_id: buildId, order_number: orderNumber, added });
  }
  return added;
}

// THE CAB TASK SCREEN — shown to a clocked-in Production tech/manager.
// One cab front-center (Q90: ORDER # + LINE is the identity), Mike's
// numbered steps grouped by day, two-step check-off (Q45): tap to start,
// tap again to complete; tap a completed task to undo (Q90 instant+undo).
// ANY clocked-on tech can move any task (Q104) — who tapped is recorded.
const cabPage = (emp, build, tasks, lineName, notes = [], tphotos = [], otherLines = [], people = {}, photoMin = 1, photoHave = 0, fixLane = { open: [], onFix: false }, prog209 = { ask: false, mandatory: false, have: false }) => {
  const inRework = build.state === "rework";
  const inFix = build.state === "fix_job";   // Q85: a returned/kicked-back cab
  // Per-task documentation (file 11): count what's attached to each step.
  const notesOf = {}; for (const n of notes) (notesOf[n.task_id] = notesOf[n.task_id] || []).push(n);
  const photosOf = {}; for (const p of tphotos) (photosOf[p.task_id] = photosOf[p.task_id] || []).push(p);
  // Q107: who's-on-it line under a step. Times shown in Phoenix (Q82, UTC-7 fixed).
  const phx = (ts) => ts ? new Date(new Date(ts).getTime() - 7 * 3600000).toISOString().slice(11, 16) : "";
  const whoLine = (t) =>
    t.state === "in_progress" && t.started_by ? `Started by ${people[t.started_by] || "?"} · ${phx(t.started_at)}` :
    t.state === "complete" && t.completed_by ? `Done by ${people[t.completed_by] || "?"} · ${phx(t.completed_at)}` : "";
  const days = [...new Set(tasks.map((t) => t.day_no))].sort((a, b) => a - b);
  // Block 124 (logic audit L4): "standard hours" counts only the real
  // (non-background) steps — the finish gate ignores background steps, so a
  // finishable cab reads a clean X of X, not X of a larger total.
  const doneMh = tasks.filter((t) => !t.is_background && t.state === "complete").reduce((s, t) => s + Number(t.man_hours), 0);
  const totalMh = tasks.filter((t) => !t.is_background).reduce((s, t) => s + Number(t.man_hours), 0);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board</title>${style}
<style>
  .task{display:flex;align-items:center;gap:14px;width:100%;text-align:left;
        background:var(--card);border:1px solid var(--line);border-radius:12px;
        padding:14px 16px;color:#fff;font-size:1.05rem;cursor:pointer;margin-bottom:10px}
  .task .no{opacity:.5;min-width:2.2em}
  .task.done{opacity:.45;text-decoration:line-through}
  .task.doing{border-color:var(--red)}
  .task .tag{margin-left:auto;font-size:.8rem;opacity:.8}
  .task.doing .tag{color:var(--red);opacity:1}
  .dayhead{margin:22px 0 10px;font-weight:700;opacity:.85}
  .cabbar{background:var(--card);border:1px solid var(--line);border-radius:14px;
          padding:16px;margin-bottom:8px}
  .cabbar b{font-size:1.2rem}
  .note{background:#3a2a00;border:1px solid #7a5900;border-radius:10px;padding:10px 14px;
        margin:10px 0;font-size:.95rem}
</style></head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${nav196(emp)}   <!-- Block 196: the ONE shared nav -->
  ${otherLines.length ? `<p style="text-align:center;margin:-8px 0 10px"><a href="#" onclick="const s187=document.getElementById('swpick');s187.hidden=!s187.hidden;if(!s187.hidden)s187.scrollIntoView({behavior:'smooth',block:'center'});return false" style="color:#8e8e93">Switch line</a></p>` : ""}   <!-- Block 187: Switch line up top, same one-tap picker -->
  <div style="text-align:center;margin:4px auto 12px;max-width:560px;padding:12px 16px;border-radius:14px;font-size:1.15rem;font-weight:800;letter-spacing:.02em;background:#1d5a2d;color:#fff;border:2px solid #30d158">${emp.first_name} · &#9679; ON THE CLOCK — ${lineName}</div>
  <!-- Block 198 (owner, day 4): ONE-TAP LUNCH / END OF DAY right at the top
       of the screen production lives on. Before this, lunch meant Switch
       line → hold the line → a popup nobody understood → THEN clock out.
       Daniel: staff "NEED TO HAVE a quick ability to clock OUT for lunch."
       One tap now. The line HOLDS — a lunch punch never releases the cab;
       clock back in from the home screen and the same steps are waiting. -->
  <div style="display:flex;gap:10px;max-width:560px;margin:0 auto 4px">
    <button onclick="quickOut198('Lunch',this)" style="flex:1.4;background:#3a2a00;color:#ffd60a;border:2px solid #ffd60a;border-radius:12px;padding:16px 10px;font-size:1.1rem;font-weight:800;cursor:pointer">&#127860; Clock out for LUNCH</button>
    <button onclick="quickOut198('End of day',this)" style="flex:1;background:#2c2c2e;color:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 10px;font-size:1rem;font-weight:700;cursor:pointer">&#127937; End of day</button>
  </div>
  <div style="text-align:center;max-width:560px;margin:0 auto 12px;font-size:.85rem;opacity:.6">Lunch holds your line — your cab and steps will be right here when you're back.</div>
  <div class="msg err" id="qerr198" style="margin:0 0 8px"></div>
  ${prog209.ask ? `
  <!-- Block 209 (owner, Sat 8/22): the END-OF-DAY PROGRESS ASK — customers
       get build reports, so End of day opens this panel first: snap a
       progress photo / jot a note, or skip (the skip disappears when the
       admin "REQUIRED" toggle flips — training first, mandatory later). -->
  <div id="prog209" hidden style="background:var(--card);border:2px solid #ffd60a;border-radius:14px;padding:14px;max-width:560px;margin:0 auto 10px;text-align:left">
    <b>&#128247; Please add progress photos &amp; notes before you go</b>
    <div style="opacity:.75;font-size:.95rem;margin:4px 0 8px">The owner of this truck gets build updates — photos of today's progress go straight into their report.${prog209.have ? ` <b style="color:#30d158">&#10003; Today's update is already on this cab</b> — add another if you like.` : ""}</div>
    <input type="file" id="progph209" accept="image/*" multiple style="color:#8e8e93">
    <textarea id="prognote209" maxlength="500" placeholder="What got done today? (optional note — the owner may see this)" style="width:100%;min-height:52px;margin-top:8px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px;font-size:16px;font-family:inherit"></textarea>
    <div class="msg" id="progmsg209" style="min-height:1em"></div>
    <button class="name" style="background:#1d3a24;border-color:#30d158;margin-top:8px" onclick="progGo209(this)">Save &amp; clock out</button>
    ${prog209.mandatory && !prog209.have ? "" : `<p style="text-align:center;margin:8px 0 0"><a href="#" onclick="progSkip209();return false" style="color:#8e8e93">Skip today &amp; clock out</a></p>`}
  </div>` : ""}
  <div class="cabbar">
    <!-- Block 101c (owner-rep): the order number taps through to the cab card
         — a quick look at what this order IS without a trip over to the shop
         board. ⌂ Home on the cab card lands right back on this task screen. -->
    <b>ORDER <a href="/order/${encodeURIComponent(build.order_number)}" style="color:inherit">${build.order_number}</a></b> · ${lineName}<br>
    <span style="opacity:.7">${build.part_number} · Cab ${build.cab_number || "—"} · ${build.destination || ""}</span><br>
    <span style="opacity:.7">${doneMh.toFixed(1)} of ${totalMh.toFixed(1)} standard hours complete</span>
  </div>
  ${(() => { const sn138 = scrubMoney138(build.invoice_note); return build.note_flagged && sn138 && (emp.role === "manager" || emp.role === "admin") ? `<div class="note">⚠ ORDER NOTE: ${escH(sn138)}</div>` : ""; })()}   <!-- Block 138: money never reaches the floor. Block 194 (owner): the order note (shipping etc.) is MANAGER/ADMIN-only on the cab screen — production builds from the checklist + flags, not customer notes. -->
  ${tasks.every((t) => t.is_background || t.state === "complete") ? `
  <!-- Block 194 (Blazer lesson): when the cab is DONE, say so at the TOP —
       the finish box used to live only below the whole checklist. -->
  <div class="cabbar" style="border-color:#30d158;cursor:pointer" onclick="const f194=document.getElementById('finish11');if(f194)f194.scrollIntoView({behavior:'smooth',block:'center'})">
    <b style="color:#30d158">&#10003; Every step is checked!</b> ${photoHave >= photoMin ? (inRework ? "Tap here to finish — send it to Body." : "Tap here to finish — send it for inspection.") : `Add ${photoMin - photoHave > 1 ? (photoMin - photoHave) + " completion photos" : "a completion photo"} and ${inRework ? "send it to Body" : "send it for inspection"} — tap here.`}
  </div>` : ""}
  ${inRework ? `
  <!-- REWORK BANNER (files 11/18 · Block 207): the manager sent this cab
       back with a reason + a time frame. The fix tasks sit in the REWORK
       group below (day_no 0 sorts first). Finish them all and the finish
       gate returns — and per the Block-207 ONE-INSPECTION ruling the crew
       pushes the cab straight to BODY themselves (Body can send it back
       with one tap if the fixes aren't right). -->
  <div class="note" style="background:#3a1200;border-color:#ff9f0a">
    ⟲ SENT BACK FOR REWORK — ${build.rework_reason || "see note"} · fix within ${Number(build.rework_hours) || "—"} hrs
    ${build.rework_note ? `<br><span style="opacity:.8">Manager's note: ${build.rework_note}</span>` : ""}
  </div>` : ""}
  ${inFix ? `
  <!-- Q85 FIX-JOB BANNER: this cab was ALREADY signed off and came BACK — a
       Body Shop kickback or a customer return. The fix step sits in the FIX
       group below (day_no 0). Finish it and the finish gate returns — resubmit
       sends the cab to AWAITING INSPECTION for RE-INSPECTION (never straight to
       complete). Fix hours are their own bucket (0 standard hours). -->
  <div class="note" style="background:#12233a;border-color:#4a90d9">
    ⟲ BACK FOR ONE MORE PASS — ${build.fix_reason || "see note"}${build.fix_hours ? ` · ${Number(build.fix_hours)} hrs set aside` : ""}
    ${build.fix_note ? `<br><span style="opacity:.8">Manager's note: ${build.fix_note}</span>` : ""}
  </div>` : ""}
  ${inFix && fixLane.onFix ? `<p style="text-align:center;margin:-2px 0 12px"><button onclick="fixRelease(this)" style="background:#2c2c2e;color:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 20px;font-size:.95rem;cursor:pointer">Done with this fix — back to my line</button></p>` : ""}
  ${fixLane.open && fixLane.open.length ? `<div class="cabbar" style="border-color:#4a90d9">
    <div style="font-weight:700;color:#4a90d9;margin-bottom:6px">Open fixes — grab one when you can</div>
    ${fixLane.open.map((f) => `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:5px 0">
      <span><b>ORDER ${f.order}</b>${f.cab ? ` · Cab #${f.cab}` : ""} · ${f.kind === "kickback" ? "kickback" : "return"}${f.reason ? " · " + f.reason : ""}${f.hours ? ` · ${f.hours} hr frame` : ""}</span>
      <button onclick="fixClaim('${f.build_id}',this)" style="margin-left:auto;background:#12233a;color:#fff;border:1px solid #4a90d9;border-radius:10px;padding:8px 16px;font-size:.9rem;cursor:pointer">Work this fix</button>
    </div>`).join("")}
  </div>` : ""}
  ${days.map((d) => `
    <div class="dayhead">${d === 0 ? (inFix ? "FIX — do these first" : "REWORK — fix these first") : `DAY ${d}`}</div>
    ${tasks.filter((t) => t.day_no === d).map((t) => `
      <button class="task ${t.state === "complete" ? "done" : t.state === "in_progress" ? "doing" : ""}"
              data-id="${t.id}" data-state="${t.state}">
        <span class="no">${t.display_no}</span> ${t.name}${t.day_end && t.day_end > t.day_no ? ` <small style="opacity:.55">(runs Days ${t.day_no}&ndash;${t.day_end})</small>` : ""}
        <span class="tag">${t.is_background ? "background" : t.state === "complete" ? "done — tap to undo" : t.state === "in_progress" ? "IN PROGRESS — tap when done" : "tap to start"}</span>
      </button>
      <!-- Per-task notes/photos (file 11): document a problem or the work
           right where it happened. Lives OUTSIDE the task button so a
           documentation tap never moves the check-off state. -->
      <div style="margin:-6px 0 10px 8px;font-size:.85rem">
        ${whoLine(t) ? `<span style="opacity:.55">${whoLine(t)}</span> · ` : ""}${t.state === "in_progress" && (t.started_by === emp.id || emp.role === "manager" || emp.role === "admin") ? `<a style="display:inline-block;padding:2px 10px;margin:2px 6px 2px 0;border:1px solid #7a5900;border-radius:8px;color:#ffd60a;cursor:pointer;white-space:nowrap" onclick="unstart164('${t.id}')">&#8617; undo start</a> ` : ""}<a style="display:inline-block;padding:6px 14px;margin:2px 0;border:1px solid #4a7ab0;border-radius:9px;color:#8ec2f0;font-size:.95rem;font-weight:600;cursor:pointer;white-space:nowrap" onclick="toggleAtt('${t.id}')">${
          (notesOf[t.id] || []).length + (photosOf[t.id] || []).length
            ? `${(photosOf[t.id] || []).length ? `📎 ${(photosOf[t.id] || []).length} photo${(photosOf[t.id] || []).length === 1 ? "" : "s"}` : ""}${(photosOf[t.id] || []).length && (notesOf[t.id] || []).length ? " · " : ""}${(notesOf[t.id] || []).length ? `📝 ${(notesOf[t.id] || []).length} note${(notesOf[t.id] || []).length === 1 ? "" : "s"}` : ""} — view / add`
            : "&#128247; Add note / photo"}</a>
        <div id="att-${t.id}" hidden style="background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:6px">
          ${(notesOf[t.id] || []).map((n) => `<div style="opacity:.85;padding:3px 0;border-bottom:1px solid var(--line)">${String(n.note).replace(/</g, "&lt;")}</div>`).join("")}
          ${(photosOf[t.id] || []).length ? `<div style="margin-top:6px">${(photosOf[t.id] || []).map((p) =>
            `<a href="/photo-view/${p.id}" target="_blank"><img src="/photo/${p.id}" style="height:56px;border-radius:8px;margin-right:6px"></a>`).join("")}</div>` : ""}
          <textarea id="an-${t.id}" placeholder="Note about this step"
            style="width:100%;min-height:44px;margin-top:8px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px;font-family:inherit"></textarea>
          <input type="file" id="ap-${t.id}" accept="image/*" multiple style="color:#8e8e93;margin-top:6px">
          <button class="back" style="color:#fff;background:#3a3a3c;border-radius:8px;margin-top:6px"
            onclick="saveAtt('${t.id}','${build.id}',this)">Save</button>
          <div style="margin-top:6px"><button class="back" type="button" style="color:#fff;background:#3a3a3c;border-radius:8px"
            onclick="phoneHandoff('${build.id}','${t.id}',this,'hoff-${t.id}')">📱 From a phone</button></div>
          <div id="hoff-${t.id}" style="margin-top:8px"></div>
        </div>
      </div>`).join("")}`).join("")}
  ${tasks.every((t) => t.is_background || t.state === "complete") ? `
  <!-- FINISH GATE (file 11, builder half): every step done -> final note ->
       cab goes AWAITING INSPECTION for the manager. Photos join when
       storage plumbing lands (noted in BUILD_LOG). -->
  <div class="cabbar" id="finish11" style="border-color:#30d158;margin-top:18px">
    <b>Every step is checked off.</b><br>
    <textarea id="fnote" placeholder="Final note for this cab (what the next set of eyes should know)"
      style="width:100%;min-height:80px;margin-top:10px;background:#111;color:#fff;
             border:1px solid var(--line);border-radius:10px;padding:10px;font-family:inherit"></textarea>
    <!-- Completion photos (file 11): captured on the phone camera. -->
    <div style="margin-top:10px;opacity:.85">Completion photos${photoMin > 0 ? ` — at least ${photoMin} required` : " (optional for this product)"}:
      <input type="file" id="fphotos" accept="image/*" multiple style="color:#8e8e93"></div>
    <div style="margin-top:8px"><button class="b" type="button" onclick="phoneHandoff('${build.id}',null,this)">📱 Send photos from a phone</button>
      <div id="hoff" style="margin-top:8px"></div></div>
    <div class="msg" id="upmsg"></div>
    <button class="name" style="background:#1d3a24;border-color:#30d158;margin-top:10px" data-min="${photoMin}" data-have="${photoHave}"
      onclick="finishCab('${build.id}',this)">${inRework ? "Fixes done — send to Body" : inFix ? "Fixes done — send back for re-inspection" : "Finished — send for inspection"}</button>
  </div>` : ""}
  <div class="msg err" id="err"></div>
  <!-- SWITCH LINE (Q107): going to help another line "for a bit" used to
       mean clock out + clock in — enough taps that nobody bothered, so the
       helper's hours kept feeding the WRONG line's pace math. One tap now:
       pick the line you're walking to and your clock moves with you. -->
  ${otherLines.length ? `
  <div id="swpick" hidden style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;margin:10px 0">
    <div style="opacity:.7;margin-bottom:8px">Helping another line? Your hours follow you:</div>
    ${otherLines.map((l) => `<button class="name" style="margin:4px 6px 4px 0" onclick="switchLine(${l.id},this)">${l.name}</button>`).join("")}
  </div>` : ""}
  <p style="text-align:center;margin:22px 0">
    <button class="back" id="clockout">Clock out</button> ·
    ${otherLines.length ? `<button class="back" onclick="document.getElementById('swpick').hidden=!document.getElementById('swpick').hidden">Switch line</button> ·` : ""}
    ${emp.role === "manager" || emp.role === "admin" ? `<a href="/manager" style="color:#8e8e93">Manager console</a> ·` : ""}
    <a href="/shopboard" style="color:#8e8e93">Shop board</a> ·
    <a href="/logout" style="color:#8e8e93">Sign out</a>
  </p>
</div>
<script>${netJs}
  // Q107 one-tap line switch: the server does the clock-out + clock-in as
  // one audited move, stamped at the tap (Q103-1 — retries keep true time).
  // Block 164 (owner-rep): un-START an accidental "tap to start". Confirm,
  // then the server wipes the start (your own steps; managers anyone's).
  async function unstart164(id) {
    if (!confirm("Put this step back to not started?\\n\\nUse this for an accidental tap — the start and who tapped it are wiped from this step.")) return;
    const err = document.getElementById("err");
    const out = await sbPost("/api/task/state",
      { task_id: id, to: "not_started", claimed_at: new Date().toISOString() },
      (m) => { err.textContent = m; });
    if (out.ok) return location.reload();
    err.textContent = out.error || "Something went wrong";
  }
  // Block 198 (owner, day 4): the one-tap lunch / end-of-day buttons up top.
  // Lunch never gets the open-steps popup (server exempts it — a lunch punch
  // PAUSES the day). End of day keeps the soft heads-up, worded plainly.
  // Block 209: the end-of-day progress ask. End-of-day taps open the photo
  // panel first; Save uploads photo(s) (kind=progress) + the note, then
  // clocks out; Skip clocks straight out (hidden once REQUIRED is on and
  // today's cab has nothing yet). Server enforces the mandatory case too.
  var PROG209 = { ask: ${prog209.ask}, mandatory: ${prog209.mandatory}, have: ${prog209.have}, done: false };
  async function progGo209(btn) {
    const m = document.getElementById("progmsg209");
    const files = (document.getElementById("progph209") || {}).files || [];
    const note = ((document.getElementById("prognote209") || {}).value || "").trim();
    if (!files.length && !note) {
      if (PROG209.mandatory && !PROG209.have) { m.textContent = "Add photos or a quick note first — the owner gets today's update."; return; }
      return progSkip209();   // nothing entered + not required = same as skip
    }
    btn.disabled = true; btn.textContent = "Saving…"; m.textContent = "";
    for (const f of files) {
      const blob = await toJpeg(f);
      const up = await sbUpload("/api/photo/upload?build_id=${build.id}&kind=progress", blob.blob || blob, (blob.type || "image/jpeg"), (t) => { m.textContent = t; });
      if (!up.ok) { m.textContent = up.error || "Photo didn't make it — try again"; btn.disabled = false; btn.textContent = "Save & clock out"; return; }
    }
    if (note) {
      const nr = await sbPost("/api/build/prognote", { build_id: "${build.id}", note: note }, (t) => { m.textContent = t; });
      if (!nr.ok) { m.textContent = nr.error || "Note didn't save — try again"; btn.disabled = false; btn.textContent = "Save & clock out"; return; }
    }
    PROG209.done = true; PROG209.have = true;
    quickOut198("End of day", window.__eodBtn209 || btn);
  }
  function progSkip209() {
    PROG209.done = true;
    quickOut198("End of day", window.__eodBtn209);
  }
  async function quickOut198(reason, btn) {
    if (reason === "End of day" && PROG209.ask && !PROG209.done) {
      const p209 = document.getElementById("prog209");
      if (p209) { window.__eodBtn209 = btn; p209.hidden = false; p209.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    }
    if (!btn) btn = document.createElement("button");   // skip-path safety: a detached stub keeps the disable/label writes harmless
    btn.disabled = true; const keep198 = btn.textContent; btn.textContent = "Clocking out…";
    const err = document.getElementById("qerr198") || document.getElementById("err");
    err.textContent = "";
    let out = await sbPost("/api/clock/out",
      { reason: reason, claimed_at: new Date().toISOString() },
      (m) => { err.textContent = m; });
    if (out.nudge163) {
      if (confirm(out.error + "\\n\\nOK clocks you out — the steps stay open for a teammate to finish.")) {
        out = await sbPost("/api/clock/out",
          { reason: reason, claimed_at: new Date().toISOString(), confirm163: true },
          (m) => { err.textContent = m; });
      } else { btn.disabled = false; btn.textContent = keep198; return; }
    }
    if (out.ok) return location.href = "/home";
    err.textContent = out.error || "Something went wrong";
    btn.disabled = false; btn.textContent = keep198;
  }
  async function switchLine(lineId, btn) {
    btn.disabled = true; btn.textContent = "Switching…";
    const err = document.getElementById("err");
    const out = await sbPost("/api/clock/switch",
      { line_id: lineId, claimed_at: new Date().toISOString() },
      (m) => { err.textContent = m; });
    if (out.ok) return location.href = "/home";
    // Block 163 (owner-rep): leaving this line with steps you started still
    // open — soft heads-up; OK leaves anyway, a teammate can finish them.
    if (out.nudge163) {
      if (confirm(out.error + "\\n\\nOK leaves anyway — the steps stay open for a teammate to finish.")) {
        const out2 = await sbPost("/api/clock/switch",
          { line_id: lineId, claimed_at: new Date().toISOString(), confirm163: true },
          (m) => { err.textContent = m; });
        if (out2.ok) return location.href = "/home";
        err.textContent = out2.error || "Something went wrong";
      } else { err.textContent = ""; }
      btn.disabled = false; btn.textContent = "Switch line";
      return;
    }
    err.textContent = out.error || "Something went wrong";
    btn.disabled = false; btn.textContent = "Try again";
  }
  // Two-step check-off (Q45): not_started -> in_progress -> complete.
  // Tapping a completed task backs it up one step (undo, Q90).
  const next = { not_started: "in_progress", in_progress: "complete", complete: "in_progress" };
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(".task");
    if (b && !b.disabled) {
      b.disabled = true;   // no double-taps while a retry is in flight
      const err = document.getElementById("err");
      const out = await sbPost("/api/task/state",
        { task_id: b.dataset.id, to: next[b.dataset.state], claimed_at: new Date().toISOString() },
        (m) => { err.textContent = m; });
      if (out.ok) return location.reload();
      // Block 159 (owner-rep F1): the soft cap's nudge. OK starts it anyway
      // (the server logs the override for the manager); Cancel leaves it be.
      if (out.nudge159) {
        if (confirm(out.error + "\\n\\nOK starts it anyway — the manager sees the count.")) {
          const out2 = await sbPost("/api/task/state",
            { task_id: b.dataset.id, to: next[b.dataset.state], claimed_at: new Date().toISOString(), confirm159: true },
            (m) => { err.textContent = m; });
          if (out2.ok) return location.reload();
          err.textContent = out2.error || "Something went wrong";
        } else { err.textContent = ""; }
        b.disabled = false;
        return;
      }
      err.textContent = out.error || "Something went wrong";
      b.disabled = false;
    }
    if (e.target.id === "clockout") location.href = "/home?clockout=1";
  });
  // Normalize EVERY photo to a web-friendly JPEG on the phone itself
  // (owner-rep catch 2026-07-28: iPhones shoot HEIC, which desktop
  // browsers can't display). The phone that TOOK the HEIC can decode it —
  // redraw on a canvas, cap the long edge at 2000 px (faster uploads,
  // less storage), fix rotation from the photo's own orientation data.
  // If the browser can't decode it, the original goes up and the server
  // gives a plain-English answer.
  async function toJpeg(file) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.85));
      return blob || file;
    } catch (e) { return file; }
  }
  // Per-task documentation (file 11): note and/or photos on one step.
  function toggleAtt(id) { const d = document.getElementById("att-" + id); d.hidden = !d.hidden; }
  async function saveAtt(taskId, buildId, btn) {
    btn.disabled = true; btn.textContent = "Saving…";
    try {
      const files = document.getElementById("ap-" + taskId).files;
      const errEl = document.getElementById("err");
      for (let i = 0; i < files.length; i++) {
        const f = await toJpeg(files[i]);
        const uo = await sbUpload("/api/photo/upload?build_id=" + buildId + "&task_id=" + taskId,
          f, f.type || "image/jpeg", (m) => { errEl.textContent = m; });
        if (!uo.ok) throw new Error(uo.error || "Photo upload failed");
      }
      const note = document.getElementById("an-" + taskId).value.trim();
      if (note) {
        const out = await sbPost("/api/task/note",
          { task_id: taskId, note, claimed_at: new Date().toISOString() },
          (m) => { errEl.textContent = m; });
        if (!out.ok) throw new Error(out.error || "Note failed");
      }
      errEl.textContent = "";
      if (!note && !files.length) throw new Error("Nothing to save — write a note or pick a photo");
      return location.reload();
    } catch (e) {
      document.getElementById("err").textContent = e.message;
      btn.disabled = false; btn.textContent = "Save";
    }
  }
  // Finish gate submit (file 11 builder half): photos first, then the note.
  async function phoneHandoff(buildId, taskId, btn, targetId){
    targetId = targetId || "hoff";
    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = "Getting a code...";
    try{
      const r = await fetch("/api/handoff/new", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ build_id: buildId, task_id: taskId }) });
      const o = await r.json();
      if(!o.ok) throw new Error(o.error || "Couldn't start the hand-off");
      document.getElementById(targetId).innerHTML =
        '<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;text-align:center;color:#111">' +
        '<div style="font-weight:700;font-size:.95rem;color:#111">Scan with a phone camera</div>' +
        '<div style="margin:10px auto 6px;max-width:260px;line-height:0">' + (o.qr || "") + '</div>' +
        '<div style="opacity:.75;font-size:.85rem;color:#111">or open <b>' + location.host + '/h</b> and enter</div>' +
        '<div style="font-size:1.8rem;letter-spacing:4px;font-weight:800;margin:4px 0;color:#111">' + o.code + '</div>' +
        '<div style="opacity:.55;font-size:.8rem;color:#111">Good for 20 minutes. Photos land on this cab as they send.</div>' +
        '<div id="hophotos" style="margin-top:6px;font-weight:800;color:#1d5a2d"></div>' +
        '</div>';
      // Block 98: LIVE recognition — poll the cab's photo count every 5 s while
      // the code is up, so the Finish gate sees phone-sent photos without a reload.
      if (!window.__hcPoll) window.__hcPoll = setInterval(async () => {
        try { const lc = await fetch("/api/build/photocount?build_id=" + encodeURIComponent(buildId)).then((r) => r.json());
          if (lc && lc.ok) { const fb = document.querySelector("[data-min]"); if (fb) fb.dataset.have = lc.count;
            const el = document.getElementById("hophotos"); if (el) el.textContent = lc.count + " photo" + (lc.count === 1 ? "" : "s") + " on this cab ✓"; } } catch (e) {}
      }, 5000);
      btn.textContent = "New code"; btn.disabled = false;
    }catch(e){ document.getElementById("err").textContent = e.message; btn.disabled = false; btn.textContent = orig; }
  }
  async function finishCab(id, btn) {
    const files = document.getElementById("fphotos").files;
    // Q86 HARD gate: at least data-min completion photos. data-have counts the
    // photos already on the cab (incl. any sent from a phone via the hand-off);
    // the server enforces the same rule.
    const need = Number(btn.dataset.min || 0);
    let have = Number(btn.dataset.have || 0);
    if (have + files.length < need) {
      // Block 98 (owner-rep): photos may have arrived from a PHONE (QR hand-off)
      // since this page loaded — ask the server for the LIVE count first.
      try { const lc = await fetch("/api/build/photocount?build_id=" + encodeURIComponent(id)).then((r) => r.json());
        if (lc && lc.ok) { have = lc.count; btn.dataset.have = lc.count; } } catch (e) {}
    }
    if (have + files.length < need) {
      document.getElementById("err").textContent = "This cab needs at least " + need + " completion photo" + (need === 1 ? "" : "s") + " before finishing (" + (have + files.length) + " so far).";
      return;
    }
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      const upEl = document.getElementById("upmsg");
      for (let i = 0; i < files.length; i++) {
        upEl.textContent = "Uploading photo " + (i + 1) + " of " + files.length + "…";
        const f = await toJpeg(files[i]);
        const uo = await sbUpload("/api/photo/upload?build_id=" + id,
          f, f.type || "image/jpeg", (m) => { upEl.textContent = m; });
        if (!uo.ok) throw new Error(uo.error || "Photo upload failed");
      }
      upEl.textContent = "";
      const out = await sbPost("/api/build/finish",
        { build_id: id, note: document.getElementById("fnote").value,
          claimed_at: new Date().toISOString() },
        (m) => { document.getElementById("err").textContent = m; });
      if (out.ok) return location.reload();
      throw new Error(out.error || "Something went wrong");
    } catch (e) {
      document.getElementById("err").textContent = e.message;
      btn.disabled = false; btn.textContent = "Finished — send for inspection";
    }
  }
  // Block 126 (M3): grab a fix onto the Fix-work clock (any tech, any line), or
  // step off a fix you're done with. Both reload to the true screen.
  async function fixClaim(id, btn){
    if (btn) { btn.disabled = true; btn.textContent = "Opening…"; }
    const out = await sbPost("/api/fix/claim", { build_id: id, claimed_at: new Date().toISOString() }, (m) => { document.getElementById("err").textContent = m; });
    if (out.ok) return location.reload();
    if (btn) { btn.disabled = false; btn.textContent = "Work this fix"; }
  }
  async function fixRelease(btn){
    if (btn) { btn.disabled = true; btn.textContent = "…"; }
    const out = await sbPost("/api/fix/release", { claimed_at: new Date().toISOString() }, (m) => { document.getElementById("err").textContent = m; });
    if (out.ok) return location.reload();
    if (btn) { btn.disabled = false; btn.textContent = "Done with this fix — back to my line"; }
  }
</script></body></html>`;
};

// THE WATCHER HOME — owners + not-yet-live departments (Q95 amendment
// 2026-07-25: everyone's on the grid; functionality follows later).
// THE WAREHOUSE BOARD (Q109) — warehouse's whole launch job on one screen:
// clock in/out (Warehouse work area, line id 9 — never counted in line pace),
// see every line's state + what's on deck, verify kits (the three-state
// gate), reorder the upcoming queue, and run the two-step pull task whose
// "Delivered" tap starts the cab's clock on production's side.
const warehousePage = (emp, clockedIn, reasons, lines, rows, hist = [], ah = { now: false, approvers: [], reasons: [], open: false }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Warehouse</title>${style}
<style>
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}
  .lane h3{margin:0 0 8px}
  .qrow{padding:6px 0;border-bottom:1px solid var(--line)}
  .chip{display:inline-block;border-radius:8px;padding:2px 10px;font-size:.8rem;font-weight:700;margin-left:8px}
  .ok{background:#1d3a24;color:#30d158}.short{background:#3a1200;color:#ff9f0a}.unv{background:#3a3a3c;color:#aaa}
  .b{background:#3a3a3c;border:none;border-radius:8px;color:#fff;padding:7px 12px;font-size:.85rem;cursor:pointer;margin-left:6px}
  .b.grn{background:#1d3a24}.b.red{background:var(--red)}
  .pull{border:1px solid #30d158;border-radius:10px;padding:10px;margin-top:8px}
</style></head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${nav196(emp)}   <!-- Block 196: the ONE shared nav (Order Queue rides in the admin bar; for staff it only bounced to /home) -->
  <div style="text-align:center;margin:4px auto 14px;max-width:560px;padding:14px 18px;border-radius:14px;font-size:1.25rem;font-weight:800;letter-spacing:.02em;${clockedIn ? "background:#1d5a2d;color:#fff;border:2px solid #30d158" : "background:#2c2c2e;color:#9a9aa0;border:2px solid #3a3a3c"}">${emp.first_name} · ${clockedIn ? "&#9679; ON THE CLOCK — Warehouse" : "&#9675; NOT CLOCKED IN"}</div>
  <h2>Warehouse — ${emp.first_name}</h2>
  <div class="lane">
    ${clockedIn
      ? `<b>ON THE CLOCK — Warehouse</b><br><span style="opacity:.6;font-size:.9rem">Clocking out — what kind?</span><br>
         ${ah.open ? `<div id="ahwrapW107" style="display:none;border:1px solid #7a5900;border-radius:12px;padding:12px;margin:8px auto 4px;max-width:560px;text-align:left">
           <p style="color:#ffd60a;font-weight:700;margin:0 0 6px">AFTER-HOURS wrap-up — last step, then you're out:</p>
           <input id="wrapW106" maxlength="200" placeholder="What did you get done? (required)" style="width:100%;box-sizing:border-box;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:10px">
           <div style="margin-top:8px;opacity:.8;font-size:.85rem">Photos of the work — optional:</div>
           <input type="file" id="ahphW107" accept="image/*" multiple style="margin-top:4px;color:#8e8e93">
           <div id="ahmsgW107" style="color:#ffd60a;font-size:.85rem;margin-top:6px;min-height:1em"></div>
           <button class="b grn" style="margin-top:8px" onclick="wrapGoW107(this)">Submit wrap-up &amp; clock out</button>
         </div>
         <p style="color:#ffd60a;margin:8px 0 2px;font-size:.9rem">AFTER HOURS — clocking out asks for a one-line wrap-up (+ photos if you like).</p>` : ""}
         ${reasons.length ? reasons.map((x) => `<button class="b" style="margin:8px 6px 0 0" onclick="clockOut('${x.label.replace(/'/g, "\\'")}',this)">${x.label}</button>`).join("") : `<button class="b" style="margin:8px 6px 0 0" onclick="clockOut('End of day',this)">Clock out</button>`}
         <div id="oth97" style="display:none;margin-top:10px"><input id="othn97" maxlength="120" placeholder="quick note — why / what kind" style="width:55%;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px"> <button class="b grn" onclick="clockOut(window.__oth97,this,val('othn97'))">Clock out</button></div>`
      : `<button class="b grn" style="padding:14px 28px;font-size:1rem" onclick="clockIn(this)">Clock in — Warehouse</button>
         <span style="opacity:.5;font-size:.85rem;margin-left:10px">${ah.now ? `<span style="color:#ffd60a;font-weight:700">After hours</span> — one quick tap, then a normal shift.` : "Morning, back from lunch — same habit as the floor."}</span>
         ${ah.now ? `<div id="ahpW" style="display:none;border:1px solid #7a5900;border-radius:12px;padding:12px;margin-top:12px">
           <p style="color:#ffd60a;font-weight:700;margin:0 0 6px">AFTER HOURS — one quick tap${ah.lastReason ? " (your last answer is pre-picked)" : ""}:</p>
           <p style="opacity:.7;margin:10px 0 4px">What's it for?</p>
           <div>${ah.reasons.map((r) => `<button class="b ahreW" data-ahreason="${r.replace(/"/g, "&quot;")}" style="margin:4px 6px 0 0;${r === ah.lastReason ? "opacity:1;outline:2px solid #30d158" : "opacity:.75"}">${r}</button>`).join("")}</div>
           <input id="ahplanW" maxlength="200" placeholder="Anything to add? (optional)" style="width:70%;margin-top:10px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px;font-size:16px"><br>
           <span style="opacity:.55;font-size:.85rem">The office approves or denies the hours after you wrap up.</span><br>
           <button class="b grn" style="margin-top:10px" onclick="ahGoW(this)">Clock in — after hours</button>
           <button class="b" style="margin-top:10px" onclick="document.getElementById('ahpW').style.display='none'">cancel</button>
         </div>` : ""}`}
  </div>
  ${rows.map((r) => `
  <div class="lane">
    <h3>${r.line.name}</h3>
    ${r.active ? `<div style="opacity:.8">Working now: <b>ORDER ${r.active.order_number}</b>${r.active.cab_number ? ` · Cab #${r.active.cab_number}` : ""} (${r.active.state.replace(/_/g, " ")})</div>` : ""}
    ${r.awaiting.length ? `<div style="color:#ffd60a;font-weight:700;margin-top:4px">⏳ ORDER ${r.awaiting[0].order_number} is AWAITING INSPECTION — line frees soon. Pull the next kit now.</div>` : ""}
    ${!r.active && !r.awaiting.length && !r.rework.length ? `<div style="color:#30d158;font-weight:700">LINE CLEAR — deliver when the kit is ready.</div>` : ""}
    ${r.rework.length ? `<div style="color:#ff9f0a;margin-top:4px">⟲ ORDER ${r.rework[0].order_number} in rework on this line.</div>` : ""}
    ${r.queue.length ? `<div style="margin-top:10px;opacity:.6">Up next (top goes first):</div>
      ${r.queue.map((q, i) => `<div class="qrow"><b>ORDER ${q.order_number}</b>${q.cab_number ? ` · Cab #${q.cab_number}` : ""} · ${q.part_number || ""}${q.queue_pinned ? ' <span class="chip" style="background:#3a2f10;color:#ffd60a" title="The front office pinned this spot — it can&#39;t be moved or crossed">&#128204; HELD — front office</span>' : ""}
        ${q.kit_status === "verified" ? '<span class="chip ok">KIT ✓ VERIFIED</span>' : q.kit_status === "short" ? '<span class="chip short">SHORT — missing parts</span>' : '<span class="chip unv">NOT VERIFIED</span>'}
        ${i === 0 && q.queue_pinned && q.kit_status !== "verified" && r.queue.some((z, zi) => zi > 0 && z.kit_status === "verified") ? `<div style="margin-top:6px;color:#ffd60a;font-size:.85rem">&#128204; Held by the office, but this kit isn't ready — the next ready cab goes ahead. This one keeps its spot and goes the moment its kit is verified.</div>` : ""}
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;margin-top:8px">
          ${i > 0 && !q.queue_pinned && !r.queue[i - 1].queue_pinned ? `<button class="b" onclick="post('/api/kit/move',{build_id:'${q.id}',dir:'up'},this)">▲</button>` : ""}
          ${i < r.queue.length - 1 && !q.queue_pinned && !r.queue[i + 1].queue_pinned ? `<button class="b" onclick="post('/api/kit/move',{build_id:'${q.id}',dir:'down'},this)">▼</button>` : ""}
          ${q.kit_status !== "verified" ? `<button class="b grn" onclick="post('/api/kit/status',{build_id:'${q.id}',status:'verified'},this)">All parts ✓</button>` : ""}
          ${q.kit_status === "verified" ? `<button class="b" onclick="arm(this,()=>post('/api/kit/status',{build_id:'${q.id}',status:'unverified'},this))">Undo verify</button>` : ""}
          ${q.kit_status !== "short" ? `<button class="b red" onclick="arm(this,()=>post('/api/kit/status',{build_id:'${q.id}',status:'short',note:val('kn-${q.id}')},this))">Short</button>` : `<button class="b" onclick="post('/api/kit/status',{build_id:'${q.id}',status:'unverified'},this)">Re-check</button>`}
        </div>
        <div style="margin-top:6px"><input id="kn-${q.id}" value="${String(q.kit_note || "").replace(/"/g, "&quot;")}" placeholder="parts note — what's short, when it's expected (stays with warehouse)" style="width:60%;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:6px;font-size:.8rem"> <button class="b" onclick="post('/api/kit/note',{build_id:'${q.id}',note:val('kn-${q.id}')},this)">Save note</button></div>
        ${i === ((r.queue[0] && r.queue[0].queue_pinned && r.queue[0].kit_status !== "verified") ? r.queue.findIndex((z) => z.kit_status === "verified") : 0) && q.kit_status === "verified" ? `
          <div class="pull">${q.kit_pull_started_at
            ? ((r.active || r.awaiting[0] || r.rework[0])
              ? `Pull started ${q.kit_pull_started_at.slice(11, 16)} UTC. <span style="color:#ffd60a">Line busy — ORDER ${(r.active || r.awaiting[0] || r.rework[0]).order_number} is still on it (${String((r.active || r.awaiting[0] || r.rework[0]).state).replace(/_/g, " ")}). It stays on the line until a manager signs it off — then it moves to Body and this opens up.</span>
               <button class="b" onclick="arm(this,()=>post('/api/kit/unpull',{build_id:'${q.id}'},this))">Undo pull</button>`
              : `Pull started ${q.kit_pull_started_at.slice(11, 16)} UTC — deliver when it's all on the line:
               <button class="b grn" onclick="arm(this,()=>post('/api/kit/deliver',{build_id:'${q.id}'},this))">Delivered — start the cab</button>
               <button class="b" onclick="arm(this,()=>post('/api/kit/unpull',{build_id:'${q.id}'},this))">Undo pull</button>`)
            : `<button class="b grn" onclick="post('/api/kit/pull',{build_id:'${q.id}'},this)">Pull started — gathering the kit</button>`}
          </div>` : ""}
      </div>`).join("")}` : `<div style="opacity:.5;margin-top:8px">Nothing waiting on this line.</div>`}
  </div>`).join("")}
  <div class="lane">
    <h3>Delivered — now in production</h3>
    <div style="opacity:.55;font-size:.85rem;margin-bottom:6px">Read-only. These come BACK to warehouse for ship-prep in a later stage.</div>
    ${(hist || []).length ? (hist || []).map((h) => `<div class="qrow" style="opacity:.85"><b>ORDER ${h.order_number}</b>${h.cab_number ? ` · Cab #${h.cab_number}` : ""} · ${h.lineName || ""} · ${String(h.state || "").replace(/_/g, " ")} · delivered ${String(h.kit_delivered_at || "").slice(0, 10)}${h.byMgmt ? ` · <span style="color:#ffd60a">started by management</span>` : ""}</div>`).join("") : `<div style="opacity:.5">Nothing delivered yet.</div>`}
  </div>
  <div class="msg err" id="err"></div>
  <p style="text-align:center"><a href="/shopboard" style="color:#8e8e93;margin-right:24px">Shop board</a>
  <a href="/logout" style="color:#8e8e93">Sign out</a></p>
</div>
<script>
  // Same sturdy patterns as the consoles: two-tap arm on anything that
  // changes another team's world; plain posts; full reload on success.
  function val(id){ const e = document.getElementById(id); return e ? e.value.trim() : ""; }
  function arm(btn, fn){ if (btn.dataset.armed) { fn(); } else { btn.dataset.armed = "1"; const orig97 = btn.textContent; btn.textContent = "Sure? Tap again"; setTimeout(() => { btn.dataset.armed = ""; btn.textContent = orig97; }, 4000); } }
  async function post(url, payload, btn){
    if (btn) btn.disabled = true;
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, claimed_at: new Date().toISOString() }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      // Block 124 (logic audit M6): if the tap failed because we're no longer
      // on the clock (day-end sweep or a manager clocked us out), this screen
      // is stale — reload so it shows the real state, not a silent reject under
      // a still-green "ON THE CLOCK" chip.
      if (/on the clock|clock in first/i.test(out.error || "")) { location.reload(); return; }
      showErr97(btn, out.error || "Something went wrong");
    } catch (e) { showErr97(btn, "Network hiccup — try again"); }
    if (btn) btn.disabled = false;
  }
  // Block 97: errors land NEXT to the button you tapped (the old bottom-of-page
  // message was invisible mid-scroll), plus the bottom line as backup.
  function showErr97(btn, msg){
    document.getElementById("err").textContent = msg;
    if (!btn) return;
    let s = btn.nextElementSibling;
    if (!s || !s.className || s.className.indexOf("berr97") === -1) {
      s = document.createElement("span"); s.className = "berr97";
      s.style.cssText = "color:#ff6b5e;font-size:.85rem;margin-left:8px;font-weight:700";
      btn.after(s);
    }
    s.textContent = msg;
  }
  // Block 106: after hours, the big button OPENS the questionnaire instead of
  // posting (the server enforces the three answers either way).
  function clockIn(btn){
    const p106 = document.getElementById("ahpW");
    if (p106) { p106.style.display = "block"; return; }
    post("/api/clock/in", { line_id: 9 }, btn);
  }
  let ahReasonW = "${(ah.lastReason || "").replace(/"/g, '\\"')}";   // Block 214/215: last reason pre-picked; approver question retired
  document.addEventListener("click", (e) => {
    const r = e.target.closest(".ahreW"); if (r) { ahReasonW = r.dataset.ahreason;
      document.querySelectorAll(".ahreW").forEach(x => { x.style.opacity = ".75"; x.style.outline = "none"; });
      r.style.opacity = "1"; r.style.outline = "2px solid #30d158"; }
  });
  function ahGoW(btn){
    post("/api/clock/in", { line_id: 9, ah_reason: ahReasonW,
      ah_plan: val("ahplanW") }, btn);
  }
  function clockOut(reason, btn, note){
    // Block 107: after hours, ANY reason tap routes through the wrap-up step
    // (required note + optional photos) — and THAT submits the clock-out.
    const wp107 = document.getElementById("ahwrapW107");
    if (wp107) { window.__wrapRW107 = reason; wp107.style.display = "block";
      const w0 = document.getElementById("wrapW106"); if (w0) w0.focus(); return; }
    // Block 97: "Other (add note)" opens a one-line note box first.
    if (reason.indexOf("Other") === 0 && note === undefined) {
      window.__oth97 = reason; document.getElementById("oth97").style.display = "block";
      const n97 = document.getElementById("othn97"); if (n97) n97.focus(); return;
    }
    post("/api/clock/out", { reason, note: note && note.trim() ? note.trim() : undefined }, btn);
  }
  async function wrapGoW107(btn){
    const w = document.getElementById("wrapW106"), m = document.getElementById("ahmsgW107");
    if (!w.value.trim()) { m.textContent = "One line on what got done — required."; w.focus(); return; }
    const files = (document.getElementById("ahphW107") || {}).files || [];
    btn.disabled = true;
    for (let i = 0; i < files.length; i++) {
      m.textContent = "Sending photo " + (i + 1) + " of " + files.length + "…";
      try {
        const r = await fetch("/api/afterhours/photo", { method: "POST", headers: { "Content-Type": files[i].type || "image/jpeg" }, body: files[i] });
        const o = await r.json();
        if (!o.ok) { m.textContent = (o.error || "Photo upload failed") + " — fix or clear the photos, then tap again."; btn.disabled = false; return; }
      } catch (e) { m.textContent = "Network hiccup on a photo — try again."; btn.disabled = false; return; }
    }
    m.textContent = ""; btn.disabled = false;
    const rW = window.__wrapRW107 || "End of day";
    post("/api/clock/out", { reason: rW, note: rW.indexOf("Other") === 0 ? w.value.trim() : undefined,
      wrap_note: w.value.trim() }, btn);
  }
  setInterval(() => { const f = document.activeElement, wp107 = document.getElementById("ahwrapW107");
    if (f && (f.tagName === "INPUT" || f.tagName === "TEXTAREA")) return;
    if (wp107 && wp107.style.display !== "none") return;
    location.reload(); }, 60000); // the board keeps itself fresh — never mid-typing
  // Block 84: fast queue-freshness. When admin OR another warehouse screen
  // reorders a line (queue_pos) or a cab changes state, reflect it here within
  // seconds instead of waiting for the 60s catch-all above. Polls the SAME
  // /api/queue/state version hash the White Board polls, so the two screens
  // never fork. Skips a cycle while a field is focused (60s backstop covers it).
  var QVER=null;
  function qpoll(){fetch('/api/queue/state',{credentials:'same-origin'}).then(function(r){return r.json();}).then(function(j){if(!j||!j.v)return;if(QVER===null){QVER=j.v;return;}if(j.v!==QVER){var f=document.activeElement;var wp=document.getElementById('ahwrapW107');if((!f||f.tagName!=='INPUT')&&!(wp&&wp.style.display!=='none')){location.reload();}}}).catch(function(){});}
  qpoll();setInterval(qpoll,6000);
</script></body></html>`;

const watcherPage = (emp, clk = null) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board</title>${style}</head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${nav196(emp)}   <!-- Block 196: the ONE shared nav (dept-aware, replaces the Block-193 ternary) -->
  <h2>Welcome, ${emp.first_name}.</h2>
  ${clk && clk.show ? `<style>.wbtn{border:none;border-radius:12px;color:#fff;padding:12px 22px;font-weight:800;cursor:pointer;margin:4px}</style>
  <div style="text-align:center;margin:4px auto 14px;max-width:560px;padding:14px 18px;border-radius:14px;font-size:1.25rem;font-weight:800;letter-spacing:.02em;${clk.clockedIn ? "background:#1d5a2d;color:#fff;border:2px solid #30d158" : "background:#2c2c2e;color:#9a9aa0;border:2px solid #3a3a3c"}">${emp.first_name} · ${clk.clockedIn ? `&#9679; ON THE CLOCK — ${emp.department}` : "&#9675; NOT CLOCKED IN"}</div>
  <div style="text-align:center;margin-bottom:14px">${clk.clockedIn
    ? `${clk.ah && clk.ah.open ? `<div style="color:#ffd60a;font-size:.9rem;margin-bottom:6px">AFTER HOURS — clocking out asks for a one-line wrap-up (+ photos if you like).</div>
       <div id="ahwrapV107" style="display:none;border:1px solid #7a5900;border-radius:12px;padding:12px;margin:0 auto 8px;max-width:560px;text-align:left">
         <p style="color:#ffd60a;font-weight:700;margin:0 0 6px">AFTER-HOURS wrap-up — last step, then you're out:</p>
         <input id="wrapW106" maxlength="200" placeholder="What did you get done? (required)" style="width:100%;box-sizing:border-box;background:#111;color:#fff;border:1px solid #3a3a3c;border-radius:8px;padding:10px">
         <div style="margin-top:8px;opacity:.8;font-size:.85rem">Photos of the work — optional:</div>
         <input type="file" id="ahphV107" accept="image/*" multiple style="margin-top:4px;color:#8e8e93">
         <div id="ahmsgV107" style="color:#ffd60a;font-size:.85rem;margin-top:6px;min-height:1em"></div>
         <button class="wbtn" style="background:#1d5a2d;margin-top:8px" onclick="wrapGoV107(this)">Submit wrap-up &amp; clock out</button>
       </div>` : ""}<button class="wbtn" style="background:#5c4a10" onclick="wclk('/api/clock/out',{reason:'Lunch'},this)">OUT FOR LUNCH</button> <button class="wbtn" style="background:#5a1d1d" onclick="wclk('/api/clock/out',{reason:'End of day'},this)">END OF DAY</button><div style="margin-top:8px">${(clk.reasons || []).filter((r) => r !== "Lunch" && r !== "End of day").map((r) => `<button class="wbtn" style="background:#2c2c2e;font-size:.82rem;padding:8px 14px" onclick="wclk('/api/clock/out',{reason:'${r.replace(/'/g, "\\'")}'},this)">${r}</button>`).join(" ")}</div><div id="woth97" style="display:none;margin-top:8px"><input id="wothn97" maxlength="120" placeholder="quick note — why / what kind" style="background:#111;color:#fff;border:1px solid #3a3a3c;border-radius:8px;padding:8px;width:220px;font-size:16px"> <button class="wbtn" style="background:#1d5a2d" onclick="wclk('/api/clock/out',{reason:window.__othW97,note:document.getElementById('wothn97').value},this)">Clock out</button></div>`
    : `<button class="wbtn" style="background:#1d5a2d;font-size:1.2rem;padding:16px 34px" onclick="wClockIn106(this)">CLOCK IN</button>${clk.ah && clk.ah.now ? `<div style="color:#ffd60a;font-weight:700;margin-top:6px">After hours — one quick tap, then a normal shift.</div>
      <div id="ahpW" style="display:none;border:1px solid #7a5900;border-radius:12px;padding:12px;margin:10px auto 0;text-align:left;max-width:560px">
        <p style="color:#ffd60a;font-weight:700;margin:0 0 6px">AFTER HOURS — one quick tap${clk.ah.lastReason ? " (your last answer is pre-picked)" : ""}:</p>
        <p style="opacity:.7;margin:10px 0 4px">What's it for?</p>
        <div>${clk.ah.reasons.map((r) => `<button class="wbtn ahreW" data-ahreason="${r.replace(/"/g, "&quot;")}" style="background:#2c2c2e;${r === clk.ah.lastReason ? "opacity:1;outline:2px solid #30d158" : "opacity:.75"}">${r}</button>`).join("")}</div>
        <input id="ahplanW" maxlength="200" placeholder="Anything to add? (optional)" style="width:70%;margin-top:10px;background:#111;color:#fff;border:1px solid #3a3a3c;border-radius:8px;padding:8px;font-size:16px"><br>
        <span style="opacity:.55;font-size:.85rem">The office approves or denies the hours after you wrap up.</span><br>
        <button class="wbtn" style="background:#1d5a2d;margin-top:10px" onclick="ahGoW(this)">Clock in — after hours</button>
        <button class="wbtn" style="background:#2c2c2e;margin-top:10px" onclick="document.getElementById('ahpW').style.display='none'">cancel</button>
      </div>` : ""}`}</div>
  <p id="werr" style="text-align:center;color:#ff6b5e;min-height:1em"></p>` : ""}
  <p style="text-align:center;opacity:.75">
    The production board is live and building.<br>
    ${emp.department === "Owner" || emp.role === "admin"
      ? "Watch the floor in real time below."
      : `The ${emp.department} board is coming in a later phase — your login is ready for it.`}
  </p>
  <p style="text-align:center;margin-top:26px">
    <a href="/shopboard" class="name" style="display:inline-block;padding:18px 42px">Open the live board</a>
  </p>
  <!-- Block 193: the manager/admin nav moved to the TOP of this page (owner: "tools should be top navigation not just bottom") — the Block-186 bottom copy is gone. -->
  <!-- Block 154 (owner-rep D7): the enable + test-push buttons are GONE —
       push is automatic (shared bell script: granted devices re-subscribe
       silently; a new device gets the one-time tap banner). -->
  <p style="text-align:center"><a href="/logout" style="color:#8e8e93">Sign out</a></p>
</div>
<script>
  // Plain English: ask the browser's permission, install the tiny
  // service worker, get this device's push address, hand it to the server.
  // Block 106: after hours the big button opens the questionnaire; the server
  // enforces the three answers either way.
  function wClockIn106(btn){
    const p106 = document.getElementById("ahpW");
    if (p106) { p106.style.display = "block"; return; }
    wclk("/api/clock/in", { line_id: ${clk && clk.lineId ? clk.lineId : 0} }, btn);
  }
  window.__ahReW = "${clk && clk.ah ? (clk.ah.lastReason || "").replace(/"/g, '\\"') : ""}";   // Block 214/215: last reason pre-picked; approver question retired
  document.addEventListener("click", (e) => {
    const r = e.target.closest(".ahreW"); if (r) { window.__ahReW = r.dataset.ahreason;
      document.querySelectorAll(".ahreW").forEach(x => { x.style.opacity = ".75"; x.style.outline = "none"; });
      r.style.opacity = "1"; r.style.outline = "2px solid #30d158"; }
  });
  function ahGoW(btn){
    wclk("/api/clock/in", { line_id: ${clk && clk.lineId ? clk.lineId : 0},
      ah_reason: window.__ahReW, ah_plan: document.getElementById("ahplanW").value }, btn);
  }
  // Block 107: after hours, ANY clock-out routes through the wrap-up step
  // (required note + optional photos) — and THAT submits the clock-out.
  async function wrapGoV107(btn){
    const w = document.getElementById("wrapW106"), m = document.getElementById("ahmsgV107");
    if (!w.value.trim()) { m.textContent = "One line on what got done — required."; w.focus(); return; }
    const files = (document.getElementById("ahphV107") || {}).files || [];
    btn.disabled = true;
    for (let i = 0; i < files.length; i++) {
      m.textContent = "Sending photo " + (i + 1) + " of " + files.length + "…";
      try {
        const r = await fetch("/api/afterhours/photo", { method: "POST", headers: { "Content-Type": files[i].type || "image/jpeg" }, body: files[i] });
        const o = await r.json();
        if (!o.ok) { m.textContent = (o.error || "Photo upload failed") + " — fix or clear the photos, then tap again."; btn.disabled = false; return; }
      } catch (e) { m.textContent = "Network hiccup on a photo — try again."; btn.disabled = false; return; }
    }
    m.textContent = ""; btn.disabled = false;
    const rV = window.__wrapRV107 || "End of day";
    wclk("/api/clock/out", { reason: rV, note: rV.indexOf("Other") === 0 ? w.value.trim() : undefined, wrapped107: true }, btn);
  }
  async function wclk(u,p,b){
    const wp107 = document.getElementById("ahwrapV107");
    if (wp107 && u.indexOf("/out") > -1 && !p.wrapped107) {
      window.__wrapRV107 = p.reason; wp107.style.display = "block";
      const w0 = document.getElementById("wrapW106"); if (w0) w0.focus(); return;
    }
    const w106 = document.getElementById("wrapW106");
    if (w106 && w106.value.trim() && u.indexOf("/out") > -1) p.wrap_note = w106.value.trim();
    // Block 97: "Other (add note)" opens the note row first.
    if (p && p.reason && String(p.reason).indexOf("Other") === 0 && p.note === undefined) {
      window.__othW97 = p.reason; var r97 = document.getElementById("woth97");
      if (r97) { r97.style.display = "block"; var n97 = document.getElementById("wothn97"); if (n97) n97.focus(); return; }
    }
    b.disabled = true;
    try { const r = await fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...p, claimed_at: new Date().toISOString() }) });
      const o = await r.json(); if (o.ok) return location.reload();
      document.getElementById("werr").textContent = o.error || "Something went wrong";
    } catch (e) { document.getElementById("werr").textContent = "Network hiccup — try again"; }
    b.disabled = false; }
  // Block 154: push subscribe/test moved to the shared bell script (automatic).
</script></body></html>`;

// Q120: the per-person NOTIFICATION INBOX — their own notification history,
// newest first, unread ones ringed red. Opening it marks them read. This is
// how notifications reach someone in-app regardless of push/text/email.
const inboxPage = (emp, notes) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Notifications — Shop Board</title>${style}</head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${nav196(emp)}   <!-- Block 196: the ONE shared nav -->
  <h2>Notifications</h2>
  ${notes.length ? notes.map((n) => {
    const when = new Date(new Date(n.created_at).getTime() - 7 * 3600000).toISOString().slice(0, 16).replace("T", " ");
    const unread = !n.read_at;
    return `<div style="background:var(--card);border:1px solid ${unread ? "#C8102E" : "var(--line)"};border-radius:12px;padding:12px 14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline">
        <b>${unread ? "\uD83D\uDD34 " : ""}${String(n.title).replace(/</g, "&lt;")}</b>
        <span style="opacity:.5;font-size:.85rem;white-space:nowrap">${when}</span>
      </div>
      <div style="opacity:.85;margin-top:4px">${String(n.body).replace(/</g, "&lt;")}</div>
    </div>`; }).join("")
  : `<div style="opacity:.6;text-align:center;margin-top:24px">No notifications yet.</div>`}
  <p style="text-align:center;margin-top:20px">
    <a href="/home" style="color:#8e8e93;margin-right:20px">Home</a>
    <a href="/logout" style="color:#8e8e93">Sign out</a></p>
</div></body></html>`;

// Q86 hand-off: the NO-LOGIN phone page. With a valid code it shows a photo
// upload that posts straight to the code's one cab; without one it shows a
// code-entry box. Plain concatenation (no nested template literals) for safety.
function handoffPage(info) {
  const esc = (x) => String(x == null ? "" : x).replace(/</g, "&lt;");
  const head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board"><meta name="robots" content="noindex, nofollow"><title>Send photos - Shop Board</title>' + style + '</head><body><div class="wrap"><div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>';
  const foot = '</div></body></html>';
  if (!info) {
    return head +
      '<h2>Send photos to a cab</h2>' +
      '<p style="text-align:center;opacity:.7">Enter the code shown on the tablet.</p>' +
      '<div style="text-align:center;margin-top:12px"><input id="cin" autocapitalize="characters" placeholder="CODE" style="text-transform:uppercase;font-size:1.4rem;letter-spacing:3px;text-align:center;background:#111;color:#fff;border:1px solid var(--line);border-radius:10px;padding:10px;width:190px"><div style="margin-top:10px"><button class="name" id="cgo" style="padding:12px 30px">Open</button></div></div>' +
      '<p style="text-align:center;opacity:.5;font-size:.85rem;margin-top:12px">The code is good for 20 minutes. No sign-in needed.</p>' +
      '<script>document.getElementById("cgo").onclick=function(){var v=document.getElementById("cin").value.trim().toUpperCase();if(v)location.href="/h?c="+encodeURIComponent(v);};</script>' +
      foot;
  }
  return head +
    '<h2>Send photos' + (info.task ? ' for a step' : '') + '</h2>' +
    '<p style="text-align:center;opacity:.8">Order <b>' + esc(info.order) + '</b>' + (info.cab ? ' &middot; Cab #' + esc(info.cab) : '') + '</p>' +
    '<p style="text-align:center;opacity:.6;font-size:.9rem">Take or pick photos - they go straight to this cab on the tablet. No sign-in needed.</p>' +
    '<div style="text-align:center;margin-top:14px"><input type="file" id="hp" accept="image/*" multiple style="color:#8e8e93"></div>' +
    '<div class="msg" id="hm" style="text-align:center;margin-top:12px"></div>' +
    '<div id="hsent" style="display:none;text-align:center;margin:14px auto 0;max-width:420px;background:#1d5a2d;border:2px solid #30d158;border-radius:14px;padding:16px;font-size:1.35rem;font-weight:800">&#10003; <span id="hc">0</span> SENT &mdash; ON THE CAB</div>' +
    '<div id="hthumbs" style="text-align:center;margin-top:10px"></div>' +
    '<p style="text-align:center;margin-top:20px"><button class="name" id="hcl" style="display:inline-block;width:auto;padding:14px 30px;background:#3a3a3c">Done &mdash; close this tab</button></p>' +
    '<script>(function(){var code=' + JSON.stringify(info.code) + ';document.getElementById("hp").addEventListener("change",async function(e){var files=e.target.files;var m=document.getElementById("hm");for(var i=0;i<files.length;i++){m.textContent="Sending photo "+(i+1)+" of "+files.length+"...";try{var r=await fetch("/api/handoff/upload?code="+encodeURIComponent(code),{method:"POST",headers:{"Content-Type":files[i].type||"image/jpeg"},body:files[i]});var o=await r.json();if(!o.ok){m.textContent=o.error||"That did not send - try again.";return;}document.getElementById("hc").textContent=o.count;document.getElementById("hsent").style.display="block";var im=document.createElement("img");im.src=URL.createObjectURL(files[i]);im.style.cssText="height:76px;border-radius:10px;margin:4px;border:2px solid #30d158";document.getElementById("hthumbs").appendChild(im);}catch(err){m.textContent="Network hiccup - try that photo again.";return;}}m.textContent="Add more if you like, or finish on the tablet.";e.target.value="";});document.getElementById("hcl").onclick=function(){window.close();setTimeout(function(){document.getElementById("hm").textContent="Tab would not close itself? Swipe it away - the photos are already on the cab.";},300);};})();</script>' +
    foot;
}

// THE TV BOARD skeleton (file 19) — view-only, dark, no buttons (Q-design).
// Today it shows each enabled line + who's clocked on; cab tiles, colors,
// and pace arrive with the time engine (Stage 2). Refreshes itself every 30 s.
const boardPage = (tv98 = false, emp196 = null) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board</title>${style}
<style>
  .board{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px;padding:10px}
  .tile{background:#1c1c1e;border:1px solid #2c2c2e;border-radius:18px;padding:26px;min-height:170px;
        border-left-width:8px}
  .tile h3{margin:0 0 6px;font-size:1.5rem}
  .idle{opacity:.45}
  .techs{font-size:1.15rem;opacity:.85;margin-top:10px}
  .stamp{position:fixed;bottom:12px;right:18px;opacity:.35;font-size:.85rem}
  /* Green = on track · amber = running behind · red = needs help (the whole point) */
  .c-green{border-left-color:#30d158}.c-amber{border-left-color:#ffd60a}
  .c-red{border-left-color:#C8102E}.c-none{border-left-color:#3a3a3c}
  .status{font-weight:700;margin-top:6px}
  .s-green{color:#30d158}.s-amber{color:#ffd60a}.s-red{color:#ff453a}.s-none{color:#8e8e93}
  .day{float:right;font-size:1.1rem;opacity:.8;font-weight:700}
  #rail>div:first-child{grid-column:1/-1}
</style></head>
<body>
  <div class="logo" style="margin-top:18px">SHOP <span>BOARD</span></div>
  <!-- Block 118 (owner-rep loop report): the staff board had NO way home —
       its only "Back" replayed browser history, which ping-pongs with the
       cab card forever on a phone. Real links now; /tv stays link-free. -->
  ${tv98 ? "" : (emp196 ? `<div style="margin:8px 0 0">${nav196(emp196)}</div>` : `<p style="text-align:center;margin:8px 0 0"><a href="/home" style="color:#8e8e93;margin-right:16px">&#8962; Home</a><a href="/logout" style="color:#8e8e93">Sign out</a></p>`)}   <!-- Block 196: the ONE shared nav (TV stays link-free) -->
  <!-- Q113: the master chip — is the shop working right now? -->
  <div style="text-align:center;margin:8px 0 2px"><span id="shopchip"></span></div>
  <!-- Block 101 (owner-rep): two surfaces, two layouts. The TV keeps the
       left-hand UPCOMING rail; the staff board (phones / iPads) tiles the
       LINES first, full width, and the upcoming queue reads BELOW them. -->
  ${tv98 ? `<div style="display:grid;grid-template-columns:minmax(230px,290px) 1fr;gap:0;align-items:start">
    <!-- Block 155 (owner-rep D9): the rail is a CLIPPED viewport that slowly
         auto-scrolls and loops, so every line's upcoming cabs cycle into
         view no matter how long the queue gets. Height reserves the top
         header and the legend strip. -->
    <div id="railview" style="overflow:hidden;height:calc(100vh - 188px)">
      <div id="rail" style="padding:12px 4px 12px 16px"></div>
    </div>
    <div class="board" id="board"></div>
  </div>` : `<div class="board" id="board"></div>
  <div id="rail" style="padding:6px 26px 30px;display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:0 20px;align-items:start"></div>`}
  <!-- Block 25 (owner-rep): the legend — every color the board can show,
       spelled out — plus the sign-out that was missing. -->
  <!-- Block 101b (owner-rep): the pinned legend sat ON TOP of the queue on
       tablets/phones. TV keeps the fixed corners (nothing scrolls there); the
       staff board's legend + stamp join the page flow below the content. -->
  <!-- Block 155 (owner-rep D9): the TV legend gets its OWN full-width strip
       (background + top border) instead of floating over the rail — content
       can never sit under it, and the rail viewport stops above it. -->
  <div style="${tv98 ? "position:fixed;bottom:0;left:0;right:0;padding:14px 18px;background:#0b0b0d;border-top:1px solid #1f1f22;z-index:5;" : "padding:12px 18px 4px;text-align:center;"}font-size:.9rem;opacity:.75">
    <span style="color:#30d158">■</span> on pace &nbsp;
    <span style="color:#ffd60a">■</span> running behind &nbsp;
    <span style="color:#ff453a">■</span> needs help &nbsp;
    <span style="color:#8e8e93">■</span> idle line &nbsp;
    <span style="color:#ff9f0a">▧</span> rework${tv98 ? "" : `&nbsp;·&nbsp;
    <a href="/home" style="color:#8e8e93">&#8962; Home</a> &nbsp;·&nbsp;
    <a href="/logout" style="color:#8e8e93">Sign out</a>`}
  </div>
  ${tv98 ? `<style>body{padding-bottom:56px}</style><div class="stamp" id="stamp" style="z-index:6"></div>` : `<div id="stamp" style="text-align:center;padding:2px 18px 28px;opacity:.35;font-size:.85rem"></div>`}
  <!-- Q86: TV SLEEP overlay — a near-black dim screen shown outside working
       hours / on closed days (burn-in + power). Tap anywhere to peek for 20s. -->
  <div id="sleep" style="display:none;position:fixed;inset:0;background:#000;z-index:9999;text-align:center;cursor:pointer" onclick="peek()">
    <div id="sleepclock" style="font-size:9vw;font-weight:800;margin-top:31vh;color:#33333a;letter-spacing:.04em"></div>
    <div id="sleepmsg" style="font-size:2.4vw;margin-top:10px;color:#2b2b31"></div>
    <div style="position:fixed;bottom:26px;left:0;right:0;font-size:1.3vw;color:#232329">SHOP BOARD — asleep · tap to peek</div>
  </div>
<script>
  // Block 95: one page, two surfaces. TVMODE (the /tv URL) renders nothing
  // clickable and keeps the sleep overlay; the staff board (/board) links
  // every order number through to the cab card.
  const TVMODE = ${tv98 ? "true" : "false"};
  const ol = (o) => TVMODE ? o : '<a href="/order/' + encodeURIComponent(o) + '" style="color:inherit">' + o + "</a>";
  // Plain fetch-poll every 30 s — Realtime push replaces this in Stage 3.
  async function refresh(){
    try{
      const r = await fetch("/api/board-state"); const s = await r.json();
      const bar = { green:"#30d158", amber:"#ffd60a", red:"#C8102E", none:"#5a5a5e" };
      // Q113 master chip: SHOP OPEN (working hours) · AFTER HOURS (someone
      // is on an approved session) · SHOP CLOSED (outside hours, nobody on).
      const sc = document.getElementById("shopchip");
      if (s.shop && sc) {
        const m = { open: ["SHOP OPEN", "#30d158"], after_hours: ["AFTER HOURS", "#ffd60a"], closed: ["SHOP CLOSED", "#8e8e93"] }[s.shop.state] || ["", "#8e8e93"];
        sc.innerHTML = '<span style="border:1px solid ' + m[1] + ';color:' + m[1] + ';border-radius:999px;padding:4px 16px;font-weight:700;font-size:.95rem">' + m[0] + (s.shop.detail ? " — " + s.shop.detail : "") + "</span>";
      }
      // Block 105 (owner-rep): a FAINT per-line hue so the lines read apart on
      // the dark theme — each tile and its UPCOMING queue share the wash.
      // Pace green/amber/red stays the only loud signal; this is background-only.
      // Block 105b (owner-rep): FUTURE LINES inherit the treatment
      // automatically — eight distinct hues, assigned by board POSITION (so
      // id gaps from added/retired lines never scramble the colors), cycling
      // only if the shop ever runs more than eight lines at once.
      const LTBG = ["rgba(96,156,224,.09)", "rgba(58,178,166,.09)", "rgba(148,118,214,.11)", "rgba(214,150,64,.09)", "rgba(214,110,140,.09)", "rgba(110,200,220,.08)", "rgba(190,100,190,.09)", "rgba(160,150,130,.10)"];
      const LTHD = ["#7fb3e8", "#5cc8bd", "#b09ae0", "#dcae6b", "#dc94ac", "#8ed4e4", "#d093d0", "#b8ad96"];
      const hue105 = {}; s.lines.forEach((l2, i105) => { hue105[l2.id] = i105 % LTBG.length; });
      const lt = (id) => hue105[id] || 0;
      document.getElementById("board").innerHTML = s.lines.map(l => \`
        <div class="tile \${l.cab ? "c-"+l.cab.color : "idle c-none"}" style="background:linear-gradient(\${LTBG[lt(l.id)]},\${LTBG[lt(l.id)]}),#1c1c1e\${l.cab && l.cab.badge ? ";border-style:dashed;border-color:#ff9f0a;border-left-width:8px" : ""}">
          \${l.closed ? \`<span style="float:right;background:#3a3a3c;color:#ddd;font-weight:800;border-radius:6px;padding:2px 8px;margin-left:8px">CLOSED</span>\` : ""}
          \${l.down && !l.closed ? \`<span style="float:right;background:#37485a;color:#cfe3f2;font-weight:800;border-radius:6px;padding:2px 8px;margin-left:8px">DOWN TODAY</span>\` : ""}
          \${l.cab && l.cab.badge ? \`<span style="float:right;background:#ff9f0a;color:#111;font-weight:800;border-radius:6px;padding:2px 8px;margin-left:8px">\${l.cab.badge}</span>\` : ""}
          \${l.cab && l.cab.total_days ? \`<span class="day">DAY \${l.cab.day} of \${l.cab.total_days}</span>\` : ""}
          <h3>\${l.cab && l.cab.family ? l.name.split("—")[0].trim() + " — " + l.cab.family : l.name}</h3>
          \${l.cab ? \`<div style="font-size:1.3rem;font-weight:700">ORDER \${ol(l.cab.order)}</div>
            \${l.cab.customer || l.cab.dest ? \`<div style="opacity:.85;font-size:1.05rem;margin-top:2px">\${l.cab.customer}\${l.cab.customer && l.cab.dest ? " · " : ""}\${l.cab.dest}</div>\` : ""}
            <div class="status s-\${l.cab.color}">\${l.cab.status}</div>
            <div style="opacity:.8;margin-top:4px">\${l.cab.done_mh} / \${l.cab.total_mh} hrs · \${l.cab.pct}%</div>
            <div style="background:#2c2c2e;border-radius:6px;height:10px;margin-top:8px"><div style="background:\${bar[l.cab.color]};height:10px;border-radius:6px;width:\${l.cab.pct}%"></div></div>
            <div style="opacity:.7;margin-top:8px">\${l.cab.promised ? "Promised " + l.cab.promised + " · " : ""}\${l.cab.remaining_mh} hrs of work left</div>\`
          : \`<div>\${l.closed ? "Line closed" : l.down ? "Down for today" : "Idle line"}</div>\`}
          <div style="opacity:.6;margin-top:8px">\${l.ondeck
            ? \`ON DECK: ORDER \${ol(l.ondeck.order)} · \${l.ondeck.family}\${l.ondeck.customer ? " · " + l.ondeck.customer : ""}\${l.ondeck.dest ? " · " + l.ondeck.dest : ""}\`
            : "ON DECK: — nothing queued"}</div>
          <div class="techs" \${l.techs.length ? "" : 'style="opacity:.4"'}>\${l.techs.length ? "On the clock: " + l.techs.join(" · ") : "Nobody on the clock"}</div>
        </div>\`).join("");
      // Block 95: the left-hand UPCOMING rail — every queued cab, grouped by
      // line in White-Board order. TV shows the basics only; staff tap through.
      const rl = document.getElementById("rail");
      if (rl) {
        const grp = s.lines.filter(l => l.upcoming && l.upcoming.length);
        rl.innerHTML = '<div style="font-weight:800;font-size:1.2rem;letter-spacing:.04em;margin:2px 0 10px;opacity:.9">UPCOMING</div>' +
          (grp.length ? grp.map(l => '<div style="margin-bottom:14px"><div style="font-weight:700;font-size:.95rem;margin-bottom:4px;color:' + LTHD[lt(l.id)] + ';opacity:.85">' + l.name + '</div>' +
            l.upcoming.map(u => '<div style="background:linear-gradient(' + LTBG[lt(l.id)] + ',' + LTBG[lt(l.id)] + '),#1c1c1e;border:1px solid #2c2c2e;border-radius:10px;padding:8px 12px;margin-bottom:6px"><b>ORDER ' + ol(u.order) + '</b><div style="opacity:.8;font-size:.92rem">' + [u.customer, u.dest].filter(Boolean).join(" · ") + '</div></div>').join("") + '</div>').join("")
          : '<div style="opacity:.45">Nothing in the queue.</div>');
      }
      document.getElementById("stamp").textContent = "Updated " + new Date().toLocaleTimeString();
      lastState = s; applySleep(s);
    }catch(e){ /* board never crashes; next poll retries */ }
  }
  // Block 155 (owner-rep D9): the rail's slow loop — 1px per 60ms (~17px/s),
  // hold 5s at the bottom, snap to the top, hold 5s, repeat. Runs only when
  // the queue actually overflows the viewport; a re-render keeps the scroll
  // position because only the rail's children change, not the viewport.
  var railHold155 = 0, railAtEnd155 = false;
  if (TVMODE) setInterval(function(){
    var v = document.getElementById("railview"); if (!v) return;
    var max = v.scrollHeight - v.clientHeight;
    if (max <= 4) { v.scrollTop = 0; railAtEnd155 = false; return; }
    var now = Date.now(); if (now < railHold155) return;
    if (railAtEnd155) { v.scrollTop = 0; railAtEnd155 = false; railHold155 = now + 5000; return; }
    v.scrollTop += 1;
    if (v.scrollTop >= max - 1) { railAtEnd155 = true; railHold155 = now + 5000; }
  }, 60);
  // Q86: TV sleep overlay control. The server says whether the board should be
  // asleep (outside hours / closed day); a tap peeks for 20s. A dim, slowly
  // drifting clock keeps it low-power and burn-in-safe.
  var lastState = null, peekUntil = 0;
  function applySleep(s){
    var el = document.getElementById("sleep"); if(!el) return;
    var asleep = TVMODE && !!(s && s.tv && s.tv.asleep) && Date.now() > peekUntil;
    el.style.display = asleep ? "block" : "none";
    if(asleep){ var m = document.getElementById("sleepmsg"); if(m) m.textContent = (s.tv.message || ""); }
  }
  function peek(){ peekUntil = Date.now() + 20000; applySleep(lastState); setTimeout(function(){ applySleep(lastState); }, 20050); }
  setInterval(function(){
    var c = document.getElementById("sleepclock"); if(!c) return;
    var d = new Date(), hh = d.getHours() % 12; if(hh === 0) hh = 12;
    var mm = d.getMinutes();
    c.textContent = hh + ":" + (mm < 10 ? "0" : "") + mm;
    c.style.transform = "translateX(" + (Math.sin(Date.now() / 60000) * 3) + "vw)";
  }, 1000);
  refresh();
  // Q117: live updates over server-sent events — the server bumps this screen
  // the instant an event lands, so the board re-renders within ~3s instead of
  // on the old 30s timer. EventSource auto-reconnects (retry:3000); the slow
  // poll below stays as a fallback and also catches pure time-drift in colours.
  try { new EventSource("/api/board-stream").addEventListener("board", refresh); }
  catch (e) { /* no EventSource -> the fallback poll still covers it */ }
  setInterval(refresh, 30000);
  // TV hygiene (risk sweep 2026-07-28): browsers running one tab for weeks
  // leak — a full reload every 6 hours keeps the board fresh forever.
  setTimeout(() => location.reload(), 6 * 60 * 60 * 1000);
</script></body></html>`;

// ORDER DETAIL (block 25, owner-rep's board notes): tap any order number on
// the board and see what the order IS — cab #, family, customer, promised
// date, and the full step list with progress. PUBLIC by owner-rep call
// (2026-07-31): whoever can see the board can look an order up. (The Q65
// customer-names toggle governs the TV tiles, not this deliberate look-up.)
const escH = (s) => String(s == null ? "" : s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
// Block 86: parse a Coyote intake payload into the cab card's owner / order /
// configuration / add-on pieces. The cab line-item description is a clean
// newline-delimited "Label: Value" list; other non-cab, non-blazer-top line
// items are add-ons. Addresses are pre-formatted to strings here.
function parseCoyoteDetail(payload, partNumber, allowSet) {
  if (!payload || typeof payload !== "object") return null;
  const c = (payload.customer && typeof payload.customer === "object") ? payload.customer : {};
  const o = (payload.order && typeof payload.order === "object") ? payload.order : {};
  const items = Array.isArray(payload.line_items) ? payload.line_items : [];
  const pn = String(partNumber || "").toUpperCase();
  const fmtAddr = (a) => { if (!a || typeof a !== "object") return ""; return [a.street, a.street2, [a.city, a.state, a.zip].filter(Boolean).join(", "), (a.country && a.country !== "USA") ? a.country : ""].filter(Boolean).join(", "); };
  let cabDesc = "", cabTaken = false; const addons = [];
  for (const it of items) {
    const num = String((it && it.item_number) || "").trim(); if (!num) continue;
    const up = num.toUpperCase(); if (up === "PSR-BLZR-TOP") continue;
    const desc = String((it && it.description) || "").trim();
    if (pn && up === pn && !cabTaken) { cabDesc = desc; cabTaken = true; continue; }
    if (allowSet && allowSet.has(up)) { if (!cabTaken && !pn) { cabDesc = desc; cabTaken = true; } continue; }
    if (desc) addons.push({ num, desc });
  }
  const lines = cabDesc.split(/[\r\n\u2028\u2029]+/).map((s) => s.trim()).filter(Boolean);
  let model = ""; const features = [];
  if (lines.length) {
    model = lines[0];
    for (let i = 1; i < lines.length; i++) {
      const idx = lines[i].indexOf(":");
      if (idx > 0) { const label = lines[i].slice(0, idx).trim(); const value = lines[i].slice(idx + 1).trim(); features.push({ label, value, stock: /^(stock|none|n\/a)\b/i.test(value) || value === "" }); }
      else features.push({ label: "", value: lines[i], stock: false });
    }
  }
  // Block 197 (owner spot, day 3): SOME orders arrive with the WHOLE config on
  // ONE line, options comma-separated ("...- Complete, Firewall Option: ...,
  // Dash: Stock") — W115117 was the first seen (every other order uses one
  // option per line). If the newline split produced no features but the single
  // line carries "Label: value" segments, split it here. Chunks without a
  // colon glue onto the previous value, so values that themselves contain
  // commas ("Recessed Firewall, 4 inch Set Back") survive intact.
  if (!features.length && model.includes(":") && model.includes(",")) {
    const head197 = []; let cur197 = null;
    for (const raw197 of model.split(",")) {
      const seg197 = raw197.trim(); if (!seg197) continue;
      const ci197 = seg197.indexOf(":");
      if (ci197 > 0 && ci197 <= 40 && /^[A-Za-z0-9 .\/'&-]+$/.test(seg197.slice(0, ci197))) {
        if (cur197) features.push(cur197);
        cur197 = { label: seg197.slice(0, ci197).trim(), value: seg197.slice(ci197 + 1).trim(), stock: false };
      } else if (cur197) cur197.value += ", " + seg197;
      else head197.push(seg197);
    }
    if (cur197) features.push(cur197);
    if (features.length) {
      model = head197.join(", ");
      for (const f197 of features) f197.stock = /^(stock|none|n\/a|no)\b/i.test(f197.value) || f197.value === "";   // "No Latch Upgrade" reads calm, not as an upgrade
    }
  }
  const ship = (c.ship_to && typeof c.ship_to === "object") ? c.ship_to : null;
  return {
    customer: { name: [c.first_name, c.last_name].filter(Boolean).join(" ").trim(), company: String(c.company || "").trim(), email: String(c.email || "").trim(), phone: String(c.phone_primary || c.phone || "").trim(), billStr: fmtAddr(c.bill_to), shipStr: fmtAddr(ship), shipState: ship ? String(ship.state || "").trim() : "" },
    order: { status: String(o.status || payload.status || "").trim(), date: String(o.date || "").slice(0, 10), ship: String(o.ship_date || "").slice(0, 10), note: String(o.invoice_note || "").trim() },
    model, features, addons,
  };
}
// Block 211 (owner, Sat 8/22): the PROGRESS REPORTS HUB — the front office's
// front door: every cab on the lines (and recently moved on to Body) with
// its photo/note counts, whether TODAY's update is in, and how many items
// are hidden — one tap into the review-and-print page per cab. Lives in the
// admin Tools menu; grows through Body/prime/crating as those stages start
// feeding the same photo+note stream.
const progressHubPage211 = (emp, onLines, movedOn) => {
  const row211 = (r, showToday) => `<div class="qrow" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 0;border-bottom:1px solid var(--line)">
    <span style="min-width:12em"><b>ORDER ${escH(r.order)}</b>${r.cab ? ` · Cab #${escH(r.cab)}` : ""}<br><small style="opacity:.6">${escH(r.line || "")}${r.family ? " · " + escH(r.family) : ""}</small></span>
    <span style="opacity:.85">&#128247; ${r.photos} photo${r.photos === 1 ? "" : "s"} · &#128221; ${r.notes} note${r.notes === 1 ? "" : "s"}${r.hiddenN ? ` · <b style="color:#ff9f0a">${r.hiddenN} hidden</b>` : ""}</span>
    ${showToday ? (r.todayOk ? `<span style="color:#30d158;font-weight:700">&#10003; today's update in</span>` : `<span style="color:#ff9f0a;font-weight:700">no update yet today</span>`) : ""}
    <a href="/report/progress/${encodeURIComponent(r.order)}" style="margin-left:auto;background:#1c1c1e;border:1px solid #4a90d9;border-radius:10px;color:#8ec2f0;padding:9px 16px;text-decoration:none;font-weight:700">Review &amp; print report</a>
  </div>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Progress reports</title>${style}
<style>.lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}</style></head>
<body><div class="wrap" style="max-width:760px">
  <div class="logo">SHOP <span>BOARD</span></div>
  <p style="text-align:center;margin:2px 0 10px"><a href="/home" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${nav196(emp, true)}
  <h2 style="text-align:center;margin:0 0 4px">&#128247; Progress reports</h2>
  <p style="text-align:center;opacity:.65;margin:0 0 14px;font-size:.95rem">The customer-facing build log per cab — review the photos &amp; notes, fix or hide anything, then print the report from the cab's page.</p>
  <div class="lane"><h3>On the lines now</h3>
    ${onLines.length ? onLines.map((r) => row211(r, true)).join("") : `<div style="opacity:.6">No cabs on the lines right now.</div>`}
  </div>
  <div class="lane"><h3>Moved on — at Body &amp; beyond</h3>
    <div style="opacity:.55;font-size:.85rem;margin-bottom:6px">Recently signed off — their build logs keep growing as Body, prime and crating start adding photos.</div>
    ${movedOn.length ? movedOn.map((r) => row211(r, false)).join("") : `<div style="opacity:.6">Nothing recently moved on.</div>`}
  </div>
</div></body></html>`;
};

// Block 210 (owner, Sat 8/22): THE CUSTOMER PROGRESS REPORT — "an ongoing
// log of the customers cab build with notes and photos... a simple pdf that
// is premier street rod watermarked... that we can send customer as they ask."
// A LIGHT, print-first page (everything else in the app is dark; this is a
// customer-facing DOCUMENT): letterhead, diagonal watermark on every printed
// page, day-by-day log of work completed + crew notes + photos. The Print /
// Save-as-PDF button uses the browser's print dialog — that IS the PDF the
// front office sends. Feed: task completions (work done), build_photo kinds
// progress+finish, build_note rows (editable; event_log keeps the original
// as audit — Block 211), and the stage milestones —
// Body/prime/crating/shipping will append to this same feed as those stages
// come online (photos+notes are per-BUILD, not per-stage, by design).
const progressReportPage210 = (b, family, days) => {
  const MON = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const fmt = (ds) => { const d = new Date(ds + "T12:00:00Z"); return `${DOW[d.getUTCDay()]}, ${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
  const gen = new Date(Date.now() - 7 * 3600000);
  const genLbl = `${MON[gen.getUTCMonth()]} ${gen.getUTCDate()}, ${gen.getUTCFullYear()}`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Build Progress — Order ${escH(b.order_number)}</title>
<style>
  *{box-sizing:border-box} body{margin:0;font-family:Georgia,'Times New Roman',serif;background:#f4f4f4;color:#1a1a1a}
  .sheet{max-width:8.5in;margin:0 auto;background:#fff;padding:.8in .75in;min-height:11in;position:relative}
  .wm{position:fixed;top:45%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-family:system-ui,sans-serif;font-weight:900;font-size:64px;letter-spacing:.14em;color:rgba(200,16,46,.07);white-space:nowrap;pointer-events:none;z-index:0}
  .inner{position:relative;z-index:1}
  .lh{border-bottom:4px solid #C8102E;padding-bottom:14px;margin-bottom:6px}
  .lh .co{font-family:system-ui,sans-serif;font-weight:900;font-size:26px;letter-spacing:.06em;color:#111}
  .lh .co span{color:#C8102E}
  .lh .tag{font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.28em;color:#777;text-transform:uppercase;margin-top:2px}
  h1{font-family:system-ui,sans-serif;font-size:21px;margin:18px 0 2px}
  .meta{font-family:system-ui,sans-serif;color:#555;font-size:13px;margin-bottom:6px}
  .intro{font-size:14px;color:#333;line-height:1.55;margin:10px 0 18px;border-left:3px solid #C8102E;padding-left:12px}
  .day{margin:0 0 20px;break-inside:avoid-page}
  .day h2{font-family:system-ui,sans-serif;font-size:15px;border-bottom:1px solid #ddd;padding-bottom:4px;margin:0 0 8px;color:#222}
  .mile{font-family:system-ui,sans-serif;font-weight:800;color:#C8102E;font-size:14px;margin:4px 0}
  .steps{font-size:13.5px;line-height:1.6;color:#333;margin:4px 0}
  .steps b{font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.08em;color:#888;text-transform:uppercase}
  .note{font-size:13.5px;font-style:italic;color:#444;background:#faf7f2;border-left:3px solid #d9c9a3;padding:8px 12px;margin:8px 0;border-radius:0 6px 6px 0}
  .shots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}
  .shots img{width:100%;height:2.1in;object-fit:cover;border-radius:6px;border:1px solid #ddd}
  .ft{font-family:system-ui,sans-serif;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:10px;margin-top:26px;display:flex;justify-content:space-between}
  .printfab{position:fixed;top:14px;right:14px;z-index:5}
  .printfab button{background:#C8102E;color:#fff;border:none;border-radius:12px;padding:14px 24px;font-family:system-ui,sans-serif;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}
  .printfab a{display:block;text-align:center;margin-top:6px;font-family:system-ui,sans-serif;font-size:12px;color:#666}
  .modrow{font-family:system-ui,sans-serif;font-size:11px;margin:2px 0 6px}
  .modbtn{background:#eee;border:1px solid #ccc;border-radius:8px;padding:4px 10px;font-family:system-ui,sans-serif;font-size:11px;cursor:pointer;margin-right:6px}
  .modbtn.warn{background:#fbe9e9;border-color:#d9a0a0;color:#8f1622}
  .hiddenitem{opacity:.4;outline:2px dashed #cf7d7d;outline-offset:3px;border-radius:6px;position:relative}
  .hidtag{font-family:system-ui,sans-serif;font-size:10.5px;font-weight:800;color:#a33;letter-spacing:.05em}
  .addbar{font-family:system-ui,sans-serif;background:#f2f6fb;border:1px solid #c9d8ec;border-radius:10px;padding:10px 12px;margin:0 0 16px}
  .addbar input[type=date]{padding:6px;border:1px solid #bbb;border-radius:8px}
  .addbar input[type=text]{padding:6px 8px;border:1px solid #bbb;border-radius:8px;width:55%}
  .addbar button{background:#C8102E;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer}
  @media print{ body{background:#fff} .sheet{max-width:none;padding:.55in .6in;min-height:0} .noprint{display:none!important} .shots img{height:2in} .hiddenitem{display:none!important} .modrow{display:none} .addbar{display:none} .hidtag{display:none} }
</style></head>
<body>
<div class="printfab noprint"><button onclick="window.print()">&#128424; Print / Save as PDF</button><a href="/order/${encodeURIComponent(b.order_number)}">&#8592; back to the order</a></div>
<div class="wm">PREMIER STREET ROD</div>
<div class="sheet"><div class="inner">
  <div class="lh"><div class="co">PREMIER <span>STREET ROD</span></div><div class="tag">Handcrafted Steel Bodies &middot; Peoria, Arizona</div></div>
  <h1>Cab Build Progress Report</h1>
  <div class="meta"><b>Order ${escH(b.order_number)}</b>${family ? ` &middot; ${escH(family)}` : ""}${b.cab_number ? ` &middot; Cab #${escH(b.cab_number)}` : ""}${b.started_at ? ` &middot; Production started ${escH(String(b.started_at).slice(0, 10))}` : ""} &middot; Report date ${genLbl}</div>
  <div class="intro">A day-by-day look at your cab as it moves through our shop — the work completed, our builders' notes, and photos straight from the production floor. Every panel is fit, hung and finished by hand right here in our facility.</div>
  <div class="addbar noprint"><b>Front office:</b> add a note onto any day &nbsp;
    <input type="date" id="addD211"> <input type="text" id="addN211" maxlength="500" placeholder="e.g. Paint samples approved by the owner today">
    <button onclick="modAdd211()">Add note</button>
    <span style="font-size:11px;color:#777;margin-left:8px">Edits, hides and adds never show on the printed report controls — what you see below is exactly what prints.</span>
  </div>
  ${days.length ? days.map((d) => `
  <div class="day">
    <h2>${fmt(d.ds)}</h2>
    ${d.milestones.map((m) => `<div class="mile">&#9733; ${escH(m)}</div>`).join("")}
    ${d.steps.length ? `<div class="steps"><b>Work completed</b><br>${d.steps.map((x) => escH(x)).join(" &middot; ")}</div>` : ""}
    ${d.notes.map((n) => `<div class="${n.hidden ? "hiddenitem" : ""}"><div class="note">&ldquo;${escH(n.note)}&rdquo; &mdash; the build crew${n.step ? ` &middot; ${escH(n.step)}` : ""}</div>
      <div class="modrow noprint">${n.hidden ? `<span class="hidtag">HIDDEN — will not print</span> <button class="modbtn" onclick="modNote211('unhide','${n.id}','${n.src || "build"}')">Restore</button>` : `<button class="modbtn" onclick="modEdit211('${n.id}', this, '${n.src || "build"}')">&#9998; Edit</button><button class="modbtn warn" onclick="modNote211('hide','${n.id}','${n.src || "build"}')">Hide from report</button>`}</div>
      ${n.hidden ? "" : `<div class="noprint" hidden data-orig="${escH(n.note)}"></div>`}</div>`).join("")}
    ${d.photos.length ? `<div class="shots">${d.photos.map((p) => `<div class="${p.hidden ? "hiddenitem" : ""}"><img src="/photo/${p.id}" alt="build photo">
      <div class="modrow noprint">${p.hidden ? `<span class="hidtag">HIDDEN</span> <button class="modbtn" onclick="modPhoto211('${p.id}', false)">Restore</button>` : `<button class="modbtn warn" onclick="modPhoto211('${p.id}', true)">Hide from report</button>`}</div></div>`).join("")}</div>` : ""}
  </div>`).join("") : `<div class="steps">Production is just getting underway — check back soon for the first day's progress.</div>`}
  <div class="ft"><span>Premier Street Rod &middot; PremierStreetRod.com</span><span>Order ${escH(b.order_number)} &middot; generated ${genLbl}</span></div>
</div></div>
<script>
  // Block 211: front-office moderation — every change round-trips the
  // audited admin endpoints and reloads, so the page always shows exactly
  // what will print.
  async function modCall211(path, payload) {
    try {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const out = await r.json();
      if (out.ok) return location.reload();
      alert(out.error || "Something went wrong");
    } catch (e) { alert("Network hiccup — try again"); }
  }
  function modNote211(action, id, src) { modCall211("/api/build/note-admin", { action: action, note_id: id, src: src || "build" }); }
  function modEdit211(id, btn, src) {
    const orig = btn.parentElement.nextElementSibling ? btn.parentElement.nextElementSibling.dataset.orig : "";
    const txt = prompt("Edit this note (the customer may read it):", orig || "");
    if (txt === null) return;
    if (!txt.trim()) return alert("To remove it entirely, use Hide instead.");
    modCall211("/api/build/note-admin", { action: "edit", note_id: id, note: txt.trim(), src: src || "build" });
  }
  function modAdd211() {
    const d = document.getElementById("addD211").value;
    const t = (document.getElementById("addN211").value || "").trim();
    if (!t) return alert("Write the note first");
    modCall211("/api/build/note-admin", { action: "add", build_id: "${b.id}", note: t, note_date: d || undefined });
  }
  function modPhoto211(id, hide) { modCall211("/api/photo/moderate", { photo_id: id, hidden: hide }); }
</script>
</body></html>`;
};

const orderPage = (b, family, lineName, tasks, detail = null, canFull = false, flags = [], canHours = false, isAdmin97 = false, fixHrs = 0, emp196 = null) => {
  // Block 138 (owner-rep, B1): floor roles get the money-scrubbed note; the
  // canFull tier (managers/admins/Warehouse/Accounting/office) sees verbatim.
  const note138 = (x) => canFull ? String(x == null ? "" : x) : scrubMoney138(x);
  const real = tasks.filter((t) => !t.is_background);
  // Block 124 (logic audit L4): "standard hours" counts only the real
  // (non-background) steps — the finish gate ignores background steps, so a
  // finishable cab reads a clean X of X, not X of a larger total.
  const doneMh = tasks.filter((t) => !t.is_background && t.state === "complete").reduce((s, t) => s + Number(t.man_hours), 0);
  const totalMh = tasks.filter((t) => !t.is_background).reduce((s, t) => s + Number(t.man_hours), 0);
  const pct = totalMh ? Math.round((doneMh / totalMh) * 100) : 0;
  const byDay = {};
  for (const t of tasks) (byDay[t.day_no] = byDay[t.day_no] || []).push(t);
  const mark = (st) => st === "complete" ? "✓" : st === "in_progress" ? "⏳" : "·";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Order ${escH(b.order_number)}</title>${style}
<style>.lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}
.kv{opacity:.85;padding:4px 0;display:grid;grid-template-columns:9em 1fr;column-gap:12px;align-items:start}.kv b{opacity:.6;font-weight:600;overflow-wrap:anywhere}.kv span{overflow-wrap:anywhere;white-space:normal}
/* Block 195 (owner, iPhone review): on a phone the two columns are too small
   to read — stack label ABOVE value, one column, a touch bigger. */
@media (max-width:600px){.kv{grid-template-columns:1fr;row-gap:2px;padding:9px 0;font-size:1.06rem;border-bottom:1px solid #222}.kv b{opacity:.5;font-size:.85em;text-transform:uppercase;letter-spacing:.04em}}</style></head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div>
  <p style="text-align:center;margin:2px 0 12px"><a href="/shopboard" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back to the board</a></p>
  ${nav196(emp196)}   <!-- Block 196 (owner: "the customer order pages do not" have nav — the endless-loop page): the ONE shared nav -->
  <h2>ORDER ${escH(b.order_number)}${b.cab_number ? ` · Cab #${escH(b.cab_number)}` : ""}</h2>
  ${isAdmin97 ? `<p style="text-align:center;margin:0 0 12px"><a href="/report/progress/${encodeURIComponent(b.order_number)}" style="display:inline-block;background:#1c1c1e;border:1px solid #4a90d9;border-radius:10px;color:#8ec2f0;padding:10px 18px;text-decoration:none;font-weight:700">&#128247; Customer progress report</a></p>` : ""}   <!-- Block 210: the build-report the front office sends the owner -->
  <div class="lane">
    <div class="kv"><b>Cab</b>${escH(family || b.part_number || "—")}</div>
    <div class="kv"><b>Line</b>${escH(lineName || "not assigned yet")}</div>
    <div class="kv"><b>Status</b>${escH(String(b.state || "").replace(/_/g, " ").toUpperCase())}${b.state === "rework" ? ` — ${escH(b.rework_reason || "")}` : ""}</div>
    ${fixHrs > 0 ? `<div class="kv"><b>Fix labor</b>${fixHrs.toFixed(1)} hr on returns/kickbacks — this order's rework, on top of the build hours</div>` : ""}
    ${b.coyote_status && b.coyote_status !== "Queued" && b.coyote_status !== "Processed" ? `<div class="kv"><b>&#9873; Coyote</b><span style="color:#ff8fa3">Order is ${escH(b.coyote_status)} in Coyote${b.started_at ? " — noted; this cab stays in production" : " — set aside until it returns to Queued"}</span></div>` : ""}
    ${b.state === "upcoming" ? `<div class="kv"><b>Kit</b>${b.kit_status === "verified" ? "✓ verified — all parts accounted for" : b.kit_status === "short" ? `SHORT — missing parts${b.kit_note ? ` (${escH(b.kit_note)})` : ""}` : "not verified yet"}</div>` : ""}
    ${b.promised_finish ? `<div class="kv"><b>Promised</b>${escH(b.promised_finish)}</div>` : ""}
    ${b.promised_finish && detail && detail.order && detail.order.ship && String(b.promised_finish) > detail.order.ship ? `<div class="kv"><b>&#9888; Ship risk</b><span style="color:#ff453a">Sold to ship ${escH(detail.order.ship)} &mdash; standard hours land ${escH(b.promised_finish)}</span></div>` : ""}
    ${b.started_at ? `<div class="kv"><b>Started</b>${escH(String(b.started_at).slice(0, 10))}</div>` : ""}
    ${b.customer_name && b.customer_display !== false ? `<div class="kv"><b>Customer</b>${escH(b.customer_name)}</div>` : ""}
    ${b.destination ? `<div class="kv"><b>Destination</b>${escH(b.destination)}</div>` : ""}
    ${(() => { const n138 = note138(b.invoice_note); return n138 && !(detail && detail.order.note) ? `<div class="kv"><b>Invoice note</b>${escH(n138)}</div>` : ""; })()}
  </div>
  ${detail ? `<div class="lane">
    <div style="font-weight:800;letter-spacing:.03em;margin-bottom:6px">OWNER</div>
    <div class="kv"><b>Name</b>${escH(detail.customer.name || b.customer_name || "—")}</div>
    ${detail.customer.company ? `<div class="kv"><b>Company</b>${escH(detail.customer.company)}</div>` : ""}
    ${canFull
      ? `${detail.customer.email ? `<div class="kv"><b>Email</b>${escH(detail.customer.email)}</div>` : ""}${detail.customer.phone ? `<div class="kv"><b>Phone</b>${escH(detail.customer.phone)}</div>` : ""}${detail.customer.billStr ? `<div class="kv"><b>Billing</b>${escH(detail.customer.billStr)}</div>` : ""}${detail.customer.shipStr ? `<div class="kv"><b>Shipping</b>${escH(detail.customer.shipStr)}</div>` : ""}`
      : `${detail.customer.shipState ? `<div class="kv"><b>Ship to</b>${escH(detail.customer.shipState)}</div>` : ""}`}
    ${(detail.order.status || detail.order.date || detail.order.ship) ? `<div class="kv"><b>Order</b>${escH(detail.order.status || "—")}${detail.order.date ? ` &middot; ordered ${escH(detail.order.date)}` : ""}${detail.order.ship ? ` &middot; ship ${escH(detail.order.ship)}` : ""}</div>` : ""}
    ${canFull ? `<div style="margin-top:6px"><a href="/order?n=${encodeURIComponent(b.coyote_root || String(b.order_number || "").split(".")[0])}" style="color:#8e8e93;font-size:.85rem">View Coyote push history &rarr;</a></div>` : ""}
  </div>
  <div class="lane" style="border-color:#C8102E">
    <!-- Block 197 (owner, floor-eyes pass): the model gets its OWN line under
         the header instead of one long bold blob; upgrade values read bold
         and bright with a real chip; stock rows stay calm but LEGIBLE. -->
    <div style="font-weight:800;letter-spacing:.03em">CAB CONFIGURATION</div>
    ${detail.model ? `<div style="opacity:.85;font-size:1.02rem;margin:2px 0 8px">${escH(detail.model)}</div>` : `<div style="margin-bottom:8px"></div>`}
    ${detail.features.length
      ? detail.features.map((f) => `<div class="kv"><b>${escH(f.label || "—")}</b><span style="${f.stock ? "opacity:.7" : "color:#fff;font-weight:650"}">${escH(f.value)}${f.stock ? "" : ` <span style="background:#0e3a5f;color:#8ec9ff;font-size:.72em;font-weight:800;letter-spacing:.05em;padding:2px 8px;border-radius:7px;vertical-align:1px">UPGRADE</span>`}</span></div>`).join("")
      : `<div class="muted" style="font-size:1.02rem">No configuration detail on file for this cab yet.</div>`}
  </div>
  ${detail.addons.length ? `<div class="lane"><div style="font-weight:800;letter-spacing:.03em;margin-bottom:6px">ADD-ONS &amp; EXTRAS</div>${detail.addons.map((a) => `<div style="padding:3px 0;font-size:1.03rem">&#9656; ${escH(a.desc)}</div>`).join("")}</div>` : ""}` : ""}
  ${flags.length ? `<div class="lane" style="border-color:#ffd60a">
    <div style="font-weight:800;letter-spacing:.03em;margin-bottom:6px">&#9873; NEEDS A RULING \u2014 UPGRADE HOURS &amp; NOTE ITEMS</div>
    ${canHours
      ? flags.map((f) => `<div style="padding:7px 0;border-top:1px solid var(--line)">${escH(f.flag_text)} <span style="opacity:.5;font-size:.8em">(${f.kind === "custom" ? "custom add-on" : f.kind === "note" ? "from the order note" : f.kind === "count" ? "cab count — verify" : f.kind === "stuck" ? "Coyote dropped the part — verify" : "option not in library"})</span><br>
        Hrs <input id="fh-${f.id}" style="width:64px"> Day <input id="fd-${f.id}" style="width:50px" value="1"> Reason <input id="fr-${f.id}" style="min-width:210px" value="${escH(f.flag_text).slice(0, 60)}">
        <button class="b" style="background:#2c2c2e;border:1px solid var(--line);border-radius:9px;color:#fff;padding:6px 12px;cursor:pointer" onclick="addHrs('${b.id}','${f.id}',this)">Set hours</button>
        <button class="b" style="background:#1c1c1e;border:1px solid #5a5a5e;border-radius:9px;color:#8e8e93;padding:6px 12px;cursor:pointer" onclick="notProd104('${b.id}','${f.id}',this,'body_build')">Body/Build \u2014 push along</button>
        <button class="b" style="background:#1c1c1e;border:1px solid #5a5a5e;border-radius:9px;color:#8e8e93;padding:6px 12px;cursor:pointer" onclick="notProd104('${b.id}','${f.id}',this,'none')">No action</button></div>`).join("")
      : `<div style="opacity:.75">${flags.length} item${flags.length === 1 ? "" : "s"} awaiting hours from the front office — the clock does not include them yet.</div>`}
  </div>` : ""}
  ${canHours ? `<div class="lane">
    <div style="font-weight:800;letter-spacing:.03em;margin-bottom:6px">ADD HOURS <span style="opacity:.5;font-weight:400;font-size:.8em">manager/admin · reason required · audited</span></div>
    Hrs <input id="ah-h" style="width:64px"> Day <input id="ah-d" style="width:50px" value="1"> Reason <input id="ah-r" style="min-width:240px" placeholder="customer request / custom note…">
    <button class="b" style="background:#2c2c2e;border:1px solid var(--line);border-radius:9px;color:#fff;padding:6px 12px;cursor:pointer" onclick="addHrs('${b.id}','',this)">Add to this cab's clock</button>
  </div>` : ""}
  ${isAdmin97 && b.state === "active" && b.started_at && new Date(new Date(b.started_at).getTime() - 7 * 3600000).toISOString().slice(0, 10) === new Date(Date.now() - 7 * 3600000).toISOString().slice(0, 10) ? `<div class="lane" style="border-color:#7a1d1d">
    <div style="font-weight:800;letter-spacing:.03em;margin-bottom:6px">START WAS A MISTAKE? <span style="opacity:.5;font-weight:400;font-size:.8em">admin only · same day only · audited</span></div>
    <div style="opacity:.7;font-size:.9rem;margin-bottom:8px">Un-starts this cab: it returns to the FRONT of its line's queue (kit stays verified), the frozen checklist is cleared, and the clock resets. Warehouse re-delivers when ready.</div>
    <button class="b" style="background:#5a1d1d;border:none;border-radius:9px;color:#fff;padding:8px 16px;cursor:pointer" onclick="unstart97('${b.id}',this)">Undo start — back to the queue</button>
    <span id="us-msg" style="font-size:.85rem;margin-left:8px"></span>
  </div>` : ""}
  <!-- Block 98d (owner-rep): the Upgrades lane earns its keep — frozen option
       steps when the build has them, the Coyote order note showcased either
       way, and the whole lane disappears when it truly has nothing to say. -->
  ${(() => {
    const opts = tasks.filter((t) => t.source === "option");
    const cnote = note138(detail && detail.order.note ? detail.order.note : "");   // Block 138: scrubbed for the floor
    if (!opts.length && !cnote) return "";
    const above = opts.length
      ? opts.map((o) => `<div style="padding:3px 0;font-size:1.05rem">▸ ${escH(o.name)} <span style="opacity:.5">(+${Number(o.man_hours)}h)</span></div>`).join("")
      : tasks.length ? `<div style="opacity:.8;font-size:1.05rem">STOCK BUILD — no upgrade option steps on this cab.</div>` : "";
    const noteRow = cnote ? `<div style="${above ? "margin-top:10px;padding-top:10px;border-top:1px solid var(--line);" : ""}font-size:1.02rem"><span style="color:#ffd60a;font-weight:800;letter-spacing:.04em;font-size:.8em">&#9873; COYOTE NOTE</span><br>${escH(cnote)}</div>` : "";
    return `<div class="lane" style="border-color:#C8102E">
    <div style="font-weight:800;letter-spacing:.03em;margin-bottom:6px">UPGRADES &amp; OPTIONS — what this cab gets</div>
    ${above}${noteRow}
  </div>`; })()}
  ${tasks.length ? `<div class="lane">
    <div style="font-weight:700;margin-bottom:6px">${real.filter((t) => t.state === "complete").length} of ${real.length} steps complete · ${doneMh.toFixed(1)} / ${totalMh.toFixed(1)} hrs · ${pct}%</div>
    <div style="background:#2c2c2e;border-radius:6px;height:10px;margin-bottom:12px"><div style="background:#30d158;height:10px;border-radius:6px;width:${pct}%"></div></div>
    ${Object.keys(byDay).sort((a, b2) => Number(a) - Number(b2)).map((d) => `
      <div style="opacity:.55;font-weight:700;margin-top:10px">${Number(d) === 0 ? "REWORK / FIX" : `DAY ${escH(d)}`}</div>
      ${byDay[d].map((t) => `<div style="padding:2px 0;opacity:${t.state === "complete" ? ".55" : ".9"}">${mark(t.state)} ${escH(t.display_no)}. ${escH(t.name)} <span style="opacity:.5">(${Number(t.man_hours)}h)${t.day_end && t.day_end > t.day_no ? ` &middot; runs Days ${escH(t.day_no)}&ndash;${escH(t.day_end)}` : ""}</span></div>`).join("")}`).join("")}
  </div>` : `<div class="lane" style="opacity:.7">No task list yet — the step list freezes onto the cab when warehouse delivers the kit and the build starts.</div>`}
  <p style="text-align:center"><a href="/shopboard" style="color:#8e8e93">← Back to the board</a></p>
  <script>
  async function unstart97(bid, btn){
    if (!btn.dataset.armed) { btn.dataset.armed = "1"; const o97 = btn.textContent; btn.textContent = "Sure? Tap again"; setTimeout(() => { btn.dataset.armed = ""; btn.textContent = o97; }, 4000); return; }
    btn.disabled = true;
    try {
      const r = await fetch("/api/build/unstart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ build_id: bid, claimed_at: new Date().toISOString() }) });
      const o = await r.json(); if (o.ok) return location.reload();
      document.getElementById("us-msg").textContent = o.error || "Something went wrong";
    } catch (e) { document.getElementById("us-msg").textContent = "Network hiccup — try again"; }
    btn.disabled = false;
  }
  // Block 104c: one tap routes a custom OUT of production scope — the work is
  // Build/Body's or ships with the order. Resolves the flag, adds NO cab
  // hours, and the routing is stored for the future Build-department board.
  function notProd104(bid, fid, btn, scope138){
    if (!btn.dataset.armed) { btn.dataset.armed = "1"; const o104 = btn.textContent; btn.textContent = "Sure? Tap again"; setTimeout(() => { btn.dataset.armed = ""; btn.textContent = o104; }, 4000); return; }
    btn.disabled = true;
    fetch("/api/build/addhours", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ build_id: bid, flag_id: fid, hours: 0, day_no: 1, scope: scope138 || "other",
        reason: scope138 === "body_build" ? "Pushed along — Build/Body work, not the production floor" : "No action — nothing for the floor" }) })
      .then(function(r){ return r.json(); })
      .then(function(j){ if (j && j.ok) { location.reload(); } else { btn.disabled = false; btn.textContent = (j && j.error) || "failed"; } })
      .catch(function(){ btn.disabled = false; btn.textContent = "network hiccup"; });
  }
  function addHrs(bid, fid, btn){ btn.disabled = true;
    var g = function(x){ var e = document.getElementById(x); return e ? e.value : ""; };
    fetch("/api/build/addhours", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ build_id: bid, flag_id: fid || undefined,
        hours: Number(g(fid ? "fh-" + fid : "ah-h")), day_no: Number(g(fid ? "fd-" + fid : "ah-d")), reason: g(fid ? "fr-" + fid : "ah-r") }) })
      .then(function(r){ return r.json(); })
      .then(function(j){ if (j && j.ok) { location.reload(); } else { btn.disabled = false; btn.textContent = (j && j.error) || "failed"; } })
      .catch(function(){ btn.disabled = false; btn.textContent = "network hiccup"; });
  }
  </script>
</div></body></html>`;
};

const shellPage = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><!-- Q48: never crawlable -->
<title>Shop Board — Premier Street Rod</title>${style}</head>
<body><div class="wrap" style="display:grid;place-items:center;height:90vh;text-align:center">
  <div>
    <div class="logo" style="font-size:clamp(2rem,8vw,4rem)">SHOP <span>BOARD</span></div>
    <p style="opacity:.6">Premier Street Rod — Stage 1</p>
    <p><a href="/login" class="name" style="display:inline-block;padding:18px 42px">Sign in</a></p>
  </div>
</div></body></html>`;

// THE MANAGER COCKPIT v1 (file 20) — manager + admin roles only.
// Per line: the active cab (sign-off completes it — the file 11 completion
// gate's manager half; note/photo requirements join in a later block) and
// the waiting queue (start = cab goes Active + its Q97 task list freezes).
// ============================================================
// Block 95 (owner-rep nav cleanup, 2026-08-09): ONE shared header
// for every console page. The daily links live in the row; every
// occasional tool sits behind a Tools menu (plain <details> --
// touch-friendly, no dialogs, CSP-safe). Managers get their own
// smaller Tools list; admin-only pages stay off it. Sub-pages
// stop inventing partial navs, so nothing "drops off" anymore.
// ============================================================
const navBar95 = (isAdmin, showReports = false, tools95 = true) => {   // Block 188: tools95=false (dept-scoped managers, e.g. Body Shop) hides the whole Tools menu
  const it = (h, t) => `<a href="${h}" style="display:block;color:#ddd;padding:9px 20px;text-decoration:none;white-space:nowrap">${t}</a>`;
  // Block 114 (owner-rep): "split them to something that makes more
  // sense" — the menu leads with the pages admin actually reaches for;
  // the pipeline/diagnostic pages sit below a Plumbing divider. Those
  // pages notify when they need a human — nobody has to watch them.
  const daily95 = [["/reports", "Reports"], ["/progress", "Progress reports"], ["/payroll", "Pay Worksheet"], ["/meeting", "Meeting Pack"], ["/coverage", "Coverage"], ["/lines", "Lines & parts"], ["/tablet", "Tablet setup"], ["/admin#channels116", "Text setup"], ["/admin#cabnums", "Cab numbers"], ["/tvboard", "TV screen"]];   // Block 154 (D6): set-once panels reachable from Tools
  const plumbing95 = [["/feed", "Coyote feed"], ["/intake", "Intake"], ["/sync", "Sync"], ["/mapper", "Mapper"], ["/integrity", "Integrity"], ["/order", "Order history"]];
  const tools = tools95 === "time"
    ? [["/payroll", "Pay Worksheet"]]   // Block 189: Accounting-manager menu · Block 215 (Daniel): Pay Worksheet ONLY — Reports removed
    : isAdmin
    ? daily95
    : [["/meeting", "Meeting Pack"], ["/coverage", "Coverage"]].concat(showReports ? [["/reports", "Reports"]] : []).concat([["/tvboard", "TV screen"]]);
  return `<style>details.t95>summary::-webkit-details-marker{display:none}</style>
  <div style="text-align:center;margin:-4px 0 14px">
    ${isAdmin ? `<a href="/admin" style="color:#8e8e93;margin-right:16px">Admin console</a>` : ""}
    <a href="/home" style="color:#8e8e93;margin-right:16px">Home</a>
    <a href="/manager" style="color:#8e8e93;margin-right:16px">Manager console</a>   <!-- Block 157 (owner-rep E2): Manager cockpit -> Manager console, matching "Admin console" -->
    ${isAdmin ? `<a href="/reconcile" style="color:#8e8e93;margin-right:16px">Order Queue</a>` : ""}   <!-- Block 156 (owner-rep E1): White Board -> Order Queue -->
    ${isAdmin ? `<a href="/changes" style="color:#8e8e93;margin-right:16px">Changes</a>` : ""}
    <a href="/shopboard" style="color:#8e8e93;margin-right:16px">Shop board</a>
    ${tools95 ? `<details class="t95" style="display:inline-block;position:relative">
      <summary style="color:#8e8e93;cursor:pointer;display:inline-block;list-style:none;text-decoration:underline">Tools &#9662;</summary>
      <div style="position:absolute;left:50%;transform:translateX(-50%);top:30px;background:#1c1c1e;border:1px solid #3a3a3c;border-radius:12px;padding:6px 0;z-index:80;min-width:185px;box-shadow:0 10px 26px rgba(0,0,0,.55);text-align:left">
        ${tools.map(([h, t]) => it(h, t)).join("")}
        ${isAdmin ? `<div style="border-top:1px solid #3a3a3c;margin:6px 0 0;padding:8px 20px 3px;color:#6e6e73;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase">Plumbing</div>` + plumbing95.map(([h, t]) => it(h, t)).join("") : ""}
      </div>
    </details>` : ""}
    <a href="/logout" style="color:#8e8e93;margin-left:16px">Sign out</a>
  </div>
  <script>if(!window.__t95w){window.__t95w=1;
  // Block 110 fold-up, re-homed by Block 219 (Daniel, 8/25): the Block-196
  // nav refactor stranded this close handler on the PLAIN-STAFF nav — the
  // one nav with no menus — so admin/manager pages (which have Tools and
  // Lines) never received it and the menu hung open in limbo on phones.
  // It now ships WITH the menu bar itself, and listens on pointerdown
  // because iOS Safari doesn't reliably fire document-level click for taps
  // on non-interactive page areas. Any tap outside an open .t95 menu folds
  // it up — Tools, Lines, and any future menu that reuses the class.
  document.addEventListener("pointerdown",(e)=>{
    document.querySelectorAll("details.t95[open]").forEach((d)=>{ if(!d.contains(e.target)) d.removeAttribute("open"); });
  });}</script>`;
};
// Block 196 (owner directive, day 3): ONE navigation for EVERY signed-in
// page — role- AND department-aware, always at the TOP. This replaces every
// hand-rolled per-page nav row (the structural cause of blocks 186/187/193
// and the "endless loops"): admins get the full admin bar, managers get
// their department's flavor (Production: tools · Accounting: time tools ·
// Body/Build: no tools), everyone else gets the simple row.
function nav196(emp, showReports = false) {
  if (!emp || !emp.role) return "";
  if (emp.role === "admin") return navBar95(true, showReports);
  if (emp.role === "manager")
    return navBar95(false, showReports, emp.department === "Accounting" ? "time" : emp.department === "Production" ? true : false);
  return `<div style="text-align:center;margin:-4px 0 14px">
    <a href="/home" style="color:#8e8e93;margin-right:16px">Home</a>
    <a href="/shopboard" style="color:#8e8e93;margin-right:16px">Shop board</a>
    <a href="/logout" style="color:#8e8e93">Sign out</a>
  </div>`;
};

// ⚙ MY SETTINGS (block 117, owner-approved spec + owner-rep add: "each of
// the users should be able to change all their personal settings, email,
// phone, etc"). The ROLE decides which events reach a person; this page
// owns the CHANNELS and their contact info. PINs stay office-reset (Q114);
// name/role/department stay admin-owned (People panel).
const settingsPage117 = (me) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — My settings</title>${style}</head>
<body><div class="wrap" style="max-width:560px">
  <div class="logo">SHOP <span>BOARD</span></div>
  <p style="text-align:center;margin:2px 0 14px"><a href="/home" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${nav196(me)}   <!-- Block 196: the ONE shared nav — this page (the gear icon everyone taps) had none -->
  <h2 style="text-align:center;margin:0 0 2px">&#9881; My settings</h2>
  <p style="text-align:center;opacity:.7;margin:0 0 14px">${me.first_name} ${me.last_name || ""}</p>
  <div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px">
    <b>My contact info</b>
    <p style="opacity:.6;font-size:.9rem;margin:6px 0 10px">Where texts reach you. Keep this current — pay and after-hours notices use it.</p>
    <div style="padding:6px 0">Mobile # <input id="mc-m" value="${escH(me.mobile || "")}" placeholder="602 555 0117" style="background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px;width:150px;font-size:16px"></div>
    <!-- Block 171 (owner ruling 2026-08-14): EMAIL AS A NOTIFICATION CHANNEL IS
         HIDDEN EVERYWHERE, not removed. Daniel: "lets HIDE email capabilities
         as a push. for now, we can revisit it later if needed." Background: the
         M365/GoDaddy SMTP path wanted an app password on the info@ ADMIN
         account (rejected, and Microsoft retires basic SMTP AUTH Dec 2026
         anyway), and floor staff aren't all on company email. The email input,
         the settings toggle, the admin columns, the Features switch and the
         setup panel are all hidden; the stored employee.email data, the send
         chokepoint and sendEmail116 stay intact for a future
         transactional-API revisit. The Email input lived here. -->
    <button style="background:#3a3a3c;border:none;border-radius:9px;color:#fff;padding:9px 14px;cursor:pointer;margin-top:4px" onclick="saveC117(this)">Save contact info</button>
    <span id="mc-msg" style="font-size:.85rem;margin-left:8px"></span>
  </div>
  <div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px">
    <b>How notices reach me</b>
    <!-- Block 204 (owner ruling, day 5): the Block-154 "push is always on"
         era is OVER — Daniel: staff control their OWN push and text. The
         push toggle is restored below, and the copy now tells the truth:
         the bell inbox always keeps a copy no matter what; these switches
         only decide whether the phone gets tapped on the shoulder. -->
    <p style="opacity:.6;font-size:.9rem;margin:6px 0 4px">Your role decides WHICH notices you get; these decide HOW they arrive. Everything ALWAYS lands in your \uD83D\uDD14 inbox no matter what you turn off here.</p>
    ${[["push", "Phone / web push", "Pops up on your phone like any app. This device also has to allow notifications — the \uD83D\uDD14 button appears below if it hasn't yet."], ["sms", "Text message", "Sent to the mobile number above."]].map(([ch, label, note]) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line)">
      <div style="flex:1"><b>${label}</b><br><small style="opacity:.55">${note}</small></div>
      <b id="st-${ch}" style="opacity:.7">${me["notify_" + ch] === false ? "OFF" : "ON"}</b>
      <button style="background:${me["notify_" + ch] === false ? "#1d5a2d" : "#3a3a3c"};border:none;border-radius:9px;color:#fff;padding:9px 14px;cursor:pointer" onclick="flip117('${ch}',this)">Turn ${me["notify_" + ch] === false ? "ON" : "OFF"}</button>
    </div>`).join("")}
  </div>
  <p style="text-align:center;margin-top:16px"><a href="/logout" style="color:#8e8e93">Sign out</a></p>
<script>
  var cur117 = { push: ${me.notify_push === false ? "false" : "true"}, sms: ${me.notify_sms === false ? "false" : "true"}, email: ${me.notify_email === false ? "false" : "true"} };
  async function flip117(ch, btn){
    btn.disabled = true;
    try {
      const r = await fetch("/api/settings/channels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: ch, enabled: !cur117[ch] }) });
      const out = await r.json();
      if (out.ok) { cur117[ch] = !cur117[ch];
        document.getElementById("st-" + ch).textContent = cur117[ch] ? "ON" : "OFF";
        btn.textContent = "Turn " + (cur117[ch] ? "OFF" : "ON");
        btn.style.background = cur117[ch] ? "#3a3a3c" : "#1d5a2d";
      }
    } catch(e) {}
    btn.disabled = false;
  }
  async function saveC117(btn){
    btn.disabled = true; const m = document.getElementById("mc-msg"); m.textContent = "";
    try {
      const r = await fetch("/api/settings/contact", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: document.getElementById("mc-m").value }) });   // Block 171: email field hidden — never send the key, so the server leaves the stored address alone
      const out = await r.json();
      if (out.ok) { m.textContent = "✓ Saved"; m.style.color = "#30d158"; }
      else { m.textContent = out.error || "Something went wrong"; m.style.color = "#ff453a"; }
    } catch(e){ m.textContent = "Network hiccup — try again"; m.style.color = "#ff453a"; }
    btn.disabled = false;
  }
</script></div></body></html>`;

const managerPage = (rows, reworkReasons = [], isAdmin = false, onClock = [], longRunners = [], recentDone = [], showReports = false, afterHours = [], canCloseLines = false, tc = null, downReasons = [], timeoff = { pending: [], upcoming: [], emps: [], reasons: [] }, fixjob = { open: [], completed: [], reasons: [], lines: [] }, proj = {}, insp188 = false, acct189 = false, tcard191 = null, odd215 = []) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Manager</title>${style}
<style>
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}
  .lane h3{margin:0 0 8px}
  .btn{background:var(--red);border:none;border-radius:10px;color:#fff;font-weight:700;
       padding:12px 18px;font-size:1rem;cursor:pointer;margin-top:8px}
  .btn.gray{background:#3a3a3c}
  .qrow{opacity:.8;padding:4px 0}
</style></head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  <!-- Top nav (Sonnet UX escalation 2026-07-28, C16: there was no way BACK
       from Manager to Admin — nav now lives at the top of every console,
       same placement everywhere per file 22.4). -->
  ${navBar95(isAdmin, showReports, acct189 ? "time" : !insp188)}
  <!-- Block 99b (owner-rep): the cockpit got long — one-tap section jumps,
       same sticky pattern as the admin console. Anchors are harmless when a
       lane isn't rendered that day. -->
  <!-- Block 153 (owner-rep D4/D5): the jump-nav mirrors the page's new order
       and Lines is a DROPDOWN naming each line so a manager lands on the one
       they want, not the top of the section. -->
  <!-- Block 188 (owner ruling, day 2): the cockpit is DEPARTMENT-SCOPED.
       insp188 (a manager whose department is not Production — Body Shop
       today) sees ONLY the inspection lane + the 4 line boxes; On the
       clock / Running long / after-hours / Time off / Time corrections /
       Fix jobs / Tools stay Production-manager (+admin) territory. Each
       department's manager view gets its own branch here as Daniel defines
       them (Accounting is next). -->
  ${acct189 ? "" : `<div style="position:sticky;top:0;z-index:5;background:var(--bg);padding:10px 0;margin-bottom:8px;text-align:center;border-bottom:1px solid var(--line)">
    ${insp188 ? "" : `<a href="#oc" style="color:#fff;font-weight:700;margin-right:14px">On the clock</a>
    <a href="#rl" style="color:#fff;font-weight:700;margin-right:14px">Running long</a>`}
    <a href="#insp153" style="color:#fff;font-weight:700;margin-right:14px">Inspection</a>
    <details class="t95" style="display:inline-block;position:relative;margin-right:14px"><summary style="color:#fff;font-weight:700;cursor:pointer;display:inline-block;list-style:none">Lines &#9662;</summary>
      <div style="position:absolute;left:50%;transform:translateX(-50%);top:26px;background:#1c1c1e;border:1px solid #3a3a3c;border-radius:12px;padding:6px 0;z-index:90;min-width:180px;box-shadow:0 10px 26px rgba(0,0,0,.55);text-align:left">
        ${rows.map((r) => `<a href="#line99-${r.line.id}" onclick="this.closest('details').open=false" style="display:block;padding:8px 14px;color:#e8e8ed;text-decoration:none">${r.line.name}</a>`).join("")}
      </div></details>
    ${insp188 ? "" : `<a href="#to99" style="color:#fff;font-weight:700;margin-right:14px">Time off</a>
    <a href="#timecorrections" style="color:#fff;font-weight:700;margin-right:14px">Time corrections</a>
    <a href="#fixjob" style="color:#fff;font-weight:700">Fix jobs</a>`}
  </div>`}
  <style>details.t95>summary::-webkit-details-marker{display:none}</style>
  <h2>Manager${insp188 ? ` <span style="opacity:.5;font-size:1rem;font-weight:400">— inspection</span>` : acct189 ? ` <span style="opacity:.5;font-size:1rem;font-weight:400">— time &amp; pay</span>` : ""}</h2>
  ${!insp188 && onClock.length ? `
  <!-- ON THE CLOCK (risk sweep 2026-07-28): the same-day fix for a forgotten
       clock-out. The sweeper auto-closes anything 4+ hrs past day end; this
       button is for catching it sooner. Audited (who forced it is logged). -->
  <div class="lane" id="oc"><h3>On the clock</h3>
    ${onClock.map((p) => `<div class="qrow">${p.name} · ${p.line} · since ${p.since_hhmm}${p.open ? ` · <span style="${p.open >= 3 ? "color:#ffd60a;font-weight:700" : "opacity:.6"}">${p.open} step${p.open > 1 ? "s" : ""} open</span>` : ""}
      <button class="btn gray" style="padding:6px 12px;margin-left:10px" onclick="forceOut('${p.id}',this)">Clock out</button></div>`).join("")}
    <div style="opacity:.5;font-size:.85rem">For the tap somebody forgot. Anything still open 4+ hrs past day end closes itself automatically.</div>
  </div>` : ""}
  ${!insp188 && !acct189 && longRunners.length ? `
  <!-- RUNNING LONG (Q107): a step In Progress 4+ hrs, no completion. Not an
       alarm — a glance. Usually it's "went to help elsewhere" or a parts
       run; the who + since makes it self-explanatory. -->
  <div class="lane" id="rl" style="border-color:#7a5900"><h3>Running long</h3>
    ${longRunners.map((t) => `<div class="qrow"><b>${t.line || "—"}</b> · ORDER ${t.order_number} · step ${t.display_no} ${t.name}
      <span style="opacity:.6">— started by ${t.who} at ${t.hhmm}, still open</span></div>`).join("")}
    <div style="opacity:.5;font-size:.85rem">Steps in progress 4+ hours. Worth a glance — nothing here changes any math.</div>
  </div>` : ""}
  ${!insp188 && !acct189 && recentDone.length ? `
  <!-- RECENTLY CHECKED OFF (Q107): the shared undo. A step completed out
       from under a partner comes back here — audited, and the engine's
       earned-value math nets it out automatically (earned = completed
       steps, so un-completing IS the reversal; no side math to fix). -->
  <div class="lane"><h3>Recently checked off</h3>
    ${recentDone.map((t) => `<div class="qrow"><b>${t.line || "—"}</b> · ORDER ${t.order_number} · step ${t.display_no} ${t.name}
      <span style="opacity:.6">— ${t.who ? `by <b>${t.who}</b>` : "no tap on record (seeded test data)"} at ${t.hhmm}</span>
      <button class="btn gray" style="padding:6px 12px;margin-left:10px" onclick="undoTask('${t.id}',this)">Un-complete</button></div>`).join("")}
  </div>` : ""}
  ${!insp188 && !acct189 && afterHours.length ? `
  <!-- Q112 + blocks 107/108 (owner-rep): WHO worked leads each row, big and
       bold, lines below the name. Managers CONFIRM the approval claim here;
       the SIGN-OFF that releases pay hours is an ADMIN job (Admin console). -->
  <div class="lane" style="border-color:#7a5900"><h3>After hours — ${isAdmin ? "needs your sign-off" : "confirm; admin signs off"}</h3>
    ${afterHours.map((s) => `<div class="qrow" style="display:block;padding:10px 0">
      <div style="font-size:1.15rem;font-weight:800">${s.who} <span style="opacity:.6;font-weight:400;font-size:.9rem">— after hours ${s.when}${s.ended && s.hrs != null ? ` · ${s.hrs}h` : ""}</span></div>
      <div style="margin:2px 0 0">${s.lineName}</div>
      <div style="opacity:.7;margin:2px 0 0">${s.reason} · says ${s.appr} approved ${s.plan ? ` · plan: "${s.plan}"` : ""}</div>
      ${s.ended ? `<div style="margin:4px 0 0">wrap-up: "${s.wrap || ""}"${s.photos.length ? s.photos.map((p2, i2) => ` <a href="/photo-view/${p2}" target="_blank" style="color:#ffd60a">&#128247; photo ${i2 + 1}</a>`).join("") : ""}</div>` : `<div style="color:#ffd60a;margin:4px 0 0">(still on the clock)</div>`}
      <div style="margin-top:8px">${s.confirmed ? "" : `<button class="btn gray" style="padding:6px 12px;margin-top:0" onclick="confirmAh('${s.id}',this)">Confirm approval</button> `}${s.ended ? (isAdmin ? `<button class="btn" style="background:#1d5a2d;padding:6px 12px;margin-top:0" onclick="armM(this,()=>signAh('${s.id}',this))">Sign off — count the hours</button> <button class="btn" style="padding:6px 12px;margin-top:0" onclick="document.getElementById('dcm-${s.id}').style.display='block';document.getElementById('dcmr-${s.id}').focus()">Decline</button>` : `<span style="opacity:.55;font-size:.85rem">Awaiting ADMIN sign-off — hours held till then.</span>`) : ""}</div>
      ${s.ended && isAdmin ? `<div id="dcm-${s.id}" style="display:none;margin-top:6px"><input id="dcmr-${s.id}" maxlength="200" placeholder="Why these hours don't count — required, goes on the record" style="min-width:300px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:7px 8px"> <button class="btn" style="padding:6px 12px;margin-top:0" onclick="armM(this,()=>declAh110('${s.id}',this))">Decline — hours don't count</button></div>` : ""}
    </div>`).join("")}
    <div style="opacity:.5;font-size:.85rem">Confirming says the named approval was real. Sign-off is an ADMIN job — it releases the session's hours onto the timecard; until then they're HELD and flagged.</div>
  </div>` : ""}
  ${!acct189 && rows.some((r) => r.active && r.active.ready194 && r.active.ready194.allDone) ? `
  <!-- Block 194: cabs whose every step is checked but that haven't been SENT
       yet surface at the very top of the Inspection lane's territory — this
       is exactly the state the Blazer sat in while the managers hunted. -->
  <div class="lane" style="border-color:#30d158" id="ready194"><h3>Ready to send — every step checked</h3>
    ${rows.filter((r) => r.active && r.active.ready194 && r.active.ready194.allDone).map((r) => `
    <div style="border:1px solid #30d158;border-radius:10px;padding:10px;margin-bottom:8px">
      <b>ORDER ${r.active.order_number}</b>${r.active.cab_number ? ` · Cab #${r.active.cab_number}` : ""} · ${r.line.name} · ${r.active.ready194.done}/${r.active.ready194.total} steps &#10003;
      <div style="opacity:.75;font-size:.85rem;margin:4px 0">${r.active.ready194.photosHave >= r.active.ready194.photosNeed ? `${r.active.ready194.photosHave} completion photo${r.active.ready194.photosHave === 1 ? "" : "s"} attached.` : `${r.active.ready194.photosHave} of ${r.active.ready194.photosNeed} completion photo${r.active.ready194.photosNeed === 1 ? "" : "s"} — crew adds them on the cab screen, or send now and the waiver goes on the record.`}</div>
      <button class="btn" style="background:#1d5a2d;border:1px solid #30d158;margin-top:0" onclick="sendInsp194('${r.active.id}',this)">Send to inspection</button>
    </div>`).join("")}
  </div>` : ""}
  ${!acct189 && rows.some((r) => (r.awaiting || []).length) ? `
  <!-- Block 153 (owner-rep D2): the sign-off / send-back used to live only
       inside each line's lane — a long scroll from the top. Every cab
       awaiting inspection now ALSO surfaces here, one glance from the top,
       with the SAME controls (input ids carry a T prefix so the two copies
       never collide; sendBack takes the prefix). The per-line copy stays. -->
  <div class="lane" style="border-color:#ffd60a" id="insp153"><h3>Needs inspection — sign off or send back</h3>
    ${rows.flatMap((r) => (r.awaiting || []).map((w) => `
    <div style="border:1px solid #ffd60a;border-radius:10px;padding:10px;margin-bottom:8px">
      <b>ORDER ${w.order_number}</b>${w.cab_number ? ` · Cab #${w.cab_number}` : ""} · ${r.line.name} · AWAITING INSPECTION
      ${w.final_note ? `<div style="opacity:.75;font-size:.9rem;margin-top:4px">Final note: ${w.final_note}</div>` : ""}
      ${(w.photos || []).length ? `<div style="margin-top:6px">${w.photos.map((p) =>
        `<a href="/photo-view/${p.id}" target="_blank"><img src="/photo/${p.id}" style="height:64px;border-radius:8px;margin-right:6px"></a>`).join("")}</div>`
        : `<div style="opacity:.5;font-size:.85rem;margin-top:4px">No completion photos attached.</div>`}
      <div style="margin-top:8px">${w.inspection_claimed_by
        ? `<span style="color:#5ac8fa;font-weight:700">&#128269; ${w.claim_name184} is on it${w.claim_hhmm184 ? ` — since ${w.claim_hhmm184}` : ""}</span>
           <button class="btn gray" style="padding:6px 12px;margin-top:0;margin-left:8px" onclick="armM(this,()=>claimInsp184('${w.id}','takeover',this))">Take over</button>
           <button class="btn gray" style="padding:6px 12px;margin-top:0" onclick="armM(this,()=>claimInsp184('${w.id}','release',this))">Release</button>`
        : `<button class="btn" style="background:#0a4a6e;border-color:#5ac8fa;margin-top:0" onclick="claimInsp184('${w.id}','claim',this)">&#128269; I&#39;ve got this one</button> <span style="opacity:.5;font-size:.85rem">first tap takes it — the others see your name here</span>`}</div>
      <button class="btn" onclick="act('complete','${w.id}',this)">Inspected — sign off</button>
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--line)">
        <select id="Trr-${w.id}" style="background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px">
          ${reworkReasons.map((x) => `<option>${x.label}</option>`).join("")}
        </select>
        Hrs <input id="Trh-${w.id}" value="2" style="width:3.4em;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px">
        <input id="Trn-${w.id}" placeholder="What needs fixing (shows on the tech's screen)"
          style="width:100%;margin-top:6px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px">
        <button class="btn gray" onclick="sendBack('${w.id}',this,'T')">Send back — rework</button>
      </div>
    </div>`)).join("")}
  </div>` : ""}
  ${acct189 ? "" : `
  <!-- Block 207 (owner ruling, Sat 8/22): the ONE-TAP Body send-back — the
       safety valve of the one-inspection system. After rework the crew
       pushes their own cab to Body; if the fixes aren't right, ONE tap
       here returns it as a kickback FIX JOB: off the line, its own hours
       bucket, the new cab on the line keeps rolling. A fixed kickback
       re-inspects through the normal sign-off (the bar rises only after
       the work has missed twice). No arm/confirm dance — the owner wants
       this EASY for Body managers; it's fully audited and reversible
       through the normal fix flow. -->
  <div class="lane" style="border-color:#4a90d9" id="sendback207"><h3>Left production recently — send back if the fixes aren't right</h3>
    ${(fixjob.sendback || []).length ? fixjob.sendback.map((c) => `<div class="qrow" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span><b>ORDER ${c.order}</b>${c.cab ? ` · Cab #${c.cab}` : ""}</span>
      <button class="btn" style="margin-left:auto;margin-top:0;padding:8px 16px" onclick="sendBack207('${c.id}',this)">Send back to production</button></div>`).join("") : `<div style="opacity:.6">No cabs have left production recently.</div>`}
    <div style="opacity:.5;font-size:.85rem;margin-top:6px">One tap opens a kickback fix job — off the line, its own hours; the crew grabs it from the Open-fixes lane. It re-inspects through the normal sign-off when fixed.</div>
  </div>`}
  ${isAdmin && timeoff.pending.length ? `
  <!-- Q92: time-off requests waiting on you. One tap approves or denies; a
       denial can carry a short note back to the person. Approved time shows
       in "Who's out" below (and, a later block, adjusts cab projections). -->
  <div class="lane" style="border-color:#0a6cff"><h3>Time off — needs you</h3>
    ${timeoff.pending.map((t) => `<div class="qrow">${t.who} · ${t.dates}${t.reason ? ` · ${t.reason}` : ""}${t.reqnote ? ` <span style="opacity:.75">— "${t.reqnote}"</span>` : ""}
      <input id="ton-${t.id}" placeholder="note (optional, sent on deny)" style="margin-left:8px;min-width:220px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:6px">
      <button class="btn" style="background:#1d5a2d;padding:6px 12px;margin-top:0;margin-left:8px" onclick="toDecide('${t.id}','approve',this)">Approve</button>
      <button class="btn gray" style="padding:6px 12px;margin-top:0" onclick="toDecide('${t.id}','deny',this)">Deny</button></div>`).join("")}
  </div>` : ""}
  <div id="lines99"></div>
  ${acct189 ? "" : rows.map((r) => `
    <div class="lane" id="line99-${r.line.id}">
      <h3>${r.line.name}${r.line.manually_closed ? ' <span style="color:#8e8e93;font-size:1rem">· CLOSED</span>' : ""}${r.line.down_today ? ` <span style="color:#9db4c8;font-size:1rem">· DOWN: ${r.line.down_reason}</span>` : ""}
        ${canCloseLines ? `<button class="btn gray" style="float:right;padding:6px 12px;margin-top:0;font-size:.85rem" onclick="armM(this,()=>lineClosed(${r.line.id},${r.line.manually_closed ? "false" : "true"}))">${r.line.manually_closed ? "Reopen line" : "Close line"}</button>` : ""}</h3>
      <!-- Q83: "Down for today" quick-hold — expected-idle only (no active cab,
           not hard-closed). Down = calm slate on the TV + quiet alerts. -->
      ${insp188 ? (r.line.down_today ? `<div style="margin:-4px 0 8px;font-size:.85rem;color:#9db4c8">Down — ${r.line.down_reason}</div>` : "")
        : r.line.down_today
        ? `<div style="margin:-4px 0 8px;font-size:.85rem;color:#9db4c8">Down — ${r.line.down_reason}
             <button class="btn gray" style="padding:4px 10px;margin-left:8px" onclick="lineDown(${r.line.id},false,null)">Back up</button></div>`
        : (r.line.manually_closed ? ""
          : `<!-- Block 133 (logic audit L9): a line can be put DOWN whether or not a
                  cab is running (a production role out sick/vacation). The manager
                  TYPES the reason (no pick-list) — it rides with the order and the
                  hold is timed until Back up or a production clock-in. -->
             <div style="margin:-4px 0 8px;font-size:.85rem">
               <input id="dr-${r.line.id}" placeholder="Why down? (rides with the order)" maxlength="120" style="padding:5px;width:58%;min-width:210px;background:#111;color:#fff;border:1px solid var(--line);border-radius:6px">
               <button class="btn gray" style="padding:4px 10px;margin-left:6px" onclick="armM(this,()=>lineDown(${r.line.id},true,document.getElementById('dr-${r.line.id}').value))">Put line down</button></div>`)}
      ${(r.awaiting || []).map((w) => `
        <div style="border:1px solid #ffd60a;border-radius:10px;padding:10px;margin-bottom:8px">
          <b>ORDER ${w.order_number}</b>${w.cab_number ? ` · Cab #${w.cab_number}` : ""} · AWAITING INSPECTION
          ${w.final_note ? `<div style="opacity:.75;font-size:.9rem;margin-top:4px">Final note: ${w.final_note}</div>` : ""}
          ${(w.photos || []).length ? `<div style="margin-top:6px">${w.photos.map((p) =>
            `<a href="/photo-view/${p.id}" target="_blank"><img src="/photo/${p.id}" style="height:64px;border-radius:8px;margin-right:6px"></a>`).join("")}</div>`
            : `<div style="opacity:.5;font-size:.85rem;margin-top:4px">No completion photos attached.</div>`}
          <div style="margin-top:8px">${w.inspection_claimed_by
            ? `<span style="color:#5ac8fa;font-weight:700">&#128269; ${w.claim_name184} is on it${w.claim_hhmm184 ? ` — since ${w.claim_hhmm184}` : ""}</span>
               <button class="btn gray" style="padding:6px 12px;margin-top:0;margin-left:8px" onclick="armM(this,()=>claimInsp184('${w.id}','takeover',this))">Take over</button>
               <button class="btn gray" style="padding:6px 12px;margin-top:0" onclick="armM(this,()=>claimInsp184('${w.id}','release',this))">Release</button>`
            : `<button class="btn" style="background:#0a4a6e;border-color:#5ac8fa;margin-top:0" onclick="claimInsp184('${w.id}','claim',this)">&#128269; I&#39;ve got this one</button>`}</div>
          <button class="btn" onclick="act('complete','${w.id}',this)">Inspected — sign off</button>
          <!-- The OTHER inspection outcome (files 11/18): send it back,
               reason-coded (Q77 list), with a note + a time frame in hours. -->
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--line)">
            <select id="rr-${w.id}" style="background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px">
              ${reworkReasons.map((x) => `<option>${x.label}</option>`).join("")}
            </select>
            Hrs <input id="rh-${w.id}" value="2" style="width:3.4em;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px">
            <input id="rn-${w.id}" placeholder="What needs fixing (shows on the tech's screen)"
              style="width:100%;margin-top:6px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px">
            <button class="btn gray" onclick="sendBack('${w.id}',this)">Send back — rework</button>
          </div>
        </div>`).join("")}
      ${(r.rework || []).map((w) => `
        <div style="border:1px dashed #ff9f0a;border-radius:10px;padding:10px;margin-bottom:8px">
          <b>ORDER ${w.order_number}</b>${w.cab_number ? ` · Cab #${w.cab_number}` : ""} · IN REWORK — ${w.rework_reason || ""} (${Number(w.rework_hours) || "—"} hrs given)
          <div style="opacity:.6;font-size:.9rem">Comes back for re-inspection when the fixes are checked off.</div>
        </div>`).join("")}
      ${r.active ? `
        <div><b>ORDER ${r.active.order_number}</b>${r.active.cab_number ? ` · Cab #${r.active.cab_number}` : ""} · ${r.active.part_number} · active${r.active.ready194 && !r.active.ready194.allDone ? ` · <span style="opacity:.7">${r.active.ready194.done}/${r.active.ready194.total} steps</span>` : ""}${proj[r.active.order_number] ? ` · ${projPhrase(proj[r.active.order_number])}` : ""}</div>
        ${r.active.ready194 && r.active.ready194.allDone ? `
        <!-- Block 194 (Blazer lesson): a done cab is LOUD here now, and the
             manager can send it to inspection from this very box. -->
        <div style="border:2px solid #30d158;border-radius:10px;padding:10px;margin:8px 0;background:#10240f">
          <b style="color:#30d158">&#10003; Every step is checked (${r.active.ready194.done}/${r.active.ready194.total}) — this cab is ready for inspection.</b>
          <div style="opacity:.75;font-size:.85rem;margin:4px 0">${r.active.ready194.photosHave >= r.active.ready194.photosNeed ? `${r.active.ready194.photosHave} completion photo${r.active.ready194.photosHave === 1 ? "" : "s"} attached.` : `${r.active.ready194.photosHave} of ${r.active.ready194.photosNeed} completion photo${r.active.ready194.photosNeed === 1 ? "" : "s"} attached — the crew adds them on the cab screen, or sending from here waives them (goes on the record).`}</div>
          <button class="btn" style="background:#1d5a2d;border:1px solid #30d158;margin-top:4px" onclick="sendInsp194('${r.active.id}',this)">Send to inspection</button>
        </div>` : ""}
        ${(r.active.downs && r.active.downs.length) ? `<div style="margin:4px 0;padding:6px 8px;border-left:3px solid #9db4c8;background:#151a1f;border-radius:6px;font-size:.85rem;color:#c8d6e2">
          ${r.active.downs.map((d) => `⚑ Line down${d.open ? " (running now)" : ""} — ${d.label}`).join("<br>")}
          ${r.active.downTotalLabel ? `<div style="margin-top:3px;opacity:.85">Down ${r.active.downTotalLabel} total across ${r.active.downs.length} stops — off the cab's pace clock.</div>` : `<div style="margin-top:3px;opacity:.7">This down time is off the cab's pace clock.</div>`}
        </div>` : ""}
        ${insp188 ? "" : `<button class="btn${r.active.ready194 && r.active.ready194.allDone ? " gray" : ""}" onclick="armM(this,()=>act('complete','${r.active.id}',this))">Skip inspection — mark production complete</button>`}`
      : `<div style="opacity:.6">No active cab</div>
        ${!insp188 && r.queue.length ? `<button class="btn" onclick="act('start','${r.queue[0].id}',this)">Start next: ORDER ${r.queue[0].order_number}</button>` : ""}`}
      ${r.queue.length ? `<div style="margin-top:10px;opacity:.6">Waiting (warehouse runs this order):</div>
        ${r.queue.map((q) => `<div class="qrow">ORDER ${q.order_number}${q.cab_number ? ` · Cab #${q.cab_number}` : ""} · ${q.part_number}
          ${q.kit_status === "verified" ? '<span style="color:#30d158;font-size:.8rem;font-weight:700"> KIT ✓</span>' : q.kit_status === "short" ? '<span style="color:#ff9f0a;font-size:.8rem;font-weight:700"> SHORT — missing parts</span>' : '<span style="opacity:.4;font-size:.8rem"> kit not verified</span>'}</div>`).join("")}` : ""}
    </div>`).join("")}
  <!-- Block 153 (owner-rep D3/D5): Time off + Time corrections now live
       BELOW the lines, and the rarely-used Returned-for-fix lane is LAST —
       the jump-nav above mirrors this exact order. -->
  <!-- Q92: enter time off for anyone directly (lands already approved) + the
       upcoming "who's out and when" list. -->
  ${insp188 || acct189 ? "" : `
  <div class="lane" id="to99"><h3>Time off</h3>
    ${isAdmin ? `<p style="margin:0 0 8px">Add for someone:
      <select id="toa-emp">${(timeoff.emps || []).map((e) => `<option value="${e.id}">${e.first_name} ${e.last_name}</option>`).join("")}</select>
      From <input type="date" id="toa-start"> To <input type="date" id="toa-end">
      <select id="toa-reason">${(timeoff.reasons || []).map((r) => `<option>${r}</option>`).join("")}</select>
      <button class="btn gray" style="padding:8px 14px;margin-top:0" onclick="toAdd()">Add time off</button></p>` : ""}
    ${timeoff.upcoming.length ? `<div style="margin-top:6px"><div style="opacity:.6;margin-bottom:4px">Who's out (approved, upcoming)</div>
      ${timeoff.upcoming.map((t) => `<div class="qrow">${t.who} · ${t.dates}${t.reason ? ` · ${t.reason}` : ""}</div>`).join("")}</div>`
      : `<div style="opacity:.6">Nobody's out on the books ahead.</div>`}
  </div>`}
  ${acct189 ? `
  <!-- Block 215 (Daniel: "ANY oddities you find within regards to payroll or
       punches should be displayed... so accounting KNOWS to fix it"): the
       ODDITIES lane — the same alternation math the editor uses, run over
       EVERYONE's last 14 days, surfaced instead of waiting to be found.
       Each row opens that person + day in the editor below. -->
  <div class="lane" id="oddities215" style="border-color:#7a5900"><h3>&#9888; Payroll oddities — worth a look</h3>
    ${odd215.length ? odd215.map((o) => `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 0;border-top:1px solid var(--line)">
      <b>${o.name}</b> <span style="opacity:.7">${o.ds}</span> <span style="color:#ffd60a">${o.bits}</span>
      <a href="/manager?tc_emp=${o.emp}&tc_date=${o.ds}#timecard191" style="margin-left:auto;background:#1c1c1e;border:1px solid #7a5900;border-radius:10px;color:#ffd60a;padding:7px 14px;text-decoration:none;font-weight:700">Open their timecard</a>
    </div>`).join("") : `<div style="color:#30d158;font-weight:700">&#10003; No punch oddities in the last 14 days.</div>`}
    <div style="opacity:.5;font-size:.85rem;margin-top:8px">Checked daily over the last 14 days: extra INs/OUTs (usually double-taps), days with no clock-out, and days the system auto-closed. Fix them here before the pay run.</div>
  </div>` : ""}
  ${acct189 && tcard191 ? `
  <!-- Block 191: the accounting TIMECARD EDITOR — person → last 14 days,
       stints (IN → OUT) with editable times, Remove, Add. No lines, no
       punch jargon. Rides the audited /api/punch/correct endpoint. -->
  <div class="lane" id="timecard191" style="border-color:#0a6cff"><h3>Edit timecards</h3>
    <p style="margin:0 0 12px">
      <select style="font-size:1.1rem;padding:10px;background:#111;color:#fff;border:1px solid var(--line);border-radius:10px" onchange="if(this.value)location.href='/manager?tc_emp='+this.value">
        <option value="">— pick a person —</option>
        ${tcard191.emps.map((e) => `<option value="${e.id}"${tcard191.selEmp === e.id ? " selected" : ""}>${e.first_name} ${e.last_name}${e.pay_type === "salary" ? " — salary" : e.pay_type === "na" ? " — owner" : ""}</option>`).join("")}
      </select>
    </p>
    ${tcard191.selEmp ? `
    <div style="margin-bottom:12px"><span style="opacity:.65">Reason on the record for changes:</span><br>
      <input id="tcc-note" value="punch clock correction" maxlength="200" style="width:100%;max-width:420px;box-sizing:border-box;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:10px;font-size:1rem"></div>
    ${tcard191.days.map((d) => `
    <div style="border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:10px${d.stints.length || d.orphans.length ? "" : ";opacity:.7"}">
      <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap">
        <b style="font-size:1.1rem">${d.dow} ${d.ds.slice(5).replace("-", "/")}</b>
        <span style="opacity:.75;font-weight:700">${d.open ? "on the clock now" : d.hours ? `${d.hours} hrs` : "no hours"}</span>
      </div>
      <div id="tccmsg-${d.ds}" style="color:#ff6b5e;font-size:.9rem;min-height:0"></div>
      ${d.off216 ? `
      <div style="margin-top:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="color:#5eaeff;font-weight:700">${/sick/i.test(d.off216.reason) ? `&#129298; SICK recorded — ${d.off216.offHrs} hrs on the worksheet` : `Time off recorded — ${String(d.off216.reason).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))} (${d.off216.offHrs} hrs)`}</span>
        <button class="b" style="padding:5px 12px" onclick="tccSickCancel216('${d.off216.id}','${d.ds}',this)">Remove</button>
      </div>` : `
      <div style="margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="opacity:.75">&#129298; Sick time:</span>
        <input id="tccsh-${d.ds}" type="number" value="8" min="0.25" max="8" step="0.25" style="width:4.5em;font-size:1rem;padding:6px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px">
        <span style="opacity:.75">hrs</span>
        <button class="b" style="padding:5px 12px;opacity:.85" onclick="tccSick216('${d.ds}',this)">Add sick time</button>
      </div>`}
      ${d.stints.map((s) => `
      <div style="margin-top:10px">
        IN <input type="time" id="tcct-${s.in.id}" value="${s.in.hhmm}" step="60" style="font-size:1.05rem;padding:8px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px">
        ${s.out ? `&nbsp;OUT <input type="time" id="tcct-${s.out.id}" value="${s.out.hhmm}" step="60" style="font-size:1.05rem;padding:8px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px">` : `<span style="color:#30d158;font-weight:700">&nbsp;— still on the clock</span>`}
        <button class="btn gray" style="padding:8px 16px;margin-top:0" onclick="tccSave('${d.ds}',[['${s.in.id}','${s.in.hhmm}']${s.out ? `,['${s.out.id}','${s.out.hhmm}']` : ""}],this,'${s.mids.join(",")}')">Save times</button>
        ${s.out ? (s.midIds.length
          ? `<button class="btn" style="padding:8px 16px;margin-top:0" onclick="armM(this,()=>tccRemoveRun('${d.ds}','${[s.in.id, ...s.midIds, s.out.id].join(",")}',this))">Remove</button>`
          : `<button class="btn" style="padding:8px 16px;margin-top:0" onclick="armM(this,()=>tccRemove('${d.ds}','${s.in.id}','${s.out.id}',this))">Remove</button>`) : ""}
      </div>`).join("")}
      ${d.orphans.length ? `<div style="opacity:.6;font-size:.85rem;margin-top:10px">The extra punches below are usually an accidental double-tap — they don't count toward hours. Remove clears them.</div>` : ""}
      ${d.orphans.map((o) => `
      <div style="margin-top:10px">
        extra ${o.kind === "clock_in" ? "IN" : "OUT"} <input type="time" id="tcct-${o.id}" value="${o.hhmm}" step="60" style="font-size:1.05rem;padding:8px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px">
        <button class="btn gray" style="padding:8px 16px;margin-top:0" onclick="tccSave('${d.ds}',[['${o.id}','${o.hhmm}']],this)">Save</button>
        <button class="btn" style="padding:8px 16px;margin-top:0" onclick="armM(this,()=>tccVoidOne('${d.ds}','${o.id}',this))">Remove</button>
      </div>`).join("")}
      <div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)">
        Add hours: IN <input type="time" id="tccai-${d.ds}" step="60" style="font-size:1.05rem;padding:8px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px">
        OUT <input type="time" id="tccao-${d.ds}" step="60" style="font-size:1.05rem;padding:8px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px">
        <button class="btn" style="background:#1d5a2d;padding:8px 16px;margin-top:0" onclick="tccAdd('${d.ds}',this)">Add</button>
      </div>
    </div>`).join("")}
    <div style="opacity:.55;font-size:.9rem">Times are Phoenix. A day with lunch is two rows — add 07:00–11:00, then 12:00–16:00. Every change lands on the timecard with your reason. Days older than 14 days need Daniel.</div>
    ` : `<div style="opacity:.6;font-size:1.05rem">Pick a person to see their last 14 days of hours.</div>`}
  </div>` : ""}
  ${!insp188 && tc ? `
  <!-- Q111 pt 2: the missed-punch corrector — the reason the physical punch
       clock can retire. Pick a person and a Phoenix day; MOVE a punch that
       has the wrong time, VOID one that shouldn't exist, ADD a forgotten
       pair. Every change needs a note, is audited, and stamps the timecard. -->
  <div class="lane" id="timecorrections"><h3>Time corrections</h3>
    <p>
      <select id="tc-emp">${tc.emps.map((e) => `<option value="${e.id}" ${tc.selEmp === e.id ? "selected" : ""}>${e.first_name} ${e.last_name}${e.pay_type === "salary" ? " — salary" : e.pay_type === "na" ? " — owner" : ""}</option>`).join("")}</select>
      <input type="date" id="tc-date" value="${tc.date}">
      <button class="btn gray" style="padding:8px 14px;margin-top:0" onclick="tcLoad()">Load day</button>
    </p>
    ${tc.selEmp ? `
      ${tc.punches.length ? `<table style="width:100%;border-collapse:collapse;font-size:.95rem">
        <tr><th style="text-align:left;opacity:.55">Time</th><th style="text-align:left;opacity:.55">Punch</th><th style="text-align:left;opacity:.55">Line</th><th style="text-align:left;opacity:.55">Correction</th><th></th><th></th></tr>
        ${tc.punches.map((p) => `<tr style="${p.voided ? "text-decoration:line-through;opacity:.45" : ""}">
          <td>${p.hhmm}</td>
          <td>${p.kind === "clock_in" ? "IN" : "OUT"}${p.kind === "clock_out_auto" ? " (auto)" : ""}${p.reason ? ` · ${p.reason}` : ""}</td>
          <td>${p.lineName}</td>
          <td style="opacity:.7">${p.voided ? "VOIDED" : p.corrected ? "corrected" : p.added ? "added" : ""}${p.note ? `: ${p.note}` : ""}</td>
          <td>${p.voided ? "" : `<input type="time" id="tcm-${p.id}" value="${p.hhmm}" step="60"> <button class="btn gray" style="padding:6px 10px;margin-top:0" onclick="armM(this,()=>tcMove('${p.id}'))">Move</button>`}</td>
          <td>${p.voided ? "" : `<button class="btn red" style="padding:6px 10px;margin-top:0" onclick="armM(this,()=>tcVoid('${p.id}'))">Void</button>`}</td>
        </tr>`).join("")}</table>` : `<div style="opacity:.6">No punches that day.</div>`}
      <p style="margin-top:12px">Add a missed punch pair:
        <select id="tca-line">${tc.lines.map((l) => `<option value="${l.id}"${tc.defLine189 === l.id ? " selected" : ""}>${l.name}</option>`).join("")}</select>
        IN <input type="time" id="tca-in" step="60"> OUT <input type="time" id="tca-out" step="60">
        <button class="btn gray" style="padding:8px 14px;margin-top:0" onclick="armM(this,()=>tcAdd())">Add</button>
        <span style="opacity:.55;font-size:.85rem">(leave OUT blank only for today)</span></p>
      <p>Why: <input id="tc-note" style="min-width:280px" placeholder="required — e.g. forgot to clock out"></p>
      <p style="opacity:.5;font-size:.85rem">Times are Phoenix. Every change is audited and shows on the timecard — nothing is silent. Managers reach back 14 days; older belongs to an admin. A change must leave the day's punches alternating IN/OUT or it's refused.</p>
    ` : `<div style="opacity:.6">Pick a person and a day to see their punches.</div>`}
  </div>` : ""}
  <!-- Q85 FIX JOB: a signed-off cab came back (Body Shop kickback / customer
       return). Opening one re-opens its ORIGINAL record as a fix job (own
       deadline + hours bucket, re-inspection to close) and logs a sign-off
       escape. It "runs alongside" — it doesn't force-pause a live build. -->
  ${insp188 || acct189 ? "" : `
  <div class="lane" style="border-color:#4a90d9" id="fixjob"><h3>Returned for fix — kickbacks & customer returns</h3>
    ${fixjob.open.length ? fixjob.open.map((f) => `<div class="qrow"><b>${f.order}</b>${f.cab ? ` · Cab #${f.cab}` : ""} · ${f.kind === "kickback" ? "Body Shop kickback" : "customer return"} · ${f.reason || ""}${f.hours ? ` · ${f.hours} hr frame` : ""}${f.spent ? ` · ${f.spent.toFixed(1)} hr logged` : ""} <span style="opacity:.7">· on ${f.line}</span>${f.note ? `<br><span style="opacity:.75">${f.note}</span>` : ""}</div>`).join("") : `<div style="opacity:.6">No open fix jobs. When one is closed, it re-inspects through the normal sign-off on its line (above).</div>`}
    <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px">
      <b>Open a fix job on a returned cab:</b>
      <p>Order
        <select id="fx-cab">${fixjob.completed.length ? fixjob.completed.map((c) => `<option value="${c.id}">${c.order}${c.cab ? ` · Cab #${c.cab}` : ""}</option>`).join("") : `<option value="">— no recently-completed cabs —</option>`}</select>
        <select id="fx-kind"><option value="kickback">Body Shop kickback</option><option value="customer_return">Customer return</option></select>
        <select id="fx-reason">${fixjob.reasons.map((x) => `<option>${x.label}</option>`).join("")}</select>
      </p>
      <p>On line <select id="fx-line">${fixjob.lines.map((l) => `<option value="${l.id}">${l.name}</option>`).join("")}</select>
        · fix within <input id="fx-hours" type="number" min="0" step="0.5" style="width:80px" placeholder="hrs"> hrs</p>
      <p>Note <input id="fx-note" style="min-width:280px" placeholder="what needs fixing (optional)"></p>
      <button class="btn" style="background:#0a6cff" onclick="armM(this,()=>openFix())">Open fix job</button>
      <span style="opacity:.5;font-size:.85rem">The fix step lands on the cab's screen; a tech works it, then it re-inspects through the sign-off on its line (above).</span>
    </div>
  </div>`}
  <div class="msg err" id="err"></div>
  <p style="text-align:center"><a href="/shopboard" style="color:#8e8e93;margin-right:24px">Shop board</a>
  <a href="/logout" style="color:#8e8e93">Sign out</a></p>
</div>
<script>
  // Plain global handler wired by onclick= on each button — sturdier than
  // delegated listeners under automation and on older shop tablets.
  async function act(kind, id, btn) {
    btn.disabled = true; const orig109 = btn.textContent; btn.textContent = "Working…";
    try {
      const r = await fetch("/api/build/" + kind, { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build_id: id, claimed_at: new Date().toISOString(),
          force: btn.dataset.force109 === "1" ? true : undefined }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      // Block 128 (logic audit L1): sign-off with OPEN steps is a DELIBERATE
      // override — but the confirm is now a SEPARATE button, so a blind
      // double-tap on "Sign off" (a laggy tablet) can't advance a cab with open
      // steps. The sign-off button resets to normal; a distinct red "Advance
      // anyway" button appears beside it and clears itself after 8 s.
      if (out.needs_force) {
        btn.disabled = false; btn.textContent = orig109;
        var pid128 = "fc128-" + id;
        var old128 = document.getElementById(pid128); if (old128) old128.remove();
        var c128 = document.createElement("button");
        c128.id = pid128; c128.className = btn.className;
        c128.style.marginLeft = "8px"; c128.style.background = "#7a1d1d"; c128.style.borderColor = "#ff453a";
        c128.textContent = "Advance anyway — " + out.open + " step" + (out.open > 1 ? "s" : "") + " still open";
        c128.onclick = function () { c128.disabled = true; c128.textContent = "Advancing…"; forceComplete128(id, c128); };
        btn.insertAdjacentElement("afterend", c128);
        document.getElementById("err").textContent = out.error || "";
        setTimeout(function () { var x = document.getElementById(pid128); if (x) x.remove(); }, 8000);
        return;
      }
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false; btn.textContent = orig109;
  }
  // Block 194 (Blazer lesson): the cockpit's "Send to inspection" — the
  // manager path of /api/build/finish (photo waiver rides along, audited).
  async function sendInsp194(id, btn) {
    btn.disabled = true; btn.textContent = "Sending…";
    const err = document.getElementById("err");
    try {
      const r = await fetch("/api/build/finish", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build_id: id, photo_pass: true, claimed_at: new Date().toISOString() }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      err.textContent = out.error || "Something went wrong";
    } catch (e) { err.textContent = "Network hiccup — try again"; }
    btn.disabled = false; btn.textContent = "Send to inspection";
  }
  // Block 191: the accounting timecard editor — a friendlier face on the
  // audited /api/punch/correct endpoint. Times type as Phoenix wall-clock;
  // AZ never shifts, so the -07:00 offset is always right. Removing a stint
  // voids its IN first, then the OUT — the order the v148 guards require.
  const TCC_EMP = "${tcard191 && tcard191.selEmp ? tcard191.selEmp : ""}";
  const TCC_LINE = ${tcard191 ? Number(tcard191.defLine) || 10 : 10};
  function tccNote() { const n = document.getElementById("tcc-note"); return n && n.value.trim() ? n.value.trim() : "punch clock correction"; }
  // Block 216: SICK DAY straight from the timecard — one tap records an
  // approved sick day (8 hrs on the worksheet); Remove cancels a mis-tap.
  async function tccOff216(ds, url, payload, btn) {
    btn.disabled = true;
    const m = document.getElementById("tccmsg-" + ds);
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const out = await r.json();
      if (out.ok) return location.reload();
      if (m) m.textContent = out.error || "Something went wrong";
    } catch (e) { if (m) m.textContent = "Network hiccup — try again"; }
    btn.disabled = false;
  }
  function tccSick216(ds, btn) {
    const hEl = document.getElementById("tccsh-" + ds);
    const hrs = hEl && hEl.value !== "" ? Number(hEl.value) : 8;   // Block 217: partial sick hours (2, 4, ...) — default a full 8
    tccOff216(ds, "/api/timeoff/add", { employee_id: TCC_EMP, start_date: ds, end_date: ds, reason: "Sick", hours: hrs }, btn);
  }
  function tccSickCancel216(id, ds, btn) { tccOff216(ds, "/api/timeoff/cancel", { request_id: id }, btn); }
  function tccIso(ds, hhmm) { return new Date(ds + "T" + hhmm + ":00-07:00").toISOString(); }
  async function tccCall(ds, payload) {
    const m = document.getElementById("tccmsg-" + ds);
    try {
      const r = await fetch("/api/punch/correct", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const out = await r.json();
      if (out.ok) return true;
      if (m) m.textContent = out.error || "Something went wrong";
    } catch (e) { if (m) m.textContent = "Network hiccup — try again"; }
    return false;
  }
  async function tccSave(ds, pairs, btn, mids) {
    // Block 199: a shop-level stint can contain line-move punches (the
    // display chains them away). The day's edges can move freely as long
    // as they don't cross a line move INSIDE the stint — catch that here
    // with a plain sentence instead of the server's generic refusal.
    const mm = (mids || "").split(",").filter(Boolean);
    if (mm.length && pairs.length === 2) {
      const vi = (document.getElementById("tcct-" + pairs[0][0]) || {}).value;
      const vo = (document.getElementById("tcct-" + pairs[1][0]) || {}).value;
      if ((vi && vi > mm[0]) || (vo && vo < mm[mm.length - 1])) {
        const m199 = document.getElementById("tccmsg-" + ds);
        if (m199) m199.textContent = "This stint has a line move at " + (vi && vi > mm[0] ? mm[0] : mm[mm.length - 1]) + " inside it — keep IN before it and OUT after it. Wrong altogether? Remove the stint, then Add the right hours.";
        return;
      }
    }
    btn.disabled = true;
    for (const [id, orig] of pairs) {
      const v = (document.getElementById("tcct-" + id) || {}).value;
      if (!v || v === orig) continue;
      if (!(await tccCall(ds, { action: "move", punch_id: id, new_at: tccIso(ds, v), note: tccNote() }))) { btn.disabled = false; return; }
    }
    location.reload();
  }
  // Block 192: Remove is ONE atomic server call now (void_pair) — the old
  // two-call version could die halfway and strand a half-removed stint.
  async function tccRemove(ds, inId, outId, btn) {
    btn.disabled = true;
    if (await tccCall(ds, { action: "void_pair", in_id: inId, out_id: outId, note: tccNote() })) return location.reload();
    btn.disabled = false;
  }
  // Block 199: Remove for a stint that spans line moves — the whole punch
  // chain (edges + interior switch pairs) voids as ONE atomic action.
  async function tccRemoveRun(ds, idsCsv, btn) {
    btn.disabled = true;
    if (await tccCall(ds, { action: "void_run", ids: idsCsv.split(","), note: tccNote() })) return location.reload();
    btn.disabled = false;
  }
  async function tccVoidOne(ds, id, btn) {
    btn.disabled = true;
    if (await tccCall(ds, { action: "void", punch_id: id, note: tccNote() })) return location.reload();
    btn.disabled = false;
  }
  async function tccAdd(ds, btn) {
    const i = (document.getElementById("tccai-" + ds) || {}).value, o = (document.getElementById("tccao-" + ds) || {}).value;
    const m = document.getElementById("tccmsg-" + ds);
    if (!i) { if (m) m.textContent = "IN time first"; return; }
    btn.disabled = true;
    const p = { action: "add", employee_id: TCC_EMP, line_id: TCC_LINE, in_at: tccIso(ds, i), note: tccNote() };
    if (o) p.out_at = tccIso(ds, o);
    if (await tccCall(ds, p)) return location.reload();
    btn.disabled = false;
  }
  // Block 184: the inspection claim — first tap stamps your name on the cab so
  // the other inspectors don't cross the shop for nothing. SOFT by design:
  // sign-off/rework stay open to any manager; Take over and Release are armed
  // (two-tap) so nobody grabs or drops a cab by accident.
  // Block 207: the Body manager's ONE-TAP send-back — no arm, no form
  // (owner: "single pass for them to send back so its easy"). Opens a
  // kickback fix job with a standard reason; detail can be added via the
  // full cockpit's fix form if ever needed.
  async function sendBack207(id, btn) {
    btn.disabled = true; btn.textContent = "Sending back…";
    try {
      const r = await fetch("/api/build/fixjob", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build_id: id, kind: "kickback", reason: "Body Shop return — fixes not up to par", claimed_at: new Date().toISOString() }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false; btn.textContent = "Send back to production";
  }
  async function claimInsp184(id, what, btn) {
    if (btn) btn.disabled = true;
    try {
      const r = await fetch("/api/inspect/claim", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build_id: id, action: what }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
      if (out.stale) return setTimeout(() => location.reload(), 1400);
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    if (btn) btn.disabled = false;
  }
  // Block 128 (logic audit L1): the SEPARATE override button's advance call —
  // reached only by a deliberate tap on the distinct red button, never by a
  // reflexive double-tap on Sign off.
  async function forceComplete128(id, c) {
    try {
      const r = await fetch("/api/build/complete", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build_id: id, claimed_at: new Date().toISOString(), force: true }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
      if (c) c.remove();
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; if (c) { c.disabled = false; c.textContent = "Advance anyway"; } }
  }
  // Q107 manager un-complete: backs a wrongly-finished step to In Progress.
  // Goes through the same /api/task/state engine as the floor (audited as
  // task.undo with the manager's id); managers don't need to be clocked in.
  async function undoTask(id, btn) {
    btn.disabled = true; btn.textContent = "…";
    try {
      const r = await fetch("/api/task/state", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: id, to: "in_progress", claimed_at: new Date().toISOString() }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false; btn.textContent = "Un-complete";
  }
  // Forgotten-clock-out correction: manager taps the person out (audited).
  async function forceOut(id, btn) {
    btn.disabled = true; btn.textContent = "…";
    try {
      const r = await fetch("/api/clock/force-out", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: id }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false; btn.textContent = "Clock out";
  }
  // Q112: one tap owns an after-hours approval claim.
  async function confirmAh(id, btn) {
    btn.disabled = true; btn.textContent = "…";
    try {
      const r = await fetch("/api/afterhours/confirm", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: id }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false; btn.textContent = "Confirm";
  }
  // Block 107: sign off a wrapped-up after-hours session — this is what
  // releases its HELD hours onto the timecard. Two-tap armed upstream.
  async function signAh(id, btn) {
    btn.disabled = true; btn.textContent = "…";
    try {
      const r = await fetch("/api/afterhours/signoff", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: id }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false; btn.textContent = "Sign off — count the hours";
  }
  // Block 110: decline with a typed reason — refuses the hours for good.
  async function declAh110(id, btn){
    const rsn = (document.getElementById("dcmr-" + id) || { value: "" }).value.trim();
    if (!rsn) { document.getElementById("err").textContent = "Type the reason first"; return; }
    btn.disabled = true;
    try {
      const r = await fetch("/api/afterhours/decline", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: id, reason: rsn }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false;
  }
  // Q113: close/reopen a line — two-tap armed, since it stops clock-ins.
  function armM(btn, fn){ if (btn.dataset.armed) { fn(); } else { btn.dataset.armed = "1"; const orig97 = btn.textContent; btn.textContent = "Sure? Tap again"; setTimeout(() => { btn.dataset.armed = ""; btn.textContent = orig97; }, 4000); } }
  // Q85: open a fix job on a returned/kicked-back cab.
  async function openFix(){
    var cab = document.getElementById("fx-cab").value;
    if(!cab){ document.getElementById("err").textContent = "No completed cab to send back."; return; }
    var payload = { build_id: cab, kind: document.getElementById("fx-kind").value,
      reason: document.getElementById("fx-reason").value, line_id: document.getElementById("fx-line").value,
      hours: document.getElementById("fx-hours").value, note: document.getElementById("fx-note").value };
    try {
      var r = await fetch("/api/build/fixjob", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      var out = await r.json();
      if(out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch(e){ document.getElementById("err").textContent = "Network hiccup — try again"; }
  }
  async function lineClosed(lineId, to) {
    try {
      const r = await fetch("/api/line/closed", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_id: lineId, closed: to === true || to === "true" }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
  }
  // Q83: mark a line "down for today" / bring it back up.
  async function lineDown(lineId, to, reason) {
    try {
      const r = await fetch("/api/line/down", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_id: lineId, down: to === true || to === "true", reason }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
  }
  // Q111 pt 2: the corrector's helpers. Times typed here are PHOENIX wall
  // clock; the -07:00 suffix pins them (Arizona never shifts).
  function tcLoad(){ const e=document.getElementById("tc-emp").value, d=document.getElementById("tc-date").value;
    if(e&&d) location.href="/manager?tc_emp="+e+"&tc_date="+d+"#timecorrections"; }
  function tcIso(d,t){ return d+"T"+t+":00-07:00"; }
  async function tcPost(payload){
    const noteEl = document.getElementById("tc-note");
    payload.note = noteEl ? noteEl.value : "";
    try {
      const r = await fetch("/api/punch/correct", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const out = await r.json();
      if (out.ok) return tcLoad();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e2) { document.getElementById("err").textContent = "Network hiccup — try again"; }
  }
  function tcMove(id){ const d=document.getElementById("tc-date").value, t=document.getElementById("tcm-"+id).value;
    if(!t) return; tcPost({ action:"move", punch_id:id, new_at: tcIso(d,t) }); }
  function tcVoid(id){ tcPost({ action:"void", punch_id:id }); }
  function tcAdd(){ const d=document.getElementById("tc-date").value;
    const i=document.getElementById("tca-in").value, o=document.getElementById("tca-out").value;
    if(!i){ document.getElementById("err").textContent="The IN time is needed"; return; }
    tcPost({ action:"add", employee_id: document.getElementById("tc-emp").value,
      line_id: Number(document.getElementById("tca-line").value),
      in_at: tcIso(d,i), out_at: o ? tcIso(d,o) : null }); }
  // Failed-inspection path: reason + note + time frame -> /api/build/rework.
  async function sendBack(id, btn, pfx) {   // Block 153: pfx picks which copy's inputs (top lane vs line lane)
    btn.disabled = true; btn.textContent = "Working…";
    const g153 = (base) => document.getElementById((pfx || "") + base + id);
    try {
      const r = await fetch("/api/build/rework", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build_id: id,
          reason: g153("rr-").value,
          note: g153("rn-").value,
          hours: Number(g153("rh-").value),
          claimed_at: new Date().toISOString() }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false; btn.textContent = "Send back — rework";
  }
  // Q92: approve/deny a time-off request (manager + admin). A deny can carry a
  // short note; the person sees the decision on their home screen.
  async function toDecide(id, decision, btn) {
    btn.disabled = true; const orig = btn.textContent; btn.textContent = "…";
    const noteEl = document.getElementById("ton-" + id);
    try {
      const r = await fetch("/api/timeoff/decide", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision, note: noteEl ? noteEl.value : "" }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false; btn.textContent = orig;
  }
  // Q92: enter time off for someone directly — lands already approved.
  async function toAdd() {
    const emp = document.getElementById("toa-emp").value,
          start = document.getElementById("toa-start").value,
          end = document.getElementById("toa-end").value,
          reason = document.getElementById("toa-reason").value;
    if (!emp || !start) { document.getElementById("err").textContent = "Pick a person and a start date"; return; }
    if (end && end < start) { document.getElementById("err").textContent = "The end date is before the start"; return; }
    try {
      const r = await fetch("/api/timeoff/add", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: emp, start_date: start, end_date: end || start, reason }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
  }
</script></body></html>`;

// Q92 (part 2): THE MEETING PACK — an on-demand living snapshot for the
// (sometimes-floating) Monday meeting. Manager + admin, read-only, no data
// entry: the floor right now, cabs finishing (awaiting sign-off), sign-offs in
// the last 7 days, and who's out ahead. Prints cleanly. "The button is the
// feature" (owner-rep) — an optional Monday auto-push can ride the scheduler later.
function meetingPage(now, board, awaiting, completed, out, proj = {}, isAdmin95 = false, emp196 = null) {
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Meeting Pack</title>${style}
<style>
  .mp{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}
  .mp h3{margin:0 0 10px}
  .row{padding:8px 0;border-bottom:1px solid var(--line)}
  .row:last-child{border-bottom:none}
  .muted{opacity:.6}
  .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle}
  .g{background:#30d158}.a{background:#ffd60a}.r{background:#ff453a}.n{background:#6b6b70}
  @media print{ a{display:none} .mp{break-inside:avoid} }
</style></head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${emp196 ? nav196(emp196) : navBar95(isAdmin95)}
  <h2>Meeting Pack</h2>
  <p class="muted" style="margin-top:-8px">A live snapshot for the meeting — ${esc(now)} (Phoenix). Reload for the latest.</p>

  <div class="mp"><h3>Right now — the floor</h3>
  ${board && board.lines && board.lines.length ? board.lines.map((l) => {
    const dot = !l.cab ? "n" : l.cab.color === "red" ? "r" : l.cab.color === "amber" ? "a" : l.cab.color === "green" ? "g" : "n";
    let line;
    if (l.closed) line = `<span class="muted">Closed</span>`;
    else if (l.down) line = `<span class="muted">Down — ${esc(l.down.reason || "")}</span>`;
    else if (!l.cab) line = `<span class="muted">Idle${l.ondeck ? ` — on deck: ${esc(l.ondeck.order)} (${esc(l.ondeck.family || "")})` : ""}</span>`;
    else { const pp = proj[l.cab.order];
      line = `<b>${esc(l.cab.order)}</b> ${esc(l.cab.family || "")} — ${esc(l.cab.status)}${l.cab.day ? ` · day ${l.cab.day}${l.cab.total_days ? `/${l.cab.total_days}` : ""}` : ""}${pp ? ` · ${projPhrase(pp)}` : ""}`; }
    const techs = (l.techs && l.techs.length) ? ` <span class="muted">· ${l.techs.map(esc).join(", ")}</span>` : "";
    return `<div class="row"><span class="dot ${dot}"></span><b>${esc(l.name)}</b> — ${line}${techs}</div>`;
  }).join("") : `<div class="muted">No lines to show.</div>`}
  </div>

  <div class="mp"><h3>Finishing — awaiting sign-off (${awaiting.length})</h3>
  ${awaiting.length ? awaiting.map((a) => `<div class="row"><b>${esc(a.order)}</b> ${esc(a.family || "")} <span class="muted">· ${esc(a.line || "")}</span></div>`).join("") : `<div class="muted">Nothing waiting on inspection.</div>`}
  </div>

  <div class="mp"><h3>Completed — last 7 days (${completed.length})</h3>
  ${completed.length ? completed.map((c) => `<div class="row"><b>${esc(c.order)}</b> ${esc(c.family || "")}${c.cab ? ` <span class="muted">· Cab #${esc(c.cab)}</span>` : ""} <span class="muted">· ${esc(c.when)}</span>${c.by ? ` <span class="muted">· by ${esc(c.by)}</span>` : ""}${c.byAdmin ? ` <span style="background:#3a2f10;color:#ffd60a;padding:1px 6px;border-radius:10px;font-size:.78em">admin sign-off</span>` : ""}</div>`).join("") : `<div class="muted">No sign-offs in the last 7 days.</div>`}
  </div>

  <div class="mp"><h3>Who's out — upcoming (${out.length})</h3>
  ${out.length ? out.map((o) => `<div class="row"><b>${esc(o.who)}</b> <span class="muted">· ${esc(o.dates)}${o.reason ? ` · ${esc(o.reason)}` : ""}</span></div>`).join("") : `<div class="muted">Nobody scheduled out.</div>`}
  </div>
</div></body></html>`;
}

// Q92 pt 2: FINISH-DATE PROJECTION (owner-rep 2026-08-04: base = remaining
// build-days counted forward over OPEN shop days; an absence moves the date
// only on a WHOLE lost day). `days` is the cab's LINE horizon (tomorrow onward),
// each {open, allOut, someOut}: an open day where the line's whole assigned crew
// is off is a LOST day (pushes the finish, no progress); any other open day is
// productive (a partial-crew day still counts, just flagged at-risk). The
// (remaining)-th productive open day is the projected finish. Pure + testable.
function projFinish(days, remaining) {
  if (remaining <= 0) return { finish: null, remaining0: true, lostDays: 0, atRiskDays: 0, ranOut: false };
  let seen = 0, lost = 0, atRisk = 0;
  for (const d of days) {
    if (!d.open) continue;
    if (d.allOut) { lost++; continue; }
    if (d.someOut) atRisk++;
    seen++;
    if (seen === remaining) return { finish: d.date, remaining0: false, lostDays: lost, atRiskDays: atRisk, ranOut: false };
  }
  return { finish: null, remaining0: false, lostDays: lost, atRiskDays: atRisk, ranOut: true };
}

// Block 61 (Q92 pt 2): the finish projection was born on the Coverage page but
// belongs everywhere a manager looks at the floor. This SHARED async helper is
// now the single source of truth — given the live board it returns each
// in-progress cab's projection (coverage-page shape) AND a byOrder map keyed by
// order number, so /coverage, the Meeting Pack floor, and the cockpit all read
// IDENTICALLY. It does its own light reads (shop calendar, approved time off,
// per-line crew) and uses projFinish for the math. Each horizon day object
// carries `date` (the v58 bug: a missing date made projFinish return undefined).
async function cabProjections(board) {
  const HORIZON = 180;
  const phxMid = Math.floor((Date.now() - PHX_OFFSET_MS) / 86400000) * 86400000 + PHX_OFFSET_MS;
  const today = phxDate(phxMid);
  const horizonEnd = phxDate(phxMid + HORIZON * 86400000);
  // Block 212 (v201 SPEED): the three reads are independent — one round trip.
  const [calRows, offRows, emps] = await Promise.all([
    db(`shop_calendar?select=cal_date,is_open&cal_date=gte.${today}&cal_date=lte.${horizonEnd}`).catch(() => []),
    db(`time_off_request?select=employee_id,start_date,end_date&status=eq.approved&end_date=gte.${today}&start_date=lte.${horizonEnd}&order=start_date`).catch(() => []),
    db(`employee?select=id,role,lines&active=is.true`),
  ]);
  const calOv = {};
  for (const r of calRows) calOv[String(r.cal_date).slice(0, 10)] = r.is_open === true;
  const isOpenDay = (d) => (d in calOv ? calOv[d] : (() => { const dw = new Date(d + "T12:00:00Z").getUTCDay(); return dw >= 1 && dw <= 5; })());
  const crewOf = {};   // line id -> [builder ids assigned to it]
  for (const e of emps) if (e.role === "production" && Array.isArray(e.lines)) for (const ln of e.lines) (crewOf[ln] = crewOf[ln] || []).push(e.id);
  const offOn = (id, d) => offRows.some((t) => t.employee_id === id && t.start_date <= d && t.end_date >= d);
  const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtFin = (ds) => ds ? WD[new Date(ds + "T12:00:00Z").getUTCDay()] + " " + MON[Number(ds.slice(5, 7)) - 1] + " " + Number(ds.slice(8, 10)) : null;
  const hdates = [];
  for (let i = 1; i <= HORIZON; i++) hdates.push(phxDate(phxMid + i * 86400000)); // tomorrow onward
  const cabs = [], byOrder = {};
  if (board && Array.isArray(board.lines)) {
    for (const l of board.lines) {
      const c = l.cab;
      if (!c || !c.total_days || Number(c.total_days) <= 0) continue;   // active/rework only (awaiting/fix have 0)
      const remaining = Math.max(0, Number(c.total_days) - Number(c.day || 0));
      const crew = crewOf[l.id] || [];
      const dayArr = hdates.map((d) => {
        const open = isOpenDay(d);
        let allOut = false, someOut = false;
        if (open && crew.length) {
          const outN = crew.filter((id) => offOn(id, d)).length;
          allOut = outN > 0 && outN === crew.length;
          someOut = outN > 0 && outN < crew.length;
        }
        return { date: d, open, allOut, someOut };
      });
      const pf = projFinish(dayArr, remaining);
      const rec = { order: c.order, family: c.family || "", line: l.name, noStd: false,
        remaining0: pf.remaining0, ranOut: pf.ranOut, finish: fmtFin(pf.finish), slip: pf.lostDays, atRisk: pf.atRiskDays };
      cabs.push(rec);
      byOrder[c.order] = rec;
    }
  }
  return { cabs, byOrder };
}

// Block 61: a compact projected-finish phrase for an in-progress cab, reused on
// the Meeting Pack floor + the manager cockpit (same wording as the coverage
// page). Takes a byOrder record from cabProjections(); returns "" when there's
// nothing meaningful to show. All values are server-generated (formatted date +
// integers), so the fragment is safe to inject un-escaped.
function projPhrase(p) {
  if (!p || p.noStd) return "";
  if (p.remaining0) return `<span style="opacity:.6">wrapping up</span>`;
  if (!p.finish) return `<span style="opacity:.6">finish beyond the horizon</span>`;
  const base = `<span style="opacity:.75">finishes ${p.finish}</span>`;
  if (p.slip > 0) return base + ` <span style="color:#ff9f0a">· pushed ${p.slip} day${p.slip === 1 ? "" : "s"} by time off</span>`;
  if (p.atRisk > 0) return base + ` <span style="opacity:.55">· ${p.atRisk} at-risk day${p.atRisk === 1 ? "" : "s"} ahead</span>`;
  return base;
}

// Q92 pt 2: THE COVERAGE CALENDAR. A days-ahead, at-a-glance read of who's
// out (approved time off) laid against the shop calendar, so a manager sees a
// thin day BEFORE it arrives instead of discovering it at 7am. Read-only,
// reuses the shop-calendar work-day rule + the Q92 pt-1 time-off data. `days`
// is pre-assembled by the route; this is a pure render.
function coveragePage(now, days, builderCount, cabs, isAdmin95 = false, emp196 = null) {
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Coverage</title>${style}
<style>
  .mp{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:8px 16px;margin-bottom:14px}
  .crow{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)}
  .crow:last-child{border-bottom:none}
  .cwhen{min-width:96px;font-weight:600}
  .cwhen .sub{display:block;font-weight:400;opacity:.55;font-size:.85em}
  .cmid{flex:1;padding-top:1px}
  .muted{opacity:.6}
  .today{background:rgba(200,16,46,.10);border-radius:10px;margin:0 -8px;padding-left:8px;padding-right:8px}
  .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}
  .g{background:#30d158}.a{background:#ffd60a}.r{background:#ff453a}.n{background:#6b6b70}
  .pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:.82em;background:rgba(255,255,255,.06)}
  @media print{ a{display:none} .mp{break-inside:avoid} }
</style></head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${emp196 ? nav196(emp196) : navBar95(isAdmin95)}
  <h2>Coverage — who's out, days ahead</h2>
  <p class="muted" style="margin-top:-8px;text-align:center">The next ${days.length} days at a glance — approved time off against the shop calendar.${builderCount ? ` ${builderCount} builder${builderCount === 1 ? "" : "s"} on the roster.` : ""} As of ${esc(now)} (Phoenix).</p>
  <div class="mp">
  ${days.map((d) => {
    const cls = d.closed ? "n" : (!builderCount ? "g" : (d.present <= 0 || d.thin ? "r" : d.buildersOut ? "a" : "g"));
    let mid;
    if (d.closed) mid = `<span class="muted">Closed${d.closedReason ? ` — ${esc(d.closedReason)}` : ""}</span>`;
    else {
      const cover = builderCount ? `<span class="pill">${d.present} of ${builderCount} builder${builderCount === 1 ? "" : "s"} in</span>` : `<span class="muted">No builders on the roster yet</span>`;
      const names = d.out.length ? ` <span class="muted">· out: ${d.out.map((o) => esc(o.who) + (o.reason ? ` (${esc(o.reason)})` : "")).join(", ")}</span>` : (builderCount ? ` <span class="muted">· full crew in</span>` : "");
      mid = cover + names;
    }
    return `<div class="crow${d.isToday ? " today" : ""}">
      <div class="cwhen"><span class="dot ${cls}"></span>${esc(d.dow)}<span class="sub">${esc(d.label)}${d.isToday ? " · today" : ""}</span></div>
      <div class="cmid">${mid}</div>
    </div>`;
  }).join("")}
  </div>
  <h3 style="margin:18px 0 6px">Cabs in progress — projected finish</h3>
  <p class="muted" style="margin:0 0 8px;font-size:.85em">Remaining build-days counted forward over open shop days; a whole day the cab's line crew is off pushes the date.</p>
  <div class="mp">
  ${cabs && cabs.length ? cabs.map((c) => {
    const cls = c.noStd ? "n" : c.slip > 0 ? "r" : c.atRisk > 0 ? "a" : "g";
    let right;
    if (c.noStd) right = `<span class="muted">no standard build-days set</span>`;
    else if (c.remaining0) right = `<span class="pill">wrapping up</span>`;
    else if (!c.finish) right = `<span class="muted">beyond the horizon</span>`;
    else right = `<span class="pill">${esc(c.finish)}</span>` + (c.slip > 0 ? ` <span style="color:#ff9f0a">· pushed ${c.slip} day${c.slip === 1 ? "" : "s"} by time off</span>` : (c.atRisk > 0 ? ` <span class="muted">· ${c.atRisk} at-risk day${c.atRisk === 1 ? "" : "s"} ahead</span>` : ""));
    return `<div class="crow"><div class="cwhen"><span class="dot ${cls}"></span>${esc(c.order)}</div><div class="cmid"><span class="muted">${esc(c.line)}${c.family ? " · " + esc(c.family) : ""}</span> — ${right}</div></div>`;
  }).join("") : `<div class="muted" style="padding:8px 0">No cabs in progress.</div>`}
  </div>
  <p class="muted" style="font-size:.85em;text-align:center"><span class="dot g"></span>full crew &nbsp; <span class="dot a"></span>someone out &nbsp; <span class="dot r"></span>thin coverage &nbsp; <span class="dot n"></span>closed. &nbsp; Time off is managed in the Manager console; closed days in the Admin shop calendar.</p>
</div></body></html>`;
}

// THE ADMIN CONSOLE v1 (file 21) — admin role only.
// Three panels this block: EMPLOYEES (roles/departments/lines/active +
// the C18 PIN reset — clearing the PIN sends them back through Q68
// choose-your-PIN at next login) · BUILD STEPS (the Q97 editor: rename,
// hours, day, reorder, retire, add — template edits NEVER touch a started
// cab, its task list froze at start) · FEATURES (the Q65 plain-language
// switches; data keeps computing while OFF, flips are audit-logged).
const DEPTS = ["Production", "Warehouse", "Build", "Body Shop", "Accounting", "Owner", "Marketing"]; // Block 158 (owner-rep E3): "Admin" removed — it is a ROLE (with Team Member, Manager), not a department. DB verified: zero employees carried it.
const ROLES = ["production", "manager", "admin"];
// Block 25 (owner-rep): "production" read wrong as a ROLE next to real
// departments ("Body Shop / production"?). The everyday role now DISPLAYS
// as "Team Member" everywhere — the stored value stays 'production' so
// nothing downstream breaks.
const ROLE_LABEL = { production: "Team Member", manager: "Manager", admin: "Admin" };
// Plain-language names for every toggle key (file 22: no jargon on screens).
const TOGGLE_INFO = {
  tv_board: ["The TV board", "The big board on the shop TV."],
  eod_progress_photo_required: ["End-of-day cab photos — REQUIRED (production)", "OFF = the end-of-day clock-out ASKS for cab progress photos & notes but lets people skip (the training phase). ON = production can't clock out End-of-day from a line until TODAY's cab has at least one progress photo or note — the customer build-report feed. Flip it when the crew is ready; no deploy needed."],
  sms_alerts: ["Text alerts", "Text messages for red lines and daily events. Stays OFF until we go live."],
  email_notifications: ["Email notifications", "System emails. Stays OFF until we go live."],
  line_frees_soon_alert: ["Line-frees-soon heads-up", "A nudge when a line looks like it will open up soon."],
  inspect_before_close_nudge: ["Inspect-before-close nudge", "A reminder to sign off finished cabs before day end."],
  early_red_standards_guard: ["Cab went red too early", "Points out a cab that hit red much sooner than it should — usually a sign the time target is off, not the crew."],
  day_start_nudge: ["Day-start nudge", "A quiet good-morning push at the start of each work day. Never on weekends or closed days (see the Shop calendar)."],
  customer_names_on_tv: ["Customer names on the TV", "Show customer names on the board tiles."],
  tv_sleep: ["Sleep the TV after hours", "Dim the shop-TV board outside working hours and on closed days (saves the screen and power); it wakes on its own when the shop opens."],
  time_off_requests: ["Time-off requests", "Techs can ask for time off from their phones."],
  // Owner-rep call 2026-07-29: reports are an ADMIN thing; the manager's job
  // is running the floor. This switch lets an admin share the page if wanted.
  manager_reports: ["Managers can see Reports", "Let the manager role open the Reports page. OFF = admins only."],
  // Q113 (owner-rep): line open/close is manual control worth having — admins
  // always; this switch decides whether the manager role gets it too.
  manager_line_control: ["Managers can open/close lines", "Let the manager role close a line for the day and reopen it. OFF = admins only."],
  // Q116: the pace early-warning monitor. OFF pauses the whole patrol;
  // delivery is ALSO gated by the Q106 sandbox until cutover regardless.
  pace_warnings: ["Pace early-warning heads-up", "Sends a push the moment a cab crosses into red and needs help. Until we go live, these come only to you."],
  // Block 116 (owner-rep launch call: "easiest launch possible") — both ship
  // OFF; flip them on one at a time when the crew is ready for them.
  notify_email: ["Email notifications", "Also send notifications by EMAIL (from info@premierstreetrod.com) to people with an email on file. Until we go live, these come only to you."],
  notify_sms: ["Text-message notifications", "Also send notifications by TEXT to people with a mobile number on file. Until we go live, these come only to you."],
};
// Q77: friendly names for the admin-editable reason lists (the pick-list
// editor). A list_key not named here still appears, keyed by its raw name.
const PICK_LIST_INFO = {
  clock_out_reason: "Clock-out reasons",
  rework_reason: "Rework reasons",
  after_hours_reason: "After-hours reasons",
  line_down_reason: "Down-for-today reasons",
  time_off_reason: "Time-off reasons",
  absence: "Absence & attendance reasons",
  blocker: "Blocker reasons (waiting on…)",
  hold: "Hold reasons",
  fixjob_reason: "Fix-job reasons",
};
const adminPage = (emps, tmpls, tplId, steps, toggles, cabs = [], nextUp = "", shopHrs = { open: 7, close: 16 }, pickLists = [], products = [], calDays = [], nudgeTimes = {}, optItems = [], afterHours = []) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Admin</title>${style}
<style>
  .panel{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:18px}
  .panel h3{margin:0 0 10px}
  table{width:100%;border-collapse:collapse;font-size:.92rem}
  th{opacity:.55;text-align:left;padding:6px 6px;font-weight:600}
  td{padding:6px 6px;border-top:1px solid var(--line);vertical-align:middle}
  input,select{background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:7px 8px;font-family:inherit;font-size:.92rem}
  input.num{width:4.2em} input.dno{width:3.4em} input.nm{width:100%;min-width:180px} input.ln{width:4.6em}
  .b{background:#3a3a3c;border:none;border-radius:8px;color:#fff;padding:8px 12px;cursor:pointer;font-size:.88rem}
  .b.red{background:var(--red)} .b.grn{background:#1d5a2d}
  .off{opacity:.45}
  .tglrow{display:flex;align-items:center;gap:12px;padding:9px 0;border-top:1px solid var(--line)}
  .tglrow:first-of-type{border-top:none}
  .tglrow small{display:block;opacity:.55}
</style></head>
<body><div class="wrap" style="max-width:980px">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${navBar95(true)}
  <!-- Sticky console nav (Sonnet UX escalation 2026-07-28, C17: the admin
       console was one long scroll with nav buried at the bottom). Tabs jump
       to sections; room to grow toward file 21's nine sections. Same top
       placement as the Manager cockpit (file 22.4: learn it once). -->
  <div style="position:sticky;top:0;z-index:5;background:var(--bg);padding:10px 0;margin-bottom:8px;
              text-align:center;border-bottom:1px solid var(--line)">
    <a href="#people" style="color:#fff;font-weight:700;margin-right:16px">People</a>
    <a href="#steps" style="color:#fff;font-weight:700;margin-right:16px">Build steps</a>
    <a href="#features" style="color:#fff;font-weight:700;margin-right:16px">Features</a>
    <a href="#setup154" onclick="var d=document.getElementById('setup154');if(d)d.open=true" style="color:#fff;font-weight:700;margin-right:16px">Setup</a>
    <a href="#hours" style="color:#fff;font-weight:700;margin-right:16px">Shop hours</a>
    <a href="#calendar" style="color:#fff;font-weight:700;margin-right:16px">Shop calendar</a>
    <a href="#picklists" style="color:#fff;font-weight:700;margin-right:16px">Reason lists</a>
  </div>
  <h2>Admin</h2>

  ${afterHours.length ? `
  <!-- Block 108 (owner-rep): after-hours sign-off queue — ADMIN approval job.
       WHO worked leads each row; sign-off releases the held hours onto pay. -->
  <div class="panel" id="ah108" style="border-color:#7a5900"><h3>After hours — needs your sign-off</h3>
    ${afterHours.map((s) => `<div style="padding:10px 0;border-top:1px solid var(--line)">
      <div style="font-size:1.2rem;font-weight:800">${s.who} <span style="opacity:.6;font-weight:400;font-size:.9rem">— after hours ${s.when}${s.ended && s.hrs != null ? ` · ${s.hrs}h` : ""}</span></div>
      <div style="margin:2px 0 0">${s.lineName}</div>
      <div style="opacity:.7;margin:2px 0 0">${s.reason} · says ${s.appr} approved ${s.plan ? ` · plan: "${s.plan}"` : ""}</div>
      ${s.ended ? `<div style="margin:4px 0 0">wrap-up: "${s.wrap || ""}"${s.photos.length ? s.photos.map((p2, i2) => ` <a href="/photo-view/${p2}" target="_blank" style="color:#ffd60a">&#128247; photo ${i2 + 1}</a>`).join("") : ""}</div>` : `<div style="color:#ffd60a;margin:4px 0 0">(still on the clock — sign off after the wrap-up lands)</div>`}
      <!-- Block 214 (Daniel: "should just be two... one tap"): APPROVE + DENY.
           The old "Confirm approval" was for managers vouching for the claim
           (they still can, from their console); an admin Approve auto-confirms
           server-side, so it was a wasted tap here. No armed second tap. -->
      <div style="margin-top:8px">${s.ended ? `<button class="b grn" onclick="ahSign108('${s.id}',this)">&#10003; Approve — count the hours</button> <button class="b red" onclick="document.getElementById('dc-${s.id}').style.display='block';document.getElementById('dcr-${s.id}').focus()">Deny</button>` : ""}</div>
      ${s.ended ? `<div id="dc-${s.id}" style="display:none;margin-top:6px"><input id="dcr-${s.id}" maxlength="200" placeholder="Why these hours don't count — required, goes on the record" style="min-width:300px"> <button class="b red" onclick="ahDecl110('${s.id}',this)">Deny — hours don't count</button></div>` : ""}
    </div>`).join("")}
    <div style="opacity:.5;font-size:.85rem;margin-top:8px">Approve releases the session's hours onto the timecard — until then they're HELD and flagged on the Pay Worksheet. Deny needs one typed line for the record; the person is notified. Both are one tap.</div>
  </div>` : ""}

  <div class="panel" id="people"><h3>People</h3>
  <div style="background:#1c1c1e;border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:12px">
    <b style="font-size:.9rem">Add a person</b> &nbsp;
    <input id="np-fn" placeholder="First name" style="width:110px"> <input id="np-ln" placeholder="Last name" style="width:110px">
    <select id="np-d">${DEPTS.map((d) => `<option>${d}</option>`).join("")}</select>
    <select id="np-r">${ROLES.map((r) => `<option value="${r}">${ROLE_LABEL[r]}</option>`).join("")}</select>
    <input id="np-l" placeholder="lines e.g. 1,2 (Production only)" style="width:180px">
    <button class="b grn" onclick="addEmp(this)">Add + issue temp code</button>
    <span id="np-msg" style="font-size:.85rem;margin-left:6px"></span>
  </div>
  <table><tr><th>Name</th><th>Department</th><th>Role</th><th>Pay</th><th>Usual lines</th><th></th><th></th><th></th></tr>
  ${emps.map((e) => `<tr class="${e.active ? "" : "off"}">
    <td><b>${e.first_name} ${e.last_name}</b></td>
    <td><select id="d-${e.id}">${DEPTS.map((d) => `<option ${e.department === d ? "selected" : ""}>${d}</option>`).join("")}</select></td>
    <td><select id="r-${e.id}">${ROLES.map((r) => `<option value="${r}" ${e.role === r ? "selected" : ""}>${ROLE_LABEL[r]}</option>`).join("")}</select></td>
    <td><select id="p-${e.id}">${[["hourly", "Hourly"], ["salary", "Salary"], ["na", "Owner — n/a"]].map(([pv, pl]) => `<option value="${pv}" ${(e.pay_type || "hourly") === pv ? "selected" : ""}>${pl}</option>`).join("")}</select></td>   <!-- Block 200: hourly people are payroll; salary/owner stay OFF the Pay Worksheet totals -->
    <td>${e.department === "Production" ? `<input class="ln" id="l-${e.id}" value="${(e.lines || []).join(",")}" placeholder="1,2">` : '<span style="opacity:.35">—</span>'}</td>
    <td><button class="b" onclick="saveEmp('${e.id}',this)">Save</button></td>
    <td><button class="b ${e.active ? "" : "grn"}" onclick="arm(this,()=>setActive('${e.id}',${e.active ? "false" : "true"},this))">${e.active ? "Deactivate" : "Reactivate"}</button></td>
    <td><button class="b ${e.must_change_pin ? "grn" : ""}" onclick="arm(this,()=>resetPin('${e.id}',this))">${e.must_change_pin && e.temp_pin ? `Temp: ${e.temp_pin}` : (e.pin_hash ? "Reset PIN" : "No PIN yet")}</button></td>
  </tr>`).join("")}</table>
  <!-- Q114: the one-tap backfill — every active name without a PIN gets a
       unique temp code. Codes show on the buttons above (admins only see
       this page); the launch-day texts + printed sheet wait for the
       owner-rep's command per Q106. -->
  <p><button class="b" onclick="arm(this,()=>tempPins(this))">Assign temp codes to everyone without a PIN</button></p>
  <p style="opacity:.5;font-size:.85rem">Deactivated people vanish from the sign-in screen but their history stays. Resetting a PIN issues a fresh TEMPORARY code (it appears on the button) — they sign in with it once and are made to choose their own.</p>
  </div>

  <!-- Block 117: the admin side of ⚙ My settings — every person's channel
       switches AND contact info, controllable from one table. -->
  <div class="panel" id="channels117"><h3>Notification channels &amp; contact — per person</h3>
  <p style="opacity:.6;font-size:.9rem">Their role decides WHICH notices they get; these switches decide HOW they arrive. OFF means OFF — nothing overrides these switches right now, and every notice ALWAYS lands in the person's bell inbox regardless. People can also flip their own Push and Text from the &#9881; gear beside the bell (Block 204). Text sending additionally needs the Text channel set up under Tools.</p>
  <!-- Block 171 (owner ruling): the Email toggle + Email address columns are
       hidden with the rest of the email channel — the stored addresses stay in
       the database untouched for a future revisit. -->
  <table><tr><th>Name</th><th>Push</th><th>Text</th><th>Mobile #</th><th></th></tr>
  ${emps.filter((e) => e.active).map((e) => `<tr>
    <td><b>${e.first_name} ${e.last_name}</b></td>
    <td><button class="b ${e.notify_push === false ? "" : "grn"}" onclick="chan117('${e.id}','push',${e.notify_push === false},this)">${e.notify_push === false ? "OFF" : "ON"}</button></td>
    <td><button class="b ${e.notify_sms === false ? "" : "grn"}" onclick="chan117('${e.id}','sms',${e.notify_sms === false},this)">${e.notify_sms === false ? "OFF" : "ON"}</button></td>
    <td><input id="cm-${e.id}" value="${e.mobile || ""}" placeholder="602 555 0117" style="width:120px"></td>
    <td><button class="b" onclick="contact117('${e.id}',this)">Save</button></td>
  </tr>`).join("")}</table>
  <p style="opacity:.5;font-size:.85rem">A switch only matters once its channel is ON under Features and set up in "Text setup" below. Push also needs the person to allow notifications on their device (the bell).</p>
  </div>

  <div class="panel" id="steps"><h3>Build steps</h3>
  <!-- C18: switching cabs is a full page load (?tpl=), which used to dump
       the scroll back to the top — the #steps fragment lands you right here. -->
  <p>${tmpls.map((t) => t.id === tplId
    ? `<b style="color:var(--red)">${t.family}</b>`
    : `<a href="/admin?tpl=${t.id}#steps" style="color:#8e8e93">${t.family}</a>`).join(" · ")}</p>
  <table><tr><th>#</th><th>Step</th><th>Day</th><th>Hours</th><th></th><th></th><th></th></tr>
  ${steps.map((s, i) => `<tr>
    <td><input class="dno" id="sn-${s.id}" value="${s.display_no}"></td>
    <td><input class="nm" id="sm-${s.id}" value="${String(s.name).replace(/"/g, "&quot;")}">${s.is_background ? `<small style="opacity:.5"> background</small>` : ""}</td>
    <td><input class="num" id="sd-${s.id}" value="${s.day_end ? `${s.day_no},${s.day_end}` : s.day_no}"></td>
    <td><input class="num" id="sh-${s.id}" value="${Number(s.man_hours)}"></td>
    <td><button class="b" onclick="saveStep('${s.id}',this)">Save</button></td>
    <td>${i > 0 ? `<button class="b" onclick="moveStep('${s.id}','up',this)">&uarr;</button>` : ""}
        ${i < steps.length - 1 ? `<button class="b" onclick="moveStep('${s.id}','down',this)">&darr;</button>` : ""}</td>
    <td><button class="b red" onclick="arm(this,()=>retireStep('${s.id}'))">Retire</button></td>
  </tr>`).join("")}</table>
  <p style="margin-top:10px">Add a step:
    <input class="dno" id="new-no" placeholder="#"> <input class="nm" id="new-name" style="min-width:220px" placeholder="Step name">
    Day <input class="num" id="new-day" value="1" title="4, or 4,5 for a step that carries over"> Hrs <input class="num" id="new-hrs" value="1">
    <button class="b" onclick="addStep('${tplId}',this)">Add</button></p>
  <h3 style="margin-top:20px">Upgrade options — ${(tmpls.find((t) => t.id === tplId) || {}).family || ""}</h3>
  <p style="opacity:.55;font-size:.85rem;margin:-4px 0 8px">Type each option EXACTLY as Coyote sends it (Label: Value). Hours extend a cab's clock; Day is where it lands in the build. These match automatically when a new cab starts — an option Coyote sends that isn't here gets flagged, never guessed.</p>
  <table><tr><th>Option (exact Coyote text)</th><th>Hrs</th><th>Day</th><th></th><th></th></tr>
  ${optItems.filter((o) => !o.kit_only).map((o) => `<tr${o.retired ? ' style="opacity:.45"' : ""}>
    <td${o.retired ? ' style="text-decoration:line-through"' : ""}><code>${o.match_text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</code></td>
    <td><input class="num" id="op-h-${o.id}" value="${o.man_hours}"></td>
    <td><input class="num" id="op-d-${o.id}" value="${o.day_no}"></td>
    <td>${o.retired ? "" : `<button class="b" onclick="saveOpt('${o.id}',this)">Save</button>`}</td>
    <td><button class="b ${o.retired ? "grn" : "red"}" onclick="arm(this,()=>toggleOpt('${o.id}','${o.retired ? "restore" : "retire"}',this))">${o.retired ? "Restore" : "Retire"}</button></td>
  </tr>`).join("")}</table>
  ${((kc) => kc ? `<p style="opacity:.45;font-size:.8rem;margin:6px 0 0">${kc} kit-item line${kc === 1 ? "" : "s"} recognized silently — sheet-metal-kit parts, not cab work; hidden here (block 137).</p>` : "")(optItems.filter((o) => o.kit_only).length)}
  <p style="margin-top:10px">Add an option:
    <input id="op-new-text" style="min-width:280px" placeholder="Back Window: 5 Window (Corner Windows)">
    Hrs <input class="num" id="op-new-hrs" value="1"> Day <input class="num" id="op-new-day" value="1">
    <button class="b" onclick="addOpt('${tplId}',this)">Add</button></p>
  <p style="opacity:.5;font-size:.85rem">Changes apply to FUTURE cabs only — a cab already started keeps the exact list it started with. Retired steps keep their history and drop off new builds.</p>
  </div>

  <div class="panel" id="features"><h3>Features</h3>
  ${toggles.filter((t) => t.key !== "notify_email" && t.key !== "email_notifications").map((t) => { const info = TOGGLE_INFO[t.key] || [t.key, ""]; return `
    <div class="tglrow"><div style="flex:1"><b>${info[0]}</b><small>${info[1]}</small></div>
    <b style="opacity:.7">${t.enabled ? "ON" : "OFF"}</b>
    <button class="b ${t.enabled ? "red" : "grn"}" onclick="flip('${t.key}',${t.enabled ? "false" : "true"},this)">Turn ${t.enabled ? "OFF" : "ON"}</button></div>`; }).join("")}
  <p style="opacity:.5;font-size:.85rem">Everything keeps tracking underneath while a feature is OFF — turning it back ON reveals full history. Every flip is logged.</p>
  </div>

  <!-- Block 116: outbound channels — prove email + SMS work BEFORE cutover.
       Credentials live on Railway (the owner pastes them, never in code);
       this panel only shows whether they are present and fires ONE explicit
       test to a typed address/number. Day-to-day routing stays behind the
       Features switches above. -->
  <!-- Block 154 (owner-rep D6): the two set-once panels collapse behind a
       "Setup" fold at the bottom of daily life; the Tools menu deep-links
       here (a hash visit auto-opens the fold). -->
  <details id="setup154"><summary style="cursor:pointer;color:#8e8e93;font-weight:700;padding:10px 0">Setup — rarely needed (Text &amp; cab numbers)</summary>
  <div class="panel" id="channels116"><h3>Text setup</h3>
  <!-- Block 171 (owner ruling): the Email half of this panel is hidden with
       the rest of the email channel (the M365 SMTP route is a dead end —
       app password on the info@ admin account, and Microsoft retires basic
       SMTP AUTH Dec 2026). sendEmail116 and the SMTP env slots stay for a
       future transactional-API revisit. -->
  <div class="tglrow"><div style="flex:1"><b>Text messages — through Twilio</b>
    <small>${SMS_READY ? "Credentials are on file. Text yourself to prove the number works." : "Waiting on credentials — add TWILIO_SID, TWILIO_TOKEN and TWILIO_FROM on Railway; the app picks them up on its next deploy."}</small></div>
    <b style="opacity:.7">${SMS_READY ? "READY" : "NOT SET UP"}</b></div>
  ${SMS_READY ? `<div style="padding:6px 0 10px">Send a test text to
    <input id="t116-sm" style="min-width:170px" placeholder="602 555 0117">
    <button class="b" onclick="test116('sms','t116-sm',this)">Send test text</button></div>` : ""}
  <p style="padding:6px 0 0"><button class="b" onclick="samples117(this)">Send me the sample set — one of each notice</button><br>
  <span style="opacity:.5;font-size:.85rem">Fires a realistic example of every notice the system sends (inspection ready, after-hours clock-in and wrap-up, ship risk, red cab, upgrades needing hours) through the real pipe — sandboxed to you, on every channel that's on for you.</span></p>
  <p style="opacity:.5;font-size:.85rem">Tests go ONLY to the number you type, and each one is logged. Everyday sending stays off until the "Text-message notifications" switch above is ON — and until we go live, even that reroutes to you.</p>
  </div>

  <!-- CAB NUMBERS (Q110): the wall board's internal cab # (244T, 305A…).
       Until cutover THE WALL OWNS THE COUNTER — type here exactly what the
       whiteboard says. Every set is audited. At cutover the app takes the
       counter over from the verified high-water marks and assigns the next
       number itself when an order arrives from Coyote. -->
  <div class="panel" id="cabnums"><h3>Cab numbers</h3>
  ${nextUp ? `<p style="opacity:.7">Next up by family (from what's entered so far): <b>${nextUp}</b> — check this against the whiteboard.</p>` : `<p style="opacity:.5">No cab numbers entered yet — the "next up" readout appears once some are in.</p>`}
  ${cabs.length ? `<table><tr><th>Order</th><th>Product</th><th>State</th><th>Cab #</th><th></th></tr>
  ${cabs.map((b) => `<tr>
    <td><b>${b.order_number}</b></td><td>${b.part_number || ""}</td><td>${String(b.state).replace(/_/g, " ")}</td>
    <td><input class="ln" id="cn-${b.id}" value="${b.cab_number || ""}" placeholder="244T"></td>
    <td><button class="b" onclick="saveCab('${b.id}',this)">Save</button></td>
  </tr>`).join("")}</table>` : `<div style="opacity:.6">No open or upcoming cabs.</div>`}
  <p style="opacity:.5;font-size:.85rem">Number + family letter, exactly as the wall shows it (T=55-59 · A=47-53 · C=67-72 C10 · F=67-72 Ford · B=Blazer · D=64-66). Numbers are never reused — a cancelled cab's number stays burned.</p>
  </div>

  <!-- Q113: the shop day, as settings. Everything derives from these two
       numbers — the day-end sweeper, after-hours detection, the board's
       master chip. Phoenix time, 24-hour numbers. -->
  </details>
  <div class="panel" id="hours"><h3>Shop hours</h3>
  <p>Open <input class="num" id="sh-open" value="${shopHrs.open}"> &nbsp; Close <input class="num" id="sh-close" value="${shopHrs.close}">
    <button class="b" onclick="saveHours(this)">Save</button>
    <span style="opacity:.55;margin-left:12px">24-hour numbers, Phoenix time — 7 and 16 mean 7:00 AM to 4:00 PM.</span></p>
  <p style="opacity:.5;font-size:.85rem">Outside these hours (and on weekends) the clock-in screen asks for after-hours approval, the sweeper closes forgotten punches, and the TV board's chip flips. Changes take effect within a minute.</p>
  </div>

  <!-- Q77: the reason-list editor. Every dropdown of reasons in the app is an
       admin-managed pick list; this panel adds/renames/reorders/retires the
       choices in each. Retire-not-delete keeps history intact. -->
  <div class="panel" id="picklists"><h3>Reason lists</h3>
  <p style="opacity:.5;font-size:.85rem">These are the choices staff and managers pick from around the app (clock-out reasons, rework reasons, and so on). Rename, reorder, add, or retire them here — retiring keeps past records intact and just drops the choice off new menus.</p>
  ${pickLists.map((pl) => `
    <div style="margin-top:16px">
      <b>${pl.label}</b>
      ${pl.items.length ? `<table style="margin-top:6px"><tr><th>Choice</th><th></th><th></th><th></th></tr>
      ${pl.items.map((it, i) => `<tr>
        <td><input class="nm" id="pl-${it.id}" value="${String(it.label).replace(/"/g, "&quot;")}"></td>
        <td><button class="b" onclick="savePick('${it.id}',this)">Save</button></td>
        <td>${i > 0 ? `<button class="b" onclick="movePick('${it.id}','up',this)">&uarr;</button>` : ""}${i < pl.items.length - 1 ? `<button class="b" onclick="movePick('${it.id}','down',this)">&darr;</button>` : ""}</td>
        <td><button class="b red" onclick="arm(this,()=>retirePick('${it.id}',true))">Retire</button></td>
      </tr>`).join("")}</table>` : `<div style="opacity:.6;font-size:.9rem">No active choices — add one below.</div>`}
      <p style="margin-top:6px"><input class="nm" id="pladd-${pl.key}" style="min-width:200px" placeholder="New choice"> <button class="b" onclick="addPick('${pl.key}',this)">Add</button></p>
      ${pl.retired.length ? `<p style="opacity:.55;font-size:.85rem">Retired: ${pl.retired.map((r) => `${String(r.label).replace(/</g, "&lt;")} <button class="b grn" style="padding:3px 8px" onclick="retirePick('${r.id}',false,this)">Restore</button>`).join(" &nbsp; ")}</p>` : ""}
    </div>`).join("")}
  </div>

  <!-- Q86: per-product completion-photo minimums. A cab of a product can't be
       sent to inspection until this many completion photos are attached
       (0 = no photo required for that product). Default 1. -->
  <div class="panel" id="products"><h3>Product settings — completion photos</h3>
  <p style="opacity:.5;font-size:.85rem">How many completion photos a builder must attach before finishing a cab of each product. Default is 1. Set 0 to exempt a product. This is a hard gate — the phone's Finish button won't send without them.</p>
  ${products.length ? `<table><tr><th>Product</th><th>Family</th><th>Min photos</th><th></th></tr>
  ${products.map((p) => `<tr>
    <td><b>${String(p.part_number).replace(/</g, "&lt;")}</b></td><td>${String(p.family || "").replace(/</g, "&lt;")}</td>
    <td><input class="num" id="pm-${p.part_number}" value="${p.photo_min}" inputmode="numeric"></td>
    <td><button class="b" onclick="savePhotoMin('${String(p.part_number).replace(/'/g, "\\'")}',this)">Save</button></td>
  </tr>`).join("")}</table>` : `<div style="opacity:.6">No products in the catalog yet.</div>`}
  </div>

  <!-- Q91: SHOP CALENDAR — the shop runs Mon-Fri 7-4 by default; this marks the
       exceptions (holidays closed, or a rare worked Saturday open) and sets the
       morning day-start nudge times. The nudge itself is switched on under Features. -->
  <div class="panel" id="calendar"><h3>Shop calendar — open &amp; closed days</h3>
  <p style="opacity:.5;font-size:.85rem">The shop runs Monday–Friday, 7 to 4. Mark a holiday or shutdown day CLOSED here, or mark a weekend OPEN if you're working it. Days you don't list follow the normal week. The day-start nudge (turn it on under Features) skips any closed day automatically.</p>

  <h4 style="margin:14px 0 6px">Day-start nudge times <span style="opacity:.5;font-weight:400;font-size:.85rem">(Phoenix, 24-hour)</span></h4>
  <table><tr><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th></th></tr>
  <tr>
    <td><input id="ng-mon" value="${nudgeTimes.mon || "07:35"}" style="width:5em"></td>
    <td><input id="ng-tue" value="${nudgeTimes.tue || "07:05"}" style="width:5em"></td>
    <td><input id="ng-wed" value="${nudgeTimes.wed || "07:05"}" style="width:5em"></td>
    <td><input id="ng-thu" value="${nudgeTimes.thu || "07:05"}" style="width:5em"></td>
    <td><input id="ng-fri" value="${nudgeTimes.fri || "07:05"}" style="width:5em"></td>
    <td><button class="b" onclick="saveNudge(this)">Save times</button></td>
  </tr></table>

  <h4 style="margin:18px 0 6px">Closed / open days</h4>
  ${calDays.length ? `<table><tr><th>Date</th><th>Status</th><th>Reason</th><th></th></tr>
  ${calDays.map((d) => { const ds = String(d.cal_date).slice(0, 10); const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(ds + "T12:00:00Z").getUTCDay()]; return `<tr>
    <td><b>${ds}</b> <span style="opacity:.5">${wd}</span></td>
    <td>${d.is_open ? '<span style="color:#30d158">OPEN</span>' : '<span style="color:#ff453a">CLOSED</span>'}</td>
    <td>${String(d.reason || "").replace(/</g, "&lt;")}</td>
    <td><button class="back" style="color:#fff;background:#3a3a3c;border-radius:8px" onclick="arm(this,()=>removeCalDay('${ds}',this))">Remove</button></td>
  </tr>`; }).join("")}</table>` : `<div style="opacity:.6">No exceptions listed — the normal Mon–Fri week applies.</div>`}

  <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <input type="date" id="cal-date" style="color:#fff">
    <input id="cal-reason" placeholder="Reason (e.g. Christmas)" style="min-width:14em">
    <button class="b" style="background:#5a1d1d;border-color:#ff453a" onclick="saveCalendar(false,this)">Mark CLOSED</button>
    <button class="b" style="background:#1d3a24;border-color:#30d158" onclick="saveCalendar(true,this)">Mark OPEN</button>
  </div>
  </div>

  <div class="msg err" id="err"></div>
  <p style="text-align:center"><a href="/manager" style="color:#8e8e93;margin-right:24px">Manager console</a>
  <a href="/shopboard" style="color:#8e8e93;margin-right:24px">Shop board</a>
  <a href="/logout" style="color:#8e8e93">Sign out</a></p>
</div>
<script>
  // Same sturdy pattern as the cockpit: plain global handlers, no dialogs.
  // Destructive taps use arm(): first tap arms the button, second fires.
  function arm(btn, fn){ if (btn.dataset.armed) { fn(); } else { btn.dataset.armed = "1"; const orig97 = btn.textContent; btn.textContent = "Sure? Tap again"; setTimeout(() => { btn.dataset.armed = ""; btn.textContent = orig97; }, 4000); } }
  async function post(url, payload, btn){
    if (btn) { btn.disabled = true; }
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const out = await r.json();
      if (out.ok) {
        // Block 100 (owner-rep): a silent reload after Save read as "the button
        // does nothing" — the numbers re-render identical, so nothing LOOKS
        // different. Flash the win on the button itself, then refresh.
        if (btn) { btn.textContent = "\u2713 Saved"; btn.classList.add("grn"); }
        setTimeout(() => location.reload(), 650); return;
      }
      showErrA(btn, out.error || "Something went wrong");
    } catch(e){ showErrA(btn, "Network hiccup — try again"); }
    if (btn) { btn.disabled = false; }
  }
  // Block 108: after-hours confirm + SIGN-OFF from the admin console.
  async function ahConf108(id, btn){
    btn.disabled = true;
    try {
      const r = await fetch("/api/afterhours/confirm", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: id }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      showErrA(btn, out.error || "Something went wrong");
    } catch(e){ showErrA(btn, "Network hiccup — try again"); }
    btn.disabled = false;
  }
  async function ahSign108(id, btn){
    btn.disabled = true; btn.textContent = "…";
    try {
      const r = await fetch("/api/afterhours/signoff", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: id }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      showErrA(btn, out.error || "Something went wrong");
    } catch(e){ showErrA(btn, "Network hiccup — try again"); }
    btn.disabled = false; btn.textContent = "\u2713 Approve — count the hours";
  }
  // Block 110: decline with a typed reason — refuses the hours for good.
  async function ahDecl110(id, btn){
    const rsn = (document.getElementById("dcr-" + id) || { value: "" }).value.trim();
    if (!rsn) { showErrA(btn, "Type the reason first"); return; }
    btn.disabled = true;
    try {
      const r = await fetch("/api/afterhours/decline", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: id, reason: rsn }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      showErrA(btn, out.error || "Something went wrong");
    } catch(e){ showErrA(btn, "Network hiccup — try again"); }
    btn.disabled = false;
  }
  // Block 100: errors land NEXT to the button you tapped (the bottom-of-page
  // line was invisible mid-scroll on this long console) — bottom kept as backup.
  function showErrA(btn, msg){
    document.getElementById("err").textContent = msg;
    if (!btn) return;
    let s = btn.nextElementSibling;
    if (!s || !s.classList || !s.classList.contains("berrA")) {
      s = document.createElement("span"); s.className = "berrA";
      s.style.cssText = "color:#ff453a;font-size:.85rem;margin-left:8px";
      btn.insertAdjacentElement("afterend", s);
    }
    s.textContent = msg;
  }
  const v = (id) => document.getElementById(id).value;
  function addEmp(btn){
    // On success the page reloads and the new row's PIN button shows Temp: XXXX.
    post("/api/admin/employee", { add: true, first_name: v("np-fn"), last_name: v("np-ln"),
      department: v("np-d"), role: v("np-r"),
      lines: v("np-l") ? v("np-l").split(",").map(Number) : [] }, btn);
  }
  function saveEmp(id, btn){
    // Block 183: the lines box only renders for Production rows — reading it
    // unconditionally threw for every other department and killed the Save
    // silently (found live: moving Body Shop -> manager did nothing).
    const le183 = document.getElementById("l-"+id);
    post("/api/admin/employee", { id, department: v("d-"+id), role: v("r-"+id), pay_type: v("p-"+id),
      lines: le183 ? le183.value.split(",").map(s=>Number(s.trim())).filter(n=>n>0) : [] }, btn); }
  function setActive(id, to, btn){ post("/api/admin/employee", { id, active: to === "true" || to === true }, btn); }
  // Q114: reset now ISSUES a temp code (the old reset opened the Q68 hole).
  async function resetPin(id, btn){
    try {
      const r = await fetch("/api/admin/employee", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reset_pin: true }) });
      const out = await r.json();
      if (out.ok) { btn.textContent = "Temp: " + out.temp_pin; btn.classList.add("grn"); }
      else document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
  }
  async function tempPins(btn){
    btn.disabled = true; btn.textContent = "Assigning…";
    try {
      const r = await fetch("/api/admin/temp-pins", { method: "POST" });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false; btn.textContent = "Assign temp codes to everyone without a PIN";
  }
  function saveStep(id, btn){ post("/api/admin/step", { action: "update", id, display_no: v("sn-"+id),
    name: v("sm-"+id), day_no: v("sd-"+id), man_hours: Number(v("sh-"+id)) }, btn); }
  function moveStep(id, dir, btn){ post("/api/admin/step", { action: "move", id, dir }, btn); }
  function retireStep(id){ post("/api/admin/step", { action: "retire", id }); }
  function addOpt(tplId, btn){ post("/api/admin/option", { action: "add", template_id: tplId, match_text: v("op-new-text"), man_hours: Number(v("op-new-hrs")), day_no: Number(v("op-new-day")) }, btn); }
  function saveOpt(id, btn){ post("/api/admin/option", { action: "update", id, man_hours: Number(v("op-h-"+id)), day_no: Number(v("op-d-"+id)) }, btn); }
  function toggleOpt(id, to, btn){ post("/api/admin/option", { action: to, id }, btn); }
  function addStep(tplId, btn){ post("/api/admin/step", { action: "add", template_id: tplId,
    display_no: v("new-no"), name: v("new-name"), day_no: v("new-day"), man_hours: Number(v("new-hrs")) }, btn); }
  function flip(key, to, btn){ post("/api/admin/toggle", { key, enabled: to === true || to === "true" }, btn); }
  // Block 154 (D6): a #setup154 / #channels116 / #cabnums deep link opens the Setup fold.
  if (["#setup154", "#channels116", "#cabnums"].indexOf(location.hash) > -1) { var d154 = document.getElementById("setup154"); if (d154) { d154.open = true; setTimeout(function(){ var t154 = document.getElementById(location.hash.slice(1)); if (t154) t154.scrollIntoView(); }, 50); } }
  // Block 117: per-person channels + contact, and the sample-set button.
  function chan117(id, ch, to, btn){ post("/api/admin/channels", { employee_id: id, channel: ch, enabled: to === true || to === "true" }, btn); }
  function contact117(id, btn){ post("/api/admin/contact", { employee_id: id, mobile: v("cm-"+id) }, btn); }   // Block 171: email key never sent — the server leaves stored addresses alone
  async function samples117(btn){
    btn.disabled = true; const was = btn.textContent; btn.textContent = "Sending the set…";
    try {
      const r = await fetch("/api/notify/samples", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const out = await r.json();
      if (out.ok) { btn.textContent = "✓ Sent — check your phone"; btn.classList.add("grn");
        setTimeout(() => { btn.textContent = was; btn.classList.remove("grn"); btn.disabled = false; }, 8000); return; }
      showErrA(btn, out.error || "Something went wrong");
    } catch(e){ showErrA(btn, "Network hiccup — try again"); }
    btn.textContent = was; btn.disabled = false;
  }
  // Block 116: explicit one-shot channel test — no reload; the button tells the story.
  async function test116(channel, inputId, btn){
    const to = v(inputId).trim();
    if (!to) return showErrA(btn, channel === "email" ? "Type the address first" : "Type the number first");
    btn.disabled = true; const was = btn.textContent; btn.textContent = "Sending…";
    try {
      const r = await fetch("/api/notify/test", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, to }) });
      const out = await r.json();
      if (out.ok) { btn.textContent = "✓ Sent — go check"; btn.classList.add("grn");
        setTimeout(() => { btn.textContent = was; btn.classList.remove("grn"); btn.disabled = false; }, 6000); return; }
      showErrA(btn, out.error || "Something went wrong");
    } catch(e){ showErrA(btn, "Network hiccup — try again"); }
    btn.textContent = was; btn.disabled = false;
  }
  function saveCab(id, btn){ post("/api/admin/cab-number", { build_id: id, cab_number: v("cn-"+id) }, btn); }
  function savePhotoMin(part, btn){ post("/api/admin/product", { part_number: part, photo_min: Number(v("pm-"+part)) }, btn); }
  function saveHours(btn){ post("/api/admin/shop-hours", { open: Number(v("sh-open")), close: Number(v("sh-close")) }, btn); }
  // Q91: shop calendar + day-start nudge times.
  function saveNudge(btn){ post("/api/admin/nudge-times", { mon: v("ng-mon"), tue: v("ng-tue"), wed: v("ng-wed"), thu: v("ng-thu"), fri: v("ng-fri") }, btn); }
  function saveCalendar(isOpen, btn){ post("/api/admin/calendar", { action: "set", cal_date: v("cal-date"), is_open: isOpen, reason: v("cal-reason") }, btn); }
  function removeCalDay(date, btn){ post("/api/admin/calendar", { action: "remove", cal_date: date }, btn); }
  // Q77: the reason-list (pick-list) editor — same post()/v()/arm() pattern.
  function savePick(id, btn){ post("/api/admin/picklist", { action: "rename", id, label: v("pl-"+id) }, btn); }
  function movePick(id, dir, btn){ post("/api/admin/picklist", { action: "move", id, dir }, btn); }
  function retirePick(id, to, btn){ post("/api/admin/picklist", { action: "retire", id, retired: to === true || to === "true" }, btn); }
  function addPick(listKey, btn){ post("/api/admin/picklist", { action: "add", list_key: listKey, label: v("pladd-"+listKey) }, btn); }
</script></body></html>`;

// REPORTS v1 (file 12 / Q26, block 19) — the first slice of the reporting
// suite, built ONLY from data the app already captures (no new data entry):
//   · Completed cabs: actual vs standard man-hours, per cab and per product
//     (file 12 suite 2 — "the money report")
//   · Open cabs aging list (suite 1)
//   · Labor hours per employee for the period (suite 3 basics)
//   · Rework count + reasons for the period (suite 5 basics)
//   · CSV export of each table (file 12 universal controls)
// Time basis (C15/Q103): ACTUAL hours = clock coverage on the cab's line
// between start and sign-off — never summed task spans. Times shown in
// Phoenix (Q82). Deeper suites (auto-tune, downtime, forecasting, digests)
// arrive in later blocks; this page is built to grow.
const phxHM = (ts) => ts ? new Date(new Date(ts).getTime() - 7 * 3600000).toISOString().slice(0, 16).replace("T", " ") : "";
const phxDate = (ms) => new Date(ms - 7 * 3600000).toISOString().slice(0, 10);

// Turn the raw clock_event stream (ascending) into closed work intervals:
// a clock_in opens one on its line; the SAME employee's next clock_out of
// any kind closes it. Still-open intervals clip at `now` so live work counts.
// Block 127 (M3, B2): fix-labor hours per order. Pairs each Fix-work clock-in
// (which carries fix_build_id) with the tech's next clock-out and sums the elapsed
// time per build. Non-fix intervals are ignored; a still-open fix counts to now.
function fixHoursByBuild(evs) {
  const open = {}, sums = {}, now = Date.now();
  const close = (emp, t) => { const o = open[emp]; if (o) { if (o.line === FIX_LINE_ID && o.fix) sums[o.fix] = (sums[o.fix] || 0) + (t - o.start); open[emp] = null; } };
  for (const e of evs) {
    const t = new Date(e.claimed_at).getTime();
    if (e.kind === "clock_in") { close(e.employee_id, t); open[e.employee_id] = { start: t, line: e.line_id, fix: e.fix_build_id }; }
    else close(e.employee_id, t);
  }
  for (const emp in open) { const o = open[emp]; if (o && o.line === FIX_LINE_ID && o.fix) sums[o.fix] = (sums[o.fix] || 0) + (now - o.start); }
  const out = {}; for (const k in sums) out[k] = sums[k] / 3600000;
  return out;
}
function workIntervals(events, nowMs) {
  const open = {}; const out = [];
  for (const ev of events) {
    const t = new Date(ev.claimed_at).getTime();
    if (ev.kind === "clock_in") { open[ev.employee_id] = { emp: ev.employee_id, line: ev.line_id, start: t }; }
    else if (open[ev.employee_id]) { out.push({ ...open[ev.employee_id], end: t }); delete open[ev.employee_id]; }
  }
  for (const k of Object.keys(open)) out.push({ ...open[k], end: nowMs });
  return out;
}
// Hours of an interval that overlap a window — the one clipping rule every
// report below shares.
const overlapHrs = (iv, a, b) => Math.max(0, (Math.min(iv.end, b) - Math.max(iv.start, a)) / 3600000);

// Q111 pt 2: a correction must leave a day's punches SANE — sorted by time
// they must alternate in/out. A span may carry IN from the previous evening
// or run OUT past midnight, so a day may open with an out or close with an
// in; what it may never do is show the same kind twice in a row.
function punchesAlternate(evs) {
  const sorted = [...evs].sort((a, b) => new Date(a.claimed_at) - new Date(b.claimed_at));
  for (let i = 1; i < sorted.length; i++)
    if ((sorted[i - 1].kind === "clock_in") === (sorted[i].kind === "clock_in")) return false;
  return true;
}
// Phoenix midnight of a YYYY-MM-DD string, as real ms (AZ never shifts).
const phxDayStart = (d) => Date.parse(d + "T00:00:00Z") + 7 * 3600000;
// A punch's Phoenix wall-clock HH:MM — what the corrector's inputs speak.
const phxHHMM = (ts) => { const d = new Date(new Date(ts).getTime() - 7 * 3600000); return String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0"); };

// Q119: parse the reports period from the query — clear presets (rolling
// "last N days" and calendar to-date) plus a custom From/To range. Returns
// the window [startMs, endMs), a human label, the exact date range to show,
// and the querystring to carry on links + CSV.
function reportPeriod(params) {
  const nowMs = Date.now();
  const today = phxDate(nowMs);                 // Phoenix YYYY-MM-DD
  const todayStart = phxDayStart(today);
  const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const from = params.get("from"), to = params.get("to");
  if (isDate(from) && isDate(to)) {
    let f = from, t = to;
    if (phxDayStart(f) > phxDayStart(t)) { const x = f; f = t; t = x; }   // swap-safe
    return { startMs: phxDayStart(f), endMs: phxDayStart(t) + 86400000, preset: "custom",
      from: f, to: t, label: "Custom", rangeText: f === t ? f : `${f} → ${t}`, qs: `from=${f}&to=${t}` };
  }
  let preset = params.get("preset") || "last30";
  let startMs, label;
  if (preset === "last7") { startMs = todayStart - 6 * 86400000; label = "Last 7 days"; }
  else if (preset === "last90") { startMs = todayStart - 89 * 86400000; label = "Last 90 days"; }
  else if (preset === "wtd") { const dow = new Date(today + "T00:00:00Z").getUTCDay(); startMs = todayStart - ((dow + 6) % 7) * 86400000; label = "This week"; }
  else if (preset === "mtd") { startMs = phxDayStart(today.slice(0, 8) + "01"); label = "This month"; }
  else if (preset === "ytd") { startMs = phxDayStart(today.slice(0, 4) + "-01-01"); label = "This year"; }
  else { preset = "last30"; startMs = todayStart - 29 * 86400000; label = "Last 30 days"; }
  return { startMs, endMs: nowMs, preset, from: "", to: "", label,
    rangeText: `${phxDate(startMs)} → ${today}`, qs: `preset=${preset}` };
}

async function reportData(startMs, endMs) {
  // Q119: the window is now an explicit [startMs, endMs) range (a preset or a
  // custom From/To), not "last N days". nowMs stays REAL now for the live
  // snapshots (open intervals, open-cab aging); winEnd bounds the window.
  const nowMs = Date.now();
  const sinceMs = startMs;
  const winEnd = endMs;
  // Block 212 (v201 SPEED): the eight independent reads → one round trip.
  // Same queries verbatim: sign-off/rework/fix moments live in the append-only
  // event log (spec §3); Q86 actor_id on the sign-off event = WHO passed
  // steel; the 10k clock_event read keeps the board engine's windowing caveat.
  const [lines, empsAllR215, builds, compEv, rwEv, fxEv, events, ahSess] = await Promise.all([
    db(`line?select=id,name&order=id`),
    db(`employee?select=id,first_name,last_name,active,role`),
    db(`build?select=id,order_number,part_number,cab_number,line_id,state,started_at,promised_finish,rework_reason&order=created_at`),
    db(`event_log?select=at,actor_id,payload&event_type=eq.build.production_complete&order=at.asc&limit=2000`),
    db(`event_log?select=at,payload&event_type=eq.build.rework_assigned&order=at.asc&limit=2000`),
    db(`event_log?select=at,payload&event_type=eq.build.fixjob_opened&order=at.asc&limit=2000`),
    db(`clock_event?select=employee_id,line_id,kind,reason,claimed_at,corrected_by,added_by,correction_note&voided=is.false&order=claimed_at.asc&limit=10000`),
    db(`after_hours_session?select=id,employee_id,reason,approved_by,confirmed_by,signed_off_by,declined_by,decline_reason,started_at,ended_at&started_at=gte.${new Date(sinceMs).toISOString()}&started_at=lt.${new Date(winEnd).toISOString()}`),
  ]);
  const emps = empsAllR215.filter((e) => !isTestAcct215(e));   // Block 215: Zz Test-Account never reaches reports
  const ivs = workIntervals(events, nowMs);
  const lineName = {}; for (const l of lines) lineName[l.id] = l.name;
  // Latest sign-off per build (a rework loop can sign off twice — last wins).
  // Q86: WHO signed it off travels with the same last-wins rule — the actor plus
  // the role captured at sign-off (by_role; falls back to the signer's CURRENT
  // role for events logged before block 62) so an ADMIN sign-off (the manager
  // was out, duties flowed up) can be tagged in the record.
  const nameOf = {}, roleOf = {};
  for (const p of emps) { nameOf[p.id] = `${p.first_name} ${p.last_name ? p.last_name[0] + "." : ""}`.trim(); roleOf[p.id] = p.role; }
  const doneAt = {}, signerOf = {};
  for (const e of compEv) if (e.payload && e.payload.build_id) { doneAt[e.payload.build_id] = new Date(e.at).getTime(); signerOf[e.payload.build_id] = { id: e.actor_id, role: (e.payload && e.payload.by_role) || null }; }
  const finished = builds.filter((b) => b.state === "production_complete" && doneAt[b.id] && doneAt[b.id] >= sinceMs && doneAt[b.id] <= winEnd && b.started_at);
  const live = builds.filter((b) => ["active", "rework", "awaiting_inspection"].includes(b.state));
  // Standard hours = the cab's own FROZEN task list (Q97); rework fix tasks
  // carry 0 std hours (Q85 own-bucket) so they never inflate the standard.
  const needTasks = [...finished, ...live].map((b) => b.id);
  const taskRows = needTasks.length
    ? await db(`task?select=build_id,man_hours,state,is_background&build_id=in.(${needTasks.join(",")})`) : [];
  const stdOf = {}; const doneMhOf = {};
  for (const t of taskRows) {
    stdOf[t.build_id] = (stdOf[t.build_id] || 0) + Number(t.man_hours);
    if (t.state === "complete") doneMhOf[t.build_id] = (doneMhOf[t.build_id] || 0) + Number(t.man_hours);
  }
  // Per finished cab: actual = coverage man-hours on ITS line, start → sign-off.
  const cabs = finished.map((b) => {
    const s = new Date(b.started_at).getTime(); const e = doneAt[b.id];
    const actual = ivs.filter((iv) => iv.line === b.line_id).reduce((sum, iv) => sum + overlapHrs(iv, s, e), 0);
    const std = stdOf[b.id] || 0;
    const sg = signerOf[b.id] || {};
    const byRole = sg.role || roleOf[sg.id] || null;   // captured-at-sign-off, else current
    return { order: b.order_number, cab: b.cab_number || "", part: b.part_number || "?", line: lineName[b.line_id] || "?",
      std, actual, varPct: std ? Math.round(((actual - std) / std) * 100) : null,
      started: phxHM(b.started_at), completed: phxHM(new Date(e).toISOString()),
      by: nameOf[sg.id] || "—", byAdmin: byRole === "admin" };
  });
  // Product rollup — where the standards get honest over time (feeds Q96).
  const prodMap = {};
  for (const c of cabs) {
    const p = prodMap[c.part] || (prodMap[c.part] = { part: c.part, n: 0, std: 0, actual: 0 });
    p.n++; p.std += c.std; p.actual += c.actual;
  }
  const products = Object.values(prodMap).map((p) => ({ part: p.part, n: p.n,
    avgStd: p.std / p.n, avgActual: p.actual / p.n,
    varPct: p.std ? Math.round(((p.actual - p.std) / p.std) * 100) : null }));
  // Open cabs aging (suite 1) — plain calendar days; the board's color math
  // stays the single source of pace truth, this is just "how long open."
  const openCabs = live.map((b) => ({ order: b.order_number, cab: b.cab_number || "", part: b.part_number || "?",
    line: lineName[b.line_id] || "?", state: b.state.replace(/_/g, " "),
    daysOpen: b.started_at ? Math.round((nowMs - new Date(b.started_at).getTime()) / 86400000 * 10) / 10 : null,
    doneMh: Math.round((doneMhOf[b.id] || 0) * 10) / 10, stdMh: Math.round((stdOf[b.id] || 0) * 10) / 10,
    promised: b.promised_finish || "" }));
  // Labor per employee for the window (suite 3) — clock truth only (C15).
  const labor = emps.map((p) => {
    const mine = ivs.filter((iv) => iv.emp === p.id);
    const hrs = mine.reduce((s, iv) => s + overlapHrs(iv, sinceMs, winEnd), 0);
    const daysSet = new Set(mine.filter((iv) => iv.end > sinceMs && iv.start < winEnd).map((iv) => phxDate(Math.max(iv.start, sinceMs))));
    return { name: `${p.first_name} ${p.last_name}`, active: p.active, hrs, days: daysSet.size };
  }).filter((r) => r.hrs > 0).sort((a, b) => b.hrs - a.hrs);
  // Rework in the window (suite 5) — count + reasons from the audit trail.
  const rw = rwEv.filter((e) => { const t = new Date(e.at).getTime(); return t >= sinceMs && t <= winEnd; });
  const rwReasons = {};
  for (const e of rw) { const r = (e.payload && e.payload.reason) || "(no reason)"; rwReasons[r] = (rwReasons[r] || 0) + 1; }
  // Q85 suite 5: SIGN-OFF ESCAPES in the window — the scoreboard the inspection
  // gate exists to zero out. Split by kind (kickback / customer return) + reason.
  const fx = fxEv.filter((e) => { const t = new Date(e.at).getTime(); return t >= sinceMs && t <= winEnd; });
  const escapes = { total: fx.length, kickback: 0, customer: 0, reasons: {} };
  for (const e of fx) {
    const p = e.payload || {};
    if (p.kind === "kickback") escapes.kickback++; else if (p.kind === "customer_return") escapes.customer++;
    const r = p.reason || "(no reason)"; escapes.reasons[r] = (escapes.reasons[r] || 0) + 1;
  }
  // TIMECARDS (Q111): payroll's view — one row per person per Phoenix day.
  // Paid = the sum of on-the-clock intervals (C15 clock truth; lunch drops
  // out because they clocked out for it, and downtime waiting on a kit stays
  // IN because they didn't). Shop time (line 10) is broken out so the
  // non-billable bucket — meetings, cleanup, in-house fabrication — is its
  // own visible column. Any clock_out_auto that day gets flagged: the
  // day-end sweeper closed a punch somebody forgot, worth a manager glance.
  // (v1 note: an interval is dayed by its start; overnight spans are already
  // prevented in practice by that same sweeper.)
  const tcMap = {};
  for (const iv of ivs) {
    if (iv.end <= sinceMs || iv.start >= winEnd) continue;
    const p = emps.find((e) => e.id === iv.emp); if (!p) continue;
    const day = phxDate(Math.max(iv.start, sinceMs));
    const k = iv.emp + "|" + day;
    const row = tcMap[k] || (tcMap[k] = { name: `${p.first_name} ${p.last_name}`, date: day,
      firstIn: iv.start, lastOut: iv.end, paid: 0, shop: 0, fix: 0, flags: new Set() });
    row.firstIn = Math.min(row.firstIn, iv.start); row.lastOut = Math.max(row.lastOut, iv.end);
    const hrs = overlapHrs(iv, sinceMs, winEnd);
    row.paid += hrs;
    if (iv.line === SHOP_LINE_ID) row.shop += hrs;
    if (iv.line === FIX_LINE_ID) row.fix += hrs;   // Block 125 (M3): Fix-work bucket
  }
  for (const ev of events) {
    // Q111 pt 2: corrected/added punches STAMP the day — no silent fixes.
    const tAll = new Date(ev.claimed_at).getTime();
    if (tAll >= sinceMs && tAll <= winEnd) {
      const rowAll = tcMap[ev.employee_id + "|" + phxDate(tAll)];
      if (rowAll) {
        if (ev.corrected_by) rowAll.flags.add("CORRECTED" + (ev.correction_note ? ": " + ev.correction_note : ""));
        if (ev.added_by) rowAll.flags.add("ADDED PUNCH" + (ev.correction_note ? ": " + ev.correction_note : ""));
      }
    }
    if (ev.kind === "clock_in") continue;
    const t = new Date(ev.claimed_at).getTime();
    if (t < sinceMs || t > winEnd) continue;
    const row = tcMap[ev.employee_id + "|" + phxDate(t)]; if (!row) continue;
    if (ev.kind === "clock_out_auto") { row.flags.add("auto-closed"); row.tcfix = `/manager?tc_emp=${ev.employee_id}&tc_date=${phxDate(t)}#timecorrections`; }   // v148: flag -> one-tap fix
    if (ev.reason && !["End of shift", "End of day", "Lunch", "Switched lines", "Switched to a fix job", "Done with the fix", "Fix finished"].includes(ev.reason)) row.flags.add(ev.reason);
  }
  // Q112 + block 107: after-hours sessions stamp their timecard rows — and a
  // session's hours are HELD off "paid" until a manager/admin SIGNS OFF on the
  // wrapped-up session in the cockpit (owner-rep: "MUST sign off before it
  // counts against their time card hours"). Sign-off releases them.
  // (ahSess fetched in the Block-212 wave above.)
  for (const sA of ahSess) {
    const sStart = new Date(sA.started_at).getTime();
    const sEnd = sA.ended_at ? new Date(sA.ended_at).getTime() : winEnd;
    const row = tcMap[sA.employee_id + "|" + phxDate(sStart)];
    if (!row) continue;
    const apA = emps.find((e) => e.id === sA.approved_by);
    if (sA.signed_off_by) {
      const sgA = emps.find((e) => e.id === sA.signed_off_by);
      row.flags.add(`AFTER HOURS: ${sA.reason} — appr. ${apA ? apA.first_name : "?"} ✓ signed off${sgA ? " by " + sgA.first_name : ""}`);
    } else {
      let held107 = 0;
      for (const iv of ivs) {
        if (iv.emp !== sA.employee_id) continue;
        const o107 = overlapHrs(iv, Math.max(sStart, sinceMs), Math.min(sEnd, winEnd));
        if (!o107) continue;
        held107 += o107;
        if (iv.line === SHOP_LINE_ID) row.shop = Math.max(0, row.shop - o107);
        if (iv.line === FIX_LINE_ID) row.fix = Math.max(0, row.fix - o107);
      }
      row.paid = Math.max(0, row.paid - held107);
      // Block 110: a DECLINED session keeps its hours off for good — the
      // typed reason rides the timecard row so payroll sees why.
      if (sA.declined_by) {
        const dcA = emps.find((e) => e.id === sA.declined_by);
        row.flags.add(`AFTER HOURS DECLINED${dcA ? " by " + dcA.first_name : ""}: "${sA.decline_reason || ""}" — ${Math.round(held107 * 10) / 10}h NOT counted`);
      } else {
        row.flags.add(`AFTER HOURS: ${sA.reason} — appr. ${apA ? apA.first_name : "?"}${sA.confirmed_by ? "" : " (UNCONFIRMED)"} — ${Math.round(held107 * 10) / 10}h HELD until sign-off`);
      }
    }
  }
  const timecards = Object.values(tcMap).map((r) => ({ ...r, flags: [...r.flags].join(" · ") }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.name.localeCompare(b.name)));
  // ON-TIME DELIVERY (Q26): of the cabs signed off in the window, how many
  // finished on or before their PROMISED date. promised_finish is a Phoenix
  // calendar date (YYYY-MM-DD, fixed per Q103-6); compare it to the sign-off's
  // Phoenix date. Cabs with no promise on file are counted separately, not scored.
  const completedInWin = builds.filter((b) => b.state === "production_complete" && doneAt[b.id] && doneAt[b.id] >= sinceMs && doneAt[b.id] <= winEnd);
  let onT = 0, lateN = 0, noProm = 0, lateDaysSum = 0;
  const lateList = [];
  for (const b of completedInWin) {
    const prom = b.promised_finish || "";
    if (!prom) { noProm++; continue; }
    const compDate = phxDate(doneAt[b.id]);
    if (compDate <= prom) { onT++; }
    else {
      lateN++;
      const dl = Math.round((Date.parse(compDate + "T00:00:00Z") - Date.parse(prom + "T00:00:00Z")) / 86400000);
      lateDaysSum += dl;
      lateList.push({ order: b.order_number, cab: b.cab_number || "", part: b.part_number || "?", line: lineName[b.line_id] || "?", promised: prom, completed: compDate, daysLate: dl });
    }
  }
  const ratedN = onT + lateN;
  lateList.sort((a, b) => b.daysLate - a.daysLate);
  const onTime = { onTime: onT, late: lateN, noPromise: noProm, rated: ratedN,
    pct: ratedN ? Math.round(100 * onT / ratedN) : null,
    avgDaysLate: lateN ? Math.round(lateDaysSum / lateN * 10) / 10 : 0, lateList };
  // DOWNTIME BY REASON (Q26): where "down for today" holds cost production time.
  // Each hold runs from when it was placed until a clock-in RESUMED that line the
  // SAME day, or — if it stayed down — the shop's close that day (holds auto-clear
  // at day end, block 33). Summed by reason so the biggest loss is obvious.
  const downEv = await db(`event_log?select=at,event_type,payload&event_type=in.(line.down,line.down_resumed)&order=at.asc&limit=4000`);
  const downs = [], resumes = [];
  for (const e of downEv) {
    const t = new Date(e.at).getTime(), lid = e.payload && e.payload.line_id;
    if (e.event_type === "line.down") downs.push({ t, lid, reason: (e.payload && e.payload.reason) || "(no reason)" });
    else resumes.push({ t, lid });
  }
  const shD = await shopHours();
  const dtMap = {}; let dtTotal = 0, dtCount = 0;
  for (const hld of downs) {
    if (hld.t < sinceMs || hld.t > winEnd) continue;
    const hDay = phxDate(hld.t);
    let end = dayEndOf(hld.t, shD.close);
    for (const r of resumes) { if (r.lid === hld.lid && r.t > hld.t && phxDate(r.t) === hDay && r.t < end) end = r.t; }
    const hrs = Math.max(0, (end - hld.t) / 3600000);
    const row = dtMap[hld.reason] || (dtMap[hld.reason] = { reason: hld.reason, hrs: 0, n: 0 });
    row.hrs += hrs; row.n++; dtTotal += hrs; dtCount++;
  }
  const downtime = { total: dtTotal, count: dtCount, byReason: Object.values(dtMap).sort((a, b) => b.hrs - a.hrs) };
  // ON-TIME TREND (Q26): the last 6 Phoenix months, INDEPENDENT of the window
  // picker above — throughput (cabs shipped) + on-time % + avg days late per
  // month, so the owner can see if the shop is trending better. Reuses the
  // completion + promise data already loaded; no extra queries.
  const MON = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthKey = (ms) => phxDate(ms).slice(0, 7);
  const nowMonth = monthKey(nowMs);
  const months = [];
  { let y = +nowMonth.slice(0, 4), m = +nowMonth.slice(5, 7);
    for (let i = 0; i < 6; i++) { months.unshift(`${y}-${String(m).padStart(2, "0")}`); m--; if (m === 0) { m = 12; y--; } } }
  const tMap = {}; for (const k of months) tMap[k] = { done: 0, onT: 0, rated: 0, lateSum: 0 };
  for (const b of builds) {
    if (b.state !== "production_complete" || !doneAt[b.id]) continue;
    const k = monthKey(doneAt[b.id]); const row = tMap[k]; if (!row) continue;
    row.done++;
    const prom = b.promised_finish || ""; if (!prom) continue;
    row.rated++;
    const compDate = phxDate(doneAt[b.id]);
    if (compDate <= prom) row.onT++;
    else row.lateSum += Math.round((Date.parse(compDate + "T00:00:00Z") - Date.parse(prom + "T00:00:00Z")) / 86400000);
  }
  const trend = months.map((k) => { const r = tMap[k]; const lateN = r.rated - r.onT; return {
    month: k, label: MON[+k.slice(5, 7)] + " " + k.slice(0, 4), done: r.done, rated: r.rated,
    pct: r.rated ? Math.round(100 * r.onT / r.rated) : null,
    avgLate: lateN ? Math.round(r.lateSum / lateN * 10) / 10 : 0 }; });
  return { startMs, endMs, cabs, products, openCabs, labor, timecards, rework: { n: rw.length, reasons: rwReasons }, escapes, onTime, downtime, trend };
}

const h1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
const reportsPage = (d, isAdmin = false, emp196 = null) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Reports</title>${style}
<style>
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}
  .lane h3{margin:0 0 10px}
  table{width:100%;border-collapse:collapse;font-size:.95rem}
  th{text-align:left;opacity:.55;font-weight:400;padding:4px 8px;border-bottom:1px solid var(--line)}
  td{padding:6px 8px;border-bottom:1px solid var(--line)}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .over{color:#ff9f0a}.way{color:var(--red)}.under{color:#30d158}
  .csv{float:right;font-size:.8rem;color:#8e8e93}
  .per a{color:#8e8e93;margin-right:12px}.per a.on{color:#fff;font-weight:700}
  .drow{cursor:pointer}.drow:hover{background:rgba(255,255,255,.04)}
  .drill{display:none}.drill>td{padding:0 8px 12px}
  .drill table{margin:4px 0 2px;font-size:.88rem;background:rgba(255,255,255,.02);border-radius:8px}
  .drill th{opacity:.4}
</style></head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${emp196 ? nav196(emp196, true) : navBar95(isAdmin, true)}
  <h2>Reports</h2>
  <!-- Q119: clear period picker — rolling windows vs calendar to-date, plus a
       custom From/To range, with the exact dates shown so it's unambiguous. -->
  <div class="per" style="line-height:2.1">
    <div><span style="opacity:.55">Rolling window:</span>
      ${[["last7", "Last 7 days"], ["last30", "Last 30 days"], ["last90", "Last 90 days"]].map(([p, t]) => `<a href="/reports?preset=${p}" class="${d.preset === p ? "on" : ""}">${t}</a>`).join("")}</div>
    <div><span style="opacity:.55">To date:</span>
      ${[["wtd", "This week"], ["mtd", "This month"], ["ytd", "This year"]].map(([p, t]) => `<a href="/reports?preset=${p}" class="${d.preset === p ? "on" : ""}">${t}</a>`).join("")}</div>
    <div><span style="opacity:.55">Custom:</span>
      From <input type="date" id="rp-from" value="${d.from || ""}" style="background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:6px">
      To <input type="date" id="rp-to" value="${d.to || ""}" style="background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:6px">
      <button onclick="rpGo()" style="background:#3a3a3c;border:none;border-radius:8px;color:#fff;padding:7px 12px;cursor:pointer;${d.preset === "custom" ? "outline:2px solid #30d158" : ""}">Show</button></div>
    <p style="margin:8px 0 2px"><b>${d.label}</b> · showing <b>${d.rangeText}</b> <span style="opacity:.55">(Phoenix dates)</span></p>
  </div>
  <script>function rpGo(){var f=document.getElementById("rp-from").value,t=document.getElementById("rp-to").value;if(!f||!t){return;}location.href="/reports?from="+f+"&to="+t;}</script>
  <div class="lane">
    <h3>On-time delivery${d.onTime.pct === null ? "" : ` — <span style="color:${d.onTime.pct >= 90 ? "#30d158" : d.onTime.pct >= 75 ? "#ff9f0a" : "var(--red)"}">${d.onTime.pct}%</span>`}</h3>
    ${d.onTime.rated ? `<p style="margin:-4px 0 10px;opacity:.85"><b>${d.onTime.onTime}</b> of <b>${d.onTime.rated}</b> cab${d.onTime.rated === 1 ? "" : "s"} finished on or before the promised date${d.onTime.late ? ` · <b>${d.onTime.late}</b> late (avg <b>${d.onTime.avgDaysLate}</b> day${d.onTime.avgDaysLate === 1 ? "" : "s"} over)` : ""}.${d.onTime.noPromise ? ` <span style="opacity:.55">${d.onTime.noPromise} more had no promised date on file — not scored.</span>` : ""}</p>
      ${d.onTime.lateList.length ? `<table><tr><th>Order</th><th>Cab #</th><th>Product</th><th>Line</th><th>Promised</th><th>Finished</th><th class="num">Days late</th></tr>
        ${d.onTime.lateList.map((c) => `<tr><td><b>${c.order}</b></td><td>${c.cab || "—"}</td><td>${c.part}</td><td>${c.line}</td><td style="opacity:.7">${c.promised}</td><td style="opacity:.7">${c.completed}</td><td class="num way">+${c.daysLate}</td></tr>`).join("")}</table>` : ""}`
    : `<div style="opacity:.6">No cabs with a promised date finished in this period.</div>`}
  </div>
  <div class="lane">
    <h3>On-time trend <span style="opacity:.55;font-weight:400;font-size:.85rem">— last 6 months</span></h3>
    <table><tr><th>Month</th><th class="num">Shipped</th><th class="num">On-time</th><th style="width:38%"></th><th class="num">Avg late</th></tr>
      ${d.trend.map((m) => `<tr><td>${m.label}</td><td class="num">${m.done}</td>
        <td class="num">${m.pct === null ? "—" : m.pct + "%"}</td>
        <td>${m.pct === null ? `<span style="opacity:.4">no promised cabs</span>` : `<div style="background:#2c2c2e;border-radius:6px;height:10px"><div style="height:10px;border-radius:6px;width:${m.pct}%;background:${m.pct >= 90 ? "#30d158" : m.pct >= 75 ? "#ff9f0a" : "var(--red)"}"></div></div>`}</td>
        <td class="num">${m.avgLate ? m.avgLate + " d" : "—"}</td></tr>`).join("")}
    </table>
    <div style="opacity:.5;font-size:.85rem;margin-top:8px">Shipped = cabs signed off that month (throughput). On-time % is of that month's cabs that had a promised date. The bar climbing means the shop is getting more predictable.</div>
  </div>
  <div class="lane">
    <a class="csv" href="/reports.csv?which=products&${d.qs}">⬇ CSV</a>
    <h3>Actual vs standard — by product (${d.cabs.length} cab${d.cabs.length === 1 ? "" : "s"} signed off)</h3>
    ${d.products.length ? `<table><tr><th>Product</th><th class="num">Cabs</th><th class="num">Avg standard</th><th class="num">Avg actual</th><th class="num">Variance</th></tr>
      ${d.products.map((p, i) => { const kids = d.cabs.filter((c) => c.part === p.part); return `<tr class="drow" onclick="dtoggle('dp${i}')"><td>▸ ${p.part}</td><td class="num">${p.n}</td><td class="num">${h1(p.avgStd)} h</td><td class="num">${h1(p.avgActual)} h</td>
        <td class="num ${p.varPct === null ? "" : p.varPct > 25 ? "way" : p.varPct > 0 ? "over" : "under"}">${p.varPct === null ? "—" : (p.varPct > 0 ? "+" : "") + p.varPct + "%"}</td></tr>
      <tr id="dp${i}" class="drill"><td colspan="5"><table><tr><th>Order</th><th>Cab #</th><th>Line</th><th class="num">Std</th><th class="num">Actual</th><th class="num">Var</th><th>Completed</th><th>Signed off by</th></tr>
        ${kids.map((c) => `<tr><td><b>${c.order}</b></td><td>${c.cab || "—"}</td><td>${c.line}</td><td class="num">${h1(c.std)}</td><td class="num">${h1(c.actual)}</td><td class="num ${c.varPct === null ? "" : c.varPct > 25 ? "way" : c.varPct > 0 ? "over" : "under"}">${c.varPct === null ? "—" : (c.varPct > 0 ? "+" : "") + c.varPct + "%"}</td><td style="opacity:.7">${c.completed}</td><td>${c.by}</td></tr>`).join("")}</table></td></tr>`; }).join("")}</table>
      <div style="opacity:.5;font-size:.85rem;margin-top:8px">Actual = clocked man-hours on the cab's line from start to sign-off — never task timers. This table is what trues the standards up over time.</div>`
    : `<div style="opacity:.6">No cabs signed off in this period.</div>`}
  </div>
  <div class="lane">
    <a class="csv" href="/reports.csv?which=cabs&${d.qs}">⬇ CSV</a>
    <h3>Signed-off cabs — the detail</h3>
    ${d.cabs.length ? `<table><tr><th>Order</th><th>Cab #</th><th>Product</th><th>Line</th><th class="num">Std</th><th class="num">Actual</th><th class="num">Var</th><th>Signed off</th><th>By</th></tr>
      ${d.cabs.map((c) => `<tr><td><b>${c.order}</b></td><td>${c.cab || "—"}</td><td>${c.part}</td><td>${c.line}</td><td class="num">${h1(c.std)}</td><td class="num">${h1(c.actual)}</td>
        <td class="num ${c.varPct === null ? "" : c.varPct > 25 ? "way" : c.varPct > 0 ? "over" : "under"}">${c.varPct === null ? "—" : (c.varPct > 0 ? "+" : "") + c.varPct + "%"}</td><td style="opacity:.7">${c.completed}</td><td>${c.by}${c.byAdmin ? ` <span style="background:#3a2f10;color:#ffd60a;padding:1px 6px;border-radius:10px;font-size:.78em;white-space:nowrap">admin sign-off</span>` : ""}</td></tr>`).join("")}</table>`
    : `<div style="opacity:.6">Nothing in this period.</div>`}
  </div>
  <div class="lane">
    <h3>Open cabs — aging</h3>
    ${d.openCabs.length ? `<table><tr><th>Order</th><th>Cab #</th><th>Product</th><th>Line</th><th>State</th><th class="num">Days open</th><th class="num">Done / std</th><th>Promised</th></tr>
      ${d.openCabs.map((c) => `<tr><td><b>${c.order}</b></td><td>${c.cab || "—"}</td><td>${c.part}</td><td>${c.line}</td><td>${c.state}</td>
        <td class="num">${c.daysOpen === null ? "—" : c.daysOpen}</td><td class="num">${c.doneMh} / ${c.stdMh} h</td><td style="opacity:.7">${c.promised}</td></tr>`).join("")}</table>`
    : `<div style="opacity:.6">No open cabs.</div>`}
  </div>
  <div class="lane">
    <a class="csv" href="/reports.csv?which=labor&${d.qs}">⬇ CSV</a>
    <h3>Labor — clocked hours per person</h3>
    ${d.labor.length ? `<table><tr><th>Name</th><th class="num">Hours</th><th class="num">Days present</th></tr>
      ${d.labor.map((r, i) => { const days = d.timecards.filter((t) => t.name === r.name); return `<tr class="drow" onclick="dtoggle('dl${i}')"><td>▸ ${r.name}${r.active ? "" : ' <span style="opacity:.4">(inactive)</span>'}</td><td class="num">${h1(r.hrs)}</td><td class="num">${r.days}</td></tr>
      <tr id="dl${i}" class="drill"><td colspan="3"><table><tr><th>Date</th><th>In</th><th>Out</th><th class="num">Paid</th><th class="num">Shop</th><th class="num">Fix</th><th>Notes</th></tr>
        ${days.map((t) => `<tr><td>${t.date}</td><td>${phxHM(new Date(t.firstIn).toISOString()).slice(11)}</td><td>${phxHM(new Date(t.lastOut).toISOString()).slice(11)}</td><td class="num">${h1(t.paid)}</td><td class="num">${t.shop ? h1(t.shop) : "—"}</td><td class="num">${t.fix ? h1(t.fix) : "—"}</td><td style="opacity:.7">${t.flags}${t.tcfix ? ` <a href="${t.tcfix}" style="color:#8e8e93">Fix punches</a>` : ""}</td></tr>`).join("")}</table></td></tr>`; }).join("")}</table>
      <div style="opacity:.5;font-size:.85rem;margin-top:8px">Coaching and coverage view — never shown on the floor board (file 12 privacy rule).</div>`
    : `<div style="opacity:.6">No clocked hours in this period.</div>`}
  </div>
  <div class="lane">
    <a class="csv" href="/reports.csv?which=timecards&${d.qs}">⬇ CSV</a>
    <h3>Timecards — payroll (Q111)</h3>
    ${d.timecards.length ? `<table><tr><th>Person</th><th>Date</th><th>First in</th><th>Last out</th><th class="num">Paid hrs</th><th class="num">Shop time</th><th class="num">Fix work</th><th>Notes</th></tr>
      ${d.timecards.map((t) => `<tr><td>${t.name}</td><td>${t.date}</td><td>${phxHM(new Date(t.firstIn).toISOString()).slice(11)}</td><td>${phxHM(new Date(t.lastOut).toISOString()).slice(11)}</td><td class="num">${h1(t.paid)}</td><td class="num">${t.shop ? h1(t.shop) : "—"}</td><td class="num">${t.fix ? h1(t.fix) : "—"}</td><td style="opacity:.7">${t.flags}${t.tcfix ? ` <a href="${t.tcfix}" style="color:#8e8e93">Fix punches</a>` : ""}</td></tr>`).join("")}</table>
      <div style="opacity:.5;font-size:.85rem;margin-top:8px">Paid = time on the clock (lunch is already out; waiting on a kit stays in). Shop time = the non-billable bucket — meetings, cleanup, in-house fabrication. Fix work = paid hours on a returned/kickback cab, tied to that order. "auto-closed" = the day-end sweeper closed a forgotten punch — worth a glance before payroll.</div>`
    : `<div style="opacity:.6">No punches in this period.</div>`}
  </div>
  <div class="lane">
    <h3>Rework (${d.rework.n} in period)</h3>
    ${d.rework.n ? Object.entries(d.rework.reasons).map(([r, n]) => `<div style="padding:3px 0;opacity:.85">${r} — ${n}</div>`).join("")
    : `<div style="opacity:.6">No rework assigned in this period. Good.</div>`}
  </div>
  <div class="lane">
    <h3>Downtime by reason${d.downtime.count ? ` — <span style="opacity:.85">${h1(d.downtime.total)} h across ${d.downtime.count} hold${d.downtime.count === 1 ? "" : "s"}</span>` : ""}</h3>
    ${d.downtime.count ? `<table><tr><th>Reason</th><th class="num">Hours lost</th><th class="num">Holds</th><th class="num">Share</th></tr>
      ${d.downtime.byReason.map((r) => `<tr><td>${r.reason}</td><td class="num">${h1(r.hrs)} h</td><td class="num">${r.n}</td><td class="num" style="opacity:.6">${d.downtime.total ? Math.round(100 * r.hrs / d.downtime.total) : 0}%</td></tr>`).join("")}</table>
      <div style="opacity:.5;font-size:.85rem;margin-top:8px">A "down for today" hold runs until a clock-in resumed the line that day, or the shop's close if it stayed down. This is production time lost to stoppages — where to look first to protect the schedule.</div>`
    : `<div style="opacity:.6">No line-down holds in this period.</div>`}
  </div>
  <!-- Q85 suite 5: SIGN-OFF ESCAPES — cabs that came BACK after manager sign-off
       (Body Shop kickbacks + customer returns). The number the inspection gate
       exists to drive to zero. Management-only, like the rest of reports. -->
  <div class="lane" style="border-color:#4a90d9">
    <h3>Sign-off escapes (${(d.escapes && d.escapes.total) || 0} in period)</h3>
    ${(d.escapes && d.escapes.total)
      ? `<div style="padding:3px 0;opacity:.9">Body Shop kickbacks — ${d.escapes.kickback} &nbsp;·&nbsp; Customer returns — ${d.escapes.customer}</div>
         ${Object.entries(d.escapes.reasons).map(([r, n]) => `<div style="padding:3px 0;opacity:.75">${r} — ${n}</div>`).join("")}`
      : `<div style="opacity:.6">No cabs came back after sign-off in this period. That's the goal.</div>`}
  </div>
  <script>function dtoggle(id){var e=document.getElementById(id);if(!e)return;e.style.display=(e.style.display==="table-row")?"none":"table-row";}</script>
</div></body></html>`;

// CSV export (file 12 universal controls) — same numbers as the page,
// straight into the owner's spreadsheet.
function reportCsv(which, d) {
  const esc = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const row = (arr) => arr.map(esc).join(",") + "\r\n";
  if (which === "products")
    return row(["Product", "Cabs signed off", "Avg standard hours", "Avg actual hours", "Variance %"]) +
      d.products.map((p) => row([p.part, p.n, h1(p.avgStd), h1(p.avgActual), p.varPct])).join("");
  if (which === "labor")
    return row(["Employee", "Clocked hours", "Days present"]) +
      d.labor.map((r) => row([r.name, h1(r.hrs), r.days])).join("");
  if (which === "timecards")
    return row(["Employee", "Date", "First in", "Last out", "Paid hours", "Shop-time hours", "Fix-work hours", "Notes / flags"]) +
      d.timecards.map((t) => row([t.name, t.date, phxHM(new Date(t.firstIn).toISOString()),
        phxHM(new Date(t.lastOut).toISOString()), h1(t.paid), h1(t.shop), h1(t.fix), t.flags])).join("");
  return row(["Order #", "Cab #", "Product", "Line", "Standard hours", "Actual hours", "Variance %", "Started", "Signed off", "Signed off by", "Admin sign-off"]) +
    d.cabs.map((c) => row([c.order, c.cab, c.part, c.line, h1(c.std), h1(c.actual), c.varPct, c.started, c.completed, c.by, c.byAdmin ? "yes" : ""])).join("");
}

// Q84: MANAGER-INTEGRITY DIAGNOSTICS — ADMIN ONLY (file 25). Once a bonus rides
// on "keeping lines green," the player-coach manager (who shares the bonus and
// holds most of the pause buttons) is inside the circle of temptation — so these
// flags go ABOVE him, to the admin. Everything here is DERIVED from the append-
// only event log (spec §3); it writes nothing. It FLAGS, humans JUDGE (the
// escalation principle) — never a floor-facing number, never auto-punishment.
// Structural note: the bonus keys off the un-fakeable calendar (fixed promised
// finish), never pace color, and clock-in on a held cab auto-resumes it — so
// this view is the honest backstop, not the primary defense.
async function integrityData(startMs, endMs) {
  const sIso = new Date(startMs).toISOString(), eIso = new Date(endMs).toISOString();
  const emps = await db(`employee?select=id,first_name,last_name,role`);
  const nameOf = {}, roleOf = {};
  for (const p of emps) { nameOf[p.id] = `${p.first_name} ${p.last_name ? p.last_name[0] + "." : ""}`.trim(); roleOf[p.id] = p.role; }
  const lines = await db(`line?select=id,name`);
  const lineName = {}; for (const l of lines) lineName[l.id] = l.name;
  // The integrity-sensitive moments, in-window: down-for-today holds, a hold
  // that a clock-in RESUMED (held then worked — the defensive-hold tell), the
  // three clock corrections, and sign-offs (with the by_role captured in Q86).
  const ev = await db(`event_log?select=at,actor_id,event_type,payload&event_type=in.(line.down,line.down_resumed,punch.moved,punch.voided,punch.added,build.production_complete)&at=gte.${sIso}&at=lt.${eIso}&order=at.asc&limit=8000`);
  const acts = {};   // actor id -> tallies
  const A = (id) => acts[id] || (acts[id] = { holds: 0, corrections: 0, signoffs: 0, selfSigns: 0 });
  const holds = [], resumed = [], signoffs = [], reasonCount = {};
  for (const e of ev) {
    if (e.event_type === "line.down") { A(e.actor_id).holds++; holds.push(e); const r = (e.payload && e.payload.reason) || "—"; reasonCount[r] = (reasonCount[r] || 0) + 1; }
    else if (e.event_type === "line.down_resumed") resumed.push(e);
    else if (e.event_type === "punch.moved" || e.event_type === "punch.voided" || e.event_type === "punch.added") A(e.actor_id).corrections++;
    else if (e.event_type === "build.production_complete") { A(e.actor_id).signoffs++; signoffs.push(e); }
  }
  // HELD-THEN-WORKED: for each resume, the manager who held that line = the
  // latest line.down on the same line before the resume (same shop day).
  const resumedList = resumed.map((e) => {
    const lid = e.payload && e.payload.line_id, t = new Date(e.at).getTime();
    let heldBy = null, heldAt = 0;
    for (const h of holds) { if ((h.payload && h.payload.line_id) === lid && new Date(h.at).getTime() <= t && new Date(h.at).getTime() >= heldAt) { heldBy = h.actor_id; heldAt = new Date(h.at).getTime(); } }
    return { line: lineName[lid] || ("Line " + lid), heldBy: heldBy ? (nameOf[heldBy] || "?") : "—", resumedBy: nameOf[e.actor_id] || "?", when: phxHM(e.at) };
  });
  // SELF-SIGN: a sign-off where the signer was clocked onto that cab's line
  // during the build (a line runs one cab at a time, so a clock-in on the line
  // between start and sign-off = they worked the cab they then passed).
  const soBuildIds = [...new Set(signoffs.map((e) => e.payload && e.payload.build_id).filter(isUuid))];
  const soBuilds = soBuildIds.length ? await db(`build?select=id,order_number,line_id,started_at&id=in.(${soBuildIds.join(",")})`) : [];
  const bById = {}; for (const b of soBuilds) bById[b.id] = b;
  const signers = [...new Set(signoffs.map((e) => e.actor_id).filter(Boolean))];
  const signerClocks = signers.length ? await db(`clock_event?select=employee_id,line_id,claimed_at&voided=is.false&kind=eq.clock_in&employee_id=in.(${signers.join(",")})&order=claimed_at.asc&limit=8000`) : [];
  const selfSignList = [];
  for (const e of signoffs) {
    const b = bById[e.payload && e.payload.build_id]; if (!b || !b.started_at) continue;
    const s = new Date(b.started_at).getTime(), f = new Date(e.at).getTime();
    const worked = signerClocks.some((c) => c.employee_id === e.actor_id && c.line_id === b.line_id && new Date(c.claimed_at).getTime() >= s && new Date(c.claimed_at).getTime() <= f);
    if (worked) { A(e.actor_id).selfSigns++; selfSignList.push({ who: nameOf[e.actor_id] || "?", order: b.order_number, line: lineName[b.line_id] || ("Line " + b.line_id), when: phxHM(e.at) }); }
  }
  const rows = Object.keys(acts).map((id) => ({ name: nameOf[id] || "?", role: roleOf[id] === "admin" ? "Admin" : roleOf[id] === "manager" ? "Manager" : "Team Member", ...acts[id] }))
    .filter((r) => r.holds || r.corrections || r.signoffs || r.selfSigns)
    .sort((a, b) => (b.holds + b.corrections + b.signoffs + b.selfSigns) - (a.holds + a.corrections + a.signoffs + a.selfSigns));
  const reasons = Object.entries(reasonCount).map(([reason, n]) => ({ reason, n })).sort((a, b) => b.n - a.n);
  return { rows, resumedList, reasons, holdCount: holds.length, resumedCount: resumed.length, selfSignList };
}
function integrityPage(d) {
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Integrity</title>${style}
<style>
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:16px}
  .lane h3{margin:0 0 10px}
  table{width:100%;border-collapse:collapse;font-size:.92rem}
  th{opacity:.55;text-align:left;padding:6px 8px;font-weight:600}
  td{padding:6px 8px;border-top:1px solid var(--line);vertical-align:middle}
  .num{text-align:right}
  .muted{opacity:.6}
  .flag{background:#3a2f10;color:#ffd60a;padding:1px 8px;border-radius:10px;font-size:.82em;white-space:nowrap}
  .pb{display:inline-block;padding:4px 10px;border-radius:20px;background:#3a3a3c;color:#fff;text-decoration:none;margin:0 4px 6px 0;font-size:.9rem}
  .pb.on{outline:2px solid #30d158}
  @media print{ a.pb,.csv{display:none} }
</style></head>
<body><div class="wrap" style="max-width:960px">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${navBar95(true)}
  <h2>Integrity — admin only</h2>
  <p class="muted" style="margin-top:-8px">Integrity-sensitive actions, derived from the audit log. <b>These flag; you judge.</b> Nothing here is auto-acted on and none of it ever reaches the floor. The manager shares the team bonus and holds the pause buttons, so his own integrity signals are surfaced here, above him — same spirit as the self-sign tag.</p>
  <div class="lane" style="padding:10px 16px">
    <span class="muted">Period:</span>
    <a class="pb ${d.preset === "last7" ? "on" : ""}" href="/integrity?preset=last7">Last 7 days</a>
    <a class="pb ${d.preset === "last30" ? "on" : ""}" href="/integrity?preset=last30">Last 30 days</a>
    <a class="pb ${d.preset === "last90" ? "on" : ""}" href="/integrity?preset=last90">Last 90 days</a>
    <a class="pb ${d.preset === "mtd" ? "on" : ""}" href="/integrity?preset=mtd">This month</a>
    <div style="margin-top:6px;font-size:.9rem"><b>${esc(d.label)}</b> · showing <b>${esc(d.rangeText)}</b> <span class="muted">(Phoenix dates)</span></div>
  </div>

  <div class="lane">
    <h3>Manager actions this period</h3>
    <p class="muted" style="margin:-4px 0 8px;font-size:.85rem">Down-for-today holds placed, clock corrections made, cabs signed off, and — flagged — self-signs (signed off a cab whose line they were clocked onto during the build).</p>
    ${d.rows.length ? `<table><tr><th>Who</th><th>Role</th><th class="num">Holds</th><th class="num">Clock corrections</th><th class="num">Sign-offs</th><th class="num">Self-signs</th></tr>
      ${d.rows.map((r) => `<tr><td><b>${esc(r.name)}</b></td><td class="muted">${esc(r.role)}</td><td class="num">${r.holds}</td><td class="num">${r.corrections}</td><td class="num">${r.signoffs}</td><td class="num">${r.selfSigns ? `<span class="flag">${r.selfSigns}</span>` : "0"}</td></tr>`).join("")}</table>`
    : `<div class="muted">No integrity-sensitive actions in this period.</div>`}
  </div>

  <div class="lane">
    <h3>Held then worked <span class="muted" style="font-weight:400;font-size:.85rem">(${d.resumedCount})</span></h3>
    <p class="muted" style="margin:-4px 0 8px;font-size:.85rem">A line was marked "down for today," then a clock-in resumed it the same day — the defensive-hold tell. Not proof of anything; a line genuinely can come back. Worth a glance when one name recurs.</p>
    ${d.resumedList.length ? `<table><tr><th>Line</th><th>Held by</th><th>Resumed by (clocked in)</th><th>When</th></tr>
      ${d.resumedList.map((r) => `<tr><td>${esc(r.line)}</td><td>${esc(r.heldBy)}</td><td>${esc(r.resumedBy)}</td><td class="muted">${esc(r.when)}</td></tr>`).join("")}</table>`
    : `<div class="muted">No held-then-worked lines in this period.</div>`}
  </div>

  <div class="lane">
    <h3>Self-signs <span class="muted" style="font-weight:400;font-size:.85rem">(${d.selfSignList.length})</span></h3>
    <p class="muted" style="margin:-4px 0 8px;font-size:.85rem">Sign-offs by someone who was clocked onto that cab's line during its build — the inspector and a builder were the same person.</p>
    ${d.selfSignList.length ? `<table><tr><th>Order</th><th>Line</th><th>Signed off by</th><th>When</th></tr>
      ${d.selfSignList.map((r) => `<tr><td><b>${esc(r.order)}</b></td><td>${esc(r.line)}</td><td>${esc(r.who)} <span class="flag">self-sign</span></td><td class="muted">${esc(r.when)}</td></tr>`).join("")}</table>`
    : `<div class="muted">No self-signs in this period.</div>`}
  </div>

  <div class="lane">
    <h3>Hold reasons <span class="muted" style="font-weight:400;font-size:.85rem">(${d.holdCount} total)</span></h3>
    <p class="muted" style="margin:-4px 0 8px;font-size:.85rem">The reason mix on down-for-today holds — a skew toward one reason is worth a look.</p>
    ${d.reasons.length ? `<table><tr><th>Reason</th><th class="num">Count</th><th class="num">Share</th></tr>
      ${d.reasons.map((r) => `<tr><td>${esc(r.reason)}</td><td class="num">${r.n}</td><td class="num muted">${d.holdCount ? Math.round(100 * r.n / d.holdCount) : 0}%</td></tr>`).join("")}</table>`
    : `<div class="muted">No holds in this period.</div>`}
  </div>

  <p class="muted" style="font-size:.85rem;text-align:center">Deferred to a later pass (they need pace snapshots the app doesn't store yet): holds placed right at a green→amber turn, and per-person rates scored against a shop baseline. This view covers what the audit log can prove today.</p>
</div></body></html>`;
}

// ============================================================
// COYOTE INTAKE INBOX (Track A) — admin-only, READ-ONLY review of the orders
// Coyote's push has landed, BEFORE the mapping job turns them into builds.
// Collapses the fresh set to the LATEST record per order # (the change-history
// "latest wins" rule), previews which production LINE each cab routes to
// (product.lines), and flags the exceptions a human should look at (unknown /
// needs-setup part, multi-cab order to split, an unusual status like Hold, an
// outsourced Blazer top). Writes NOTHING — the staging view the mapper builds on.
async function intakeInboxData() {
  const rows = await db(`coyote_intake?select=payload,received_at&processed_at=is.null&order=received_at.desc&limit=5000`);
  const prods = await db(`product?select=part_number,family,lines&retired=is.false`);
  const prodByPart = {}; for (const p of prods) prodByPart[String(p.part_number).toUpperCase()] = p;
  const lns = await db(`line?select=id,name`);
  const lineName = {}; for (const l of lns) lineName[l.id] = l.name;
  const allow = new Set(Object.keys(prodByPart)); // the product catalog IS the 16-part allowlist
  const seen = new Set();
  const orders = [];
  let raw = 0, dupes = 0;
  for (const r of rows) {
    raw++;
    const p = r.payload || {};
    const o = (p.order && typeof p.order === "object") ? p.order : {};
    const ordNo = String(o.order_number ?? p["Order #"] ?? p.order_number ?? "").trim();
    const key = ordNo || ("__row_" + raw);
    if (seen.has(key)) { dupes++; continue; }   // rows are newest-first -> first seen wins
    seen.add(key);
    const c = (p.customer && typeof p.customer === "object") ? p.customer : {};
    const custName = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || (c.company || "");
    const items = Array.isArray(p.line_items) ? p.line_items : [];
    const cabParts = [], lineSet = new Set();
    let blazerTop = false;
    for (const it of items) {
      const num = String((it && it.item_number) ?? "").trim();
      if (!num) continue;
      const up = num.toUpperCase();
      if (up === "PSR-BLZR-TOP") { blazerTop = true; continue; }
      if (allow.has(up)) { cabParts.push(num); for (const lid of (prodByPart[up].lines || [])) lineSet.add(lid); }
    }
    const status = String(o.status ?? p.status ?? "").trim() || "—";
    const flags = [];
    if (cabParts.length === 0) flags.push("needs-setup");
    if (cabParts.length > 1) flags.push("multi-cab");
    if (status !== "Queued" && status !== "Processed" && status !== "—") flags.push("status");
    if (blazerTop) flags.push("blazer-top");
    orders.push({ order: ordNo || "—", customer: custName, status,
      date: String(o.date ?? "").slice(0, 10), ship: String(o.ship_date ?? "").slice(0, 10),
      cabParts, blazerTop, routed: [...lineSet].sort((a, b) => a - b).map((lid) => lineName[lid] || ("Line " + lid)), flags });
  }
  orders.sort((a, b) => ((a.status === "Queued" ? 0 : 1) - (b.status === "Queued" ? 0 : 1)) || String(a.order).localeCompare(String(b.order)));
  const queued = orders.filter((o) => o.status === "Queued").length;
  const processed = orders.filter((o) => o.status === "Processed").length;
  const needsSetup = orders.filter((o) => o.flags.includes("needs-setup")).length;
  const multiCab = orders.filter((o) => o.flags.includes("multi-cab")).length;
  const oddStatus = orders.filter((o) => o.flags.includes("status")).length;
  const rmap = {};
  for (const p of prods) {
    const ls = (p.lines || []).map((lid) => lineName[lid] || ("Line " + lid)).join(", ") || "—";
    (rmap[p.family] = rmap[p.family] || new Set()).add(ls);
  }
  const routing = Object.entries(rmap).map(([family, set]) => ({ family, lines: [...set].join(" / ") })).sort((a, b) => a.family.localeCompare(b.family));
  return { orders, raw, distinct: orders.length, dupes, queued, processed, needsSetup, multiCab, oddStatus, routing };
}
function intakeInboxPage(d) {
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const chip = (f) => f === "needs-setup" ? `<span class="flag red">needs setup</span>`
    : f === "multi-cab" ? `<span class="flag blue">multi-cab — split</span>`
    : f === "status" ? `<span class="flag amber">check status</span>`
    : f === "blazer-top" ? `<span class="flag grey">+ blazer top (outsourced)</span>` : "";
  const row = (o) => `<tr>
    <td><b><a href="/order?n=${encodeURIComponent(o.order)}" style="color:inherit;text-decoration:underline dotted">${esc(o.order)}</a></b></td>
    <td>${esc(o.customer) || '<span class="muted">—</span>'}</td>
    <td>${o.status === "Queued" ? `<span class="st q">Queued</span>` : o.status === "Processed" ? `<span class="st p">Processed</span>` : `<span class="st o">${esc(o.status)}</span>`}</td>
    <td class="muted">${esc(o.date) || "—"}</td>
    <td>${o.cabParts.length ? o.cabParts.map(esc).join("<br>") : '<span class="flag red">no cab part</span>'}</td>
    <td>${o.routed.length ? o.routed.map(esc).join(", ") : '<span class="muted">—</span>'}</td>
    <td>${o.flags.map(chip).join(" ") || '<span class="muted">ok</span>'}</td>
  </tr>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Intake</title>${style}
<style>
  @media (max-width:640px){.wrap{padding-left:8px;padding-right:8px} .wrap table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap} .wrap .kpi{min-width:calc(50% - 10px)}}
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:16px}
  .lane h3{margin:0 0 10px}
  table{width:100%;border-collapse:collapse;font-size:.92rem}
  th{opacity:.55;text-align:left;padding:6px 8px;font-weight:600}
  td{padding:7px 8px;border-top:1px solid var(--line);vertical-align:top}
  .muted{opacity:.6}
  .flag{padding:1px 8px;border-radius:10px;font-size:.8em;white-space:nowrap;display:inline-block}
  .flag.red{background:#3a1510;color:#ff6b5e}
  .flag.amber{background:#3a2f10;color:#ffd60a}
  .flag.blue{background:#10233a;color:#5eaeff}
  .flag.grey{background:#2c2c2e;color:#aeaeb2}
  .st{padding:1px 9px;border-radius:10px;font-size:.82em;font-weight:600}
  .st.q{background:#10233a;color:#5eaeff}
  .st.p{background:#12331c;color:#5edb84}
  .st.o{background:#3a2f10;color:#ffd60a}
  .kpi{display:inline-block;min-width:92px;text-align:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:0 8px 8px 0}
  .kpi b{display:block;font-size:1.5rem}
  .kpi span{opacity:.6;font-size:.8rem}
  @media print{ a{display:none} }
</style></head>
<body><div class="wrap" style="max-width:1000px">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${navBar95(true)}
  <h2>Intake — orders from Coyote</h2>
  <p class="muted" style="margin-top:-8px">The fresh orders Coyote has pushed, collapsed to the <b>latest record per order</b>. This is a review view — <b>nothing here is on the board yet</b>; the mapping job turns these into cabs once the push is finalized. Blazer tops are outsourced and never enter the app.</p>
  <div style="margin:14px 0">
    <div class="kpi"><b>${d.distinct}</b><span>fresh orders</span></div>
    <div class="kpi"><b>${d.queued}</b><span>queued</span></div>
    <div class="kpi"><b>${d.processed}</b><span>processed</span></div>
    <div class="kpi"><b>${d.needsSetup}</b><span>needs setup</span></div>
    <div class="kpi"><b>${d.multiCab}</b><span>multi-cab</span></div>
    <div class="kpi"><b>${d.oddStatus}</b><span>odd status</span></div>
  </div>
  ${d.dupes ? `<p class="muted" style="font-size:.85rem">${d.raw} raw records received · ${d.dupes} older duplicate${d.dupes === 1 ? "" : "s"} collapsed (latest wins).</p>` : ""}
  <div class="lane">
    ${d.orders.length ? `<table>
      <tr><th>Order #</th><th>Customer</th><th>Status</th><th>Ordered</th><th>Cab part(s)</th><th>&rarr; Line</th><th>Flags</th></tr>
      ${d.orders.map(row).join("")}
    </table>` : `<div class="muted">No fresh orders right now — the intake queue is clear. New pushes will appear here automatically.</div>`}
  </div>
  <div class="lane">
    <h3>Routing map <span class="muted" style="font-weight:400;font-size:.85rem">(product family &rarr; line)</span></h3>
    <p class="muted" style="margin:-4px 0 8px;font-size:.85rem">How a cab's part number routes to a production line — the mapping job uses this. Change a product's line in the catalog to change it.</p>
    <table><tr><th>Family</th><th>Line</th></tr>
      ${d.routing.map((r) => `<tr><td>${esc(r.family)}</td><td>${esc(r.lines)}</td></tr>`).join("")}
    </table>
  </div>
  <p class="muted" style="font-size:.85rem;text-align:center">Read-only. When the push contract is final, the mapping job will read this same fresh set, split multi-cab orders, assign cab numbers, and place cabs on the board — stamping each order handled so it's never re-mapped.</p>
</div></body></html>`;
}

// ============================================================
// COYOTE -> BOARD MAPPER — DRY-RUN PREVIEW (Track A, admin-only, READ-ONLY).
// Shows exactly what the mapping job WOULD create for every fresh Coyote order
// BEFORE anything is written to the board, so it can be checked against the
// physical whiteboard first. Writes NOTHING. Cadence-independent: it reads the
// same latest-per-order fresh set the mapper will, so whatever cadence the
// developer settles on (change-only vs full-record) does not change this view.
// Cab # is deliberately NOT invented here — the floor/whiteboard owns the cab
// counter until cutover and the app mirrors it; match rows to the board by
// ORDER # (the canonical key). We map order #, cab part -> product -> line,
// status -> board placement, the invoice note (-> manager review), and
// multi-cab splits — the build-record shape a Queued order becomes.
function classifyOrder(o) {
  const st = o.status, hasCab = o.cabPartsCount > 0;
  if (!hasCab) {
    if (o.hasBlazerTop) return { group: "excluded", state: "—", reason: "Blazer top only — outsourced, never built here." };
    return { group: "needs-setup", state: "—", reason: "No recognized cab part — add the part to the catalog, or the order isn't a cab." };
  }
  if (st === "Queued") return { group: "place", state: o.cabPartsCount > 1 ? "upcoming · split" : "upcoming", reason: "" };
  if (st === "Processed") return { group: "shipped", state: "shipped", reason: "Already shipped — kept as history, not placed on the live board." };
  return { group: "review", state: "held", reason: st === "—" ? "No status on the order — check Coyote before mapping." : `Status "${st}" is outside Queued/Processed (e.g. Hold) — not placed until it is back to Queued.` };
}
async function mapperPreviewData() {
  const rows = await db(`coyote_intake?select=payload,received_at&processed_at=is.null&order=received_at.desc&limit=5000`);
  const prods = await db(`product?select=part_number,family,lines&retired=is.false`);
  const prodByPart = {}; for (const p of prods) prodByPart[String(p.part_number).toUpperCase()] = p;
  const lns = await db(`line?select=id,name`);
  const lineName = {}; for (const l of lns) lineName[l.id] = l.name;
  const allow = new Set(Object.keys(prodByPart));
  const tmplReady = {}; for (const t of await db(`build_template?select=family,ready`)) tmplReady[t.family] = t.ready;
  const seen = new Set(); const orders = []; let raw = 0, dupes = 0;
  for (const r of rows) {
    raw++;
    const p = r.payload || {};
    const o = (p.order && typeof p.order === "object") ? p.order : {};
    const ordNo = String(o.order_number ?? p.order_number ?? "").trim();
    const key = ordNo || ("__row_" + raw);
    if (seen.has(key)) { dupes++; continue; }   // newest-first -> first seen wins
    seen.add(key);
    const c = (p.customer && typeof p.customer === "object") ? p.customer : {};
    const custName = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || (c.company || "");
    const items = Array.isArray(p.line_items) ? p.line_items : [];
    const cabParts = []; let blazerTop = false;
    for (const it of items) {
      const num = String((it && it.item_number) ?? "").trim(); if (!num) continue;
      const up = num.toUpperCase();
      if (up === "PSR-BLZR-TOP") { blazerTop = true; continue; }
      if (allow.has(up)) { const pr = prodByPart[up]; cabParts.push({ part: num, family: pr.family, lines: (pr.lines || []).map((lid) => lineName[lid] || ("Line " + lid)), qty151: it && (it.qty ?? it.quantity) != null ? String(it.qty ?? it.quantity).trim() : ""   /* Block 160 (C2 audit): Coyote pushes the count as "qty" — "quantity" never existed in any real payload; read qty first, keep quantity as a fallback */ }); }
    }
    const status = String(o.status ?? "").trim() || "—";
    const noteRaw = String(o.invoice_note ?? "").trim();
    // Block 151: the preview mirrors the engine — duplicate same-part rows
    // collapse to one cab and the preview says so right in the Note column.
    const col151 = collapseCabs151(cabParts);
    const cabs151 = col151.cabs;
    const dup151 = col151.dupes.map((d) => "⚠ " + d.part + " on " + d.rows + " rows" + (d.qty > 1 ? " (quantity " + d.qty + ")" : "") + " — one cab placed, verify the count").join(" · ");
    const note = noteRaw + (dup151 ? (noteRaw ? " · " : "") + dup151 : "");
    const cls = classifyOrder({ status, cabPartsCount: cabs151.length, hasBlazerTop: blazerTop });
    let group = cls.group, propState = cls.state, reason = cls.reason;
    if (group === "place" && cabs151.some((cp) => tmplReady[cp.family] === false)) {
      group = "review"; propState = "held";
      reason = "New cab — its build steps aren't finished, so it's held off the board until the template is marked ready.";
    }
    const splits = cabs151.length > 1 ? cabs151.map((cp, i) => ({ sub: `${ordNo}.${i + 1}`, part: cp.part, line: cp.lines.join(", ") })) : [];
    orders.push({ order: ordNo || "—", customer: custName, status, group, propState, reason,
      date: String(o.date ?? "").slice(0, 10), ship: String(o.ship_date ?? "").slice(0, 10),
      parts: cabs151, lines: [...new Set(cabs151.flatMap((cp) => cp.lines))], family: [...new Set(cabs151.map((cp) => cp.family))].join(", "),
      note, hasNote: !!note, blazerTop, splits });
  }
  const rank = { place: 0, review: 1, "needs-setup": 2, shipped: 3, excluded: 4 };
  orders.sort((a, b) => (rank[a.group] - rank[b.group]) || String(a.order).localeCompare(String(b.order)));
  const counts = { place: 0, review: 0, "needs-setup": 0, shipped: 0, excluded: 0, note: 0, split: 0 };
  for (const o of orders) { counts[o.group] = (counts[o.group] || 0) + 1; if (o.group === "place" && o.hasNote) counts.note++; if (o.group === "place" && o.splits.length) counts.split++; }
  return { orders, raw, distinct: orders.length, dupes, counts };
}
function mapperPreviewPage(d) {
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clip = (s, n) => s.length > n ? esc(s.slice(0, n)) + "…" : esc(s);
  const g = (name) => d.orders.filter((o) => o.group === name);
  const placeRow = (o) => `<tr>
    <td><b><a href="/order?n=${encodeURIComponent(o.order)}" style="color:inherit;text-decoration:underline dotted">${esc(o.order)}</a></b></td>
    <td>${esc(o.customer) || '<span class="muted">—</span>'}</td>
    <td>${o.parts.map((p) => esc(p.part)).join("<br>") || '<span class="muted">—</span>'}</td>
    <td>${esc(o.family) || '<span class="muted">—</span>'}</td>
    <td>${o.lines.length ? o.lines.map(esc).join(", ") : '<span class="flag amber">no line</span>'}</td>
    <td><span class="st q">${esc(o.propState)}</span></td>
    <td class="muted">${esc(o.ship || o.date) || "—"}</td>
    <td>${o.hasNote ? '<span class="flag amber">note → review</span>' : '<span class="muted">—</span>'}</td>
  </tr>${o.splits.length ? `<tr class="sub"><td></td><td colspan="7"><span class="muted">splits into:</span> ${o.splits.map((s) => `<b>${esc(s.sub)}</b> ${esc(s.part)} → ${esc(s.line)}`).join(" · ")}</td></tr>` : ""}${o.hasNote ? `<tr class="sub"><td></td><td colspan="7"><span class="muted">invoice note:</span> ${clip(o.note, 220)}</td></tr>` : ""}`;
  const simpleRow = (o) => `<tr>
    <td><b><a href="/order?n=${encodeURIComponent(o.order)}" style="color:inherit;text-decoration:underline dotted">${esc(o.order)}</a></b></td>
    <td>${esc(o.customer) || '<span class="muted">—</span>'}</td>
    <td>${o.parts.map((p) => esc(p.part)).join("<br>") || (o.blazerTop ? '<span class="muted">blazer top</span>' : '<span class="flag red">no cab part</span>')}</td>
    <td>${o.status === "Queued" ? '<span class="st q">Queued</span>' : o.status === "Processed" ? '<span class="st p">Processed</span>' : `<span class="st o">${esc(o.status)}</span>`}</td>
    <td class="muted">${esc(o.reason)}</td>
  </tr>`;
  const section = (title, rows, head, sub) => `<div class="lane"><h3>${title} <span class="muted" style="font-weight:400;font-size:.8em">(${rows.length})</span></h3>${sub ? `<p class="muted" style="margin:-4px 0 8px;font-size:.85rem">${sub}</p>` : ""}${rows.length ? `<table><tr>${head}</tr>${rows.join("")}</table>` : `<div class="muted">None.</div>`}</div>`;
  const place = g("place"), review = g("review"), needs = g("needs-setup"), shipped = g("shipped"), excluded = g("excluded");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Mapper preview</title>${style}
<style>
  @media (max-width:640px){.wrap{padding-left:8px;padding-right:8px} .wrap table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap} .wrap .kpi{min-width:calc(50% - 10px)}}
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:16px}
  .lane h3{margin:0 0 10px}
  table{width:100%;border-collapse:collapse;font-size:.92rem}
  th{opacity:.55;text-align:left;padding:6px 8px;font-weight:600}
  td{padding:7px 8px;border-top:1px solid var(--line);vertical-align:top}
  tr.sub td{border-top:none;padding-top:0;font-size:.85rem}
  .muted{opacity:.6}
  .flag{padding:1px 8px;border-radius:10px;font-size:.8em;white-space:nowrap;display:inline-block}
  .flag.red{background:#3a1510;color:#ff6b5e}.flag.amber{background:#3a2f10;color:#ffd60a}
  .st{padding:1px 9px;border-radius:10px;font-size:.82em;font-weight:600}
  .st.q{background:#10233a;color:#5eaeff}.st.p{background:#12331c;color:#5edb84}.st.o{background:#3a2f10;color:#ffd60a}
  .kpi{display:inline-block;min-width:92px;text-align:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:0 8px 8px 0}
  .kpi b{display:block;font-size:1.5rem}.kpi span{opacity:.6;font-size:.8rem}
  @media print{ a{display:none} }
</style></head>
<body><div class="wrap" style="max-width:1050px">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${navBar95(true)}
  <h2>Mapper preview <span class="muted" style="font-size:.6em;font-weight:400">— dry run, nothing is written</span></h2>
  <p class="muted" style="margin-top:-8px">Exactly what the mapping job <b>would</b> put on the board for each fresh Coyote order, so you can check it against the whiteboard first. This writes <b>nothing</b> — no cab is placed and no order is marked handled. <b>Cab #s aren't shown</b> on purpose: the floor assigns those and the app mirrors the wall, so match rows to the board by <b>order #</b>. When the push contract is final, the write step promotes these — and the mapping is already correct no matter how often the developer pushes.</p>
  <div style="margin:14px 0">
    <div class="kpi"><b>${place.length}</b><span>will place</span></div>
    <div class="kpi"><b>${d.counts.split}</b><span>multi-cab</span></div>
    <div class="kpi"><b>${d.counts.note}</b><span>note → review</span></div>
    <div class="kpi"><b>${review.length + needs.length}</b><span>need attention</span></div>
    <div class="kpi"><b>${shipped.length}</b><span>shipped (skip)</span></div>
  </div>
  ${d.dupes ? `<p class="muted" style="font-size:.85rem">${d.raw} raw records · ${d.dupes} older duplicate${d.dupes === 1 ? "" : "s"} collapsed (latest per order wins).</p>` : ""}
  ${section("✅ Will be placed on the board", place.map(placeRow), '<th>Order #</th><th>Customer</th><th>Cab part(s)</th><th>Family</th><th>→ Line</th><th>Board state</th><th>Target ship</th><th>Note</th>', "Queued orders with a recognized cab part. Each becomes an upcoming cab on its routed line; a multi-cab order splits into dotted sub-orders; an invoice note rides onto the cab and raises a manager-review flag.")}
  ${(review.length || needs.length) ? section("⚠️ Need attention before mapping", [...review, ...needs].map(simpleRow), '<th>Order #</th><th>Customer</th><th>Cab part(s)</th><th>Status</th><th>Why it is held back</th>', "Not placed automatically — an unusual status (e.g. Hold), or a part the catalog does not recognize. Resolve it in Coyote or the catalog and it flows through on the next look.") : ""}
  ${shipped.length ? section("🚚 Already shipped — kept as history, not placed", shipped.map(simpleRow), '<th>Order #</th><th>Customer</th><th>Cab part(s)</th><th>Status</th><th>Note</th>', "Processed = shipped. These stay in the record but do not clutter the live board.") : ""}
  ${excluded.length ? section("⛔ Excluded", excluded.map(simpleRow), '<th>Order #</th><th>Customer</th><th>Cab part(s)</th><th>Status</th><th>Why</th>', "Blazer tops are outsourced and never enter the app.") : ""}
  <p class="muted" style="font-size:.85rem;text-align:center">Read-only preview. The write step — promote an order to a real cab on the board, idempotent and keyed on order # — is the small follow-on once the push cadence is confirmed. The mapping shown here does not change either way.</p>
</div></body></html>`;
}

// ============================================================
// LATEST PUSH — WHAT CHANGED (Track A, admin-only, READ-ONLY). Productizes the
// hand-run push-to-push diff: compares the most recent Coyote push against the
// one before it and reports what's NEW, what CHANGED (status/ship/note/parts,
// with before->after), and what FELL OFF (was Queued in the prior push, absent
// now — the tell for a status change like Queued->Hold when the push filters to
// Queued/Processed). Writes nothing. Compares the ACTIVE (Queued) set, so
// terminal Processed/shipped orders don't show up as false "fell off".
function diffFields(a, b) {   // a = newer, b = older; returns list of changes
  const out = [];
  if (a.status !== b.status) out.push({ field: "status", before: b.status, after: a.status });
  if (a.ship !== b.ship) out.push({ field: "ship date", before: b.ship || "—", after: a.ship || "—" });
  if (a.note !== b.note) out.push({ field: "invoice note", before: b.note || "(blank)", after: a.note || "(blank)" });
  if (a.parts !== b.parts) out.push({ field: "cab part(s)", before: b.parts || "—", after: a.parts || "—" });
  return out;
}
async function pushDiffData() {
  // Block 90: reworked for the CHANGE-ONLY delta feed (confirmed live 2026-08-06).
  // The old version compared batch ROSTERS (full-snapshot thinking) and read only
  // processed_at=is.null rows — but the write engine now stamps rows processed
  // within the hour (the page would starve), and absence from a delta push means
  // "nothing changed", never "left the queue". Now: read ALL rows, and diff each
  // order in the latest push against ITS OWN most recent earlier row.
  const rows = await db(`coyote_intake?select=payload,received_at&order=received_at.desc&limit=5000`);
  const recs = rows.map((r) => {
    const p = r.payload || {}, o = (p.order && typeof p.order === "object") ? p.order : {};
    const c = (p.customer && typeof p.customer === "object") ? p.customer : {};
    const items = Array.isArray(p.line_items) ? p.line_items : [];
    const parts = items.map((it) => String((it && it.item_number) ?? "").trim()).filter(Boolean).sort().join(", ");
    return { t: new Date(r.received_at).getTime(), ord: String(o.order_number ?? p.order_number ?? "").trim(),
      status: String(o.status ?? "").trim() || "—", ship: String(o.ship_date ?? "").slice(0, 10),
      note: String(o.invoice_note ?? "").trim(), parts,
      customer: [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || (c.company || ""), received: r.received_at };
  }).filter((r) => r.ord);
  if (!recs.length) return { empty: true };
  // split into push batches: a burst is seconds, pushes are hours/days apart
  const GAP = 30 * 60 * 1000, batches = []; let cur = [recs[0]];
  for (let i = 1; i < recs.length; i++) {
    if (cur[cur.length - 1].t - recs[i].t > GAP) { batches.push(cur); cur = [recs[i]]; } else cur.push(recs[i]);
  }
  batches.push(cur);
  const latest = batches[0], prev = batches[1] || [];
  const mapOf = (b) => { const m = {}; for (const r of b) if (!(r.ord in m)) m[r.ord] = r; return m; }; // desc -> first = newest
  const A = mapOf(latest);
  const prevOf = {}; // each order's most recent row from ANY earlier push
  for (let bi = 1; bi < batches.length; bi++) for (const r of batches[bi]) if (!(r.ord in prevOf)) prevOf[r.ord] = r;
  const stamp = (iso) => { const d = new Date(new Date(iso).getTime() - 7 * 3600 * 1000); return d.toISOString().slice(0, 16).replace("T", " "); };
  const added = [], changed = [], left = []; let unchanged = 0;
  for (const k of Object.keys(A)) {
    if (!(k in prevOf)) { added.push(A[k]); continue; }
    const fx = diffFields(A[k], prevOf[k]);
    if (!fx.length) { unchanged++; continue; }
    changed.push({ ...A[k], changes: fx });
    const st = fx.find((c) => c.field === "status");
    if (st && st.before === "Queued" && st.after !== "Queued") left.push({ ...A[k], from: st.before, to: st.after });
  }
  const bo = (x, y) => String(x.ord).localeCompare(String(y.ord));
  added.sort(bo); changed.sort(bo); left.sort(bo);
  return { hasPrev: !!batches[1], latestTime: stamp(latest[0].received), latestCount: Object.keys(A).length,
    prevTime: prev.length ? stamp(prev[0].received) : null, prevCount: prev.length ? Object.keys(mapOf(prev)).length : 0,
    added, changed, left, unchanged, batchCount: batches.length };
}
function pushDiffPage(d) {
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clip = (s, n) => { s = String(s == null ? "" : s); return s.length > n ? esc(s.slice(0, n)) + "…" : esc(s); };
  const stat = (s) => s === "Queued" ? '<span class="st q">Queued</span>' : s === "Processed" ? '<span class="st p">Processed</span>' : `<span class="st o">${esc(s)}</span>`;
  const nav = `<div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${navBar95(true)}`;
  const head = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Latest push</title>${style}
<style>
  @media (max-width:640px){.wrap{padding-left:8px;padding-right:8px} .wrap table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap} .wrap .kpi{min-width:calc(50% - 10px)}}
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:16px}
  .lane h3{margin:0 0 10px}
  table{width:100%;border-collapse:collapse;font-size:.92rem}
  th{opacity:.55;text-align:left;padding:6px 8px;font-weight:600}
  td{padding:7px 8px;border-top:1px solid var(--line);vertical-align:top}
  .muted{opacity:.6}
  .chg{color:#ffd60a}.chg b{color:#fff}
  .st{padding:1px 9px;border-radius:10px;font-size:.82em;font-weight:600}
  .st.q{background:#10233a;color:#5eaeff}.st.p{background:#12331c;color:#5edb84}.st.o{background:#3a2f10;color:#ffd60a}
  .kpi{display:inline-block;min-width:96px;text-align:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:0 8px 8px 0}
  .kpi b{display:block;font-size:1.5rem}.kpi span{opacity:.6;font-size:.8rem}
  @media print{ a{display:none} }
</style></head>
<body><div class="wrap" style="max-width:1000px">
  ${nav}
  <h2>Latest push <span class="muted" style="font-size:.6em;font-weight:400">— what changed since the one before</span></h2>`;
  if (d.empty) return head + `<div class="lane"><div class="muted">No pushes have landed yet. When Coyote sends one, this page shows what's new or changed — each order against its own history.</div></div></div></body></html>`;
  const intro = `<p class="muted" style="margin-top:-8px">The feed is <b>change-only</b>: a push carries just the orders with changes, so every order here is compared against <b>its own previous row</b> — never against a full roster. An order absent from a push simply had nothing new. New orders, field edits (status · ship date · invoice note · cab part), and status moves off Queued all arrive as explicit rows. Read-only; nothing is written.</p>
  <div class="lane" style="padding:12px 16px">
    <b>Latest push:</b> ${esc(d.latestTime)} <span class="muted">· ${d.latestCount} order${d.latestCount === 1 ? "" : "s"} in the batch</span><br>
    <b>Previous push:</b> ${d.prevTime ? esc(d.prevTime) + ` <span class="muted">· ${d.prevCount} order${d.prevCount === 1 ? "" : "s"}</span>` : '<span class="muted">— none earlier to compare against</span>'}
  </div>`;
  if (!d.hasPrev) return head + intro + `<div class="lane"><div class="muted">This is the first push on record — there's nothing earlier to diff against yet. The next push will compare against this one.</div></div></div></body></html>`;
  const kpis = `<div style="margin:14px 0">
    <div class="kpi"><b>${d.added.length}</b><span>new</span></div>
    <div class="kpi"><b>${d.changed.length}</b><span>changed</span></div>
    <div class="kpi"><b>${d.left.length}</b><span>left the queue</span></div>
    <div class="kpi"><b>${d.unchanged}</b><span>unchanged</span></div>
  </div>`;
  const addedRows = d.added.map((o) => `<tr><td><b><a href="/order?n=${encodeURIComponent(o.ord)}" style="color:inherit;text-decoration:underline dotted">${esc(o.ord)}</a></b></td><td>${esc(o.customer) || '<span class="muted">—</span>'}</td><td>${stat(o.status)}</td><td>${esc(o.parts) || '<span class="muted">—</span>'}</td></tr>`).join("");
  const changedRows = d.changed.map((o) => `<tr><td><b><a href="/order?n=${encodeURIComponent(o.ord)}" style="color:inherit;text-decoration:underline dotted">${esc(o.ord)}</a></b></td><td>${esc(o.customer) || '<span class="muted">—</span>'}</td><td class="chg">${o.changes.map((c) => `${esc(c.field)}: <b>${clip(c.before, 50)}</b> → <b>${clip(c.after, 50)}</b>`).join("<br>")}</td></tr>`).join("");
  const leftRows = d.left.map((o) => `<tr><td><b><a href="/order?n=${encodeURIComponent(o.ord)}" style="color:inherit;text-decoration:underline dotted">${esc(o.ord)}</a></b></td><td>${esc(o.customer) || '<span class="muted">—</span>'}</td><td>${stat(o.from)} → ${stat(o.to)}</td></tr>`).join("");
  const sect = (title, rows, headcols, sub) => `<div class="lane"><h3>${title} <span class="muted" style="font-weight:400;font-size:.8em">(${rows ? rows.split("</tr>").length - 1 : 0})</span></h3>${sub ? `<p class="muted" style="margin:-4px 0 8px;font-size:.85rem">${sub}</p>` : ""}${rows ? `<table><tr>${headcols}</tr>${rows}</table>` : `<div class="muted">None.</div>`}</div>`;
  return head + intro + kpis
    + sect("🆕 New in this push", addedRows, "<th>Order #</th><th>Customer</th><th>Status</th><th>Cab part(s)</th>", "First appearance in the feed — orders never pushed before (any status).")
    + sect("✏️ Changed", changedRows, "<th>Order #</th><th>Customer</th><th>What changed</th>", "Orders present in both pushes with an edited field. A status change (e.g. Queued → Hold) shows here when the push carries it as a row.")
    + sect("🚪 Left the build queue", leftRows, "<th>Order #</th><th>Customer</th><th>Status moved</th>", "Status moved OFF Queued in this push (a hold, a ship, or a cancel) — carried as an explicit row by the change-only feed, never guessed from absence.")
    + `<p class="muted" style="font-size:.85rem;text-align:center">Read-only. This is the standing version of the manual push-to-push diff — it answers "what moved" every time a push lands, no queries needed.</p>
</div></body></html>`;
}

// ============================================================
// COYOTE FEED MONITOR (Track A, admin-only, READ-ONLY). Eyes on the intake:
// data-health stats (how much data, fresh vs handled, growth, rough size) plus
// a push-activity log (every push batch received, newest first, expandable to
// its orders). Robust to any push shape — it just reports what landed, no
// full-snapshot/fall-off assumptions. Serves the "is the data piling up" worry
// and lets us watch the hourly pushes land. Writes nothing.
async function feedMonitorData() {
  // health from small columns (all rows)
  const meta = await db(`coyote_intake?select=order_number,received_at,processed_at&limit=100000`);
  const total = meta.length;
  let fresh = 0, handled = 0; const byOrder = {}, perDay = {}; let oldest = null, newest = null;
  for (const r of meta) {
    if (r.processed_at) handled++; else fresh++;
    const on = String(r.order_number ?? "").trim(); if (on) byOrder[on] = (byOrder[on] || 0) + 1;
    const day = String(r.received_at).slice(0, 10); perDay[day] = (perDay[day] || 0) + 1;
    if (!oldest || r.received_at < oldest) oldest = r.received_at;
    if (!newest || r.received_at > newest) newest = r.received_at;
  }
  const distinct = Object.keys(byOrder).length;
  const dupeRows = total - distinct, dupeOrders = Object.values(byOrder).filter((n) => n > 1).length;
  const days = Object.keys(perDay).sort().reverse().slice(0, 14).map((day) => ({ day, n: perDay[day] }));
  // recent payloads for the push log + a storage sample
  const rows = await db(`coyote_intake?select=payload,received_at&order=received_at.desc&limit=1000`);
  let sampleBytes = 0;
  const recs = rows.map((r) => {
    const s = JSON.stringify(r.payload || {}); sampleBytes += s.length;
    const p = r.payload || {}, o = (p.order && typeof p.order === "object") ? p.order : {};
    const c = (p.customer && typeof p.customer === "object") ? p.customer : {};
    return { t: new Date(r.received_at).getTime(), received: r.received_at,
      ord: String(o.order_number ?? p.order_number ?? "").trim() || "—",
      status: String(o.status ?? "").trim() || "—",
      customer: [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || (c.company || "") };
  });
  const avgBytes = rows.length ? Math.round(sampleBytes / rows.length) : 0, estBytes = avgBytes * total;
  // group recent rows into push batches (gap > 30 min = a new push)
  const batches = [];
  if (recs.length) {
    let cur = [recs[0]];
    for (let i = 1; i < recs.length; i++) { if (cur[cur.length - 1].t - recs[i].t > 30 * 60 * 1000) { batches.push(cur); cur = [recs[i]]; } else cur.push(recs[i]); }
    batches.push(cur);
  }
  const stamp = (iso) => { const dt = new Date(new Date(iso).getTime() - 7 * 3600 * 1000); return dt.toISOString().slice(0, 16).replace("T", " "); };
  const log = batches.slice(0, 20).map((b) => {
    const q = b.filter((x) => x.status === "Queued").length, pr = b.filter((x) => x.status === "Processed").length;
    return { time: stamp(b[0].received), n: b.length, q, pr, other: b.length - q - pr,
      orders: b.map((x) => ({ ord: x.ord, status: x.status, customer: x.customer })) };
  });
  // feed health + growth outlook
  const nowMs = Date.now();
  const newestMs = newest ? new Date(newest).getTime() : null, oldestMs = oldest ? new Date(oldest).getTime() : null;
  const sinceMin = newestMs ? Math.max(0, Math.round((nowMs - newestMs) / 60000)) : null;
  const phxHr = new Date(nowMs - 7 * 3600 * 1000).getUTCHours();
  const inWindow = phxHr >= 6 && phxHr < 18;   // Aaron's stated 6 AM–6 PM active window
  const spanDays = (newestMs && oldestMs) ? Math.max(1, (newestMs - oldestMs) / 86400000) : 1;
  const rowsPerDay = total / spanDays, bytesPerDay = rowsPerDay * avgBytes;
  const projMB6 = bytesPerDay * 182 / 1048576, projMB12 = bytesPerDay * 365 / 1048576;
  const yearsTo1GB = bytesPerDay > 0 ? (1073741824 / bytesPerDay) / 365 : null;
  return { total, fresh, handled, distinct, dupeRows, dupeOrders, days,
    oldest: oldest ? stamp(oldest) : "—", newest: newest ? stamp(newest) : "—",
    avgBytes, estBytes, batchCount: batches.length, sampled: rows.length, log,
    sinceMin, inWindow, rowsPerDay, spanDays, projMB6, projMB12, yearsTo1GB };
}
function feedMonitorPage(d) {
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmtB = (n) => n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(2) + " MB";
  const fmtMB = (mb) => mb < 1024 ? mb.toFixed(mb < 10 ? 1 : 0) + " MB" : (mb / 1024).toFixed(2) + " GB";
  const ago = (m) => m == null ? "—" : m < 60 ? m + " min ago" : m < 1440 ? Math.floor(m / 60) + "h " + (m % 60) + "m ago" : Math.floor(m / 1440) + "d ago";
  const health = d.sinceMin == null ? { cls: "muted", txt: "No pushes received yet." }
    : d.sinceMin <= 90 ? { cls: "ok", txt: "Live — last push " + ago(d.sinceMin) + "." }
    : d.inWindow ? { cls: "warn", txt: "Last push " + ago(d.sinceMin) + " during work hours — most likely a quiet stretch on the change-only feed, but worth a glance if it stays quiet." }
    : { cls: "muted", txt: "Last push " + ago(d.sinceMin) + ". Outside the 6 AM–6 PM window — pushes resume in the morning." };
  const stat = (s) => s === "Queued" ? '<span class="st q">Queued</span>' : s === "Processed" ? '<span class="st p">Processed</span>' : `<span class="st o">${esc(s)}</span>`;
  const batchBlock = (b) => `<details><summary><b>${esc(b.time)}</b> · ${b.n} order${b.n === 1 ? "" : "s"} <span class="muted">· ${b.q} queued · ${b.pr} processed${b.other ? ` · ${b.other} other` : ""}</span></summary>
    <table style="margin-top:8px"><tr><th>Order #</th><th>Status</th><th>Customer</th></tr>
    ${b.orders.map((o) => `<tr><td><b><a href="/order?n=${encodeURIComponent(o.ord)}" style="color:inherit;text-decoration:underline dotted">${esc(o.ord)}</a></b></td><td>${stat(o.status)}</td><td>${esc(o.customer) || '<span class="muted">—</span>'}</td></tr>`).join("")}
    </table></details>`;
  const maxDay = Math.max(1, ...d.days.map((x) => x.n));
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Coyote feed</title>${style}
<style>
  @media (max-width:640px){.wrap{padding-left:8px;padding-right:8px} .wrap table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap} .wrap .kpi{min-width:calc(50% - 10px)}}
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:16px}
  .lane h3{margin:0 0 10px}
  table{width:100%;border-collapse:collapse;font-size:.92rem}
  th{opacity:.55;text-align:left;padding:6px 8px;font-weight:600}
  td{padding:6px 8px;border-top:1px solid var(--line)}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .muted{opacity:.6}
  .st{padding:1px 9px;border-radius:10px;font-size:.82em;font-weight:600}
  .st.q{background:#10233a;color:#5eaeff}.st.p{background:#12331c;color:#5edb84}.st.o{background:#3a2f10;color:#ffd60a}
  .kpi{display:inline-block;min-width:96px;text-align:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:0 8px 8px 0}
  .kpi b{display:block;font-size:1.5rem}.kpi span{opacity:.6;font-size:.8rem}
  details{border-top:1px solid var(--line);padding:8px 0}
  summary{cursor:pointer;list-style:none}
  summary::-webkit-details-marker{display:none}
  summary:before{content:"▸ ";opacity:.5}
  details[open] summary:before{content:"▾ "}
  .bar{display:inline-block;height:8px;background:#5eaeff;border-radius:4px;vertical-align:middle;margin-left:8px}
  .dot{width:10px;height:10px;border-radius:50%;flex:none;display:inline-block}
  .dot.ok{background:#30d158}.dot.warn{background:#ffd60a}.dot.muted{background:#8e8e93}
  .lane.ok{border-color:#1f5133}.lane.warn{border-color:#5a4a10}
  @media print{ a{display:none} details{border:none} details>*:not(summary){display:block} }
</style></head>
<body><div class="wrap" style="max-width:1000px">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${navBar95(true)}
  <h2>Coyote feed <span class="muted" style="font-size:.6em;font-weight:400">— activity &amp; data health</span></h2>
  <p class="muted" style="margin-top:-8px">A live look at the intake: how much data we're holding and every push as it lands. Read-only — nothing here changes the board or the data.</p>
  <div class="lane ${health.cls}" style="padding:12px 16px;display:flex;align-items:center;gap:10px">
    <span class="dot ${health.cls}"></span>
    <div><b>Feed status:</b> ${health.txt}</div>
  </div>
  <div style="margin:14px 0">
    <div class="kpi"><b>${d.total}</b><span>rows total</span></div>
    <div class="kpi"><b>${d.fresh}</b><span>fresh</span></div>
    <div class="kpi"><b>${d.handled}</b><span>handled</span></div>
    <div class="kpi"><b>${d.distinct}</b><span>distinct orders</span></div>
    <div class="kpi"><b>${d.dupeRows}</b><span>extra rows</span></div>
  </div>
  <div class="lane">
    <h3>Data health</h3>
    <table>
      <tr><td>Oldest row</td><td class="num">${esc(d.oldest)}</td></tr>
      <tr><td>Newest row</td><td class="num">${esc(d.newest)}</td></tr>
      <tr><td>Fresh (not yet acted on) / Handled</td><td class="num">${d.fresh} / ${d.handled}</td></tr>
      <tr><td>Distinct orders / extra (change-history) rows</td><td class="num">${d.distinct} / ${d.dupeRows}${d.dupeOrders ? ` (${d.dupeOrders} orders w/ history)` : ""}</td></tr>
      <tr><td>Avg payload size <span class="muted">(sampled ${d.sampled})</span></td><td class="num">${fmtB(d.avgBytes)}</td></tr>
      <tr><td>Estimated payload data held</td><td class="num">${fmtB(d.estBytes)}</td></tr>
    </table>
    <p class="muted" style="font-size:.82rem;margin:8px 0 0">Payload-size figures are estimates from a live sample; the table on disk runs somewhat larger with indexes. At this size storage is not a concern — archiving is a future housekeeping step, not an urgent one.</p>
  </div>
  <div class="lane">
    <h3>Growth outlook</h3>
    <table>
      <tr><td>Recent rate</td><td class="num">~${d.rowsPerDay.toFixed(d.rowsPerDay < 10 ? 1 : 0)} rows/day <span class="muted">(over ${d.spanDays.toFixed(0)} day${d.spanDays >= 1.5 ? "s" : ""})</span></td></tr>
      <tr><td>Projected data in 6 months / 12 months</td><td class="num">~${fmtMB(d.projMB6)} / ~${fmtMB(d.projMB12)}</td></tr>
      <tr><td>Time to reach 1 GB at this rate</td><td class="num">${d.yearsTo1GB ? "~" + d.yearsTo1GB.toFixed(d.yearsTo1GB < 10 ? 1 : 0) + " years" : "—"}</td></tr>
    </table>
    <p class="muted" style="font-size:.82rem;margin:8px 0 0">Rough projection from recent volume, which is currently inflated by one-time backfills — the change-only hourly feed going forward will be much lighter, so treat these as an upper bound. Even so, reaching a size where archiving matters is years out.</p>
  </div>
  <div class="lane">
    <h3>Rows received per day <span class="muted" style="font-weight:400;font-size:.82em">(days with pushes, newest first)</span></h3>
    ${d.days.length ? `<table>${d.days.map((x) => `<tr><td>${esc(x.day)}</td><td class="num">${x.n}<span class="bar" style="width:${Math.round((x.n / maxDay) * 160)}px"></span></td></tr>`).join("")}</table>` : `<div class="muted">No rows yet.</div>`}
  </div>
  <div class="lane">
    <h3>Push activity <span class="muted" style="font-weight:400;font-size:.82em">(each push, newest first — click to expand)</span></h3>
    <p class="muted" style="margin:-4px 0 8px;font-size:.85rem">Every push burst that landed, grouped by arrival time (Phoenix). A quiet hour on a change-only feed sends nothing, so gaps between pushes are normal — this shows what actually arrived.</p>
    ${d.log.length ? d.log.map(batchBlock).join("") : `<div class="muted">No pushes yet.</div>`}
    ${d.batchCount > d.log.length ? `<p class="muted" style="font-size:.82rem;margin-top:10px">Showing the ${d.log.length} most recent pushes of ${d.batchCount} in the sample.</p>` : ""}
  </div>
  <p class="muted" style="font-size:.85rem;text-align:center">Read-only monitor. Fresh rows are what the mapper will act on; handled rows are done or set aside (never deleted — reversible).</p>
</div></body></html>`;
}

// ============================================================
// ORDER HISTORY — one order's full Coyote push history (admin-only, READ-ONLY).
// Companion to /changes (all orders in the latest push) and /intake (all orders,
// latest state): this is ONE order, EVERY push over time — the first snapshot
// plus a row per change, with field-by-field diffs, plus how the order currently
// maps to the board. Reachable by clicking any order # on the Coyote pages, or by
// typing a number in the lookup box. Writes NOTHING. Keys on the
// coyote_intake.order_number column; n is user-supplied, so it is shape-guarded
// and URL-encoded before the query (no PostgREST filter injection).
async function orderHistoryData(n) {
  const ord = String(n == null ? "" : n).trim();
  if (!ord) return { order: "", asked: false, found: false, history: [] };
  if (!/^[A-Za-z0-9._-]{1,32}$/.test(ord)) return { order: ord, asked: true, found: false, badKey: true, history: [] };
  const prods = await db(`product?select=part_number,family,lines&retired=is.false`);
  const prodByPart = {}; for (const p of prods) prodByPart[String(p.part_number).toUpperCase()] = p;
  const lns = await db(`line?select=id,name`);
  const lineName = {}; for (const l of lns) lineName[l.id] = l.name;
  const allow = new Set(Object.keys(prodByPart));
  const rows = await db(`coyote_intake?select=payload,received_at,processed_at&order_number=eq.${encodeURIComponent(ord)}&order=received_at.asc&limit=5000`);
  const stamp = (iso) => { try { return new Date(new Date(iso).getTime() - 7 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " "); } catch (e) { return "—"; } };
  const snap = (p) => {
    const o = (p && p.order && typeof p.order === "object") ? p.order : {};
    const c = (p && p.customer && typeof p.customer === "object") ? p.customer : {};
    const custName = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || (c.company || "");
    const items = Array.isArray(p && p.line_items) ? p.line_items : [];
    const parts = []; let blazerTop = false;
    for (const it of items) {
      const num = String((it && it.item_number) ?? "").trim(); if (!num) continue;
      if (num.toUpperCase() === "PSR-BLZR-TOP") { blazerTop = true; continue; }
      parts.push(num);
    }
    return { status: String(o.status ?? p.status ?? "").trim() || "—", date: String(o.date ?? "").slice(0, 10),
      ship: String(o.ship_date ?? "").slice(0, 10), note: String(o.invoice_note ?? "").trim(), customer: custName, parts, blazerTop };
  };
  const FIELDS = [["status", "Status"], ["date", "Ordered"], ["ship", "Ship date"], ["note", "Invoice note"], ["parts", "Cab part(s)"]];
  const val = (s, f) => f === "parts" ? s.parts.join(", ") : String(s[f] || "");
  const history = []; let prev = null;
  for (const r of rows) {
    const s = snap(r.payload || {});
    const changes = [];
    if (prev) for (const [f, label] of FIELDS) { if (val(s, f) !== val(prev, f)) changes.push({ field: label, before: val(prev, f) || "—", after: val(s, f) || "—" }); }
    history.push({ stamp: stamp(r.received_at), processed: r.processed_at != null, snap: s, changes, first: prev == null });
    prev = s;
  }
  if (!history.length) return { order: ord, asked: true, found: false, history: [] };
  const cur = history[history.length - 1].snap;
  const recParts = cur.parts.filter((x) => allow.has(x.toUpperCase()));
  const cls = classifyOrder({ status: cur.status, cabPartsCount: recParts.length, hasBlazerTop: cur.blazerTop });
  const routed = [...new Set(recParts.flatMap((x) => (prodByPart[x.toUpperCase()].lines || []).map((lid) => lineName[lid] || ("Line " + lid))))].sort();
  const family = [...new Set(recParts.map((x) => prodByPart[x.toUpperCase()].family))].join(", ");
  return { order: ord, asked: true, found: true, customer: cur.customer, current: cur,
    mapping: { group: cls.group, state: cls.state, reason: cls.reason, routed, family, recParts,
      otherItems: cur.parts.filter((x) => !allow.has(x.toUpperCase()) && x.toUpperCase() !== "PSR-BLZR-TOP") },
    history, pushCount: history.length, changed: history.filter((h) => h.changes.length).length,
    firstSeen: history[0].stamp, lastSeen: history[history.length - 1].stamp };
}
function orderHistoryPage(d) {
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clip = (s, n) => { s = String(s == null ? "" : s); return s.length > n ? esc(s.slice(0, n)) + "…" : esc(s); };
  const stChip = (s) => s === "Queued" ? '<span class="st q">Queued</span>' : s === "Processed" ? '<span class="st p">Processed</span>' : `<span class="st o">${esc(s)}</span>`;
  const grpChip = (g) => ({ place: '<span class="flag blue">will place</span>', review: '<span class="flag amber">needs attention</span>', "needs-setup": '<span class="flag red">needs setup</span>', shipped: '<span class="flag grey">shipped — history</span>', excluded: '<span class="flag grey">excluded</span>' }[g] || "");
  const lookup = `<form method="get" action="/order" style="margin:12px 0">
    <input name="n" value="${esc(d.order)}" placeholder="Order # (e.g. 23305)" style="background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 12px;color:inherit;font-size:1rem;width:220px;max-width:60%">
    <button style="background:#0a84ff;border:0;border-radius:10px;padding:9px 16px;color:#fff;font-weight:600;cursor:pointer;margin-left:6px">Look up</button></form>`;
  let body;
  if (!d.asked) {
    body = `<div class="lane"><div class="muted">Type an order number above to see its full Coyote history — every push over time, what changed on each, and how it maps to the board.</div></div>`;
  } else if (d.badKey) {
    body = `<div class="lane"><div class="muted">"${esc(d.order)}" doesn't look like an order number. Order numbers are letters, digits, dots or dashes — e.g. <b>23305</b> or <b>W115954</b>.</div></div>`;
  } else if (!d.found) {
    body = `<div class="lane"><div class="muted">No Coyote records for order <b>${esc(d.order)}</b>. Double-check the number, or browse the <a href="/intake" style="color:#5eaeff">Intake</a> page. Blazer tops (outsourced) and orders never pushed won't appear here.</div></div>`;
  } else {
    const m = d.mapping, cur = d.current;
    const mapLane = `<div class="lane">
      <h3>Current state &amp; mapping ${grpChip(m.group)}</h3>
      <table>
        <tr><td>Status</td><td class="num">${stChip(cur.status)}</td></tr>
        <tr><td>Customer</td><td class="num">${esc(cur.customer) || "—"}</td></tr>
        <tr><td>Cab part(s)</td><td class="num">${m.recParts.length ? m.recParts.map(esc).join(", ") : (cur.blazerTop ? '<span class="muted">blazer top only (outsourced)</span>' : '<span class="flag red">no recognized cab part</span>')}${m.recParts.length && m.otherItems.length ? ` <span class="muted">· +${m.otherItems.length} option${m.otherItems.length === 1 ? "" : "s"}/labor</span>` : ""}${!m.recParts.length && !cur.blazerTop && m.otherItems.length ? ` <span class="muted" style="font-size:.85em">(${m.otherItems.map(esc).join(", ")})</span>` : ""}${cur.blazerTop && m.recParts.length ? ' <span class="flag grey">+ blazer top</span>' : ""}</td></tr>
        <tr><td>Family → line</td><td class="num">${esc(m.family) || "—"}${m.routed.length ? " → " + m.routed.map(esc).join(", ") : ""}</td></tr>
        <tr><td>Ordered / ship</td><td class="num">${esc(cur.date) || "—"} / ${esc(cur.ship) || "—"}</td></tr>
        <tr><td>Would map to</td><td class="num"><b>${esc(m.state)}</b></td></tr>
        ${cur.note ? `<tr><td>Invoice note</td><td class="num" style="max-width:420px;white-space:normal;text-align:left">${clip(cur.note, 400)} <span class="flag amber">→ review</span></td></tr>` : ""}
      </table>
      ${m.reason ? `<p class="muted" style="font-size:.85rem;margin:8px 0 0">${esc(m.reason)}</p>` : ""}
    </div>`;
    const histRows = d.history.map((h) => `<tr>
      <td class="num">${esc(h.stamp)}</td>
      <td>${stChip(h.snap.status)}</td>
      <td style="white-space:normal">${h.first ? '<span class="flag blue">first seen</span>' : h.changes.length ? h.changes.map((c) => `<b>${esc(c.field)}</b>: ${clip(c.before, 60)} → ${clip(c.after, 60)}`).join("<br>") : '<span class="muted">no change</span>'}</td>
      <td>${h.processed ? '<span class="st p">handled</span>' : '<span class="st q">fresh</span>'}</td>
    </tr>`).join("");
    const histLane = `<div class="lane">
      <h3>Push history <span class="muted" style="font-weight:400;font-size:.82em">(${d.pushCount} push${d.pushCount === 1 ? "" : "es"}, oldest first · ${d.changed} with a change)</span></h3>
      <p class="muted" style="margin:-4px 0 8px;font-size:.85rem">Every time Coyote sent this order — the first snapshot, then one row per change. The mapper reads the newest row as the current state; the older rows are the audit trail.</p>
      <table><tr><th>Received (Phoenix)</th><th>Status</th><th>What changed</th><th></th></tr>${histRows}</table>
    </div>`;
    body = `<div style="margin:14px 0">
        <div class="kpi"><b>${d.pushCount}</b><span>pushes</span></div>
        <div class="kpi"><b>${d.changed}</b><span>changes</span></div>
        <div class="kpi" style="min-width:150px"><b style="font-size:1rem">${esc(d.firstSeen)}</b><span>first seen</span></div>
        <div class="kpi" style="min-width:150px"><b style="font-size:1rem">${esc(d.lastSeen)}</b><span>last seen</span></div>
      </div>${mapLane}${histLane}`;
  }
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Order history</title>${style}
<style>
  @media (max-width:640px){.wrap{padding-left:8px;padding-right:8px} .wrap table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap} .wrap .kpi{min-width:calc(50% - 10px)}}
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:16px}
  .lane h3{margin:0 0 10px}
  table{width:100%;border-collapse:collapse;font-size:.92rem}
  th{opacity:.55;text-align:left;padding:6px 8px;font-weight:600}
  td{padding:7px 8px;border-top:1px solid var(--line);vertical-align:top}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .muted{opacity:.6}
  .flag{padding:1px 8px;border-radius:10px;font-size:.8em;white-space:nowrap;display:inline-block}
  .flag.red{background:#3a1510;color:#ff6b5e}
  .flag.amber{background:#3a2f10;color:#ffd60a}
  .flag.blue{background:#10233a;color:#5eaeff}
  .flag.grey{background:#2c2c2e;color:#aeaeb2}
  .st{padding:1px 9px;border-radius:10px;font-size:.82em;font-weight:600}
  .st.q{background:#10233a;color:#5eaeff}
  .st.p{background:#12331c;color:#5edb84}
  .st.o{background:#3a2f10;color:#ffd60a}
  .kpi{display:inline-block;min-width:96px;text-align:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:0 8px 8px 0}
  .kpi b{display:block;font-size:1.5rem}.kpi span{opacity:.6;font-size:.8rem}
  @media print{ a{display:none} }
</style></head>
<body><div class="wrap" style="max-width:900px">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${navBar95(true)}
  <h2>Order history${d.found ? ` — <span style="color:#5eaeff">${esc(d.order)}</span>${d.customer ? ` <span class="muted" style="font-size:.6em;font-weight:400">· ${esc(d.customer)}</span>` : ""}` : ""}</h2>
  <p class="muted" style="margin-top:-8px">One order's full history from Coyote — every push, every change, and how it maps to the board. Read-only.</p>
  ${lookup}
  ${body}
</div></body></html>`;
}

// ============================================================
// LINES & PARTS MANAGER — admin config for the production lines and the cab
// part numbers Coyote routes to them (owner-rep 2026-08-07). WRITES to the
// `line` and `product` config tables (audited). Coyote stays the source of
// truth for ORDERS; this only controls which part numbers are RECOGNIZED
// (the product catalog IS the accept-list classifyOrder gates on) and which
// line each cab family routes to. Changes take effect on the next push and on
// new placements; cabs already on the board are not moved by a reroute.
async function linesManagerData() {
  const lines = await db(`line?select=id,name,enabled&order=id`);
  const prods = await db(`product?select=part_number,family,lines,is_smk,retired&order=family,part_number`);
  const tmpls = await db(`build_template?select=id,family,ready`);
  const tmplByFam = {}; for (const t of tmpls) tmplByFam[t.family] = t;
  const famMap = {};
  for (const p of prods) {
    const f = (famMap[p.family] = famMap[p.family] || { family: p.family, parts: [], lineSet: new Set() });
    f.parts.push({ part_number: p.part_number, lines: (p.lines || []).slice().sort((a, b) => a - b), is_smk: !!p.is_smk, retired: !!p.retired });
    for (const lid of (p.lines || [])) f.lineSet.add(lid);
  }
  const families = Object.values(famMap).map((f) => ({
    family: f.family, parts: f.parts, lines: [...f.lineSet].sort((a, b) => a - b),
    hasTemplate: !!tmplByFam[f.family], templateId: tmplByFam[f.family] ? tmplByFam[f.family].id : null, ready: tmplByFam[f.family] ? tmplByFam[f.family].ready : false,
  })).sort((a, b) => a.family.localeCompare(b.family));
  const usage = {}; for (const l of lines) usage[l.id] = [];
  for (const f of families) for (const lid of f.lines) if (usage[lid]) usage[lid].push(f.family);
  // Block 122 (owner-rep): which lines still have a not-signed-off cab on them,
  // so disabling one WARNS (but still allows — a temporary line-down is fine;
  // re-enabling restores the cab exactly). One cab per line, so first wins.
  const onLine122 = await db(`build?select=order_number,line_id,state&state=in.(active,awaiting_inspection,rework)&limit=1000`);
  const occ122 = {}; for (const b of onLine122) if (b.line_id != null && !occ122[b.line_id]) occ122[b.line_id] = b.order_number;
  return { lines: lines.map((l) => ({ id: l.id, name: l.name, enabled: l.enabled, families: usage[l.id] || [], occupant: occ122[l.id] || null })), families };
}
function linesManagerPage(d) {
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const inp = "background:var(--card);border:1px solid var(--line);border-radius:8px;padding:6px 8px;color:inherit;font-size:.95rem";
  const activeLines = d.lines.filter((l) => l.enabled);
  const lineChecks = (name, current) => activeLines.map((l) => `<label class="ck"><input type="checkbox" name="${name}" value="${l.id}"${current.includes(l.id) ? " checked" : ""}> ${esc(l.name)}</label>`).join("");
  const lineRow = (l) => `<tr>
    <td class="num">${l.id}</td>
    <td><input id="ln-${l.id}" value="${esc(l.name)}" style="${inp};width:100%;max-width:340px"></td>
    <td>${l.enabled ? '<span class="st p">On</span>' : '<span class="st o">Off</span>'}</td>
    <td>${l.families.length ? l.families.map(esc).join(", ") : '<span class="muted">—</span>'}</td>
    <td style="white-space:nowrap">
      <button class="b" onclick="renameLine(${l.id},this)">Save name</button>
      <button class="b" onclick="toggleLine(${l.id},${l.enabled ? "false" : "true"},this,${l.occupant ? `'${esc(l.occupant)}'` : "''"})">${l.enabled ? "Disable" : "Enable"}</button>
    </td></tr>`;
  const famCard = (f, i) => `<div class="lane">
    <h3 style="margin-bottom:4px">${esc(f.family)} ${!f.hasTemplate ? '<span class="flag amber">no template</span>' : f.ready ? '<span class="st p">Ready</span>' : '<span class="flag amber">Draft — held off the board</span>'}</h3>
    <p class="muted" style="margin:0 0 8px;font-size:.85rem">Part${f.parts.length === 1 ? "" : "s"}: ${f.parts.map((p) => `<code${p.retired ? ' style="opacity:.45;text-decoration:line-through"' : ""}>${esc(p.part_number)}</code>${p.is_smk ? '<span class="muted">·smk</span>' : ""} <button class="b" style="padding:2px 8px;font-size:.75rem" onclick="post('/api/admin/catalog',{action:'${p.retired ? "restore" : "retire"}',part:'${esc(p.part_number)}'},this)">${p.retired ? "Restore" : "Retire"}</button>`).join(" &nbsp; ")}</p>
    <div class="checks">${lineChecks("rt-" + i, f.lines)}</div>
    <div style="margin-top:8px">
      <button class="b grn" onclick="routeFam(${i},this)">Save routing</button>
      <span style="margin:0 6px;opacity:.3">|</span>
      <input id="pn-${i}" placeholder="add a part #" style="${inp};width:190px">
      <button class="b" onclick="addPart(${i},this)">Add part &rarr; accepted</button>
    </div>
    ${f.templateId ? `<div style="margin-top:8px;border-top:1px dashed var(--line);padding-top:8px;font-size:.85rem">
      <a href="/admin?tpl=${f.templateId}" style="color:#5eaeff">Edit build steps</a>
      <span style="margin:0 8px;opacity:.3">|</span>
      ${f.ready
        ? `<button class="b" onclick="tmplReady('${f.templateId}',false,this)">Set back to draft</button>`
        : `<button class="b grn" onclick="tmplReady('${f.templateId}',true,this)">Mark ready</button> <span class="muted">— add the build steps first</span>`}
    </div>` : ""}
  </div>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Lines & parts</title>${style}
<style>
  @media (max-width:640px){.wrap{padding-left:8px;padding-right:8px} .wrap table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}}
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:16px}
  .lane h3{margin:0 0 10px}
  table{width:100%;border-collapse:collapse;font-size:.92rem}
  th{opacity:.55;text-align:left;padding:6px 8px;font-weight:600}
  td{padding:7px 8px;border-top:1px solid var(--line);vertical-align:middle}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .muted{opacity:.6}
  code{background:#0d0d0f;border:1px solid var(--line);border-radius:6px;padding:1px 6px;font-size:.9em}
  .flag{padding:1px 8px;border-radius:10px;font-size:.8em;white-space:nowrap;display:inline-block}
  .flag.amber{background:#3a2f10;color:#ffd60a}
  .st{padding:1px 9px;border-radius:10px;font-size:.82em;font-weight:600}
  .st.p{background:#12331c;color:#5edb84}.st.o{background:#3a2f10;color:#ffd60a}
  .b{background:#1c1c1e;border:1px solid var(--line);border-radius:8px;padding:6px 12px;color:#eaeaea;font-size:.85rem;cursor:pointer;margin-right:4px}
  .b.grn{background:#12331c;border-color:#1e5233;color:#5edb84}
  .checks{display:flex;flex-wrap:wrap;gap:6px 12px}
  .ck{display:inline-flex;align-items:center;gap:5px;font-size:.88rem;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:4px 10px;cursor:pointer}
  @media print{ a,.b{display:none} }
</style></head>
<body><div class="wrap" style="max-width:1000px">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${navBar95(true)}
  <h2>Lines &amp; parts <span class="muted" style="font-size:.6em;font-weight:400">— production lines &amp; the cab part numbers Coyote routes to them</span></h2>
  <p class="muted" style="margin-top:-8px">Add or rename a line, move a cab family to a different line, and register the part numbers a cab is built from. Every part number here is <b>accepted Coyote push data</b> — a number not in this catalog is ignored when a push lands. Changes apply to the next push and to new placements; cabs already on the board don't move.</p>

  <div class="lane">
    <h3>Production lines</h3>
    <table><tr><th>#</th><th>Name</th><th>Status</th><th>Cabs routing here</th><th></th></tr>
      ${d.lines.map(lineRow).join("")}
    </table>
    <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px">
      <input id="newline" placeholder="New line name (e.g. Line 7 — 47-53)" style="${inp};width:340px;max-width:70%">
      <button class="b grn" onclick="addLine(this)">Add line</button>
      <span class="muted" style="font-size:.8rem">a new line starts On and appears on the board</span>
    </div>
  </div>

  <h2 style="margin-top:26px">Cabs &amp; part numbers</h2>
  <p class="muted" style="margin-top:-8px">Check the line(s) a cab builds on and Save routing. Add a part number to make it accepted push data (it inherits the cab's build steps).</p>
  ${d.families.map(famCard).join("")}

  <div class="lane" style="border-style:dashed">
    <h3>Add a new cab</h3>
    <p class="muted" style="margin:-4px 0 10px;font-size:.85rem">A brand-new cab: part number, family name, and the line(s) it builds on. The part number is accepted immediately. A new family has <b>no build steps</b> until a template is made (a separate step) — it stays flagged until then.</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">
      <input id="nc-pn" placeholder="Part number (e.g. PSR-7387)" style="${inp};width:210px">
      <input id="nc-fam" placeholder="Cab / family (e.g. 73-87 Squarebody)" style="${inp};width:260px">
    </div>
    <div class="checks">${lineChecks("nc-lines", [])}</div>
    <button class="b grn" style="margin-top:8px" onclick="addCab(this)">Add cab &rarr; accepted</button>
  </div>

  <p class="muted" style="font-size:.8rem;text-align:center">Admin-only; every change is written to the audit log. Coyote stays the source of truth for orders — this only controls which parts are recognized and where they route.</p>
</div>
<script>
  var FAM = ${JSON.stringify(d.families.map((f) => f.family))};
  async function post(url, obj, btn){ var t=btn?btn.textContent:""; if(btn){btn.disabled=true;btn.textContent="…";}
    try{ var r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(obj)});
      var j=await r.json().catch(function(){return {};});
      if(!r.ok||!j.ok){ alert((j&&j.error)||("Error "+r.status)); if(btn){btn.disabled=false;btn.textContent=t;} return; }
      location.reload();
    }catch(e){ alert(e.message); if(btn){btn.disabled=false;btn.textContent=t;} } }
  function v(id){ var el=document.getElementById(id); return el?el.value:""; }
  function ckl(name){ return [].slice.call(document.querySelectorAll('input[name="'+name+'"]:checked')).map(function(c){return Number(c.value);}); }
  function addLine(b){ if(!v("newline").trim())return alert("Name the line"); post("/api/admin/line",{action:"add",name:v("newline")},b); }
  function renameLine(id,b){ if(!v("ln-"+id).trim())return alert("Name can't be empty"); post("/api/admin/line",{action:"rename",id:id,name:v("ln-"+id)},b); }
  function toggleLine(id,to,b,occ){
    // Block 122 (owner-rep, warn-and-allow): disabling a line that still has a
    // cab on it is ALLOWED (a temporary line-down; re-enabling restores it),
    // but never silent — confirm first, and point at the lighter daily tool.
    if(to==="false" && occ){ if(!confirm("This line still has ORDER "+occ+" on it. Disabling hides and pauses that cab until you re-enable the line — it isn't lost, and it comes right back when you turn the line back on.\n\nFor a quick pause instead, use “Down for today” in the Manager console.\n\nDisable this line anyway?")) return; }
    post("/api/admin/line",{action:"toggle",id:id,enabled:to},b);
  }
  function routeFam(i,b){ var L=ckl("rt-"+i); if(!L.length)return alert("Pick at least one line"); post("/api/admin/catalog",{action:"route",family:FAM[i],lines:L},b); }
  function addPart(i,b){ if(!v("pn-"+i).trim())return alert("Enter a part number"); var L=ckl("rt-"+i); if(!L.length)return alert("Check the line(s) it routes to, above"); post("/api/admin/catalog",{action:"add-part",part_number:v("pn-"+i),family:FAM[i],lines:L},b); }
  function addCab(b){ if(!v("nc-pn").trim()||!v("nc-fam").trim())return alert("Part number and cab/family both needed"); var L=ckl("nc-lines"); if(!L.length)return alert("Pick at least one line"); post("/api/admin/catalog",{action:"add-part",part_number:v("nc-pn"),family:v("nc-fam"),lines:L},b); }
  function tmplReady(id,to,b){ post("/api/admin/template",{action:to?"mark-ready":"mark-draft",template_id:id},b); }
</script>
</body></html>`;
}

// ============================================================
// COYOTE → BOARD WRITE ENGINE (owner-rep 2026-08-07; design = file 40). Turns
// fresh Coyote intake into real `build` rows, FULLY AUTOMATICALLY. Idempotent on
// the UNIQUE build.order_number. Two modes: PREVIEW (compute the plan, write
// nothing) and APPLY (execute + stamp processed_at). NEVER guesses — an
// unrecognized part or a draft template is PARKED (skipped, left fresh) so it
// never lands on a wrong line; it auto-places once the catalog is made current.
// cab # stays wall-owned (NULL, Q110). Status rules locked with owner-rep:
// Queued->upcoming · Hold->on_hold (auto-resume) · Processed->complete(history) ·
// Cancel->cancelled(kept) · odd/blank->park. Started cabs: info edits apply,
// disruptive changes (part/line) are flagged not force-relocated.
function classifyForBoard(o) {
  if (!o.cabParts.length) {
    if (o.blazerTop && !o.unknownParts.length) return { action: "exclude", stamp: true, reason: "Blazer top only — outsourced, never built here." };
    return { action: "park", stamp: false, reason: o.unknownParts.length ? ("Unrecognized part(s): " + o.unknownParts.join(", ") + " — add them in Lines & Parts and it places automatically.") : "No cab part on the order." };
  }
  const draft = o.cabParts.filter((c) => !c.ready);
  if (draft.length) return { action: "park", stamp: false, reason: "Cab template not finished (draft): " + [...new Set(draft.map((c) => c.family))].join(", ") + " — held until its build steps are marked ready." };
  const st = o.status;
  if (st === "Processed") return { action: "complete", stamp: true, reason: "Shipped — kept as history, not placed on the active board." };
  if (st === "Cancel" || st === "Cancelled" || st === "-") return { action: "cancel", stamp: true, reason: "Cancelled — marked cancelled, kept for the record." };
  if (st === "Hold") return { action: "place", state: "on_hold", stamp: true, reason: "On hold — placed and parked; resumes when it returns to Queued." };
  if (st === "Queued") return { action: "place", state: "upcoming", stamp: true, reason: "" };
  return { action: "park", stamp: false, reason: 'Unexpected status "' + (st || "—") + '" — held for a look rather than guessing.' };
}
// AUTO-ASSIGN the next wall cab number for a newly-placed cab (Q110): number +
// family letter (T/A/C/F/B/D), continuing from the highest number seen for that
// family. Mutates ctx.hi so multiple same-family cabs in one run count up. Returns
// null for a family with no letter mapping (left blank, surfaced on /reconcile).
function nextCabNumber(ctx, part) {
  const pr = ctx.prodByPart[String(part || "").toUpperCase()];
  const suffix = RECON_FAM_SUFFIX[pr ? pr.family : ""] || "";
  if (!suffix) return null;
  ctx.hi[suffix] = (ctx.hi[suffix] || 0) + 1;
  return `${ctx.hi[suffix]}${suffix}`;
}
async function syncContext() {
  const rows = await db(`coyote_intake?select=id,payload,received_at&processed_at=is.null&order=received_at.desc&limit=8000`);
  const prods = await db(`product?select=part_number,family,lines&retired=is.false`);
  const prodByPart = {}; for (const p of prods) prodByPart[String(p.part_number).toUpperCase()] = p;
  const lns = await db(`line?select=id,name,enabled`);
  const lineName = {}, lineEnabled = {}; for (const l of lns) { lineName[l.id] = l.name; lineEnabled[l.id] = !!l.enabled; }
  const tmpls = await db(`build_template?select=family,ready`);
  const famReady = {}; for (const t of tmpls) famReady[t.family] = t.ready === true;
  const builds = await db(`build?select=id,order_number,coyote_root,line_id,part_number,state,started_at,invoice_note,note_flagged,customer_name,destination,options_sig,coyote_status&limit=100000`);
  const buildByOrder = {}; for (const b of builds) buildByOrder[b.order_number] = b;
  // Block 176 (Fable-5): index builds by their Coyote ROOT order number too, so
  // the stuck-cab detector below can find a cab whether it was placed under the
  // bare order (23417) or a multi-cab dotted key (23417.1). One order -> N cabs.
  const buildsByRoot = {}; for (const b of builds) { const rt = b.coyote_root || String(b.order_number || "").split(".")[0]; (buildsByRoot[rt] = buildsByRoot[rt] || []).push(b); }
  const allNums = await db(`build?select=cab_number&cab_number=not.is.null&limit=100000`);
  const hi = {}; for (const r of allNums) { const m = String(r.cab_number).trim().toUpperCase().match(/^(\d+)\s*([A-Z]{1,2})$/); if (m) hi[m[2]] = Math.max(hi[m[2]] || 0, Number(m[1])); }
  return { rows, prodByPart, lineName, lineEnabled, famReady, buildByOrder, buildsByRoot, hi };
}
function reduceFresh(ctx) {
  const byKey = new Map();
  for (const r of ctx.rows) {
    const p = r.payload || {};
    const o = (p.order && typeof p.order === "object") ? p.order : {};
    const ordNo = String(o.order_number ?? p.order_number ?? "").trim();
    const key = ordNo || ("__row_" + r.id);
    if (byKey.has(key)) { byKey.get(key).rowIds.push(r.id); continue; }   // newest-first: first seen = latest
    const c = (p.customer && typeof p.customer === "object") ? p.customer : {};
    const custName = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || (c.company || "");
    const dest = String(c.state ?? c.ship_state ?? "").trim() || null;
    const items = Array.isArray(p.line_items) ? p.line_items : [];
    const cabParts = [], unknownParts = [], ifaceAdds = [], ifaceDrops = []; let blazerTop = false;
    for (const it of items) {
      const num = String((it && it.item_number) ?? "").trim(); if (!num) continue;
      const up = num.toUpperCase();
      if (up === "PSR-BLZR-TOP") { blazerTop = true; continue; }
      const pr = ctx.prodByPart[up];
      // Block 176 (Fable-5, Aaron 8/15): each line item now carries an
      // authoritative `interface` flag ("true" = a tracked cab part). Verified
      // against every stored push since 8/5 (1,030 pushes, ~75k line items):
      // ZERO disagreements with the part library. When flag and library
      // DISAGREE the flag decides — that removes the keep-two-lists-in-sync
      // failure mode Aaron warned about:
      //   flag=false + library knows it -> Coyote UNCHECKED the part; never
      //     build from it (parks/orphans then surface via the stuck flags).
      //   flag=true + library missing it -> a NEW tracked part we can't place
      //     yet (no family/line) -> office notice to add it, not silent noise.
      //   flag absent (pre-8/5 rows, or the field ever vanishes) -> plain
      //     library matching, exactly the old behavior. Booleans or strings ok.
      const ifc176 = it && it.interface != null ? String(it.interface).trim().toLowerCase() : null;
      if (ifc176 === "false" && pr) { ifaceDrops.push(num); continue; }
      if (ifc176 === "true" && !pr) { ifaceAdds.push(num); continue; }
      if (ifc176 === "false") continue;   // declared NOT ours (brackets, hardware, ~75/order) — recognized-and-excluded, never "unrecognized" noise; an all-false order parks clean as "No cab part."
      if (pr) { const enabled = (pr.lines || []).filter((x) => ctx.lineEnabled[x]); const lid = enabled.length ? enabled[0] : ((pr.lines || [])[0] ?? null); cabParts.push({ part: num, family: pr.family, line: lid, ready: ctx.famReady[pr.family] === true, qty151: it && (it.qty ?? it.quantity) != null ? String(it.qty ?? it.quantity).trim() : ""   /* Block 160 (C2 audit): Coyote pushes the count as "qty" — "quantity" never existed in any real payload; read qty first, keep quantity as a fallback */ }); }
      else unknownParts.push(num);
    }
    const col151 = collapseCabs151(cabParts);   // Block 151: dup rows -> one cab + a report
    byKey.set(key, { key, orderNo: ordNo, status: String(o.status ?? "").trim() || "—", custName, dest, note: String(o.invoice_note ?? "").trim(), cabParts: col151.cabs, dupCabs: col151.dupes, unknownParts, ifaceAdds, ifaceDrops, blazerTop, rowIds: [r.id] });
  }
  return [...byKey.values()];
}
// Block 151 (owner-rep, the 23305 double): ONE CAB PER DISTINCT CAB PART.
// Coyote's line-item quantity arrives BLANK today, so the same part on two
// rows is a leftover of a Coyote-side order edit far more often than a real
// second cab — 23305 proved it (an office edit re-added the cab + Guniwheel
// rows without removing the originals and the board silently built two cabs,
// inventing 162.5C). Rule: duplicate same-part rows collapse to ONE cab and
// are REPORTED so placement raises a manager "verify the count" flag — the
// system calls the double out instead of a human having to catch it. The
// moment Coyote starts sending a real quantity > 1, THAT expands honestly
// into that many cabs (still reported, as a heads-up). Distinct parts keep
// the normal dotted split, unchanged.
function parseDays152(x) {
  // "4" -> {day_no:4, day_end:null} · "4,5" / "4-6" -> {day_no:4, day_end:6}.
  // Bad input falls back to Day 1; a backwards or equal range drops the end.
  const t = String(x == null ? "" : x).trim();
  const m = t.match(/^(\d+)\s*[,\-\u2013]\s*(\d+)$/);
  if (m) { const a = Number(m[1]), b = Number(m[2]); if (a >= 1 && b > a) return { day_no: a, day_end: b }; if (a >= 1) return { day_no: a, day_end: null }; }
  const n2 = Number(t);
  return { day_no: Number.isFinite(n2) && n2 >= 1 ? Math.floor(n2) : 1, day_end: null };
}
function collapseCabs151(cabParts) {
  const seen = new Map(); const out = []; const dupes = [];
  for (const cp of cabParts) {
    const k = String(cp.part || "").toUpperCase();
    const qn = Math.floor(Number(cp.qty151)); const qty = Number.isFinite(qn) && qn > 0 ? qn : 1;
    if (!seen.has(k)) seen.set(k, { cp, rows: 1, qty });
    else { const e = seen.get(k); e.rows++; e.qty = Math.max(e.qty, qty); }
  }
  for (const e of seen.values()) {
    for (let i = 0; i < e.qty; i++) out.push(e.cp);
    if (e.rows > 1) dupes.push({ part: e.cp.part, rows: e.rows, qty: e.qty });   // Block 161 (owner-rep ruling): a clean qty>1 is TRUSTED data — split .1/.2 silently, no flag; only a part duplicated across ROWS (source contradicting its own qty convention, the 23305 edit pattern) is worth a human's eyes
  }
  return { cabs: out, dupes };
}
function buildSyncPlan(ctx) {
  const items = [];
  for (const o of reduceFresh(ctx)) {
    const dec = classifyForBoard(o);
    const targets = [];
    if (dec.action === "place") {
      const multi = o.cabParts.length > 1;
      o.cabParts.forEach((cp, i) => targets.push({
        order_number: multi ? `${o.orderNo}.${i + 1}` : o.orderNo, coyote_root: o.orderNo,
        line_id: cp.line, part_number: cp.part, state: dec.state,
        customer_name: o.custName || null, destination: o.dest, invoice_note: o.note || null, note_flagged: !!o.note,
      }));
    }
    items.push({ orderNo: o.orderNo || "—", status: o.status, customer: o.custName, action: dec.action, state: dec.state || null, reason: dec.reason, stamp: dec.stamp, targets, rowIds: o.rowIds, parts: o.cabParts.map((c) => c.part), unknownParts: o.unknownParts, dupCabs: o.dupCabs || [], ifaceAdds: o.ifaceAdds || [], ifaceDrops: o.ifaceDrops || [] });
  }
  return items;
}
// Block 176 (Fable-5): in-process dedup for the interface-drift office notices
// below — a re-push of the same order never re-notifies (worst case after a
// redeploy: one repeat). Cab-attached flags dedup harder via flagCabAlert176.
const __ifaceNoticed176 = new Set();
async function syncRun(apply, actorId) {
  const ctx = await syncContext();
  const plan = buildSyncPlan(ctx);
  const now = new Date().toISOString();
  const sum = { applied: !!apply, orders: plan.length, placed: 0, updated: 0, flagged: 0, completed: 0, cancelled: 0, parked: 0, excluded: 0, noop: 0, actions: [] };
  const stampIds = [];
  const A = (order, doWhat, extra) => sum.actions.push(Object.assign({ order, do: doWhat }, extra || {}));
  for (const it of plan) {
    // Block 176 (Fable-5): office notices when Aaron's interface flag and the
    // board's part library DISAGREE — the only two drift cases left now.
    if (apply && it.ifaceAdds && it.ifaceAdds.length) for (const p176 of it.ifaceAdds) {
      const k176 = "add|" + it.orderNo + "|" + p176.toUpperCase();
      if (__ifaceNoticed176.has(k176)) continue; __ifaceNoticed176.add(k176);
      try {
        const adm176 = await adminIds225();   // Block 225: Coyote part-interface flags are admin plumbing
        await notify("sync.iface_add", adm176, `Order ${it.orderNo}: new Coyote cab part ${p176}`, `Coyote marks ${p176} as a tracked cab part, but it is not in the board's part library yet, so this cab cannot place itself. Add ${p176} under Admin -> Lines & Parts (family, line, build steps) and the order places automatically on the next sync.`, "/reconcile");
      } catch (eA176) { console.error("iface-add notify:", (eA176 && eA176.message) || eA176); }
      logEvent("sync.iface_add", actorId || null, { order_number: it.orderNo, part: p176 });
      sum.flagged++; A(it.orderNo, "Coyote added a tracked part the board does not know", { part: p176 });
    }
    if (apply && it.ifaceDrops && it.ifaceDrops.length) for (const p176 of it.ifaceDrops) {
      const k176 = "drop|" + p176.toUpperCase();   // per PART: one unchecked box floods every order carrying it
      if (__ifaceNoticed176.has(k176)) continue; __ifaceNoticed176.add(k176);
      try {
        const adm176 = await adminIds225();   // Block 225: Coyote part-interface flags are admin plumbing
        await notify("sync.iface_drop", adm176, `Coyote unchecked cab part ${p176}`, `Coyote now marks ${p176} as NOT part of the interface (its checkbox is off), so orders carrying it stop building cabs here. If that was intentional, retire it under Lines & Parts too; if not, re-check the box in Coyote and re-push.`, "/reconcile");
      } catch (eD176) { console.error("iface-drop notify:", (eD176 && eD176.message) || eD176); }
      logEvent("sync.iface_drop", actorId || null, { order_number: it.orderNo, part: p176 });
    }
    if (it.action === "park") {
      sum.parked++; A(it.orderNo, "park", { reason: it.reason });
      // Block 176 (Fable-5): Aaron's feed is now CHANGE-ONLY and he CLEARS the
      // trigger on an order once it loses its valid part — so he may never push
      // it again. If a LIVE cab already exists for a parked order, Coyote sent
      // an update we could not act on (cab part removed, template gone to draft,
      // or an odd status) and this cab could sit here with no further updates —
      // exactly the "stuck on your side" case Aaron warned about. Surface it for
      // a human to decide (cancel / close / fix in Coyote and re-push). NEVER
      // auto-remove: owner rule is cancel-never-delete, and a STARTED cab stays
      // in production regardless (Block 120) — this is a heads-up, not a move.
      if (apply) {
        const kids176 = (ctx.buildsByRoot[it.orderNo] || []).filter((b) => ["upcoming", "active", "awaiting_inspection", "rework", "fix_job", "on_hold"].includes(b.state));
        for (const b176 of kids176) {
          try { const did = await flagCabAlert176("stuck", b176, ("Coyote no longer sends a buildable cab part for this order (" + (it.reason || "no cab part") + ")." + (it.ifaceDrops && it.ifaceDrops.length ? " Coyote marks " + it.ifaceDrops.join(", ") + " as no longer part of the interface." : "") + " Its feed is change-only and it may not push again, so this cab can sit here without updates. Verify: set it aside / cancel it, or fix the part in Coyote and re-push." + (b176.started_at ? " This cab is IN PRODUCTION — it stays on the line regardless; heads-up only." : "")), it.orderNo, actorId); if (did) { sum.flagged++; A(b176.order_number, "dropped-part — flagged for a look", { stuck: true }); } }
          catch (e176) { console.error("stuck-cab flag:", (e176 && e176.message) || e176); }
        }
      }
      continue;
    }
    if (it.action === "exclude") { sum.excluded++; if (it.stamp) stampIds.push(...it.rowIds); A(it.orderNo, "exclude", { reason: it.reason }); continue; }
    if (it.action === "complete") {
      // Block 176 (Fable-5): match by ROOT, patch by id — a multi-cab order's
      // builds live under DOTTED numbers (23417.1/.2); the old bare-number
      // patch missed every one of them. Harmless under the old hourly re-push
      // (a human eventually saw the leftovers), fatal under Aaron's change-only
      // feed: the final "Processed" push is the LAST push ever, so a missed
      // complete would leave those cabs on the board forever.
      const kidsC176 = (ctx.buildsByRoot[it.orderNo] || []).filter((b) => b.state !== "production_complete" && b.state !== "cancelled");
      if (kidsC176.length) {
        if (apply) for (const bC of kidsC176) await db(`build?id=eq.${bC.id}`, { method: "PATCH", body: JSON.stringify({ state: "production_complete" }) });
        sum.completed += kidsC176.length; A(it.orderNo, "mark shipped / complete", { cabs: kidsC176.length });
      } else sum.noop++;
      if (it.stamp) stampIds.push(...it.rowIds); continue;
    }
    if (it.action === "cancel") {
      // Block 176 (Fable-5): same root-aware, patch-by-id rework as complete —
      // the old bare-number patch missed dotted multi-cab builds, and the
      // change-only feed makes a missed Cancel permanent. Per-cab rules keep
      // Block 120: a STARTED cab stays in production (cancel NOTED only); a
      // not-started cab is SET ASIDE; finished/aside cabs are left untouched.
      const kidsX176 = ctx.buildsByRoot[it.orderNo] || [];
      let did176 = false;
      for (const bX of kidsX176) {
        if (bX.started_at) {
          if (apply && (bX.coyote_status || null) !== "Cancel") await db(`build?id=eq.${bX.id}`, { method: "PATCH", body: JSON.stringify({ coyote_status: "Cancel" }) });
          sum.noop++; A(bX.order_number, "cancel NOTED on started cab — stays in production", { started: true }); did176 = true;
        } else if (bX.state !== "cancelled" && bX.state !== "production_complete") {
          if (apply) await db(`build?id=eq.${bX.id}`, { method: "PATCH", body: JSON.stringify({ state: "cancelled", coyote_status: "Cancel" }) });
          sum.cancelled++; A(bX.order_number, "set aside — cancelled before production"); did176 = true;
        }
      }
      if (!did176) sum.noop++;
      if (it.stamp) stampIds.push(...it.rowIds); continue;
    }
    if (it.action === "place") {
      for (const t of it.targets) {
        const b = ctx.buildByOrder[t.order_number];
        if (!b) {
          const cn = nextCabNumber(ctx, t.part_number);
          if (apply) await db("build", { method: "POST", body: JSON.stringify({ order_number: t.order_number, coyote_root: t.coyote_root, line_id: t.line_id, part_number: t.part_number, cab_number: cn, state: t.state, customer_name: t.customer_name, destination: t.destination, invoice_note: t.invoice_note, note_flagged: t.note_flagged, coyote_status: t.state === "on_hold" ? "Hold" : null }) });
          sum.placed++; A(t.order_number, "place", { line: t.line_id, part: t.part_number, state: t.state, cab: cn });
        } else if (b.started_at) {
          const patch = {};
          if ((b.invoice_note || "") !== (t.invoice_note || "")) { patch.invoice_note = t.invoice_note; patch.note_flagged = t.note_flagged;
            // Block 138: a changed note re-triages — NEW non-money lines become
            // needs-a-ruling items; already-ruled lines keep their ruling.
            if (apply) { try { await noteTriage138(b.id, t.invoice_note, t.order_number); } catch (e138) { console.error("note triage:", (e138 && e138.message) || e138); } } }
          if ((b.customer_name || "") !== (t.customer_name || "")) patch.customer_name = t.customer_name;
          if ((b.destination || "") !== (t.destination || "")) patch.destination = t.destination;
          // Block 120 (owner-rep): a STARTED cab never leaves its spot on a
          // Coyote status change. Hold/Cancel are NOTED (coyote_status), never
          // a state move; only "Processed" (shipped) removes it, handled
          // above. Queued clears the note (back to normal).
          const cs120 = t.state === "on_hold" ? "Hold" : (t.state === "upcoming" ? null : (b.coyote_status || null));
          if ((b.coyote_status || null) !== cs120) patch.coyote_status = cs120;
          const disruptive = (b.line_id !== t.line_id) || (String(b.part_number) !== String(t.part_number));
          if (apply && Object.keys(patch).length) await db(`build?order_number=eq.${encodeURIComponent(t.order_number)}`, { method: "PATCH", body: JSON.stringify(patch) });
          if (disruptive) { sum.flagged++; if (apply) logEvent("sync.started_cab_flag", actorId || null, { order_number: t.order_number, from_line: b.line_id, to_line: t.line_id, from_part: b.part_number, to_part: t.part_number }); A(t.order_number, "update started cab — line/part change FLAGGED, not relocated", { started: true }); }
          else { sum.updated++; A(t.order_number, "update started cab (info only)", { started: true }); }
          // Block 94d (owner-rep): OPTIONS changed in Coyote AFTER this cab
          // started — rare but real. The frozen checklist is NEVER touched:
          // flag the cab, notify admins, a human compares and adjusts hours.
          // Fires only when a delta arrives for a started cab whose options
          // signature (stamped at freeze) no longer matches. Fully try/caught.
          if (apply && b.id && b.options_sig) {
            try {
              const [ci94d] = await db(`coyote_intake?select=payload&order_number=eq.${encodeURIComponent(t.coyote_root || t.order_number)}&order=received_at.desc&limit=1`);
              const det94d = ci94d && ci94d.payload ? parseCoyoteDetail(ci94d.payload, b.part_number, new Set(Object.keys(ctx.prodByPart))) : null;
              if (det94d) {
                // Block 113: rebuild the signature under the SAME rule the
                // freeze uses — a priced library match outranks stock-prefix —
                // else every re-push of such a cab would false-flag "changed".
                const pr113 = ctx.prodByPart[String(b.part_number || "").toUpperCase()];
                const lib113 = pr113 && pr113.family ? await db(`option_item?select=match_text,man_hours&family=eq.${encodeURIComponent(pr113.family)}&retired=is.false&man_hours=gt.0`) : [];
                const n113 = (s) => String(s || "").trim().toLowerCase().replace(/\s+:/g, ":").replace(/\s+/g, " "); // block 119b: same spaced-colon rule as the freeze
                const priced113 = new Set(); for (const o of lib113) priced113.add(n113(o.match_text));
                const parts94d = [];
                for (const f of det94d.features) {
                  const full113 = (f.label ? f.label + ": " : "") + f.value;
                  if (f.stock && !(priced113.has(n113(full113)) || priced113.has(n113(f.value)))) continue;
                  parts94d.push(full113);
                }
                for (const a of det94d.addons) parts94d.push("CUSTOM: " + a.desc);
                let sgD = 0; const ssD = parts94d.sort().join("|"); for (let i = 0; i < ssD.length; i++) sgD = (sgD * 31 + ssD.charCodeAt(i)) >>> 0;
                if (String(sgD) !== String(b.options_sig)) {
                  await db("option_flag", { method: "POST", body: JSON.stringify({ build_id: b.id, kind: "changed", flag_text: "Coyote options CHANGED after build start — now: " + (parts94d.join(" · ") || "(none)") + ". Compare the checklist and add/adjust hours." }) });
                  await db(`build?order_number=eq.${encodeURIComponent(t.order_number)}`, { method: "PATCH", body: JSON.stringify({ note_flagged: true, options_sig: String(sgD) }) });
                  const admD = (await db(`employee?select=id&role=eq.admin&active=is.true`)).map((e) => e.id);
                  await notify("option.changed", admD, `Order ${t.order_number}: options changed MID-BUILD`, "Coyote changed this cab's options after it started. The checklist was NOT touched — open the order to review and set hours.", "/order/" + encodeURIComponent(t.order_number));
                  sum.flagged++; logEvent("sync.options_changed", actorId || null, { order_number: t.order_number, new_sig: String(sgD) });
                }
              }
            } catch (eD) { logEvent("option.change_check_error", null, { order_number: t.order_number, error: String((eD && eD.message) || eD) }); }
          }
        } else {
          // Block 120: a NOT-started cab follows Coyote — Hold sets it aside
          // (state on_hold, off the line-up), Queued returns it to upcoming in
          // its line's queue and clears the note.
          const patch = { line_id: t.line_id, part_number: t.part_number, state: t.state, customer_name: t.customer_name, destination: t.destination, invoice_note: t.invoice_note, note_flagged: t.note_flagged, coyote_status: t.state === "on_hold" ? "Hold" : null };
          if (apply) await db(`build?order_number=eq.${encodeURIComponent(t.order_number)}`, { method: "PATCH", body: JSON.stringify(patch) });
          sum.updated++; A(t.order_number, t.state === "on_hold" ? "set aside — on hold before production" : "update", { line: t.line_id });
        }
      }
      // Block 151 → 161 (owner-rep ruling): a clean qty of 2+ places .1/.2
      // AUTOMATICALLY with no flag — the quantity field is trusted data (v160).
      // Only the contradictory case — the same cab part duplicated across ROWS
      // (an office-edit artifact, the 23305 pattern) — gets the "verify" flag,
      // because the source is disagreeing with its own quantity convention.
      // The board still acts on its own either way (collapse to the qty count;
      // the phantom row never propagates); the flag just tells the office to
      // clean the Coyote order. Idempotent per text, never blocks placement.
      if (it.dupCabs && it.dupCabs.length && it.targets.length) {
        for (const d151 of it.dupCabs) {
          try {
            const txt151 = ("Coyote lists cab part " + d151.part + " on " + d151.rows + " separate rows (qty says " + d151.qty + ") — duplicate rows are usually an office-edit artifact, so the board placed " + (d151.qty > 1 ? d151.qty + " cabs" : "ONE cab") + " per the quantity field and dropped the extra row. Have the office clean the duplicated rows in Coyote; if the customer truly ordered more cabs, fix the quantity there and re-push.").slice(0, 300);
            sum.flagged++; A(it.orderNo, "duplicate cab-part rows — verify the count", { part: d151.part, rows: d151.rows });
            if (!apply) continue;
            const [b151] = await db(`build?select=id&order_number=eq.${encodeURIComponent(it.targets[0].order_number)}`);
            if (!b151) continue;
            const have151 = await db(`option_flag?select=flag_text&build_id=eq.${b151.id}&kind=eq.count`);
            if (have151.some((f) => f.flag_text === txt151)) continue;
            await db("option_flag", { method: "POST", body: JSON.stringify({ build_id: b151.id, kind: "count", flag_text: txt151 }) });
            await db(`build?id=eq.${b151.id}`, { method: "PATCH", body: JSON.stringify({ note_flagged: true }) });
            const adm151 = await adminIds225();   // Block 225: cab-count verification is an admin ruling
            await notify("cab.count", adm151, `Order ${it.orderNo}: same cab on multiple rows — verify the count`, txt151, "/order/" + encodeURIComponent(it.targets[0].order_number), { urgent: await urgent226(b151.id) });
            logEvent("sync.dup_cab_flag", actorId || null, { order_number: it.orderNo, part: d151.part, rows: d151.rows, qty: d151.qty });
          } catch (e151) { console.error("dup-cab flag:", (e151 && e151.message) || e151); }
        }
      }
      // Block 176 (Fable-5): ORPHANED CABS — Aaron's final-sync-without-the-part
      // arrives as a NORMAL update when the order still has other cab parts
      // (only an all-parts-gone order parks). Every push is a FULL order
      // snapshot, so any live cab under this root that this push no longer
      // targets is exactly his "stuck on your side" case: the trigger is
      // cleared and no later push will ever move it. Same rule as the park
      // case — FLAG for a human, never auto-remove (cancel-never-delete;
      // started cabs stay put per Block 120). Dedup'd by flagCabAlert176.
      if (apply) {
        const have176 = new Set(it.targets.map((t) => String(t.order_number)));
        const orph176 = (ctx.buildsByRoot[it.orderNo] || []).filter((b) => !have176.has(String(b.order_number)) && ["upcoming", "active", "awaiting_inspection", "rework", "fix_job", "on_hold"].includes(b.state));
        for (const b176 of orph176) {
          try { const did = await flagCabAlert176("stuck", b176, ("This Coyote push no longer includes cab " + b176.order_number + " (part " + (b176.part_number || "?") + ")." + (it.ifaceDrops && it.ifaceDrops.length ? " Coyote marks " + it.ifaceDrops.join(", ") + " as no longer part of the interface." : "") + " Its feed is change-only, so this cab may never update again. Verify: set it aside / cancel it, or fix the order in Coyote and re-push." + (b176.started_at ? " This cab is IN PRODUCTION - it stays on the line regardless; heads-up only." : "")), it.orderNo, actorId); if (did) { sum.flagged++; A(b176.order_number, "cab no longer in the Coyote push — flagged for a look", { stuck: true }); } }
          catch (e176b) { console.error("orphan-cab flag:", (e176b && e176b.message) || e176b); }
        }
      }
      if (it.stamp) stampIds.push(...it.rowIds);
    }
  }
  const uniq = [...new Set(stampIds)];
  if (apply && uniq.length) for (let i = 0; i < uniq.length; i += 100) await db(`coyote_intake?id=in.(${uniq.slice(i, i + 100).join(",")})`, { method: "PATCH", body: JSON.stringify({ processed_at: now }) });
  sum.stamped = apply ? uniq.length : 0; sum.wouldStamp = uniq.length;
  if (apply) logEvent("sync.run", actorId || null, { placed: sum.placed, updated: sum.updated, flagged: sum.flagged, completed: sum.completed, cancelled: sum.cancelled, parked: sum.parked, stamped: sum.stamped });
  return sum;
}
// Block 176 (Fable-5): raise a dismissible, DEDUP'd review flag on a cab and
// alert managers/admins once. Non-destructive — it only creates an option_flag
// (visible in the order's "needs a ruling" lane, clearable with "No action"),
// marks the cab note-flagged, and sends one notification. Mirrors the Block 94d
// options-changed pattern. Returns true if it created a NEW flag, false if the
// same alert was already open (so it never re-notifies on every sync tick).
async function flagCabAlert176(kind, b, text, root, actorId) {
  const txt = String(text || "").slice(0, 300);
  const have = await db(`option_flag?select=id,flag_text&build_id=eq.${b.id}&kind=eq.${encodeURIComponent(kind)}&resolved=is.false`);
  if (have && have.some((f) => f.flag_text === txt)) return false;   // already flagged — stay quiet
  await db("option_flag", { method: "POST", body: JSON.stringify({ build_id: b.id, kind, flag_text: txt }) });
  if (!b.note_flagged) await db(`build?id=eq.${b.id}`, { method: "PATCH", body: JSON.stringify({ note_flagged: true }) });
  try {
    const adm = await adminIds225();   // Block 225: cab-number rulings are admin work
    const title = kind === "stuck" ? `Order ${b.order_number}: Coyote dropped this cab's part — verify` : `Order ${b.order_number}: Coyote data needs a look`;
    await notify("cab." + kind, adm, title, txt, "/order/" + encodeURIComponent(root || b.coyote_root || String(b.order_number || "").split(".")[0]), { urgent: await urgent226(b.id) });
  } catch (eN) { console.error("cab-alert notify:", (eN && eN.message) || eN); }
  logEvent("sync." + kind + "_flag", actorId || null, { order_number: b.order_number, root: root || null });
  return true;
}
function syncPage(d) {
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const kpi = (n, label) => `<div class="kpi"><b>${n}</b><span>${label}</span></div>`;
  const badge = (a) => a === "place" ? '<span class="st q">place</span>' : a === "update" ? '<span class="st p">update</span>' : a === "park" ? '<span class="flag amber">park</span>' : a === "exclude" ? '<span class="flag grey">exclude</span>' : a.indexOf("cancel") > -1 ? '<span class="flag red">cancel</span>' : a.indexOf("complete") > -1 || a.indexOf("shipped") > -1 ? '<span class="flag grey">shipped</span>' : a.indexOf("FLAG") > -1 ? '<span class="flag amber">flagged</span>' : `<span class="st o">${esc(a)}</span>`;
  const s = d.sum;
  const rows = s.actions.map((a) => `<tr><td><b>${esc(a.order)}</b></td><td>${badge(a.do)}</td><td class="muted" style="white-space:normal">${esc(a.do)}${a.line ? ` · line ${esc(a.line)}` : ""}${a.part ? ` · ${esc(a.part)}` : ""}${a.reason ? ` — ${esc(a.reason)}` : ""}</td></tr>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Sync</title>${style}
<style>
  @media (max-width:640px){.wrap{padding-left:8px;padding-right:8px} .wrap table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}}
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:.92rem}
  th{opacity:.55;text-align:left;padding:6px 8px;font-weight:600}
  td{padding:7px 8px;border-top:1px solid var(--line);vertical-align:top}
  .muted{opacity:.6}
  .flag{padding:1px 8px;border-radius:10px;font-size:.8em;white-space:nowrap;display:inline-block}
  .flag.amber{background:#3a2f10;color:#ffd60a}.flag.red{background:#3a1510;color:#ff6b5e}.flag.grey{background:#2c2c2e;color:#aeaeb2}
  .st{padding:1px 9px;border-radius:10px;font-size:.82em;font-weight:600}
  .st.q{background:#10233a;color:#5eaeff}.st.p{background:#12331c;color:#5edb84}.st.o{background:#3a2f10;color:#ffd60a}
  .kpi{display:inline-block;min-width:92px;text-align:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:0 8px 8px 0}
  .kpi b{display:block;font-size:1.5rem}.kpi span{opacity:.6;font-size:.8rem}
  @media print{ a{display:none} }
</style></head>
<body><div class="wrap" style="max-width:1000px">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${navBar95(true)}
  <h2>Sync <span class="muted" style="font-size:.6em;font-weight:400">— Coyote → board, ${d.preview ? "PREVIEW (writes nothing)" : "last run"}</span></h2>
  <p class="muted" style="margin-top:-8px">${d.preview ? "This is exactly what the automatic engine <b>would do</b> to the board right now — nothing is written here. Once it's turned on, it does this by itself every hour." : "The engine runs automatically every hour."}</p>
  <div style="margin:14px 0">
    ${kpi(s.placed, "place")}${kpi(s.updated, "update")}${kpi(s.completed, "shipped")}${kpi(s.cancelled, "cancel")}${kpi(s.parked, "parked")}${kpi(s.excluded, "excluded")}${s.flagged ? kpi(s.flagged, "flagged") : ""}
  </div>
  ${d.preview ? `<div class="lane" style="text-align:center;padding:16px">
    <button id="runsync" onclick="runSyncNow()" style="background:#0a84ff;color:#fff;border:none;border-radius:12px;padding:12px 24px;font-size:1.05rem;font-weight:600;cursor:pointer">Run sync now</button>
    <div id="syncres" style="margin-top:12px;font-size:.95rem"></div>
    <p class="muted" style="margin:10px 0 0;font-size:.78rem">Runs the engine once, right now — places and updates the board exactly as previewed above. Safe to press again anytime (it's idempotent).</p>
  </div>
  <script>
  function runSyncNow(){var b=document.getElementById('runsync'),o=document.getElementById('syncres');b.disabled=true;b.textContent='Running…';o.textContent='';fetch('/api/admin/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'apply'})}).then(function(r){return r.json();}).then(function(j){if(!j||!j.ok){o.innerHTML='<span style="color:#ff6b5e">Did not run: '+((j&&j.error)||'not authorized')+'</span>';b.textContent='Run sync now';b.disabled=false;return;}var s=j.summary||{};o.innerHTML='<b style="color:#5edb84">Done.</b> placed '+(s.placed||0)+' · updated '+(s.updated||0)+' · shipped '+(s.completed||0)+' · cancelled '+(s.cancelled||0)+' · parked '+(s.parked||0)+'. <a href="/shopboard" style="color:#5eaeff">Open the board &rarr;</a>';b.textContent='Run again';b.disabled=false;}).catch(function(e){o.innerHTML='<span style="color:#ff6b5e">Error: '+e+'</span>';b.textContent='Run sync now';b.disabled=false;});}
  </script>` : ""}
  <p class="muted" style="margin-top:-6px;font-size:.85rem"><b>Parked</b> = an order the engine won't place because it can't map it cleanly (unrecognized part, or a cab whose build steps aren't finished). It's never guessed onto a line — add the part / finish the steps in <a href="/lines" style="color:#5eaeff">Lines &amp; parts</a> and it places itself on the next run.</p>
  <div class="lane">
    ${s.actions.length ? `<table><tr><th>Order #</th><th>Action</th><th>Detail</th></tr>${rows}</table>` : `<div class="muted">Nothing to do — the fresh intake is clear.</div>`}
  </div>
  <p class="muted" style="font-size:.8rem;text-align:center">Idempotent (keyed on the unique order #) · cab numbers stay wall-owned · every run audited · nothing hard-deleted.</p>
</div></body></html>`;
}
// ============================================================
// BOARD ↔ WALL RECONCILIATION (block 81) — the trust bridge to cutover.
// The write engine now auto-places Coyote cabs on the board with cab_number
// NULL (the wall still owns the counter, Q110). This admin page lists every
// open board cab grouped by line, with its Coyote context (customer, promised,
// order #) + the family's next-up number as a hint, so an admin can walk the
// wall line-by-line and type each cab its REAL wall number. Reuses the audited,
// dup-guarded /api/admin/cab-number endpoint — no new write path, no migration.
// Anything left UNNUMBERED = not yet found on the wall → the thing to investigate
// (a Coyote-Queued order with no matching physical cab, the file-38 red flag).
const RECON_FAM_SUFFIX = { "47-53": "A", "55-59": "T", "64-66": "D", "67-72 Chevy": "C", "67-72 Ford": "F", "69-72 Blazer": "B" };
function reconcileShape(open, famOf, lineName, hi) {
  const cabs = open.map((b) => {
    const fam = famOf[String(b.part_number || "").toUpperCase()] || "";
    const suffix = RECON_FAM_SUFFIX[fam] || "";
    const hint = suffix ? `${(hi[suffix] || 0) + 1}${suffix}` : "";
    return {
      id: b.id, order: b.order_number || "—", part: b.part_number || "", family: fam, suffix,
      cab: b.cab_number || "", lineId: b.line_id, line: lineName[b.line_id] || (b.line_id ? "Line " + b.line_id : "— unrouted"),
      rawState: String(b.state || ""), state: String(b.state || "").replace(/_/g, " "),
      customer: b.customer_name || "", dest: b.destination || "", promised: b.promised_finish || "",
      noteFlag: !!b.note_flagged, hint, qp: (b.queue_pos == null ? null : Number(b.queue_pos)), createdAt: b.created_at || "", pinned: !!b.queue_pinned,
      numbered: !!b.cab_number, fromCoyote: !!b.coyote_root, coyoteStatus: b.coyote_status || "", reorderable: false, ondeck: false, isFirst: false, isLast: false,
    };
  });
  const rank = (s) => (s === "upcoming" ? 1 : 0); // active / awaiting / rework rise to the top; upcoming = the queue
  const byLine = {};
  for (const c of cabs) { (byLine[c.lineId] || (byLine[c.lineId] = { lineId: c.lineId, line: c.line, cabs: [] })).cabs.push(c); }
  const groups = Object.values(byLine).sort((a, b) => (a.lineId || 999) - (b.lineId || 999));
  for (const g of groups) {
    g.cabs.sort((a, b) => rank(a.rawState) - rank(b.rawState) || (a.qp == null ? 1e9 : a.qp) - (b.qp == null ? 1e9 : b.qp) || (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
    const up = g.cabs.filter((c) => c.rawState === "upcoming");
    up.forEach((c, i) => { c.reorderable = true; c.isFirst = i === 0; c.isLast = i === up.length - 1; c.ondeck = i === 0;
      // Block 124 (logic audit L7): a pinned cab can't move, and you can't move
      // a cab INTO a pinned neighbor's slot — dim those arrows so they never
      // point at a guaranteed rejection.
      c.noUp = c.isFirst || c.pinned || (i > 0 && up[i - 1].pinned);
      c.noDown = c.isLast || c.pinned || (i < up.length - 1 && up[i + 1].pinned); });
  }
  const total = cabs.length;
  const numbered = cabs.filter((c) => c.numbered).length;
  const toReconcile = cabs.filter((c) => !c.numbered && c.fromCoyote).length;
  return { groups, total, numbered, unnumbered: total - numbered, toReconcile };
}
async function reconcileData() {
  const open = await db("build?select=id,order_number,coyote_root,part_number,cab_number,line_id,state,customer_name,destination,promised_finish,note_flagged,queue_pos,queue_pinned,created_at,coyote_status&state=in.(upcoming,active,awaiting_inspection,rework)&limit=100000");
  const prods = await db("product?select=part_number,family");
  const famOf = {}; for (const p of prods) famOf[String(p.part_number).toUpperCase()] = p.family;
  const lines = await db("line?select=id,name&order=id");
  const lineName = {}; for (const l of lines) lineName[l.id] = l.name;
  const allNums = await db("build?select=cab_number&cab_number=not.is.null&limit=100000");
  const hi = {};
  for (const r of allNums) { const m = String(r.cab_number).trim().toUpperCase().match(/^(\d+)\s*([A-Z]{1,2})$/); if (m) hi[m[2]] = Math.max(hi[m[2]] || 0, Number(m[1])); }
  const shaped = reconcileShape(open, famOf, lineName, hi);
  // Block 120 (owner-rep): the SET-ASIDE list — cabs pulled from the line-up
  // by a Coyote Hold/Cancel BEFORE they started. Shown here so they're noted;
  // each returns to its line's queue automatically if Coyote flips it back to
  // Queued (the sync handles it). Started cabs are NEVER set aside.
  const aside = await db("build?select=order_number,part_number,cab_number,state,customer_name,coyote_status,created_at&state=in.(on_hold,cancelled)&started_at=is.null&order=created_at.desc&limit=1000");
  shaped.setAside = aside.map((b) => ({
    order: b.order_number || "—", part: b.part_number || "", family: famOf[String(b.part_number || "").toUpperCase()] || "",
    cab: b.cab_number || "", customer: b.customer_name || "",
    why: (b.coyote_status === "Cancel" || b.state === "cancelled") ? "Cancelled" : "On hold",
    when: String(b.created_at || "").slice(0, 10),
  }));
  return shaped;
}
function reconcilePage(d, role) {
  const admin = role === "admin";
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const kpi = (id, n, label) => `<div class="kpi"><b id="${id}">${n}</b><span>${label}</span></div>`;
  const row = (c) => `<tr id="row-${c.id}" data-cab="1" class="${c.ondeck ? "ondeck" : ""}${c.numbered ? " done" : (c.fromCoyote && !c.numbered ? " unrec" : "")}">
    <td class="mvc">${c.reorderable && admin ? `${c.noUp ? '<span class="ar dim">&#9650;</span>' : `<button class="ar" title="Move up" onclick="qmove('${c.id}','up',this)">&#9650;</button>`}${c.noDown ? '<span class="ar dim">&#9660;</span>' : `<button class="ar" title="Move down" onclick="qmove('${c.id}','down',this)">&#9660;</button>`}<button class="ar" style="${c.pinned ? "background:#5c4a10;border-color:#ffd60a;" : ""}margin-left:2px" title="${c.pinned ? "Pinned — the warehouse can't move or cross this spot. Tap to unpin." : "Pin this cab to its spot — the warehouse can't move or cross it"}" onclick="qpin('${c.id}',${c.pinned ? "false" : "true"},this)">&#128204;</button>` : ""}${c.pinned && !admin ? '<span title="Held by the front office" style="margin-right:4px">&#128204;</span>' : ""}${c.ondeck ? '<span class="deck">on deck</span>' : ""}</td>
    <td><b><a href="/order/${encodeURIComponent(c.order)}" style="color:inherit">${esc(c.order)}</a></b>${c.noteFlag ? ' <span class="flag amber">note</span>' : ""}${c.coyoteStatus && c.coyoteStatus !== "Queued" && c.coyoteStatus !== "Processed" ? ` <span class="flag" style="background:#3a1520;color:#ff8fa3">Coyote: ${esc(c.coyoteStatus)}</span>` : ""}</td>
    <td class="muted">${esc(c.customer) || "—"}</td>
    <td>${esc(c.family) || esc(c.part) || "?"}${c.suffix ? ` <span class="sfx">${c.suffix}</span>` : ""}</td>
    <td class="muted">${esc(c.state)}</td>
    <td>${admin ? `<input class="cn" id="cn-${c.id}" value="${esc(c.cab)}" placeholder="${esc(c.hint) || "244T"}" autocomplete="off">` : `<b>${esc(c.cab) || "—"}</b>`}</td>
    ${admin ? `<td><button class="b" onclick="saveCab('${c.id}',this)">Save</button> <span id="msg-${c.id}" class="msg">${c.numbered ? '<span style="color:#5edb84">✓</span>' : ""}</span></td>` : "<td></td>"}
  </tr>`;
  const groups = d.groups.map((g) => `<div class="lane"><h3 style="margin:0 0 8px">${esc(g.line)} <span class="muted" style="font-weight:400;font-size:.8em">— ${g.cabs.length} cab${g.cabs.length === 1 ? "" : "s"}</span></h3>
    <table><tr><th style="width:74px"></th><th>Order #</th><th>Customer</th><th>Family</th><th>State</th><th>Cab #</th><th></th></tr>
    ${g.cabs.map(row).join("")}</table></div>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Order Queue</title>${style}
<style>
  @media (max-width:640px){.wrap{padding-left:8px;padding-right:8px} .wrap table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}}
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:.92rem}
  th{opacity:.55;text-align:left;padding:6px 8px;font-weight:600}
  td{padding:7px 8px;border-top:1px solid var(--line);vertical-align:middle}
  .muted{opacity:.6}
  .flag{padding:1px 8px;border-radius:10px;font-size:.8em;white-space:nowrap;display:inline-block;background:#3a2f10;color:#ffd60a}
  .sfx{display:inline-block;background:#10233a;color:#5eaeff;border-radius:8px;padding:0 7px;font-size:.78em;font-weight:600}
  .kpi{display:inline-block;min-width:96px;text-align:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:0 8px 8px 0}
  .kpi b{display:block;font-size:1.5rem}.kpi span{opacity:.6;font-size:.8rem}
  input.cn{width:90px;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:#1c1c1e;color:#fff;font-size:.95rem;text-transform:uppercase}
  .b{background:#2c2c2e;color:#fff;border:1px solid var(--line);border-radius:9px;padding:6px 12px;font-size:.85rem;cursor:pointer}
  .b:hover{background:#3a3a3c}
  .mvc{white-space:nowrap}
  .ar{background:#2c2c2e;color:#fff;border:1px solid var(--line);border-radius:7px;padding:2px 7px;font-size:.8rem;cursor:pointer;line-height:1}
  .ar:hover{background:#3a3a3c}.ar.dim{opacity:.2;cursor:default}
  .deck{display:inline-block;background:#12331c;color:#5edb84;border-radius:8px;padding:1px 7px;font-size:.72em;font-weight:600;margin-left:4px;vertical-align:middle}
  tr.ondeck td{background:rgba(94,219,132,.06)}
  tr.unrec td{background:rgba(255,214,10,.05)}
  tr.unrec input.cn{border-color:#5c4a10}
  tr.done input.cn{border-color:#1f4a2c}
  .msg{font-size:.85rem;margin-left:4px}
  #freshnote{background:#10233a;color:#5eaeff;border:1px solid #204a6e;border-radius:10px;padding:8px 12px;margin:0 0 12px;font-size:.85rem;text-align:center}
  @media print{ a,.b,.ar,input{display:none} }
</style></head>
<body><div class="wrap" style="max-width:1000px">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${role === "admin" || role === "manager" ? navBar95(role === "admin") : ""}
  <h2>Order Queue <span class="muted" style="font-size:.6em;font-weight:400">— the production lines${admin ? "" : " (view only)"}</span></h2>   <!-- Block 156 (owner-rep E1): named by Daniel -->
  <p class="muted" style="margin-top:-8px">Each line lists its cabs oldest-first — the top upcoming cab is <b>on deck</b> next. ${admin ? "Use the &#9650;&#9660; arrows to move a cab up or down the queue; type a cab its wall number and Save." : "This is a live view — the warehouse and admin control the order; it refreshes here on its own."} Changes on another screen show up here within a few seconds.</p>
  <div id="freshnote" style="display:none">The queue just changed on another screen — this page will refresh as soon as you're done typing.</div>
  <div style="margin:14px 0">
    ${kpi("kpi-tot", d.total, "open cabs")}${kpi("kpi-num", d.numbered, "numbered")}${kpi("kpi-un", d.unnumbered, "to reconcile")}
  </div>
  ${d.total ? groups : `<div class="lane"><div class="muted">No open cabs on the board yet.</div></div>`}
  ${(d.setAside && d.setAside.length) ? `<div class="lane" style="border-color:#5a2a3a">
    <h3 style="margin:0 0 6px">Set aside <span class="muted" style="font-weight:400;font-size:.8em">&mdash; Coyote hold / cancel, before production (${d.setAside.length})</span></h3>
    <p class="muted" style="margin:-2px 0 10px;font-size:.85rem">These were pulled from the line-up by a Coyote status change before they started &mdash; kept here so they're noted. Each drops back into its line's queue on its own if Coyote returns it to Queued.</p>
    <table><tr><th>Order #</th><th>Customer</th><th>Family</th><th>Cab #</th><th>Why</th><th>Since</th></tr>
    ${d.setAside.map((s) => `<tr><td><b><a href="/order/${encodeURIComponent(s.order)}" style="color:inherit">${esc(s.order)}</a></b></td><td class="muted">${esc(s.customer) || "&mdash;"}</td><td>${esc(s.family) || esc(s.part) || "?"}</td><td>${esc(s.cab) || "&mdash;"}</td><td><span class="flag" style="background:#3a1520;color:#ff8fa3">${esc(s.why)}</span></td><td class="muted">${esc(s.when)}</td></tr>`).join("")}</table>
  </div>` : ""}
  <p class="muted" style="font-size:.8rem;text-align:center">Oldest-first by default; the order you set here (or the warehouse sets for kit-readiness) drives what's on deck. Every move is logged. Cab numbers are never shared or reused.</p>
  <script>
  function recount(){var rows=document.querySelectorAll('tr[data-cab]');var done=0,tot=rows.length;rows.forEach(function(r){var inp=r.querySelector('input.cn');if(inp&&inp.value.trim())done++;});var a=document.getElementById('kpi-num');if(a)a.textContent=done;var b=document.getElementById('kpi-un');if(b)b.textContent=(tot-done);}
  function saveCab(id,btn){var inp=document.getElementById('cn-'+id);var v=inp.value.trim();var msg=document.getElementById('msg-'+id);var row=document.getElementById('row-'+id);btn.disabled=true;var old=btn.textContent;btn.textContent='…';msg.innerHTML='';fetch('/api/admin/cab-number',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({build_id:id,cab_number:v})}).then(function(r){return r.json();}).then(function(j){if(!j||!j.ok){msg.innerHTML='<span style="color:#ff6b5e">'+((j&&j.error)||'error')+'</span>';btn.textContent=old;btn.disabled=false;return;}if(v){row.classList.add('done');msg.innerHTML='<span style="color:#5edb84">&#10003; '+v.toUpperCase()+'</span>';}else{row.classList.remove('done');msg.textContent='';}btn.textContent=old;btn.disabled=false;recount();}).catch(function(e){msg.innerHTML='<span style="color:#ff6b5e">'+e+'</span>';btn.textContent=old;btn.disabled=false;});}
  function qmove(id,dir,btn){var all=document.querySelectorAll('.ar');all.forEach(function(x){x.disabled=true;});fetch('/api/queue/move',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({build_id:id,dir:dir})}).then(function(r){return r.json();}).then(function(j){if(j&&j.ok){location.reload();}else{all.forEach(function(x){x.disabled=false;});var n=document.getElementById('freshnote');if(n){n.textContent=(j&&j.error)||'Move failed';n.style.display='';}}}).catch(function(){all.forEach(function(x){x.disabled=false;});});}
  function qpin(id,want,btn){btn.disabled=true;fetch('/api/queue/pin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({build_id:id,pinned:want})}).then(function(r){return r.json();}).then(function(j){if(j&&j.ok){location.reload();}else{btn.disabled=false;var n=document.getElementById('freshnote');if(n){n.textContent=(j&&j.error)||'Pin failed';n.style.display='';}}}).catch(function(){btn.disabled=false;});}
  var QVER=null;
  function qpoll(){fetch('/api/queue/state',{credentials:'same-origin'}).then(function(r){return r.json();}).then(function(j){if(!j||!j.v)return;if(QVER===null){QVER=j.v;return;}if(j.v!==QVER){var f=document.activeElement;if(!f||f.tagName!=='INPUT'){location.reload();}else{var n=document.getElementById('freshnote');if(n)n.style.display='';}}}).catch(function(){});}
  qpoll();setInterval(qpoll,6000);
  </script>
</div></body></html>`;
}

// ============================================================
// PAY WORKSHEET (payroll hours export) — replaces the manual "Employee Pay
// Worksheet" that is hand-tallied and emailed to the outsourced payroll company.
// Shop Board already holds accurate clock hours, so it builds the sheet itself.
// Owner-rep answers (2026-08-06): HOURS ONLY (no wage rates/pay in the app) ·
// split Regular (<=8/day) vs Overtime (>8/day) · Sick from approved time-off
// (reason "Sick") · Unpaid from approved time-off (reason "Unpaid") · round to
// the nearest quarter-hour · semi-monthly, paid the 1st & 15th · both per-day
// detail and per-period totals. Admin-only (payroll is sensitive; file 12).
const roundQ = (h) => Math.round(h * 4) / 4;   // nearest quarter-hour (owner-rep)
const PAY_STD_DAY = 8;                          // a full sick/unpaid day = 8 h
// Two periods a month: 11th–25th (paid the 1st of next month) and 26th–10th
// (paid the 15th). Cutoffs = owner-rep's best recollection; custom overrides.
// Block 221: extracted from payPeriod so the period-end reminder and the
// crossed-40h check share the exact same calendar.
const pad221 = (n) => String(n).padStart(2, "0"), mk221 = (y, m, d) => `${y}-${pad221(m)}-${pad221(d)}`;
const shift221 = (y, m, dl) => { let mm = m + dl, yy = y; while (mm < 1) { mm += 12; yy--; } while (mm > 12) { mm -= 12; yy++; } return [yy, mm]; };
const periodFor221 = (y, m, d) => {
  if (d >= 11 && d <= 25) { const [ny, nm] = shift221(y, m, 1); return { f: mk221(y, m, 11), t: mk221(y, m, 25), pay: mk221(ny, nm, 1) }; }
  if (d >= 26) { const [ny, nm] = shift221(y, m, 1); return { f: mk221(y, m, 26), t: mk221(ny, nm, 10), pay: mk221(ny, nm, 15) }; }
  const [py, pm] = shift221(y, m, -1); return { f: mk221(py, pm, 26), t: mk221(y, m, 10), pay: mk221(y, m, 15) };
};
function payPeriod(params) {
  const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const from = params.get("from"), to = params.get("to");
  if (isDate(from) && isDate(to)) {
    let f = from, t = to; if (phxDayStart(f) > phxDayStart(t)) { const x = f; f = t; t = x; }
    return { startMs: phxDayStart(f), endMs: phxDayStart(t) + 86400000, preset: "custom",
      from: f, to: t, pay: "", label: "Custom range", rangeText: `${f} → ${t}`, qs: `from=${f}&to=${t}` };
  }
  const today = phxDate(Date.now());
  let cur = periodFor221(+today.slice(0, 4), +today.slice(5, 7), +today.slice(8, 10));
  const preset = params.get("preset") === "last" ? "last" : "this";
  if (preset === "last") { const pd = phxDate(phxDayStart(cur.f) - 86400000); cur = periodFor221(+pd.slice(0, 4), +pd.slice(5, 7), +pd.slice(8, 10)); }
  return { startMs: phxDayStart(cur.f), endMs: phxDayStart(cur.t) + 86400000, preset, from: cur.f, to: cur.t, pay: cur.pay,
    label: preset === "last" ? "Last pay period" : "Current pay period", rangeText: `${cur.f} → ${cur.t} · paid ${cur.pay}`, qs: `preset=${preset}` };
}
async function payrollData(startMs, endMs) {
  const nowMs = Date.now();
  const dates = []; for (let ms = startMs; ms < endMs; ms += 86400000) dates.push(phxDate(ms));
  // Block 212 (v201 SPEED): the five reads are independent — one round trip
  // (same queries verbatim; isWorkDay below rides the cached calendar).
  const [empsAll215, events, ahSess111, offRows, auto148] = await Promise.all([
    db(`employee?select=id,first_name,last_name,active,pay_type&active=is.true&order=first_name,last_name`),   // Block 200: pay_type splits hourly vs salary/owner
    db(`clock_event?select=employee_id,line_id,kind,claimed_at,voided&voided=is.false&order=claimed_at.asc&limit=20000`),
    db(`after_hours_session?select=employee_id,started_at,ended_at,signed_off_by,declined_by,decline_reason&started_at=lt.${new Date(endMs).toISOString()}&order=started_at.asc`),
    db(`time_off_request?select=employee_id,start_date,end_date,reason,hours&status=eq.approved&start_date=lte.${dates[dates.length - 1]}&end_date=gte.${dates[0]}`).catch(() => []),
    db(`clock_event?select=employee_id,claimed_at&voided=is.false&kind=eq.clock_out_auto&claimed_at=gte.${new Date(startMs).toISOString()}&claimed_at=lt.${new Date(endMs).toISOString()}&order=claimed_at.asc`),
  ]);
  const emps = empsAll215.filter((e) => !isTestAcct215(e));   // Block 215: Zz Test-Account never reaches payroll
  const ivs = workIntervals(events, nowMs);
  const workday = {}; for (const d of dates) workday[d] = await isWorkDay(d);
  // worked hours per emp per day (dayed by interval start, clipped to window)
  const worked = {};
  for (const iv of ivs) {
    const h = overlapHrs(iv, startMs, endMs); if (h <= 0) continue;
    const d = phxDate(Math.max(iv.start, startMs));
    (worked[iv.emp] = worked[iv.emp] || {}); worked[iv.emp][d] = (worked[iv.emp][d] || 0) + h;
  }
  // Block 111 (owner-rep): the Pay Worksheet is payroll's at-a-glance truth —
  // an after-hours stint counts ONLY once an admin SIGNED OFF. Pending and
  // DECLINED stints are pulled out of Regular/OT here and listed by name
  // below the tables (declines carry the typed reason).
  const nmP111 = {}; for (const e of emps) nmP111[e.id] = `${e.first_name} ${e.last_name}`;
  const payOf201 = {}; for (const e of emps) payOf201[e.id] = e.pay_type || "hourly";   // Block 201: salaried/owner auto-closes stay off the worksheet's glance list
  // (ahSess111 fetched in the Block-212 wave above.)
  const ahCut = {}; const ahNotes = [];
  for (const sA of ahSess111) {
    if (sA.signed_off_by) continue;
    const sStart = new Date(sA.started_at).getTime();
    const sEnd = sA.ended_at ? new Date(sA.ended_at).getTime() : nowMs;
    if (sEnd <= startMs || sStart >= endMs) continue;
    let cut111 = 0;
    for (const iv of ivs) {
      if (iv.emp !== sA.employee_id) continue;
      const o = overlapHrs(iv, Math.max(sStart, startMs), Math.min(sEnd, endMs));
      if (!o) continue;
      cut111 += o;
      const d = phxDate(Math.max(iv.start, startMs));
      (ahCut[sA.employee_id] = ahCut[sA.employee_id] || {}); ahCut[sA.employee_id][d] = (ahCut[sA.employee_id][d] || 0) + o;
    }
    if (!nmP111[sA.employee_id]) continue;   // Block 215: test-account sessions stay off the sheet
    if (cut111 > 0.005) ahNotes.push({ name: nmP111[sA.employee_id], date: phxDate(sStart), hrs: roundQ(cut111),
      declined: Boolean(sA.declined_by),
      note: sA.declined_by ? `DECLINED by ${nmP111[sA.declined_by] || "admin"}: "${sA.decline_reason || ""}"` : "pending admin sign-off" });
  }
  for (const eid in ahCut) for (const d in ahCut[eid]) if (worked[eid] && worked[eid][d] != null) worked[eid][d] = Math.max(0, worked[eid][d] - ahCut[eid][d]);
  // approved time off overlapping the window -> per emp per work-day, by reason
  const off = {};
  // (offRows fetched in the Block-212 wave above.)
  for (const r of offRows) {
    const rl = (r.reason || "").toLowerCase(), type = rl.includes("sick") ? "sick" : rl.includes("unpaid") ? "unpaid" : "other";
    let ms = Math.max(phxDayStart(r.start_date), startMs); const end = Math.min(phxDayStart(r.end_date) + 86400000, endMs);
    for (; ms < end; ms += 86400000) { const d = phxDate(ms); if (!workday[d]) continue; (off[r.employee_id] = off[r.employee_id] || {}); off[r.employee_id][d] = { type, reason: r.reason || "", hours: r.hours != null ? roundQ(Number(r.hours)) : null }; }   // Block 217: hours=null means a full standard day
  }
  const rows = emps.map((e) => {
    const wk = worked[e.id] || {}, of = off[e.id] || {}; let reg = 0, ot = 0, sick = 0, unpaid = 0, ahx = 0; const byDay = {};
    for (const d of dates) {
      const ax = roundQ((ahCut[e.id] || {})[d] || 0); ahx += ax;
      const h = roundQ(wk[d] || 0);
      let s = 0, u = 0, otherOff = null;
      if (of[d]) { const offH217 = of[d].hours != null ? of[d].hours : PAY_STD_DAY;   // Block 217 (Daniel): partial sick time — "sometimes they just take 2 hours or 4 hours"
        if (of[d].type === "sick") s = offH217; else if (of[d].type === "unpaid") u = offH217; else otherOff = of[d].reason; }
      sick += s; unpaid += u;
      if (h > 0 || s || u || otherOff || ax) byDay[d] = { worked: h, reg: h, ot: 0, sick: s, unpaid: u, otherOff, ahx: ax };
    }
    // Block 216 (Daniel: "we are in arizona... overtime is paid ONLY when they
    // work more than 40 hours in a one week period"): WEEKLY overtime, the
    // Arizona/FLSA rule — OT = hours WORKED beyond 40 in a 7-day week, not
    // "over 8 in a day". Weeks are 7-day blocks from the period's first day
    // (a standard pay period = exactly two whole weeks). Paid leave (sick /
    // unpaid days) never counts toward the 40. The old per-day split
    // (min(h,8)/max(0,h-8)) is retired; byDay keeps the raw worked hours.
    const wkSum216 = [];   // wk[] is already net of not-yet-signed-off after-hours time (the ahCut pass above)
    dates.forEach((d216, i216) => { const w216 = Math.floor(i216 / 7);
      wkSum216[w216] = roundQ((wkSum216[w216] || 0) + roundQ(wk[d216] || 0)); });
    for (const wS of wkSum216) { const wOt = Math.max(0, roundQ(wS) - 40); ot = roundQ(ot + wOt); reg = roundQ(reg + (roundQ(wS) - wOt)); }
    return { id: e.id, name: `${e.first_name} ${e.last_name}`, payType: e.pay_type || "hourly", reg, ot, sick, unpaid, ahx, total: roundQ(reg + ot + sick + unpaid), byDay };
  }).filter((r) => r.reg || r.ot || r.sick || r.unpaid || r.ahx || Object.keys(r.byDay).length);
  // Block 200 (owner, day 4): SALARY and OWNER (n/a) people are NOT hourly
  // payroll — "she's seeing only the hours of true numbers of the hourly
  // employees." They come OUT of the tables and totals; anyone of them who
  // did punch is listed by name below as informational only, so a salaried
  // manager's punches can never inflate the pay run.
  const salNotes = rows.filter((r) => r.payType === "salary" || r.payType === "na")
    .map((r) => ({ name: r.name, label: r.payType === "salary" ? "salary" : "owner", hrs: roundQ(r.reg + r.ot) }));
  const hourlyRows = rows.filter((r) => r.payType !== "salary" && r.payType !== "na");
  const totals = hourlyRows.reduce((a, r) => ({ reg: a.reg + r.reg, ot: a.ot + r.ot, sick: a.sick + r.sick, unpaid: a.unpaid + r.unpaid, ahx: a.ahx + r.ahx, total: a.total + r.total }), { reg: 0, ot: 0, sick: 0, unpaid: 0, ahx: 0, total: 0 });
  // v148 (owner-rep): every SYSTEM clock-out in the window gets a named note on
  // payroll's sheet — the machine closed someone's day, a human should glance
  // at it before the pay run (and can fix the punches in one tap).
  // (auto148 fetched in the Block-212 wave above.)
  const autoNotes = auto148.filter((a) => nmP111[a.employee_id] && !["salary", "na"].includes(payOf201[a.employee_id]))   // Block 201: hourly only · Block 215: test account excluded
    .map((a) => { const d148 = phxDate(new Date(a.claimed_at).getTime()); return {
    name: nmP111[a.employee_id] || "?", date: d148, at: phxHHMM(a.claimed_at),
    link: `/manager?tc_emp=${a.employee_id}&tc_date=${d148}#timecorrections` }; });
  return { rows: hourlyRows, dates, workdays: dates.filter((d) => workday[d]), totals, ahNotes, autoNotes, salNotes };
}
function payrollPage(d, isAdmin189 = true) {   // Block 189: accounting managers open this too — their nav must not carry admin links
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const wd = d.workdays, dow = (ds) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(ds + "T00:00:00Z").getUTCDay()];
  const cell = (day) => { if (!day) return '<td class="c muted">·</td>'; let t = h1(day.worked); const marks = []; if (day.ot) marks.push('<span class="ot">' + h1(day.ot) + ' OT</span>'); if (day.sick) marks.push('<span class="sk">' + h1(day.sick) + ' S</span>'); if (day.unpaid) marks.push('<span class="up">' + h1(day.unpaid) + ' U</span>'); if (day.otherOff) marks.push('<span class="muted">' + esc(day.otherOff) + '</span>'); if (day.ahx) marks.push('<span class="up">&minus;' + h1(day.ahx) + ' AH</span>'); if (!day.worked && (day.sick || day.unpaid)) t = day.sick ? '<span class="sk">' + h1(day.sick) + ' S</span>' : '<span class="up">' + h1(day.unpaid) + ' U</span>'; else if (!day.worked && day.ahx) t = '<span class="up">0.0</span>'; return `<td class="c">${t}${marks.length && (day.worked || day.ahx) ? ' ' + marks.join(' ') : ''}</td>`; };   // Block 217: sick/unpaid marks carry their HOURS (partial sick days)
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Pay Worksheet</title>${style}
<style>
  .lane{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;font-size:.9rem}
  th{opacity:.55;text-align:left;padding:5px 7px;font-weight:600;border-bottom:1px solid var(--line)}
  td{padding:5px 7px;border-bottom:1px solid var(--line)}
  td.c,th.c{text-align:center;font-variant-numeric:tabular-nums}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .muted{opacity:.55}.ot{color:#ff9f0a;font-size:.82em}.sk{color:#5eaeff;font-weight:600}.up{color:#ff6b5e;font-weight:600}
  .csv{float:right;font-size:.82rem;color:#8e8e93}
  .per a{color:#8e8e93;margin-right:12px}.per a.on{color:#fff;font-weight:700}
  @media print{ a,.per{display:none} }
</style></head>
<body><div class="wrap" style="max-width:1200px">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${navBar95(isAdmin189, false, isAdmin189 ? true : "time")}
  <h2>Pay Worksheet</h2>
  <p class="muted" style="margin-top:-8px">Payroll hours from real clock-in/out — Overtime is hours worked <b>beyond 40 in a week</b> (the Arizona / federal rule; weeks run 7 days from the period's first day), plus Sick and Unpaid from approved time off, rounded to the quarter-hour. Paid leave never counts toward the 40. Download the CSV and email it to payroll. Hours only — no wage rates or pay are stored in the app.</p>
  <div class="lane per" style="line-height:2.1">
    <span style="opacity:.55">Pay period:</span>
    <a href="/payroll?preset=this" class="${d.preset === "this" ? "on" : ""}">Current</a>
    <a href="/payroll?preset=last" class="${d.preset === "last" ? "on" : ""}">Last</a>
    <span style="opacity:.55;margin-left:10px">Custom:</span>
    From <input type="date" id="pp-from" value="${esc(d.from)}" style="background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:6px">
    To <input type="date" id="pp-to" value="${esc(d.to)}" style="background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:6px">
    <button onclick="ppGo()" style="background:#3a3a3c;border:none;border-radius:8px;color:#fff;padding:7px 12px;cursor:pointer;${d.preset === "custom" ? "outline:2px solid #30d158" : ""}">Show</button>
    <p style="margin:8px 0 2px"><b>${esc(d.label)}</b> · <b>${esc(d.rangeText)}</b> <span style="opacity:.55">(Phoenix dates)</span></p>
  </div>
  <script>function ppGo(){var f=document.getElementById("pp-from").value,t=document.getElementById("pp-to").value;if(!f||!t)return;location.href="/payroll?from="+f+"&to="+t;}</script>
  <div class="lane">
    <a class="csv" href="/payroll.csv?${d.qs}">⬇ CSV for payroll</a>
    <h3>Totals for the period</h3>
    ${d.rows.length ? `<table><tr><th>Employee</th><th class="num">Regular</th><th class="num">Overtime</th><th class="num">Sick</th><th class="num">Unpaid</th><th class="num">AH not counted</th><th class="num">Total</th></tr>
      ${d.rows.map((r) => `<tr><td>${esc(r.name)}</td><td class="num">${h1(r.reg)}</td><td class="num ${r.ot ? "ot" : ""}">${h1(r.ot)}</td><td class="num ${r.sick ? "sk" : ""}">${h1(r.sick)}</td><td class="num ${r.unpaid ? "up" : ""}">${h1(r.unpaid)}</td><td class="num ${r.ahx ? "up" : "muted"}">${r.ahx ? h1(r.ahx) : "·"}</td><td class="num"><b>${h1(r.total)}</b></td></tr>`).join("")}
      <tr style="border-top:2px solid var(--line)"><td><b>All (${d.rows.length})</b></td><td class="num"><b>${h1(d.totals.reg)}</b></td><td class="num"><b>${h1(d.totals.ot)}</b></td><td class="num"><b>${h1(d.totals.sick)}</b></td><td class="num"><b>${h1(d.totals.unpaid)}</b></td><td class="num ${d.totals.ahx ? "up" : "muted"}"><b>${d.totals.ahx ? h1(d.totals.ahx) : "·"}</b></td><td class="num"><b>${h1(d.totals.total)}</b></td></tr></table>`
    : `<div class="muted">No hours in this pay period.</div>`}
  </div>
  ${d.rows.length ? `<div class="lane" style="overflow-x:auto">
    <h3>Day by day <span class="muted" style="font-weight:400;font-size:.85rem">(work days only · OT = over 8h · S = sick · U = unpaid)</span></h3>
    <table><tr><th>Employee</th>${wd.map((ds) => `<th class="c">${dow(ds)}<br><span class="muted" style="font-weight:400">${ds.slice(5)}</span></th>`).join("")}<th class="num">Total</th></tr>
      ${d.rows.map((r) => `<tr><td>${esc(r.name)}</td>${wd.map((ds) => cell(r.byDay[ds])).join("")}<td class="num"><b>${h1(r.total)}</b></td></tr>`).join("")}
    </table>
  </div>` : ""}
  ${(d.ahNotes || []).length ? `<div class="lane" style="border-color:#7a5900">
    <h3>After-hours not counted <span class="muted" style="font-weight:400;font-size:.85rem">(excluded from the hours above)</span></h3>
    ${d.ahNotes.map((n) => `<div style="padding:5px 0;border-top:1px solid var(--line)"><b>${esc(n.name)}</b> · ${esc(n.date)} · ${h1(n.hrs)}h — ${n.declined ? `<span class="up">${esc(n.note)}</span>` : `<span class="ot">${esc(n.note)}</span>`}</div>`).join("")}
  </div>` : ""}
  ${(d.autoNotes || []).length ? `<div class="lane" style="border-color:#7a5900">
    <h3>System clock-outs <span class="muted" style="font-weight:400;font-size:.85rem">(no clock-out was recorded — the day closed it; check before payroll)</span></h3>
    ${d.autoNotes.map((n) => `<div style="padding:5px 0;border-top:1px solid var(--line)"><b>${esc(n.name)}</b> · ${esc(n.date)} · closed at ${esc(n.at)} <a href="${n.link}" style="color:#8e8e93;margin-left:10px">Fix punches</a></div>`).join("")}
  </div>` : ""}
  ${(d.salNotes || []).length ? `<div class="lane">
    <h3>Salaried &amp; owners <span class="muted" style="font-weight:400;font-size:.85rem">(not on hourly payroll — their punches are informational only and are NOT in the totals above)</span></h3>
    ${d.salNotes.map((n) => `<div style="padding:5px 0;border-top:1px solid var(--line)"><b>${esc(n.name)}</b> · ${n.label}${n.hrs ? ` · punched ${h1(n.hrs)}h this period` : ""}</div>`).join("")}
  </div>` : ""}
  <p class="muted" style="font-size:.85rem;text-align:center">Semi-monthly, paid the 1st & 15th (cutoffs adjustable — use Custom for an exact range). Sick/Unpaid come from approved time-off days; other approved absences are noted but not totaled here. Hourly people only — salaried &amp; owners never count in the totals (set who's who under People in the Admin console).</p>
</div></body></html>`;
}
function payrollCsv(d) {
  // Block 215 (Daniel): the CSV is THE REPORT SENT TO THE ACCOUNTANT — just
  // payroll hours for the period, shaped like the hand-made "Employee Pay
  // Worksheet" they already send (his 8/15 example: DATES down the side,
  // EMPLOYEES across the top, hours in the cells, a Total row). Gone from the
  // file: the AH-not-counted column, system clock-outs, salaried/owners, and
  // the long day-by-day dump — those live on the Pay Worksheet PAGE where
  // accounting verifies before exporting. One safety line survives: if any
  // after-hours time is still awaiting sign-off in the window, a note says
  // hours are missing until it's approved — so a check can't be cut short
  // silently. (Hourly people only; Zz test account already filtered out.)
  const q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const dow = (ds) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(ds + "T00:00:00Z").getUTCDay()];
  const first = (name) => String(name || "").split(" ")[0];
  // Two Jonathans = two identical columns — a shared first name gets its last
  // initial ("Jonathan A" / "Jonathan T"), like the hand sheet's "John T".
  const seen215 = {}; d.rows.forEach((r) => { const f = first(r.name); seen215[f] = (seen215[f] || 0) + 1; });
  const colName = (r) => { const f = first(r.name); return seen215[f] > 1 ? `${f} ${(String(r.name).split(" ")[1] || "")[0] || ""}` : f; };
  const L = [];
  // Block 215c (Daniel): ONE title cell, always the same shape —
  // "Employee Pay Worksheet (08/11/26 - 08/25/26)". Dates pulled from the
  // period's own range text so the label matches the picker exactly.
  const isoDs = String(d.rangeText || "").match(/\d{4}-\d{2}-\d{2}/g) || [];
  const mdy = (ds) => ds ? `${ds.slice(5, 7)}/${ds.slice(8, 10)}/${ds.slice(2, 4)}` : "";
  const fromDs = isoDs[0] || d.dates[0], toDs = isoDs[1] || d.dates[d.dates.length - 1];
  // A truly-empty CSV line gets COLLAPSED by some viewers (Safari's preview
  // dropped it — Daniel's screenshot); a row of empty CELLS survives everywhere.
  const blankRow215 = () => Array(d.rows.length + 2).fill("").map(q).join(",");
  L.push(q(`Employee Pay Worksheet (${mdy(fromDs)} - ${mdy(toDs)})`));
  L.push(blankRow215());
  L.push(["Date", "Day", ...d.rows.map((r) => colName(r))].map(q).join(","));
  for (const ds of d.dates) {
    const cells = d.rows.map((r) => { const c = r.byDay[ds];
      if (!c) return "";
      const hrs = c.worked || 0, s = c.sick || 0, u = c.unpaid || 0;
      if (!hrs && s) return h1(s) + " S";      // sick day — marked like their "8 ST"
      if (!hrs && u) return h1(u) + " U";      // unpaid day
      if (hrs && s) return h1(hrs) + " +" + h1(s) + "S";   // Block 217: worked part of the day + partial sick hours
      if (hrs && u) return h1(hrs) + " +" + h1(u) + "U";
      return hrs ? h1(hrs) : ""; });
    if (cells.some((c) => c !== "")) L.push([ds, dow(ds), ...cells].map(q).join(","));
  }
  L.push(blankRow215());   // Block 215c (Daniel): a breathing row between the days and the totals
  L.push(["", "Total", ...d.rows.map((r) => h1(r.total))].map(q).join(","));
  L.push(["", "Regular", ...d.rows.map((r) => h1(r.reg))].map(q).join(","));
  L.push(["", "Overtime", ...d.rows.map((r) => h1(r.ot))].map(q).join(","));
  if (d.rows.some((r) => r.sick)) L.push(["", "Sick", ...d.rows.map((r) => h1(r.sick))].map(q).join(","));
  if (d.rows.some((r) => r.unpaid)) L.push(["", "Unpaid", ...d.rows.map((r) => h1(r.unpaid))].map(q).join(","));
  const pendAh = (d.ahNotes || []).filter((n) => !n.declined);
  if (pendAh.length) {
    L.push("");
    L.push(q(`NOTE: ${h1(pendAh.reduce((a, n) => a + n.hrs, 0))} after-hours hours (${pendAh.map((n) => `${n.name} ${n.date}`).join(" · ")}) are NOT in this sheet — they're awaiting admin sign-off. Approve or deny them in the app, then re-download.`));
  }
  return L.join("\n");
}

// Block 131 (logic audit L6): the ON-DECK cab of a line's upcoming queue — the
// front cab, or (L5) the first fully-kitted cab past a stuck pin. This is the ONE
// cab that may start a kit pull; a pull can't live anywhere else.
async function onDeckId(lineId) {
  const up = await db(`build?select=id,queue_pinned,kit_status&line_id=eq.${lineId}&state=eq.upcoming&order=queue_pos.asc.nullslast,created_at.asc`);
  if (!up.length) return null;
  const idx = (up[0].queue_pinned && up[0].kit_status !== "verified") ? up.findIndex((z) => z.kit_status === "verified") : 0;
  return idx >= 0 && up[idx] ? up[idx].id : null;
}
// Block 131 (L6, owner-rep ruling): a pull belongs to the on-deck cab only. When
// the on-deck changes (a reorder moves another cab ahead, or a stuck pin's kit
// finally verifies), any pull left on a now-not-on-deck cab REVERTS — the kit is
// un-pulled and the warehouse starts fresh on whatever's now on deck.
async function revertStrandedPull(lineId, actorId) {
  const deck = await onDeckId(lineId);
  const pulled = await db(`build?select=id,order_number&line_id=eq.${lineId}&state=eq.upcoming&kit_pull_started_at=not.is.null`);
  for (const p of pulled) {
    if (p.id !== deck) {
      await db(`build?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ kit_pull_started_at: null, kit_pull_started_by: null }) });
      logEvent("kit.pull_reverted", actorId, { build_id: p.id, order_number: p.order_number, cause: "no longer on deck" });
    }
  }
}
// Q109: the ONE true "start the cab" path — used by the warehouse Delivered
// tap (the normal way now) and the manager's manual override. Freezes the
// template into the cab's own task list (Q97) and stamps the start.
// ---------- Block 133 (logic audit L9): line "down" with a live/held cab ----------
// Owner-rep ruling: a manager may put a line DOWN even with a cab running (a tech
// out). The manager TYPES a reason; it rides with the order and the down is TIMED.
// Because pace/day math is pure clocked-labor (no wall clock ticks against an idle
// cab), the hold pauses the cab's production time on its own — this just records
// and reports it. The hold PAUSES outside shop hours and persists across days
// until a manager lifts it OR a production role clocks in. Warehouse may DELIVER a
// kit to a down line, but the clock does NOT start — the cab waits for resume.

// Working-time overlap of [downMs,upMs] with shop-open windows (Q113 hours, Q91
// calendar): closed hours + non-work days never count, so an overnight hold
// pauses at close and resumes at open. ovMap = calendarOverrides() result.
function downWorkingMs(downMs, upMs, hrs, ovMap) {
  if (!(upMs > downMs)) return 0;
  let total = 0;
  let dayMid = Math.floor((downMs - PHX_OFFSET_MS) / 86400000) * 86400000 + PHX_OFFSET_MS;
  const lastMid = Math.floor((upMs - PHX_OFFSET_MS) / 86400000) * 86400000 + PHX_OFFSET_MS;
  for (; dayMid <= lastMid; dayMid += 86400000) {
    const dateStr = new Date(dayMid).toISOString().slice(0, 10);
    let work;
    if (dateStr in ovMap) work = ovMap[dateStr];
    else { const dow = new Date(dateStr + "T12:00:00Z").getUTCDay(); work = dow >= 1 && dow <= 5; }
    if (!work) continue;
    const s = Math.max(downMs, dayMid + hrs.open * 3600000);
    const e = Math.min(upMs, dayMid + hrs.close * 3600000);
    if (e > s) total += e - s;
  }
  return total;
}

// Close every OPEN (up_at null) hold on a line — the resume stamps end + who/cause.
async function closeOpenDowns(lineId, actorId, cause) {
  await db(`line_down?line_id=eq.${lineId}&up_at=is.null`, { method: "PATCH",
    body: JSON.stringify({ up_at: new Date().toISOString(), up_by: actorId || null, up_cause: cause }) });
}

// When a down line comes back up, START the cab whose kit warehouse already
// delivered while it was held (state still upcoming, kit_delivered_at set, not
// yet started). Only the on-deck cab can be in that state (L5/L6 gates), so there
// is at most one. The clock starts NOW — never backdated to the drop. A defensive
// clash guard keeps the one-active-per-line invariant.
async function startDeliveredWaiting(lineId, actorId) {
  const clash = await db(`build?select=id&line_id=eq.${lineId}&state=in.(active,awaiting_inspection,rework)&limit=1`);
  if (clash.length) return;
  const waiting = await db(`build?select=id,part_number,order_number,coyote_root&line_id=eq.${lineId}&state=eq.upcoming&kit_delivered_at=not.is.null&started_at=is.null&order=queue_pos.asc.nullslast,created_at.asc&limit=1`);
  if (!waiting.length) return;
  const w = waiting[0];
  await freezeAndStart(w, actorId, new Date().toISOString());
  logEvent("build.started_after_down", actorId, { build_id: w.id, order_number: w.order_number, line_id: lineId });
}

// Block 135 (owner-rep ruling on the T1 walkthrough find): resume a "down for
// today" hold once a punch ONTO the line is RECORDED — close the timed hold,
// clear the flag, and start any cab whose kit warehouse delivered while the
// line was held. Shared by /api/clock/in AND /api/clock/switch: since block
// 98b the floor's everyday line tap is a SWITCH (the paycheck punch lands on
// company time 14 first), so without this the normal morning taps never
// lifted an L9 hold. Runs only AFTER the punch insert — the v146 lesson.
async function resumeDownLine135(lineId, empId) {
  const [lnR] = await db(`line?select=down_today&id=eq.${lineId}`);
  if (!lnR || !lnR.down_today) return;
  await closeOpenDowns(lineId, empId, "clock_in");
  await db(`line?id=eq.${lineId}`, { method: "PATCH", body: JSON.stringify({
    down_today: false, down_reason: null, down_by: null, down_at: null }) });
  logEvent("line.down_resumed", empId, { line_id: lineId, cause: "clock_in" });
  await startDeliveredWaiting(lineId, empId);
}

async function freezeAndStart(b, empId, startedAt) {
  await db(`build?id=eq.${b.id}`, { method: "PATCH", body: JSON.stringify({ state: "active", started_at: startedAt, queue_pinned: false }) });
  const [prod] = await db(`product?select=template_id&part_number=eq.${encodeURIComponent(b.part_number)}`);
  const steps = await db(`step_template?select=display_no,name,day_no,day_end,man_hours,is_background,sort_order&template_id=eq.${prod.template_id}&retired=is.false&order=sort_order`);
  for (const st of steps)   // frozen copy (Q97) — sequential inserts keep it simple at this scale
    await db("task", { method: "POST", body: JSON.stringify({ build_id: b.id, display_no: st.display_no,
      name: st.name, day_no: st.day_no, day_end: st.day_end ?? null, man_hours: st.man_hours, is_background: st.is_background,
      source: "template", state: "not_started", sort_order: st.sort_order }) });
  // Block 94b: freeze the cab's UPGRADE OPTIONS in with the steps. Structured
  // options match the per-family library by exact normalized text and get real
  // hours on their day. Unknown options + ALL PSR-CUSTOM add-ons become FLAGS
  // (a human types the hours — never guessed); admins get notified (Q106-
  // sandboxed). Wrapped in try/catch: an option hiccup never blocks a start.
  let optCount94 = 0, flagCount94 = 0;
  try {
    const coyOrd94 = b.coyote_root || String(b.order_number || "").split(".")[0];
    if (coyOrd94) {
      const [ci94] = await db(`coyote_intake?select=payload&order_number=eq.${encodeURIComponent(coyOrd94)}&order=received_at.desc&limit=1`);
      const prodsAll94 = await db(`product?select=part_number,family`);
      const allow94 = new Set(prodsAll94.map((x) => String(x.part_number).toUpperCase()));
      const det94 = ci94 && ci94.payload ? parseCoyoteDetail(ci94.payload, b.part_number, allow94) : null;
      if (det94) {
        const famMap94 = {}; for (const x of prodsAll94) famMap94[String(x.part_number).toUpperCase()] = x.family;
        const fam94 = famMap94[String(b.part_number || "").toUpperCase()] || "";
        const lib94 = fam94 ? await db(`option_item?select=match_text,man_hours,day_no&family=eq.${encodeURIComponent(fam94)}&retired=is.false`) : [];
        // Block 119b: also collapse space BEFORE a colon — Coyote's raw text
        // (and library rows pasted from it) can read "Floor : Large Hump
        // Floor" while the rebuilt form reads "Floor: …"; both sides must
        // normalize identically or a real option throws a bogus flag.
        const norm94 = (s) => String(s || "").trim().toLowerCase().replace(/\s+:/g, ":").replace(/\s+/g, " ");
        const byText94 = {}; for (const o of lib94) byText94[norm94(o.match_text)] = o;
        const sig94 = []; let sort94 = 9000;
        for (const f of det94.features) {
          const full = (f.label ? f.label + ": " : "") + f.value;
          const hit = byText94[norm94(full)] || byText94[norm94(f.value)];
          // Block 113 (owner-rep): a PRICED library match OUTRANKS the
          // stock-prefix heuristic — "Stock Holes w/ Radius Front Edge"
          // starts with the word Stock but carries real radius-edge labor,
          // so it must pass through. Plain Stock/None values still skip.
          if (f.stock && !(hit && Number(hit.man_hours) > 0)) continue;
          sig94.push(full);
          if (hit) {
            // Block 102: a matched ZERO-hour entry is a KNOWN config choice
            // with no cab labor (year, floor style, bed hardware, scripts…) —
            // recognized for the signature: no task, no flag, no clock time.
            if (Number(hit.man_hours) > 0) {
              optCount94++;
              await db("task", { method: "POST", body: JSON.stringify({ build_id: b.id, display_no: "U" + optCount94,
                name: "UPGRADE — " + full, day_no: hit.day_no, man_hours: hit.man_hours, is_background: false,
                source: "option", state: "not_started", sort_order: sort94++ }) });
            }
          } else {
            flagCount94++;
            await db("option_flag", { method: "POST", body: JSON.stringify({ build_id: b.id, kind: "option", flag_text: full }) });
          }
        }
        for (const a of det94.addons) {
          sig94.push("CUSTOM: " + a.desc);
          // Block 104c (owner-rep audit): a catalog part SKU is MERCHANDISE —
          // it ships with the order and is nobody's cab labor. Only true labor
          // lines (LABOR / PSR-CUSTOM item numbers) ask for hours; whether
          // they're production's or Build's is a one-tap human call on the card.
          const num104 = String(a.num || "").toUpperCase();
          if (!(num104 === "LABOR" || num104.startsWith("LABOR") || num104 === "PSR-CUSTOM" || num104.startsWith("PSR-CUSTOM"))) continue;
          flagCount94++;
          await db("option_flag", { method: "POST", body: JSON.stringify({ build_id: b.id, kind: "custom", flag_text: a.desc }) });
        }
        let sg94 = 0; const ss94 = sig94.sort().join("|"); for (let i = 0; i < ss94.length; i++) sg94 = (sg94 * 31 + ss94.charCodeAt(i)) >>> 0;
        await db(`build?id=eq.${b.id}`, { method: "PATCH", body: JSON.stringify({ options_sig: String(sg94) }) });
        if (flagCount94) {
          // Block 104 (owner-rep): custom add-ons and unknown options are
          // ACTION ITEMS the moment the cab reaches the line — the production
          // manager gets the push alongside the admins (Q106-sandboxed).
          const adm94 = await adminIds225();   // Block 225: upgrade-hours rulings are admin work
          await notify("option.flagged", adm94, `Order ${b.order_number}: ${flagCount94} upgrade${flagCount94 === 1 ? "" : "s"} need hours`,
            "Upgrade work started without hours on the clock — open the order and set them so the timeline stays honest.", "/order/" + encodeURIComponent(b.order_number), { urgent: await urgent226(b.id) });
        }
      }
    }
  } catch (e94) { logEvent("option.freeze_error", null, { build_id: b.id, error: String((e94 && e94.message) || e94) }); }
  // Block 138 (owner-rep, B1): triage the order note the moment the cab
  // starts — non-money lines become needs-a-ruling items. Never blocks a start.
  try {
    const [bn138] = await db(`build?select=invoice_note&id=eq.${b.id}`);
    if (bn138 && bn138.invoice_note) await noteTriage138(b.id, bn138.invoice_note, b.order_number);
  } catch (e138) { logEvent("note.triage_error", null, { build_id: b.id, error: String((e138 && e138.message) || e138) }); }
  // Block 103: THE PROMISE — computed the moment the cab starts, from its FULL
  // frozen hours (stock + upgrades) over the family's own day budget (template
  // man-hours / template days — the crew basis is baked in) counted across
  // OPEN shop days. Fixed once set (Q103-6); no padding — honest capacity.
  // If Coyote's SOLD ship date can't be met on standard hours, the conflict
  // flags the day the cab starts (managers + admins, Q106-sandboxed) instead
  // of surfacing the week it ships late. Wrapped: never blocks a start.
  try {
    const frozen103 = await db(`task?select=man_hours&build_id=eq.${b.id}`);
    const totalMh103 = frozen103.reduce((s2, t2) => s2 + Number(t2.man_hours || 0), 0);
    const stepMh103 = steps.reduce((s2, t2) => s2 + Number(t2.man_hours || 0), 0);
    const [tpl103] = await db(`build_template?select=total_days&id=eq.${prod.template_id}`);
    const tplDays103 = tpl103 && Number(tpl103.total_days) > 0 ? Number(tpl103.total_days) : 0;
    if (totalMh103 > 0 && stepMh103 > 0 && tplDays103 > 0) {
      const dayBudget103 = stepMh103 / tplDays103;
      const daysNeeded103 = Math.max(1, Math.ceil(totalMh103 / dayBudget103 - 1e-9));
      let cursor103 = new Date(startedAt).getTime(); let counted103 = 0; let promised103 = null;
      for (let i103 = 0; i103 < 240 && counted103 < daysNeeded103; i103++) {
        const ds103 = phxDate(cursor103);
        if (await isWorkDay(ds103)) { counted103++; promised103 = ds103; }
        cursor103 += 86400000;
      }
      if (promised103) {
        await db(`build?id=eq.${b.id}`, { method: "PATCH", body: JSON.stringify({ promised_finish: promised103 }) });
        const coyOrd103 = b.coyote_root || String(b.order_number || "").split(".")[0];
        let ship103 = "";
        if (coyOrd103) {
          const [ci103] = await db(`coyote_intake?select=payload&order_number=eq.${encodeURIComponent(coyOrd103)}&order=received_at.desc&limit=1`);
          const o103 = ci103 && ci103.payload && ci103.payload.order;
          ship103 = o103 ? String(o103.ship_date || "").slice(0, 10) : "";
        }
        const conflict103 = Boolean(ship103 && promised103 > ship103);
        logEvent("build.promised", empId, { build_id: b.id, order_number: b.order_number, promised: promised103,
          ship_date: ship103 || null, days: daysNeeded103, total_mh: totalMh103, conflict: conflict103 });
        if (conflict103) {
          const mg103 = await adminIds225();   // Block 225 (Daniel): ship-date risk is admin-only — rare, high-value, off the floor manager's bell
          await notify("build.promise_conflict", mg103, `ORDER ${b.order_number} — can't make the sold ship date`,
            `Standard hours put the finish at ${promised103}; Coyote has it sold to ship ${ship103}. Upgrade hours are already in the math. Add crew, use an approved after-hours session, or move the customer date.`,
            "/order/" + encodeURIComponent(b.order_number));
        }
      }
    }
  } catch (e103) { logEvent("build.promise_error", null, { build_id: b.id, error: String((e103 && e103.message) || e103) }); }
  logEvent("build.start", empId, { build_id: b.id, order_number: b.order_number, tasks_frozen: steps.length, options_frozen: optCount94, option_flags: flagCount94 });
}

// ============================================================
// NOTIFICATIONS v1 (block 23, file 16) — the engine + WEB PUSH, zero deps.
//
// THE Q106 SANDBOX, in the owner-rep's words: "the ONLY test of push,
// text, email or ANY notifications ONLY goes to me. daniel park. NOTHING
// goes out to staff." — reaffirmed 2026-07-30: "no emails, no NOTHING
// until we are ready to go live." Enforced STRUCTURALLY: every message
// funnels through notify() below, and unless the Railway variable
// NOTIFY_LIVE is exactly "yes" (a named cutover step, deliberately NOT an
// admin-console switch so it can't be flipped by accident), delivery is
// REWRITTEN to SANDBOX_EMPLOYEE_ID with a stamp naming who it WOULD have
// reached. notification_log records true intent either way, so at cutover
// we can show exactly what the matrix would have done all along.
//
// Channel status (owner-rep choice 2026-07-30): WEB PUSH ships now, pure
// Node — VAPID JWT per RFC 8292, payload sealed per RFC 8291 (aes128gcm),
// both proven by local sign/verify and encrypt/decrypt round-trips before
// commit. Email + SMS stay unbuilt until a provider is connected.
const b64u = (b) => Buffer.from(b).toString("base64url");
const fromB64u = (s) => Buffer.from(s, "base64url");
const hmac256 = (k, d) => crypto.createHmac("sha256", k).update(d).digest();

// VAPID JWT (RFC 8292): proves to the browser's push service that we own
// the keypair this device subscribed against.
function vapidJwt(aud) {
  const pub = fromB64u(VAPID_PUB);
  const key = crypto.createPrivateKey({ format: "jwk", key: { kty: "EC", crv: "P-256",
    d: VAPID_PRIV, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) } });
  const part = (o) => b64u(Buffer.from(JSON.stringify(o)));
  const unsigned = `${part({ typ: "JWT", alg: "ES256" })}.${part({ aud,
    exp: Math.floor(Date.now() / 1000) + 43200, sub: "mailto:marketing@premierstreetrod.com" })}`;
  return `${unsigned}.${b64u(crypto.sign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" }))}`;
}

// RFC 8291 payload sealing — a push service only accepts messages
// encrypted to that one device's own keys (not even the service can read
// them). Single record, 0x02 delimiter, no padding.
function encryptPush(payload, uaPub, authSecret) {
  const ecdh = crypto.createECDH("prime256v1");
  const asPub = ecdh.generateKeys();
  const shared = ecdh.computeSecret(uaPub);
  const salt = crypto.randomBytes(16);
  const ikm = hmac256(hmac256(authSecret, shared),
    Buffer.concat([Buffer.from("WebPush: info\x00"), uaPub, asPub, Buffer.from([1])]));
  const prk = hmac256(salt, ikm);
  const cek = hmac256(prk, Buffer.concat([Buffer.from("Content-Encoding: aes128gcm\x00"), Buffer.from([1])])).subarray(0, 16);
  const nonce = hmac256(prk, Buffer.concat([Buffer.from("Content-Encoding: nonce\x00"), Buffer.from([1])])).subarray(0, 12);
  const cipher = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const ct = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])),
    cipher.final(), cipher.getAuthTag()]);
  return Buffer.concat([salt, Buffer.from([0, 0, 16, 0]), Buffer.from([asPub.length]), asPub, ct]);
}

// One sealed message to one subscribed device. 404/410 means the device
// unsubscribed or expired — retire the row quietly, never error the floor.
async function sendPush(sub, payloadObj) {
  const box = encryptPush(JSON.stringify(payloadObj), fromB64u(sub.p256dh), fromB64u(sub.auth));
  const r = await fetch(sub.endpoint, { method: "POST", body: box, headers: {
    "Authorization": `vapid t=${vapidJwt(new URL(sub.endpoint).origin)}, k=${VAPID_PUB}`,
    "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream",
    "TTL": "3600", "Urgency": "normal" } });
  if (r.status === 404 || r.status === 410)
    await db(`push_subscription?id=eq.${sub.id}`, { method: "PATCH", body: JSON.stringify({ active: false }) });
  return r.status;
}

// Block 116: minimal SMTP client (zero-npm, matching this file's rule) for
// the shop's Microsoft 365 mailbox — EHLO -> STARTTLS -> AUTH LOGIN -> one
// message. Line-oriented; multi-line replies ("250-…") are consumed until
// the "250 " final line. Throws with the server's actual reply so a bad
// password or a blocked mailbox reads as itself in the admin test panel.
function smtpExchange116(sock, expect, toSend) {
  return new Promise((resolve, reject) => {
    let buf = "";
    const onData = (d) => {
      buf += d.toString("utf8");
      const lines = buf.split(/\r\n/).filter(Boolean);
      const last = lines[lines.length - 1];
      if (!last || !/^\d{3} /.test(last)) return; // multi-line reply, keep reading
      sock.removeListener("data", onData);
      if (!expect.test(last)) return reject(new Error("SMTP: " + last.slice(0, 180)));
      resolve(last);
    };
    sock.on("data", onData);
    sock.once("error", reject);
    sock.once("close", () => reject(new Error("SMTP: connection closed early")));
    if (toSend !== null) sock.write(toSend + "\r\n");
  });
}
async function sendEmail116(to, subject, bodyText) {
  if (!EMAIL_READY) throw new Error("Email is not set up yet (SMTP_USER / SMTP_PASS on Railway)");
  const plain = await new Promise((res, rej) => {
    const s = net.connect(SMTP_PORT, SMTP_HOST, () => res(s));
    s.once("error", rej);
    s.setTimeout(20000, () => s.destroy(new Error("SMTP: connection timed out")));
  });
  await smtpExchange116(plain, /^220 /, null); // server greeting
  await smtpExchange116(plain, /^250 /, "EHLO shopboard.premierstreetrod.com");
  await smtpExchange116(plain, /^220 /, "STARTTLS");
  const sock = await new Promise((res, rej) => {
    const t = tls.connect({ socket: plain, servername: SMTP_HOST }, () => res(t));
    t.once("error", rej);
    t.setTimeout(20000, () => t.destroy(new Error("SMTP: connection timed out")));
  });
  await smtpExchange116(sock, /^250 /, "EHLO shopboard.premierstreetrod.com");
  await smtpExchange116(sock, /^334 /, "AUTH LOGIN");
  await smtpExchange116(sock, /^334 /, Buffer.from(SMTP_USER).toString("base64"));
  await smtpExchange116(sock, /^235 /, Buffer.from(SMTP_PASS).toString("base64"));
  await smtpExchange116(sock, /^250 /, `MAIL FROM:<${SMTP_USER}>`);
  await smtpExchange116(sock, /^250 /, `RCPT TO:<${to}>`);
  await smtpExchange116(sock, /^354 /, "DATA");
  const msg = [
    `From: Shop Board <${SMTP_USER}>`,
    `To: <${to}>`,
    `Subject: ${String(subject).replace(/[\r\n]+/g, " ")}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@premierstreetrod.com>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    String(bodyText).replace(/\r?\n/g, "\r\n").replace(/^\./gm, ".."),
  ].join("\r\n");
  await smtpExchange116(sock, /^250 /, msg + "\r\n.");
  try { sock.write("QUIT\r\n"); sock.end(); } catch (e) {}
  return true;
}
// Block 116: SMS via Twilio's plain REST API (fetch, still zero-npm).
async function sendSms116(to, bodyText) {
  if (!SMS_READY) throw new Error("Texting is not set up yet (TWILIO_SID / TWILIO_TOKEN / TWILIO_FROM on Railway)");
  const digits = String(to).replace(/[^\d+]/g, "");
  const e164 = digits.startsWith("+") ? digits : "+1" + digits.replace(/^1/, "");
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: "POST",
    headers: { "Authorization": "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: e164, From: TWILIO_FROM, Body: String(bodyText).slice(0, 500) }).toString(),
  });
  const out = await r.json().catch(() => ({}));
  if (r.status >= 300) throw new Error("Twilio: " + String(out.message || `status ${r.status}`).slice(0, 180));
  return true;
}

// THE chokepoint — every notification the system ever sends passes here.
// intendedIds = who SHOULD get it; the sandbox decides who DOES. Never
// throws: a notification problem must never break a floor tap.
// Block 220 (Daniel, 8/26): DEPARTMENT-SCOPED MANAGER NOTIFICATIONS.
// "each departments manager role will be different. no reason for her to get
// the bell notifications of anything happening on the production floor." The
// ACCOUNTING manager's lane is PAY ONLY — the no-lunch-punch flag and the
// system-clock-out notice (both target her explicitly beside the admins),
// plus her own personal events. Every generic managers+admins notice —
// inspection traffic, pace, line-frees, ship-risk, Coyote plumbing, order
// rulings, the daily touches — routes through this helper, which drops
// Accounting-department managers. Admins always ride along. A manager with
// NO department set keeps receiving (undefined is not excluded) until
// Daniel scopes that department's manager role too.
// Block 221 (Daniel, 8/26): "body shop managers get different notifications
// than production managers." Lanes: default "floor" = Production-floor
// traffic (pace, line-frees, ship-risk, Coyote plumbing, order rulings,
// daily touches) — PRODUCTION-dept managers only; "inspect" = the
// inspection hand-off — Production AND Body Shop managers (Body Shop ARE
// the inspectors). Admins always ride. A manager with NO department stays
// on every lane until Daniel scopes that department (none exist today).
// Block 225 (Daniel, 8/26): ADMIN-ONLY recipients — the order-pipeline and
// ruling notices (Coyote sync flags, cab-count, cab rulings, upgrade hours,
// note triage, check-the-standard, ship-date risk) are acted on in the
// ADMIN console; a floor manager can't rule on any of them, so they no
// longer reach his bell at all.
// Block 226b (Daniel, 8/26): URGENCY CARVE-OUT — paperwork rulings are
// bell-only UNLESS the order in question is LIVE on a production line
// ("these questions from admin need to be answered immediately").
async function urgent226(buildId) {
  try {
    const [u] = await db(`build?select=state&id=eq.${buildId}`);
    return Boolean(u && (u.state === "active" || u.state === "rework"));
  } catch (e) { return false; }
}
async function adminIds225() {
  return (await db(`employee?select=id&active=is.true&role=eq.admin`)).map((a) => a.id);
}
async function floorMgrIds220(lane221) {
  const rows = await db(`employee?select=id,role,department&active=is.true&role=in.(manager,admin)`);
  const ok221 = lane221 === "inspect" ? ["Production", "Body Shop"] : ["Production"];
  return rows.filter((r) => r.role === "admin" || !r.department || ok221.includes(r.department)).map((r) => r.id);
}
async function notify(eventType, intendedIds, title, bodyText, link, opts226) {
  try {
    const intended = (Array.isArray(intendedIds) ? intendedIds : [intendedIds]).filter(Boolean);
    if (!intended.length) return;
    const sandbox = !NOTIFY_LIVE;
    const ppl = await db(`employee?select=first_name,last_name&id=in.(${intended.join(",")})`);
    const names = ppl.map((p) => `${p.first_name} ${p.last_name ? p.last_name[0] + "." : ""}`).join(", ");
    const targets = sandbox ? (SANDBOX_EMPLOYEE_ID ? [SANDBOX_EMPLOYEE_ID] : []) : intended;
    // Block 117 (⚙ My settings): the person picks CHANNELS; their role
    // already picked the EVENTS. Role-critical notices (pay decisions,
    // inspection hand-offs, ship risk, self-tests) USED to ignore the mutes.
    // Block 180 (owner ruling 2026-08-16, launch simplicity): that critical
    // bypass is SUSPENDED — the owner is introducing the system in layers,
    // so a person's OFF switch mutes EVERYTHING for them, criticals included.
    // To restore the old always-land behavior, put `critical117 ||` back at
    // the front of wants117's return.
    const critical117 = ["afterhours.", "build.ready_inspection", "build.rework_assigned", "build.promise_conflict", "test.", "notify."].some((pre) => String(eventType).startsWith(pre));
    void critical117; // computed but intentionally unused while suspended — Block 180
    // Block 225 (Daniel, 8/26): PER-EVENT CHANNEL POLICY — some notices
    // inform but must never interrupt: they land on EVERY intended bell and
    // never push, text, or email ANYBODY (his scope ruling: everyone, owners
    // included). Today: line-frees planning info + the daily touches. This is
    // what makes "some of these should just be bell and some push" real —
    // flipping a person's push ON buzzes only the events not listed here.
    // Block 226b (Daniel's admin-dive rulings): the OFFICE-PAPERWORK events
    // join the bell-only list — sync flags, cab rulings, upgrade-hours and
    // note triage wait at the desk. EXCEPTION: a caller passing
    // {urgent:true} (the order is ACTIVE on a line) punches through and
    // buzzes normally. pace.standards and option.changed stay pushable —
    // they only ever fire about live cabs.
    const BELL_ONLY_225 = ["touch.linefrees", "nudge.daystart", "sync.iface_add", "sync.iface_drop", "note.triage", "option.flagged"];
    const bellOnly225 = !(opts226 && opts226.urgent) && (BELL_ONLY_225.includes(String(eventType)) || String(eventType).startsWith("cab."));
    // Block 226b: OWNER-QUIET — "i dont want to burden the owners WHEN they
    // decide to turn on their push notifications." Owner-department admins
    // get push/text/email ONLY for the big stuff (ship-date risk, short
    // kits), their own personal time-off events, and self-tests; everything
    // else stays complete-but-silent on their bell. Daniel (Marketing) and
    // any future working admin are untouched.
    const OWNER_PUSH_226 = ["build.promise_conflict", "kit.short"];
    const ownerQuiet226 = (pp) => Boolean(pp && pp.role === "admin" && pp.department === "Owner")
      && !OWNER_PUSH_226.includes(String(eventType))
      && !["timeoff.", "test."].some((pre) => String(eventType).startsWith(pre));
    const prefs117 = {};
    if (targets.length) for (const pp of await db(`employee?select=id,role,department,notify_push,notify_sms,notify_email&id=in.(${targets.join(",")})`)) prefs117[pp.id] = pp;
    // Block 184 (owner ruling, launch day 1): READY-FOR-INSPECTION is the
    // floor managers' job signal — it punches through the per-person mute on
    // PUSH ONLY. Text/email stay muted for everyone (his exact words: "keep
    // text message notifications still off for all of them").
    // Block 185 (v179 audit fix): the punch is scoped to role=MANAGER — the
    // inspectors (Mike + Isaac + Jason). The event still targets admins too,
    // but for THEM the normal mutes apply, so the muted owners stay quiet
    // (Daniel's admin channels are ON, so he hears it the normal way).
    // Block 202 (owner, night of day 4): the inspection punch-through is
    // SUSPENDED — Daniel: turn everyone's push OFF except his and Eric's
    // ("i THINK i may have misunderstood something... we will dive into
    // heavily tomorrow"). This flag let build.ready_inspection push MANAGERS
    // straight through their OFF switch (the Blazer-era fix), which would
    // have defeated tonight's quiet order the moment a cab hit inspection.
    // RESTORE LATER = delete the leading "false && ".
    const inspectPunch184 = false && eventType === "build.ready_inspection";
    const wants117 = (id, ch) => { const pp = prefs117[id]; if (ch === "push" && inspectPunch184 && pp && pp.role === "manager") return true; if (ownerQuiet226(pp)) return false; return !pp || pp["notify_" + ch] !== false; };
    const pushT117 = bellOnly225 ? [] : targets.filter((id) => wants117(id, "push"));
    let status = "sandbox_no_target", sent = 0;
    if (targets.length && !pushT117.length) status = "muted";
    if (pushT117.length && VAPID_PUB && VAPID_PRIV) {
      const subs = await db(`push_subscription?select=id,endpoint,p256dh,auth&active=is.true&employee_id=in.(${pushT117.join(",")})`);
      const payload = { title: sandbox ? `[TEST] ${title}` : title,
        body: sandbox ? `${bodyText}\n(Build test — would have gone to: ${names})` : bodyText,
        url: link || "/home" };
      for (const s of subs) { try { const st = await sendPush(s, payload); if (st < 300) sent++; } catch (e) {} }
      status = sent ? "sent" : (subs.length ? "failed" : "no_subscription");
    }
    // Block 116: EMAIL + SMS ride the same chokepoint — same sandbox, same
    // [TEST] stamp, gated by the Features switches (both OFF by default so
    // launch stays quiet). Deliberately NOT awaited: an SMTP round-trip must
    // never slow a floor tap. The channel block logs its own rows.
    if (!bellOnly225 && targets.length && (EMAIL_READY || SMS_READY)) {   // Block 225: bell-only events never text or email either
      (async () => {
        const togs116 = await db(`feature_toggle?select=key,enabled&key=in.(notify_email,notify_sms)`);
        const emailOn = togs116.some((t) => t.key === "notify_email" && t.enabled === true);
        const smsOn = togs116.some((t) => t.key === "notify_sms" && t.enabled === true);
        if (!((emailOn && EMAIL_READY) || (smsOn && SMS_READY))) return;
        const ppl116 = await db(`employee?select=id,email,mobile&id=in.(${targets.join(",")})`);
        const subj116 = sandbox ? `[TEST] ${title}` : title;
        const body116 = (sandbox ? `${bodyText}\n(Build test — would have gone to: ${names})` : bodyText)
          + `\n\nOpen: https://shopboard.premierstreetrod.com${link || "/home"}`;
        let emailStatus = null, smsStatus = null;
        for (const p of ppl116) {
          if (emailOn && EMAIL_READY && p.email && wants117(p.id, "email")) {
            try { await sendEmail116(p.email, subj116, body116); emailStatus = "sent"; }
            catch (e) { if (emailStatus !== "sent") emailStatus = "failed"; }
          }
          if (smsOn && SMS_READY && p.mobile && wants117(p.id, "sms")) {
            try { await sendSms116(p.mobile, (subj116 + " — " + bodyText).slice(0, 300)); smsStatus = "sent"; }
            catch (e) { if (smsStatus !== "sent") smsStatus = "failed"; }
          }
        }
        if (emailOn && EMAIL_READY && !emailStatus) emailStatus = "no_address";
        if (smsOn && SMS_READY && !smsStatus) smsStatus = "no_number";
        const rows116 = [];
        if (emailStatus) rows116.push(...intended.map((id) => ({ event_type: eventType, intended_employee_id: id, channel: "email", title, body: bodyText, sandboxed: sandbox, status: emailStatus })));
        if (smsStatus) rows116.push(...intended.map((id) => ({ event_type: eventType, intended_employee_id: id, channel: "sms", title, body: bodyText, sandboxed: sandbox, status: smsStatus })));
        if (rows116.length) await db("notification_log", { method: "POST", body: JSON.stringify(rows116) });
      })().catch(() => { /* channel trouble never breaks the floor */ });
    }
    await db("notification_log", { method: "POST", body: JSON.stringify(intended.map((id) => ({
      event_type: eventType, intended_employee_id: id, channel: "push", title, body: bodyText,
      sandboxed: sandbox, status }))) });
  } catch (e) { /* never break the floor over a notification */ }
}
// The warehouse crew, resolved fresh each event (roster changes stick).
const warehouseIds = async () =>
  (await db("employee?select=id&department=eq.Warehouse&active=is.true")).map((e) => e.id);

// Block 222 (Daniel, 8/26 — warehouse dive): VERIFY-THE-NEXT-KIT NUDGE.
// "they should receive a push notification at some point deep into
// production of a cab, and IF warehouse hasn't verified the cab on deck,
// that they need to verify all parts are accounted for." His ruling: fire
// at 75% of the current cab's production tasks; a kit already VERIFIED is
// silent, and a kit marked SHORT is silent too (short IS verified — they
// already know what's missing; the admins get their own kit.short notice).
// Once per cab in production (event_log dedupe), rides every task-complete
// tap, fire-and-forget so it never slows the floor.
async function kitVerifyNudge222(buildId) {
  try {
    const [b] = await db(`build?select=id,line_id,order_number,cab_number,state&id=eq.${buildId}`);
    if (!b || b.state !== "active" || b.line_id == null) return;
    const tasks222 = await db(`task?select=state,is_background&build_id=eq.${buildId}`);
    const real222 = tasks222.filter((t) => !t.is_background);
    if (!real222.length) return;
    const done222 = real222.filter((t) => t.state === "complete").length;
    if (done222 / real222.length < 0.75) return;
    const [next222] = await db(`build?select=id,order_number,cab_number,kit_status&line_id=eq.${b.line_id}&state=eq.upcoming&order=queue_pos.asc.nullslast&limit=1`);
    if (!next222) return;                                                        // nothing on deck
    if (next222.kit_status === "verified" || next222.kit_status === "short") return;
    const dup222 = await db(`event_log?select=id&event_type=eq.warehouse.verify_kit&payload->>build_id=eq.${buildId}&limit=1`);
    if (dup222.length) return;
    const [ln222] = await db(`line?select=name&id=eq.${b.line_id}`);
    logEvent("warehouse.verify_kit", null, { build_id: buildId, next_id: next222.id, order_number: b.order_number, next_order: next222.order_number, line: ln222 ? ln222.name : String(b.line_id) });
    notify("warehouse.verify_kit", await warehouseIds(),
      `${ln222 ? ln222.name : "Line"} — verify the next kit`,
      `Order ${b.order_number}${b.cab_number ? ` (Cab #${b.cab_number})` : ""} is 75% done. On deck: order ${next222.order_number}${next222.cab_number ? ` (Cab #${next222.cab_number})` : ""} — its kit hasn't been verified yet. Make sure every part is accounted for before the line frees.`,
      "/home");
  } catch (e) { console.error("kit-verify nudge failed:", e.message); }
}

// Q116: PACE EARLY-WARNING. Turns the board's own red into a push so the
// owner-rep hears about a cab that needs help without watching the TV.
// EDGE-TRIGGERED: one push when a cab CROSSES into red, nothing while it
// stays red, and it re-arms once the cab recovers (build.pace_alert_color
// remembers the last colour seen, so it survives a redeploy). Reuses the
// board engine's EXACT math via an internal read of /api/board-state — the
// alert fires precisely when the TV would show red, zero duplicate math.
// The Q106 sandbox still gates delivery: until cutover every push reroutes
// to the owner-rep with the [TEST] stamp.
async function pacePatrol() {
  try {
    if (!DB_READY) return;
    // Two monitors ride this one patrol: the pace warning (Q116, default ON)
    // and the Q91 early-red standards guard (default OFF). If a cab crosses
    // into red EARLY — little of the build actually done — that usually means
    // the hour STANDARD is too tight, not that the crew is slow, so it pings
    // the manager to "check the standard" INSTEAD of a normal red.
    const togs = await db(`feature_toggle?select=key,enabled&key=in.(pace_warnings,early_red_standards_guard)`);
    const paceWarnOn = !togs.some((t) => t.key === "pace_warnings" && t.enabled === false); // default on
    const earlyRedOn = togs.some((t) => t.key === "early_red_standards_guard" && t.enabled === true); // default off
    if (!paceWarnOn && !earlyRedOn) return;               // both paused
    const s = await fetch(`http://127.0.0.1:${PORT}/api/board-state`).then((r) => r.json()).catch(() => null);
    if (!s || !s.lines) return;
    const active = await db(`build?select=id,order_number,pace_alert_color&state=in.(active,rework)`);
    const idOf = {}, prevOf = {};
    for (const b of active) { idOf[b.order_number] = b.id; prevOf[b.order_number] = b.pace_alert_color; }
    const recips = await floorMgrIds220();
    for (const l of s.lines) {
      const c = l.cab;
      if (!c || !c.order || !(c.order in idOf)) continue;
      const cur = c.color, prev = prevOf[c.order];
      if (cur === "red" && prev !== "red") {              // crossed INTO red -> one push
        const early = Number(c.pct) < 30;                 // red with <30% of the build done -> suspect the STANDARD
        if (early && earlyRedOn) {
          await notify("pace.standards", await adminIds225(), `${l.name}: check the standard on ${c.order}`,   // Block 225: a wrong hour TARGET is an admin fix
            `${c.order} hit red at only ${Number(c.pct) || 0}% done (day ${c.day || "?"}). That usually means the hour target is off, not the crew.`, "/board");
          logEvent("pace.standards", null, { build_id: idOf[c.order], order_number: c.order, line: l.name, pct: c.pct, day: c.day });
        } else if (paceWarnOn) {
          await notify("pace.warn", recips, `${l.name}: ${c.order} needs help`,
            `${c.status}${c.promised ? ` · promised ${c.promised}` : ""}.`, "/board");
          logEvent("pace.warn", null, { build_id: idOf[c.order], order_number: c.order, line: l.name, status: c.status });
        }
      }
      if (cur !== prev)                                    // remember it either way
        await db(`build?id=eq.${idOf[c.order]}`, { method: "PATCH", body: JSON.stringify({ pace_alert_color: cur }) });
    }
  } catch (e) { console.error("pace patrol failed (will retry):", e.message); }
}
setInterval(pacePatrol, 10 * 60 * 1000);   // Q116: steady patrol, same cadence as the day-end sweeper

// Q91: the DAY-START NUDGE — one quiet good-morning push per WORK day, at the
// per-weekday time, calendar-aware (never weekends/holidays). Edge-triggered
// via notification_log so a redeploy mid-morning can't double-fire, and it
// won't nag: if the server was down past the window it just skips the day.
// OFF unless the admin turns on the day_start_nudge toggle; delivery still
// obeys the Q106 sandbox (routes to the owner-rep until go-live).
async function dayStartNudge() {
  try {
    if (!DB_READY) return;
    const [tog] = await db(`feature_toggle?select=enabled&key=eq.day_start_nudge`);
    if (!tog || tog.enabled !== true) return;                     // OFF unless explicitly on
    const now = Date.now();
    const phx = new Date(now - PHX_OFFSET_MS);
    const today = phxDate(now);                                   // Phoenix YYYY-MM-DD
    if (!(await isWorkDay(today))) return;                        // weekend / holiday
    const [hh, mm] = (await nudgeTimeFor(phx.getUTCDay())).split(":").map(Number);
    const target = hh * 60 + mm, nowMin = phx.getUTCHours() * 60 + phx.getUTCMinutes();
    if (nowMin < target || nowMin > target + 120) return;         // before the time, or >2h late (was down) — skip
    // Already fired today? (Phoenix midnight -> real ms -> ISO for the filter.)
    const phxMidReal = new Date(today + "T00:00:00Z").getTime() + PHX_OFFSET_MS;
    const prior = await db(`notification_log?select=id&event_type=eq.nudge.daystart&created_at=gte.${new Date(phxMidReal).toISOString()}&limit=1`);
    if (prior.length) return;
    const recips = (await db(`employee?select=id,role,department&role=in.(production,manager)&active=is.true`)).filter((r) => r.role !== "manager" || !r.department || r.department === "Production").map((e) => e.id);
    if (!recips.length) return;
    await notify("nudge.daystart", recips, "Good morning — let's get started",
      "Clock in and pick up your line when you're ready.", "/home");
    logEvent("nudge.daystart", null, { date: today, at: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, recipients: recips.length });
  } catch (e) { console.error("day-start nudge failed (will retry):", e.message); }
}
setInterval(dayStartNudge, 5 * 60 * 1000);   // check every 5 min; fires once per work day

// Q91 (block 2): the two other TIME-BASED touches — morning pre-brief and
// inspect-before-close — share one small scheduler with the day-start nudge:
// toggle-gated, work-day only, fires once inside a 2-hour window, deduped via
// notification_log so a redeploy can't double-send. Each builder returns the
// message, or null to stay quiet (e.g. nothing waiting to inspect).
async function dailyTouch(eventType, toggleKey, timeHHMM, buildMsg) {
  try {
    if (!DB_READY) return;
    const [tog] = await db(`feature_toggle?select=enabled&key=eq.${toggleKey}`);
    if (!tog || tog.enabled !== true) return;             // OFF unless explicitly on
    const now = Date.now(), phx = new Date(now - PHX_OFFSET_MS), today = phxDate(now);
    if (!(await isWorkDay(today))) return;                 // weekend / holiday
    const [hh, mm] = timeHHMM.split(":").map(Number);
    const target = hh * 60 + mm, nowMin = phx.getUTCHours() * 60 + phx.getUTCMinutes();
    if (nowMin < target || nowMin > target + 120) return;  // before the time, or >2h late — skip
    const phxMidReal = new Date(today + "T00:00:00Z").getTime() + PHX_OFFSET_MS;
    const prior = await db(`notification_log?select=id&event_type=eq.${eventType}&created_at=gte.${new Date(phxMidReal).toISOString()}&limit=1`);
    if (prior.length) return;                              // already fired today
    const msg = await buildMsg();
    if (!msg || !msg.recips || !msg.recips.length) return; // builder vetoed (nothing to say)
    await notify(eventType, msg.recips, msg.title, msg.body, msg.link || "/home");
    logEvent(eventType, null, msg.log || {});
  } catch (e) { console.error(`${eventType} failed (will retry):`, e.message); }
}
// Block 225 (Daniel, 8/26): the Morning pre-brief is REMOVED — planned early,
// never enabled, never fired once; its content is the top of the manager
// console + the Meeting Pack. dailyTouch stays (the 3:45 inspect nudge uses it).
// Inspect-before-close (~3:45): clear any awaiting-inspection cab before the
// shop closes so none sleeps overnight. Silent if none is waiting.
async function inspectBeforeClose() {
  return dailyTouch("touch.inspect", "inspect_before_close_nudge", "15:45", async () => {
    const waiting = await db(`build?select=id&state=eq.awaiting_inspection`);
    if (!waiting.length) return null;                     // nothing waiting -> no nudge
    const recips = await floorMgrIds220("inspect");
    if (!recips.length) return null;
    return { recips, title: "Sign off before close",
      body: `${waiting.length} cab${waiting.length === 1 ? "" : "s"} still awaiting inspection — clear ${waiting.length === 1 ? "it" : "them"} before the shop closes.`, link: "/manager",
      log: { waiting: waiting.length } };
  });
}
setInterval(inspectBeforeClose, 5 * 60 * 1000);

// Q117: LIVE BOARD via server-sent events. Screens hold an EventSource; this
// tick watches ONE cheap signal — the newest event_log id — and bumps every
// connected screen the instant it moves (every board-affecting mutation
// writes an event_log row, so this catches them all). The client then
// re-fetches board-state and re-renders. When nobody's watching (no clients)
// it does zero work; pure time-drift in pace colours rides the 30s fallback.
const sseClients = new Set();
let lastEventId = null;
async function boardTick() {
  if (!DB_READY || sseClients.size === 0) return;
  try {
    const [ev] = await db(`event_log?select=id&order=id.desc&limit=1`);   // index read on the pk
    const sig = ev ? ev.id : 0;
    if (sig !== lastEventId) {
      lastEventId = sig;
      for (const res of sseClients) { try { res.write(`event: board\ndata: ${sig}\n\n`); } catch (e) {} }
    }
  } catch (e) { /* next tick retries */ }
}
setInterval(boardTick, 3000);

// ---------- the server ----------
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  // Q123: security response headers on EVERY response — set once here (before
  // routing) so they ride along whether a route ends via send(), json(), a
  // redirect, SSE, the CSV download, or the photo proxy (Node merges these
  // setHeader values with each route's writeHead). HSTS is safe — Railway
  // serves HTTPS only. X-Frame-Options SAMEORIGIN blocks click-jacking
  // (nothing embeds the app cross-origin; the TV board loads directly).
  // nosniff + Referrer-Policy are low-risk hardening. A Content-Security-Policy
  // is intentionally NOT here yet — the app leans on inline styles/scripts, so
  // CSP gets its own careful pass (Q123 cont.).
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Q123: Content-Security-Policy — now ENFORCING (v46). It ran REPORT-ONLY in
  // v45 and was confirmed clean (no violations on the board, the cockpit, an
  // order page, or an opened cab photo) before this flip. Inventory (block 45)
  // confirmed the app is fully first-party: all fetch()/EventSource are same-
  // origin, cab photos load via the /photo proxy (self), the worker is /sw.js
  // (self), and there are no external scripts, fonts, or data images.
  // 'unsafe-inline' stays for script/style because the UI leans on inline
  // scripts, inline styles, AND inline onclick handlers (which nonces cannot
  // cover); connect-src 'self' still stops an injected script exfiltrating
  // off-origin, and the rest locks down framing, base-uri, forms, and objects.
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'self'");
  const send = (code, type, data) => {
    // Block 97: shared-tablet sliding sign-out — each page load on a marked
    // device renews a 30-minute window; 30 quiet minutes = signed out. Skips
    // /logout so signing out sticks. Phones (unmarked) are untouched.
    // Block 214: shared tablets renew on page views AND on action POSTs (a
    // photo upload or step tap keeps you signed in mid-flow), window now 10
    // minutes — the 2-minute walk-away logout is the client watchdog in the
    // bell script; this is the backstop. Never clobber a cookie a route
    // already set (login/logout/tablet mint their own).
    if ((String(type).startsWith("text/html") || (req.method === "POST" && url.pathname.startsWith("/api/")))
        && url.pathname !== "/logout" && !res.getHeader("Set-Cookie") && /sb_shared=1/.test(req.headers.cookie || "")) {
      const sid97 = readSession(req.headers.cookie);
      if (sid97) res.setHeader("Set-Cookie", [
        `sb_session=${makeSession(sid97, 10 * 60 * 1000)}; Path=/; HttpOnly; SameSite=Lax`,
        "sb_shared_ui=1; Path=/; Max-Age=31536000; SameSite=Lax",   // the client watchdog's (non-secret) hint — self-heals tablets marked before Block 214
      ]);
    }
    // Block 212 (v201 SPEED): gzip text responses when the browser accepts it
    // (every browser does) — a 150 KB page becomes ~20 KB on shop Wi-Fi.
    // Only text types come through send(); binaries (photos/icons) use their
    // own writeHead paths and are untouched. Sync gzip on ≤150 KB ≈ 1 ms.
    const canGzip212 = /\bgzip\b/.test(String(req.headers["accept-encoding"] || ""));
    const body212 = typeof data === "string" ? Buffer.from(data) : data;
    if (canGzip212 && body212 && body212.length > 1024) {
      const gz212 = zlib.gzipSync(body212);
      res.writeHead(code, { "content-type": type, "content-encoding": "gzip", "vary": "Accept-Encoding" });
      return res.end(gz212);
    }
    res.writeHead(code, { "content-type": type }); res.end(data);
  };
  const json = (code, obj) => send(code, "application/json", JSON.stringify(obj));

  try {
    // Q74: the external watchdog pings this.
    if (url.pathname === "/health")
      return json(200, { ok: true, db: DB_READY, at: new Date().toISOString() });

    if (url.pathname === "/") return send(200, "text/html; charset=utf-8", shellPage);

    // Until Railway has the database variables, every DB page says so plainly.
    if (!DB_READY)
      return send(200, "text/html; charset=utf-8",
        `<h1 style="font-family:sans-serif">Database not connected yet</h1>
         <p style="font-family:sans-serif">SUPABASE_URL / SUPABASE_SERVICE_KEY are not set on Railway.</p>`);

    // SIGN-IN SCREEN — name grid built from ACTIVE employees only (Q70).
    // Q95 AMENDED 2026-07-25: EVERYONE is on the grid — owners, warehouse,
    // body, build, accounting. The subtitle shows their department; what
    // they can DO after sign-in is gated at /home, not hidden here.
    if (url.pathname === "/login") {
      const emps = await db("employee?select=id,first_name,last_name,role,department,pin_hash&active=is.true&order=first_name");
      // Chip wording (owner-rep 2026-07-30, Q94 refined): POSITION first,
      // granted role in parentheses — "Michael Hull / Production (Manager)".
      // Manager and admin are grants an admin can give or take in the People
      // panel any day; they are never the person's position.
      const view = emps.map((e) => ({ ...e, has_pin: Boolean(e.pin_hash),
        dept_label: (e.department || "Production") +
          (e.role === "manager" ? " (Manager)" : e.role === "admin" ? " (Admin)" : ""),
      }));
      return send(200, "text/html; charset=utf-8", loginPage(view));
    }

    // Q114: /api/pin/set (the Q68 open onboarding) is GONE — it let anyone
    // who found the site claim a never-signed-in name. Its replacement is the
    // temp-code flow: /api/login accepts the temp code, parks the person at
    // /change-pin, and this endpoint makes the PIN theirs.
    if (url.pathname === "/change-pin") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [emp] = await db(`employee?select=first_name,must_change_pin&id=eq.${empId}&active=is.true`);
      if (!emp) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      if (!emp.must_change_pin) { res.writeHead(302, { Location: "/home" }); return res.end(); }
      return send(200, "text/html; charset=utf-8", changePinPage(emp.first_name));
    }
    if (url.pathname === "/api/pin/change" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const { pin } = await body(req);
      if (!/^\d{4}$/.test(String(pin))) return json(400, { ok: false, error: "PIN must be 4 digits" });
      const [emp] = await db(`employee?select=id,temp_pin&id=eq.${empId}&active=is.true`);
      if (!emp) return json(404, { ok: false, error: "Unknown employee" });
      if (emp.temp_pin && String(pin) === String(emp.temp_pin))
        return json(400, { ok: false, error: "That's the temporary code — pick one that's yours" });
      await db(`employee?id=eq.${empId}`, { method: "PATCH", body: JSON.stringify({
        pin_hash: hashPin(pin), temp_pin: null, must_change_pin: false }) });
      logEvent("pin.changed", empId, {}); // Q114: temp code wiped with the change
      return json(200, { ok: true });
    }

    // LOGIN — verify PIN, with the C17 per-person lockout.
    if (url.pathname === "/api/login" && req.method === "POST") {
      const { id, pin } = await body(req);
      // Q123: stop a name-enumeration sweep from one source before the PIN check.
      if (loginIpBlocked(req)) return json(429, { ok: false, error: "Too many sign-in attempts from this network — wait a few minutes" });
      if (locked(id)) return json(429, { ok: false, error: "Too many tries — locked for 5 minutes" });
      // Block 174 (Fable-5 audit): guard the login id before it reaches PostgREST —
      // it's unauthenticated user input flowing into an id=eq. filter (same class the
      // v47/48/v171 sweeps closed). A non-UUID gets the generic "no PIN" answer (no
      // info leak) and is counted as a failed source, never touching the DB.
      if (!isUuid(id)) { noteLoginFail(req, id); return json(404, { ok: false, error: "No PIN on file — see the manager" }); }
      // Q70 hardening (2026-07-29 soak-test find): same active enforcement
      // as /api/pin/set above — a retired account can't sign in by id.
      const [emp] = await db(`employee?select=id,pin_hash,must_change_pin,role&id=eq.${id}&active=is.true`);
      if (!emp || !emp.pin_hash) { noteLoginFail(req, id); return json(404, { ok: false, error: "No PIN on file — see the manager" }); }
      if (!checkPin(pin, emp.pin_hash)) {
        const s = strike(id);
        noteLoginFail(req, id);
        logEvent("pin.fail", id, {});
        return json(401, { ok: false, error: s.lockedUntil > Date.now() ? "Locked for 5 minutes (5 wrong tries)" : "Wrong PIN — try again" });
      }
      // Block 173 (C1 — owner ruling: admin-only outside company Wi-Fi). Inert until
      // SHOP_EGRESS_IP is set. Non-admin EXCEPTION mechanism = pending owner ruling.
      if (!onShopNetwork(req) && emp.role !== "admin") {
        logEvent("login.offnetwork_blocked", id, {});
        return json(403, { ok: false, error: "Off the shop network — only admins can sign in from outside. Connect to the shop Wi-Fi to sign in." });
      }
      pinStrikes.delete(id);
      logEvent("employee.login", id, {});
      // Block 97 (owner-rep): a device marked "shared tablet" gets a SHORT
      // sliding session (30 min, renewed per page in send()); personal phones
      // keep the 12-hour day session.
      const shared97 = /sb_shared=1/.test(req.headers.cookie || "");
      res.setHeader("Set-Cookie", shared97
        ? [`sb_session=${makeSession(id, 10 * 60 * 1000)}; Path=/; HttpOnly; SameSite=Lax`,   // Block 214: 10-min backstop; the 2-min walk-away logout is client-side
           "sb_shared_ui=1; Path=/; Max-Age=31536000; SameSite=Lax"]
        : `sb_session=${makeSession(id)}; Path=/; HttpOnly; SameSite=Lax`);
      // Q114: a temp-code login works — but goes straight to /change-pin.
      return json(200, { ok: true, change_required: Boolean(emp.must_change_pin) });
    }

    // HOME — three shapes, gated by DEPARTMENT (Q94: role=can-do, dept=where):
    //  Production dept  -> clock in/out; while ON the clock -> the cab task screen.
    //  Everyone else    -> watcher home (owners watch the board; future
    //                      departments see "your board is coming" — Q95 amendment).
    if (url.pathname === "/home") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [emp] = await db(`employee?select=id,first_name,lines,department,role,must_change_pin&id=eq.${empId}`);   // Block 165: id rides along — the cab screen's "started by mistake? undo" compares emp.id to the step's starter (v164 shipped without it, so the link never rendered for the starter — Daniel caught it live)
      if (!emp) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      // Q114: a temporary code gets you exactly one place — the change-PIN screen.
      if (emp.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      if (emp.department === "Warehouse" || (emp.role === "admin" && String(url.searchParams.get("viewas") || "").toLowerCase() === "warehouse")) {
        // Q109: warehouse gets its own board — the handoff INTO production.
        // Block 212 (v201 SPEED): independent reads fired together.
        const [lastWRows, reasonsW, linesW, buildsW, histW97, mgrRows132, hrsW212] = await Promise.all([
          db(`clock_event?select=kind&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`),
          db(`pick_list_item?select=label&list_key=eq.clock_out_reason&retired=is.false&order=sort_order`),
          db(`line?select=id,name&enabled=is.true&order=id`),
          db(`build?select=id,order_number,part_number,cab_number,line_id,state,kit_status,kit_note,kit_pull_started_at,queue_pos,queue_pinned,created_at&state=in.(upcoming,active,awaiting_inspection,rework)&order=created_at`),
          // Block 97 (owner-rep): the delivered history — where warehouse's cabs
          // ARE in production. Read-only; ship-prep/receive-back is a later stage.
          db(`build?select=order_number,cab_number,line_id,state,kit_delivered_at,kit_delivered_by&kit_delivered_at=not.is.null&state=in.(active,awaiting_inspection,rework,production_complete,complete)&order=kit_delivered_at.desc&limit=15`),
          db(`employee?select=id&role=in.(manager,admin)`),
          shopHours(),
        ]);
        const [lastW] = lastWRows;
        const rowsW = linesW.map((l) => ({ line: l,
          active: buildsW.find((b) => b.line_id === l.id && (b.state === "active")) || null,
          awaiting: buildsW.filter((b) => b.line_id === l.id && b.state === "awaiting_inspection"),
          rework: buildsW.filter((b) => b.line_id === l.id && b.state === "rework"),
          queue: buildsW.filter((b) => b.line_id === l.id && b.state === "upcoming")
            .sort((a, b) => (a.queue_pos ?? 9999) - (b.queue_pos ?? 9999) || (a.created_at < b.created_at ? -1 : 1)) }));
        const lnName97 = Object.fromEntries(linesW.map((l) => [l.id, l.name]));
        // Block 132 (logic audit L8): a cockpit-started cab is stamped delivered by
        // the MANAGER, not warehouse — flag those rows so the list says so.
        const mgrIds132 = new Set(mgrRows132.map((e) => e.id));
        histW97.forEach((h) => { h.lineName = lnName97[h.line_id] || (h.line_id ? "Line " + h.line_id : ""); h.byMgmt = mgrIds132.has(h.kit_delivered_by); });
        // Block 106 (owner-rep live test): warehouse clocks in from THIS page,
        // but the Q112 after-hours questionnaire only existed on the floor's
        // home screen — an evening warehouse punch-in was flatly denied. Same
        // three questions, same claim-then-confirm, now on this surface too.
        const clockedInW106 = Boolean(lastW && lastW.kind === "clock_in");
        const ahNowW = isAfterHoursDept(Date.now(), hrsW212, "Warehouse");   // Block 195: warehouse runs from 6
        const [ahReasW, openAhWRows, lastAhWRows214] = await Promise.all([
          // Block 215: the approver roster fetch is gone with the question.
          (ahNowW && !clockedInW106) ? db(`pick_list_item?select=label&list_key=eq.after_hours_reason&retired=is.false&order=sort_order`) : [],
          clockedInW106 ? db(`after_hours_session?select=id&employee_id=eq.${empId}&ended_at=is.null&limit=1`) : [],
          (ahNowW && !clockedInW106) ? db(`after_hours_session?select=reason&employee_id=eq.${empId}&order=started_at.desc&limit=1`) : [],   // Block 214/215: prefill last reason
        ]);
        const [openAhW] = openAhWRows;
        return send(200, "text/html; charset=utf-8",
          warehousePage(emp, clockedInW106, reasonsW, linesW, rowsW, histW97,
            { now: ahNowW, reasons: ahReasW.map((r) => r.label), open: Boolean(openAhW),
              lastReason: (lastAhWRows214[0] && ahReasW.some((r) => r.label === lastAhWRows214[0].reason)) ? lastAhWRows214[0].reason : "" }));
      }
      if (emp.department !== "Production") {
        // Block 92 (owner-rep): Body Shop + Build punch here — dept-time lines
        // 13/12 (disabled: clockable, never on the TV — warehouse-9 pattern).
        // Block 190 (owner ruling, day 2): ACCOUNTING punches too — line 16
        // (migration 0050), same pattern. Marketing/admins stay off the clock.
        const DEPT_LINE92 = { "Body Shop": 13, "Build": 12, "Accounting": 16 };
        let clk92 = null;
        if (DEPT_LINE92[emp.department]) {
          // Block 212 (v201 SPEED): reads fired together per dependency wave.
          const [lastC92Rows, rs92, hrs92] = await Promise.all([
            db(`clock_event?select=kind&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`),
            db(`pick_list_item?select=label&list_key=eq.clock_out_reason&retired=is.false&order=sort_order`),
            shopHours(),
          ]);
          const [lastC92] = lastC92Rows;
          // Block 106: Body + Build punch HERE — same Q112 after-hours
          // questionnaire and wrap-note the floor and warehouse get.
          const in92 = Boolean(lastC92 && lastC92.kind === "clock_in");
          const ahNow92 = isAfterHoursDept(Date.now(), hrs92, emp.department);   // Block 195: dept-aware open
          const [ahRe92, openAh92Rows, lastAh92Rows214] = await Promise.all([
            // Block 215: the approver roster fetch is gone with the question.
            (ahNow92 && !in92) ? db(`pick_list_item?select=label&list_key=eq.after_hours_reason&retired=is.false&order=sort_order`) : [],
            in92 ? db(`after_hours_session?select=id&employee_id=eq.${empId}&ended_at=is.null&limit=1`) : [],
            (ahNow92 && !in92) ? db(`after_hours_session?select=reason&employee_id=eq.${empId}&order=started_at.desc&limit=1`) : [],   // Block 214/215: prefill last reason
          ]);
          const [openAh92] = openAh92Rows;
          clk92 = { show: true, clockedIn: in92, reasons: rs92.map((r) => r.label), lineId: DEPT_LINE92[emp.department],
            ah: { now: ahNow92, reasons: ahRe92.map((r) => r.label), open: Boolean(openAh92),
              lastReason: (lastAh92Rows214[0] && ahRe92.some((r) => r.label === lastAh92Rows214[0].reason)) ? lastAh92Rows214[0].reason : "" } };
        }
        return send(200, "text/html; charset=utf-8", watcherPage(emp, clk92));
      }
      // Block 212 (v201 SPEED): the floor home's three base reads together.
      const [lastRows212, allLines, reasons] = await Promise.all([
        db(`clock_event?select=kind,line_id&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`),
        db(`line?select=id,name&enabled=is.true&order=id`),
        db(`pick_list_item?select=label&list_key=eq.clock_out_reason&retired=is.false&order=sort_order`),
      ]);
      const [last] = lastRows212;
      const clockedIn = last && last.kind === "clock_in";
      // Q111: Shop time (line 10) is disabled so it never appears in
      // allLines — name it by hand for the on-the-clock header.
      const lineName = clockedIn ? (last.line_id === SHOP_LINE_ID ? "Shop time"
        : last.line_id === FIX_LINE_ID ? "Fix work"
        : last.line_id === 14 ? "no line yet — tap one below"
        : (allLines.find((l) => l.id === last.line_id) || {}).name || "") : "";
      // Block 126 (M3): every OPEN fix, offered to whoever's on shift — the fix
      // lane any tech can grab from, on both the cab screen and the clock screen.
      const openFixes126 = clockedIn
        ? (await db(`build?select=id,order_number,cab_number,fix_kind,fix_reason,fix_hours&state=eq.fix_job&order=fix_assigned_at`))
            .map((f) => ({ build_id: f.id, order: f.order_number, cab: f.cab_number, kind: f.fix_kind, reason: f.fix_reason, hours: f.fix_hours }))
        : [];
      // ?clockout=1 = the task screen's Clock-out button — show the reason picker.
      if (clockedIn && url.searchParams.get("clockout") !== "1") {
        // ON THE CLOCK: front-center cab = the active build on YOUR line (Q90).
        // A cab in REWORK still owns its line and its screen (files 11/18).
        // Q85: fix_job joins active/rework as a workable cab, but active/rework
        // WIN the screen — a fix job only appears when its line has no live
        // build (it "runs alongside", never displacing current work).
        // Block 126 (M3): a tech working a FIX sees THAT cab's checklist no matter
        // their line. focus_build_id (set by "Work this fix") wins the screen; a
        // stale focus (the fix already finished / signed off) is cleared and we
        // fall back to the normal line pick.
        let build = null, onFix126 = false;
        const [meF126] = await db(`employee?select=focus_build_id&id=eq.${empId}`);
        if (meF126 && meF126.focus_build_id) {
          const [fB126] = await db(`build?select=id,order_number,part_number,cab_number,destination,invoice_note,note_flagged,state,rework_reason,rework_note,rework_hours,fix_kind,fix_reason,fix_note,fix_hours&id=eq.${meF126.focus_build_id}`);
          if (fB126 && fB126.state === "fix_job") { build = fB126; onFix126 = true; }
          else await db(`employee?id=eq.${empId}`, { method: "PATCH", body: JSON.stringify({ focus_build_id: null }) });
        }
        if (!build) {
          const cands = await db(`build?select=id,order_number,part_number,cab_number,destination,invoice_note,note_flagged,state,rework_reason,rework_note,rework_hours,fix_kind,fix_reason,fix_note,fix_hours&line_id=eq.${last.line_id}&state=in.(active,rework,fix_job)&order=started_at`);
          build = cands.find((x) => x.state === "active" || x.state === "rework") || cands.find((x) => x.state === "fix_job") || null;
        }
        if (build) {
          // Q107: started_by/completed_by ride along so the screen can show
          // WHO is on a step — two techs sharing a cab see each other's work.
          // Block 212 (v201 SPEED): the cab screen is the floor's whole day —
          // its nine build-dependent reads now land in ONE round trip.
          const mid209 = phxDayStart(phxDate(Date.now()));
          const [tasks, notes, tphotos, folks, prodMinRows212, cShots, progTogRows212, ph209, nt209q212, tn209q218] = await Promise.all([
            db(`task?select=id,display_no,name,day_no,day_end,man_hours,is_background,state,started_by,started_at,completed_by,completed_at&build_id=eq.${build.id}&order=day_no,sort_order`),
            // Per-task documentation (file 11) rides along with the task list.
            db(`task_note?select=task_id,note&build_id=eq.${build.id}&order=created_at`),
            db(`build_photo?select=id,task_id&build_id=eq.${build.id}&kind=eq.task&order=created_at`),
            // First names for the attribution lines (includes retired accounts
            // so history never shows a blank).
            db(`employee?select=id,first_name`),
            // Q86: this product's completion-photo minimum drives the Finish gate.
            db(`product?select=photo_min&part_number=eq.${encodeURIComponent(build.part_number)}`),
            db(`build_photo?select=id&build_id=eq.${build.id}&kind=eq.finish`),
            db(`feature_toggle?select=enabled&key=eq.eod_progress_photo_required`),
            db(`build_photo?select=id&build_id=eq.${build.id}&kind=in.(progress,finish,task)&hidden=is.false&created_at=gte.${new Date(mid209).toISOString()}&limit=1`),   // Block 218 (Daniel): STEP photos count as today's update too
            db(`build_note?select=id&build_id=eq.${build.id}&hidden=is.false&created_at=gte.${new Date(mid209).toISOString()}&limit=1`),
            db(`task_note?select=id&build_id=eq.${build.id}&hidden=is.false&created_at=gte.${new Date(mid209).toISOString()}&limit=1`),   // Block 218: step notes count too
          ]);
          const people = {}; for (const p of folks) people[p.id] = p.first_name;
          // Q111: Shop time joins the switch picker — a tech can step off
          // the cab to a meeting or in-house work with one honest tap.
          const otherLines = allLines.filter((l) => l.id !== last.line_id)
            .concat([{ id: SHOP_LINE_ID, name: "Shop time" }, { id: 14, name: "⏸ Off the line — stay on the clock" }]);
          const [prodMin] = prodMinRows212;
          const photoMin = prodMin ? prodMin.photo_min : 1;
          // Block 209 (owner, Sat 8/22): the end-of-day progress ask — does
          // TODAY's cab already carry a progress photo/note, and is the
          // mandatory switch on? (One photo per CAB per day satisfies the
          // gate for the whole crew — the customer needs one update, not
          // one per tech.)
          const [progTog209] = progTogRows212;
          const prog209 = { ask: true, mandatory: Boolean(progTog209 && progTog209.enabled), have: Boolean(ph209.length || nt209q212.length || tn209q218.length) };   // Block 218: any photo or note today — progress, step or finish — satisfies the ask
          return send(200, "text/html; charset=utf-8", cabPage(emp, build, tasks, lineName, notes, tphotos, otherLines, people, photoMin, cShots.length, { open: openFixes126.filter((f) => f.build_id !== build.id), onFix: onFix126 }, prog209));
        }
        // No active cab on this line -> fall through to the clock screen.
      }
      const usual = allLines.filter((l) => (emp.lines || []).includes(l.id));
      const other = allLines.filter((l) => !(emp.lines || []).includes(l.id));
      // Q112: outside shop hours the clock-in screen collects governance,
      // and an open after-hours session makes the wrap-up note required.
      const ahNow = isAfterHours(Date.now());
      // Block 212 (v201 SPEED): the clock screen's six reads in one round trip
      // (the time-off reason list is tiny — fetched alongside, applied only
      // when the toggle is on, same result as before).
      const [ahReasonRows, openAhRows212, toTogRows212, toReasonRows213, toMineRows, lastAhRows214] = await Promise.all([
        // Block 215: the approver roster fetch is gone with the question.
        (ahNow && !clockedIn) ? db(`pick_list_item?select=label&list_key=eq.after_hours_reason&retired=is.false&order=sort_order`) : [],
        clockedIn ? db(`after_hours_session?select=id&employee_id=eq.${empId}&ended_at=is.null&limit=1`) : [],
        db(`feature_toggle?select=enabled&key=eq.time_off_requests`),
        db(`pick_list_item?select=label&list_key=eq.time_off_reason&retired=is.false&order=sort_order`),
        db(`time_off_request?select=start_date,end_date,reason,status,decision_note&employee_id=eq.${empId}&or=(status.eq.pending,end_date.gte.${phxDate(Date.now())})&order=start_date.desc&limit=8`),
        (ahNow && !clockedIn) ? db(`after_hours_session?select=reason&employee_id=eq.${empId}&order=started_at.desc&limit=1`) : [],   // Block 214/215: prefill last reason
      ]);
      const [openAh] = openAhRows212;
      // Q92: the request control shows when the admin toggle is on; the person
      // always sees their own pending + upcoming-approved requests here.
      const [toTog] = toTogRows212;
      const toOn = !toTog || toTog.enabled !== false;
      const toReasons = toOn ? toReasonRows213.map((r) => r.label) : [];
      const toMine = toMineRows.map((t) => ({
        dates: t.start_date === t.end_date ? t.start_date : `${t.start_date} → ${t.end_date}`,
        reason: t.reason, status: t.status, note: t.decision_note }));
      // Block 98c: clocked ONTO a real line that has no workable cab — tell the
      // tech where the line stands instead of a bare clock-out screen.
      let lineStat98 = null;
      if (clockedIn && last && last.line_id !== SHOP_LINE_ID && last.line_id !== FIX_LINE_ID && last.line_id !== 14) {
        const lnB98 = await db(`build?select=order_number,state,queue_pos,created_at&line_id=eq.${last.line_id}&state=in.(active,rework,awaiting_inspection,upcoming)&order=created_at&limit=30`);
        // Block 124 (logic audit M5): only the "no cab to work" card when the
        // line has NO cab being worked. If an active/rework cab is on it, the
        // tech just opened the clock-out view by choice — no false card.
        const hasWork98 = lnB98.some((b) => b.state === "active" || b.state === "rework");
        if (!hasWork98) {
          const up98 = lnB98.filter((b) => b.state === "upcoming").sort((a, b) => ((a.queue_pos ?? 9999) - (b.queue_pos ?? 9999)) || (a.created_at < b.created_at ? -1 : 1));
          lineStat98 = { name: lineName,
            awaiting: (lnB98.find((b) => b.state === "awaiting_inspection") || {}).order_number || null,
            ondeck: (up98[0] || {}).order_number || null };
        }
      }
      return send(200, "text/html; charset=utf-8",
        homePage(emp, { clockedIn, lineName, lineId: last ? last.line_id : 0 }, usual, other, reasons,
          { now: ahNow, reasons: ahReasonRows.map((r) => r.label), open: Boolean(openAh),
            lastReason: (lastAhRows214[0] && ahReasonRows.some((r) => r.label === lastAhRows214[0].reason)) ? lastAhRows214[0].reason : "" },
          { on: toOn, reasons: toReasons, mine: toMine }, lineStat98, { open: openFixes126 }));
    }

    // TASK STATE CHANGE — the two-step check-off engine (Q45/Q90/Q104).
    // Rules enforced here: you must be signed in AND clocked on (Q104);
    // only legal transitions; who-did-what recorded; everything event-logged.
    if (url.pathname === "/api/task/state" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const { task_id, to, claimed_at, confirm159 } = await body(req);
      if (!isUuid(task_id)) return json(400, { ok: false, error: "That step reference isn't valid" });
      // Block 212 (v201 SPEED): the floor's most-tapped endpoint — the two
      // independent lookups now share one round trip.
      const [tRows212, lastCkRows212] = await Promise.all([
        db(`task?select=id,state,build_id,display_no,is_background&id=eq.${task_id}`),
        db(`clock_event?select=kind&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`),
      ]);
      const [t] = tRows212;
      if (!t) return json(404, { ok: false, error: "Task not found" });
      const [lastCk] = lastCkRows212;
      if (!lastCk || lastCk.kind !== "clock_in") {
        // Q107: the ONE exception to "on the clock" — a manager/admin backing
        // a wrongly-completed step out from the cockpit. It's a correction,
        // not floor work; still audited below like every state change.
        const [me] = await db(`employee?select=role&id=eq.${empId}`);
        const managerUndo = me && (me.role === "manager" || me.role === "admin")
          && ((t.state === "complete" && to === "in_progress") || (t.state === "in_progress" && to === "not_started"));   // Block 164: un-start is a correction too
        if (!managerUndo)
          return json(403, { ok: false, error: "Clock in first — task changes need you on the clock" });
      }
      const legal = { not_started: ["in_progress"], in_progress: ["complete", "not_started"], complete: ["in_progress"] };   // Block 164: in_progress -> not_started is the UN-START (accidental tap)
      if (!(legal[t.state] || []).includes(to))
        return json(400, { ok: false, error: `Can't go ${t.state} → ${to}` });
      // Block 159 → 167 (owner-rep ruling): SOFT cap on concurrent open
      // steps, counted PER LINE — Daniel's correction after hitting the
      // global count from Line 2 ("the limit of 2 tasks should be PER LINE,
      // not total for any one staff member"). A fresh start (not an undo)
      // with 2+ of YOUR non-background steps already open on THE SAME LINE
      // gets a "finish one first?" nudge; a confirmed second tap proceeds
      // and is LOGGED (task.cap_override). Open steps on OTHER lines never
      // count here — the leave-line warning (block 163) covers those.
      // Starting tasks can NOT inflate pace (labor-based), so this guards
      // data quality. Background steps neither count nor get nudged.
      if (to === "in_progress" && t.state === "not_started" && !t.is_background) {
        const open159 = await db(`task?select=build_id,is_background&state=eq.in_progress&started_by=eq.${empId}`);
        const real159 = (open159 || []).filter((x) => !x.is_background);
        let n159 = 0;
        if (real159.length) {
          const [tb159] = await db(`build?select=line_id&id=eq.${t.build_id}`);
          const bIds159 = [...new Set(real159.map((x) => x.build_id))];
          const b159 = await db(`build?select=id,line_id&id=in.(${bIds159.join(",")})`);
          const sameLine159 = new Set((b159 || []).filter((b) => tb159 && b.line_id != null && Number(b.line_id) === Number(tb159.line_id)).map((b) => b.id));
          n159 = real159.filter((x) => sameLine159.has(x.build_id)).length;
        }
        if (n159 >= 2) {
          if (confirm159 !== true)
            return json(200, { ok: false, nudge159: true, open: n159, error: `You've got ${n159} steps going on this line — finish one first?` });
          logEvent("task.cap_override", empId, { task_id, build_id: t.build_id, display_no: t.display_no, open_before: n159 });
        }
      }
      // Block 164 (owner-rep): UN-START — the missing undo for an accidental
      // "tap to start". Only the person who started the step may take it back
      // (managers/admins: anyone's). The start is wiped clean — started_by/at
      // null — so the open-step count and per-step timing read as if the
      // mis-tap never happened. Audited below as task.unstart.
      if (to === "not_started" && t.started_by && t.started_by !== empId) {
        const [meU164] = await db(`employee?select=role&id=eq.${empId}`);
        if (!meU164 || (meU164.role !== "manager" && meU164.role !== "admin"))
          return json(403, { ok: false, error: "Only the person who started this step (or a manager) can undo the start" });
      }
      const patch = { state: to };
      if (to === "in_progress" && t.state === "not_started") { patch.started_by = empId; patch.started_at = claimed_at || new Date().toISOString(); }
      if (to === "complete") { patch.completed_by = empId; patch.completed_at = claimed_at || new Date().toISOString(); }
      if (to === "in_progress" && t.state === "complete") { patch.completed_by = null; patch.completed_at = null; }
      if (to === "not_started") { patch.started_by = null; patch.started_at = null; }
      await db(`task?id=eq.${task_id}`, { method: "PATCH", body: JSON.stringify(patch) });
      logEvent(to === "not_started" ? "task.unstart" : t.state === "complete" ? "task.undo" : to === "complete" ? "task.complete" : "task.start",
        empId, { task_id, build_id: t.build_id, display_no: t.display_no, from: t.state, to });
      if (to === "complete") void kitVerifyNudge222(t.build_id);   // Block 222: 75% checkpoint — nudge warehouse if the on-deck kit is unverified
      return json(200, { ok: true });
    }

    // CLOCK IN (Q90 one-tap; Q52 Wi-Fi gate below). Payroll-grade rows (C3.8).
    if (url.pathname === "/api/clock/in" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const gate = wifiGate(req); if (gate) return json(403, { ok: false, error: gate });
      const { line_id, claimed_at, approved_by, ah_reason, ah_plan } = await body(req);
      if (!line_id) return json(400, { ok: false, error: "Pick a line" });
      if (!Number.isInteger(Number(line_id))) return json(400, { ok: false, error: "Pick a line" });
      if (approved_by != null && !isUuid(approved_by)) return json(400, { ok: false, error: "That approver isn't valid" });
      // Double clock-in guard (risk sweep 2026-07-28): a second clock-in used
      // to silently orphan the first interval — real coverage lost. Refuse it
      // plainly instead; the reload shows the clock-out screen.
      const [already] = await db(`clock_event?select=kind,line_id&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (already && already.kind === "clock_in") {
        const [l] = await db(`line?select=name&id=eq.${already.line_id}`);
        return json(400, { ok: false, error: `You're already on the clock${l ? " — " + l.name : ""}. Clock out first, then switch.` });
      }
      // Q112: an after-hours clock-in must carry its governance — who
      // approved it, the reason, and the one-line plan. The screen collects
      // it and the SERVER enforces it, so the record can never be skipped.
      // The named approver + the admins get the claim-then-confirm push
      // (Q106-sandboxed until cutover); unconfirmed sessions stay flagged
      // on the cockpit and the timecards until someone owns the claim.
      // Q113: a manually-closed line takes no clock-ins. Q83: also read the
      // "down for today" hold so clocking in can RESUME the line.
      const [lnGate] = await db(`line?select=manually_closed,down_today&id=eq.${line_id}`);
      if (lnGate && lnGate.manually_closed)
        return json(400, { ok: false, error: "That line is closed right now — see the manager" });
      // Q83/Q84 + Block 133/134 (L9): clocking into a line held "down for today"
      // RESUMES it — but the resume (close the timed hold, clear the flag, start
      // any delivered-but-held cab) now runs AFTER the clock_event insert below,
      // so an after-hours reject can't tear down the hold + start a cab while
      // recording no clock-in. lnGate.down_today was read above; used again there.
      const inAtMs = new Date(claimed_at || Date.now()).getTime();
      const hrsIn = await shopHours();
      const [meDep195] = await db(`employee?select=department&id=eq.${empId}`);   // Block 195: warehouse clocks in from 6
      if (isAfterHoursDept(inAtMs, hrsIn, meDep195 && meDep195.department)) {
        // Block 214 (Daniel): typed PLAN optional. Block 215 (Daniel, Monday):
        // the "who approved it" question is GONE too — "Ross would and is
        // basically the only authority... admin can just approve or deny on
        // our side." Only the REASON is required now; the admin Approve/Deny
        // at sign-off IS the approval. approved_by stays in the table
        // (nullable, pre-215 history intact); if a client ever still sends
        // one it's validated and recorded, never required.
        if (!ah_reason)
          return json(400, { ok: false, error: "After hours needs one thing: what's it for" });
        const plan214 = String(ah_plan || "").trim();
        let appr215 = null;
        if (approved_by && isUuid(String(approved_by))) {
          const [apprRow] = await db(`employee?select=id,first_name,role&id=eq.${approved_by}&active=is.true`);
          if (apprRow && (apprRow.role === "manager" || apprRow.role === "admin")) appr215 = apprRow;
        }
        const [me2] = await db(`employee?select=first_name,last_name&id=eq.${empId}`);
        const [lnA] = await db(`line?select=name&id=eq.${line_id}`);
        await db("after_hours_session", { method: "POST", body: JSON.stringify({
          employee_id: empId, line_id, approved_by: appr215 ? appr215.id : null, reason: String(ah_reason),
          plan: plan214, started_at: new Date(inAtMs).toISOString() }) });
        logEvent("afterhours.start", empId, { line_id, approved_by: appr215 ? appr215.id : null, reason: ah_reason, plan: plan214 });
        const adminsA = await db(`employee?select=id&active=is.true&role=eq.admin`);
        notify("afterhours.claimed", [...new Set([...(appr215 ? [appr215.id] : []), ...adminsA.map((a) => a.id)])],
          `After hours: ${me2 ? me2.first_name + " " + ((me2.last_name || "")[0] || "") + "." : "someone"} clocked in`,
          `${lnA ? lnA.name : "Line " + line_id} — ${ah_reason}.${plan214 ? ` Plan: ${plan214}.` : ""} Approve or deny from the Admin console once they wrap up.`, "/admin");
      }
      await db("clock_event", { method: "POST", body: JSON.stringify({
        employee_id: empId, line_id, kind: "clock_in", claimed_at: claimed_at || new Date().toISOString() }) });
      logEvent("clock.in", empId, { line_id });
      // Block 134 (L9 audit fix): the clock-in is now recorded — safe to resume a
      // held line. Close the timed hold, clear the flag, and start any cab whose
      // kit warehouse dropped while the line was down. Runs post-insert, so a
      // rejected clock-in above never resumes the line or starts a cab.
      if (lnGate && lnGate.down_today) await resumeDownLine135(line_id, empId);
      return json(200, { ok: true });
    }

    // CLOCK OUT — reason label maps to the event kind (Q77 list drives the UI).
    if (url.pathname === "/api/clock/out" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const gate = wifiGate(req); if (gate) return json(403, { ok: false, error: gate });
      const { reason, claimed_at, wrap_note, note, confirm163 } = await body(req);
      // Timecard-audit fix: an out while NOT clocked in wrote a misleading
      // flagged row (pay math skips orphan outs, people reading don't).
      // Same guard the switch endpoint has.
      const [lastOut107] = await db(`clock_event?select=kind,line_id&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (!lastOut107 || lastOut107.kind !== "clock_in")
        return json(400, { ok: false, error: "You're not on the clock" });
      // Block 163 (owner-rep ruling): clocking OUT with steps you started
      // still open on your line — same soft heads-up as the line switch.
      // Block 198 (owner, day 4): LUNCH is exempt from the open-steps nudge —
      // a lunch punch PAUSES the day, the person returns to the same steps,
      // so "you still have steps open — clock out anyway?" only scared people
      // (Daniel: staff "get a pop up message that they are UNSURE of what to
      // do with"). End-of-day and every other reason keep the heads-up.
      if (confirm163 !== true && reason !== "Lunch" && lastOut107.line_id != null) {
        const open163o = await db(`task?select=build_id,is_background&state=eq.in_progress&started_by=eq.${empId}`);
        const real163o = (open163o || []).filter((t) => !t.is_background);
        if (real163o.length) {
          const bIds163o = [...new Set(real163o.map((t) => t.build_id))];
          const b163o = await db(`build?select=id,line_id,state&id=in.(${bIds163o.join(",")})`);
          const onLine163o = new Set((b163o || []).filter((b) => Number(b.line_id) === Number(lastOut107.line_id) && ["active", "rework", "fix_job"].includes(b.state)).map((b) => b.id));
          const n163o = real163o.filter((t) => onLine163o.has(t.build_id)).length;
          if (n163o > 0)
            return json(200, { ok: false, nudge163: true, open: n163o, error: `You started ${n163o} step${n163o > 1 ? "s" : ""} on this line that ${n163o > 1 ? "are" : "is"} still open — a teammate can tap ${n163o > 1 ? "them" : "it"} done, or go finish first. Clock out anyway?` });
        }
      }
      // Block 209 (owner, Sat 8/22): the MANDATORY progress-photo gate —
      // dormant until the admin flips "End-of-day cab photo — REQUIRED
      // (production)" in Features. When ON: a production tech clocking out
      // End-of-day from a cab line must have TODAY's progress photo or note
      // on that cab (by ANYONE on the crew — the customer needs one update
      // per cab per day, not one per tech). Managers/admins exempt; lunch
      // and other reasons never gated; a line with no active cab never gated.
      if ((reason === "End of day" || reason === "End of shift") && [1, 2, 3, 4].includes(Number(lastOut107.line_id))) {
        const [tog209] = await db(`feature_toggle?select=enabled&key=eq.eod_progress_photo_required`);
        if (tog209 && tog209.enabled === true) {
          const [me209] = await db(`employee?select=department,role&id=eq.${empId}`);
          if (me209 && me209.department === "Production" && me209.role === "production") {
            const [bG209] = await db(`build?select=id&line_id=eq.${lastOut107.line_id}&state=in.(active,rework,fix_job)&limit=1`);
            if (bG209) {
              const d0209 = phxDayStart(phxDate(Date.now()));
              // Block 218 (Daniel): STEP photos and STEP notes satisfy the gate
              // too — a tech who documented a step during the day already gave
              // the customer their update.
              const phG = await db(`build_photo?select=id&build_id=eq.${bG209.id}&kind=in.(progress,finish,task)&hidden=is.false&created_at=gte.${new Date(d0209).toISOString()}&limit=1`);
              if (!phG.length) {
                const ntG = await db(`build_note?select=id&build_id=eq.${bG209.id}&hidden=is.false&created_at=gte.${new Date(d0209).toISOString()}&limit=1`);
                const tnG = ntG.length ? [{}] : await db(`task_note?select=id&build_id=eq.${bG209.id}&hidden=is.false&created_at=gte.${new Date(d0209).toISOString()}&limit=1`);
                if (!ntG.length && !tnG.length)
                  return json(400, { ok: false, need_progress209: true, error: "The owner of this cab gets a progress update today — snap a photo (or add a note) on your line screen, then clock out." });
              }
            }
          }
        }
      }
      // Q112 + block 107: an open after-hours session can't close without its
      // wrap-up. Closing it starts the SIGN-OFF loop — the approver + admins
      // get the wrap note (and photo count), and the session's hours stay
      // HELD off the timecard until a manager/admin signs off in the cockpit.
      const [openAhOut] = await db(`after_hours_session?select=id,started_at,approved_by&employee_id=eq.${empId}&ended_at=is.null&order=started_at.desc&limit=1`);
      if (openAhOut) {
        if (!String(wrap_note || "").trim())
          return json(400, { ok: false, error: "After-hours wrap-up: one line on what got done, then clock out" });
        const endIso107 = claimed_at || new Date().toISOString();
        await db(`after_hours_session?id=eq.${openAhOut.id}`, { method: "PATCH", body: JSON.stringify({
          ended_at: endIso107, wrap_note: String(wrap_note).trim() }) });
        logEvent("afterhours.end", empId, { session_id: openAhOut.id, wrap_note: String(wrap_note).trim() });
        try {
          const hrs107 = Math.round(Math.max(0, new Date(endIso107).getTime() - new Date(openAhOut.started_at).getTime()) / 360000) / 10;
          const [meOut107] = await db(`employee?select=first_name&id=eq.${empId}`);
          const admins107 = await db(`employee?select=id&active=is.true&role=eq.admin`);
          const nPhotos107 = (await db(`after_hours_photo?select=id&session_id=eq.${openAhOut.id}`)).length;
          notify("afterhours.wrapped", [...new Set([openAhOut.approved_by, ...admins107.map((a) => a.id)])],
            `After hours wrapped up — ${meOut107 ? meOut107.first_name : "?"}, ${hrs107}h`,
            `"${String(wrap_note).trim()}"${nPhotos107 ? ` + ${nPhotos107} photo${nPhotos107 > 1 ? "s" : ""}` : ""} — an ADMIN signs off in the Admin console so the hours count on the timecard.`, "/manager");
        } catch (e) { console.error("ah wrap notify failed:", e.message); }
      }
      // Block 97 (owner-rep): "End of day" and "End of shift" are the SAME
      // normal end-of-day punch (the old split mis-filed "End of day" as an
      // early-out and flagged it on timecards). An "Other" clock-out may carry
      // a short typed note; it rides inside the reason so timecards read plainly.
      const note97 = String(note || "").trim().slice(0, 120);
      const reason97 = note97 ? `${reason} — ${note97}` : reason;
      const kind = reason === "Lunch" ? "clock_out_lunch"
        : (reason === "End of shift" || reason === "End of day") ? "clock_out_shift" : "clock_out_early";
      await db("clock_event", { method: "POST", body: JSON.stringify({
        employee_id: empId, kind, reason: reason97 || null, claimed_at: claimed_at || new Date().toISOString() }) });
      logEvent("clock.out", empId, { reason: reason97, kind });
      void longDayCheck206(empId, claimed_at || new Date().toISOString());   // Block 206: fire-and-forget — never slows the tap; guarded inside
      void week40Check221(empId, claimed_at || new Date().toISOString());   // Block 221: crossed-40h check rides the same clock-out, same fire-and-forget
      return json(200, { ok: true });
    }

    // SWITCH LINE (Q107): one tap = clock out of the current line + clock in
    // on the line you're walking over to help, as a single audited move.
    // Why it exists: cab color runs off clocked labor vs earned value
    // (C15/Q103), so helping ANOTHER line while clocked into your own quietly
    // feeds your hours to the wrong cab's pace math. Making the honest path
    // one tap is the fix — the friction was the problem.
    if (url.pathname === "/api/clock/switch" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const gate = wifiGate(req); if (gate) return json(403, { ok: false, error: gate });
      const { line_id, claimed_at, confirm163 } = await body(req);
      if (!line_id) return json(400, { ok: false, error: "Pick a line" });
      if (!Number.isInteger(Number(line_id))) return json(400, { ok: false, error: "Pick a line" });
      // Q113: no switching ONTO a manually-closed line either.
      const [lnGateS] = await db(`line?select=manually_closed&id=eq.${line_id}`);
      if (lnGateS && lnGateS.manually_closed)
        return json(400, { ok: false, error: "That line is closed right now — see the manager" });
      const [last] = await db(`clock_event?select=kind,line_id,reason,claimed_at&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      // Block 163 (owner-rep ruling): leaving a line with steps YOU started
      // still open gets a heads-up FIRST — soft, warn-but-allow. On your own
      // line open steps legitimately carry to tomorrow; on a line you jumped
      // on to help, a forgotten open step is exactly how the TEST-23702 ghost
      // was born — and sometimes another teammate is MEANT to do the final
      // tap, which is fine: OK leaves anyway. Background steps don't count.
      if (confirm163 !== true && last && last.kind === "clock_in" && last.line_id != null) {
        const open163 = await db(`task?select=build_id,is_background&state=eq.in_progress&started_by=eq.${empId}`);
        const real163 = (open163 || []).filter((t) => !t.is_background);
        if (real163.length) {
          const bIds163 = [...new Set(real163.map((t) => t.build_id))];
          const b163 = await db(`build?select=id,line_id,state&id=in.(${bIds163.join(",")})`);
          const onLine163 = new Set((b163 || []).filter((b) => Number(b.line_id) === Number(last.line_id) && ["active", "rework", "fix_job"].includes(b.state)).map((b) => b.id));
          const n163 = real163.filter((t) => onLine163.has(t.build_id)).length;
          if (n163 > 0)
            return json(200, { ok: false, nudge163: true, open: n163, error: `You started ${n163} step${n163 > 1 ? "s" : ""} on this line that ${n163 > 1 ? "are" : "is"} still open — a teammate can tap ${n163 > 1 ? "them" : "it"} done, or go finish first. Leave anyway?` });
        }
      }
      // Retry safety: if a switch died BETWEEN its two writes (out landed,
      // in didn't), the retry finds a fresh "Switched lines" out — finish
      // the job by writing just the clock-in instead of refusing.
      const halfSwitched = last && last.kind === "clock_out_early"
        && last.reason === "Switched lines"
        && Date.now() - new Date(last.claimed_at).getTime() < 5 * 60000;
      if (!last || (last.kind !== "clock_in" && !halfSwitched))
        return json(400, { ok: false, error: "You're not on the clock — just clock in on that line instead" });
      if (last.kind === "clock_in" && last.line_id === line_id)
        return json(400, { ok: false, error: "You're already on that line" });
      const when = new Date(claimed_at || Date.now());
      // The clock-in lands 1 second AFTER the clock-out on purpose: the time
      // engine replays events in claimed_at order, and two rows sharing one
      // timestamp could replay in either order (the out could close the NEW
      // interval). One second of payroll time buys deterministic replay.
      if (!halfSwitched)
        await db("clock_event", { method: "POST", body: JSON.stringify({
          employee_id: empId, line_id: last.line_id, kind: "clock_out_early",
          reason: "Switched lines", claimed_at: when.toISOString() }) });
      await db("clock_event", { method: "POST", body: JSON.stringify({
        employee_id: empId, line_id, kind: "clock_in",
        claimed_at: new Date((halfSwitched ? new Date(last.claimed_at).getTime() : when.getTime()) + 1000).toISOString() }) });
      logEvent("clock.switch", empId, { from_line: last.line_id, to_line: line_id });
      // Block 135: switching ONTO a "down for today" line resumes it, exactly
      // like a direct clock-in — the punch above is recorded, so it's safe.
      await resumeDownLine135(line_id, empId);
      return json(200, { ok: true });
    }

    // Block 125 (M3): GRAB A FIX. Moves the tech's clock onto the Fix-work bucket
    // (line 15) stamped with this order, and points their screen at the fix. Not a
    // lock — two techs may share one fix. Fix-work is non-production: paid, never
    // charged to a cab's pace.
    if (url.pathname === "/api/fix/claim" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const gate = wifiGate(req); if (gate) return json(403, { ok: false, error: gate });
      const { build_id, claimed_at } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That fix reference isn't valid" });
      const [fb] = await db(`build?select=id,state,order_number&id=eq.${build_id}`);
      if (!fb || fb.state !== "fix_job")
        return json(400, { ok: false, error: "That fix isn't open anymore — refresh the list" });
      const [lastF] = await db(`clock_event?select=kind,line_id,claimed_at,fix_build_id&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (!lastF || lastF.kind !== "clock_in")
        return json(400, { ok: false, error: "Clock in first, then grab the fix" });
      if (lastF.line_id === FIX_LINE_ID && lastF.fix_build_id === build_id) {
        await db(`employee?id=eq.${empId}`, { method: "PATCH", body: JSON.stringify({ focus_build_id: build_id }) });
        return json(200, { ok: true });
      }
      const whenF = new Date(claimed_at || Date.now());
      // Close whatever they were on, then open the fix stint 1s later (same
      // deterministic-replay rule as a line switch).
      await db("clock_event", { method: "POST", body: JSON.stringify({
        employee_id: empId, line_id: lastF.line_id, kind: "clock_out_early",
        reason: "Switched to a fix job", claimed_at: whenF.toISOString() }) });
      await db("clock_event", { method: "POST", body: JSON.stringify({
        employee_id: empId, line_id: FIX_LINE_ID, kind: "clock_in", fix_build_id: build_id,
        claimed_at: new Date(whenF.getTime() + 1000).toISOString() }) });
      await db(`employee?id=eq.${empId}`, { method: "PATCH", body: JSON.stringify({ focus_build_id: build_id }) });
      logEvent("fix.claim", empId, { build_id, order_number: fb.order_number });
      return json(200, { ok: true });
    }

    // Block 125 (M3): DONE WITH A FIX (manual release). Steps off the Fix-work
    // bucket to "off the line" (still on the clock) and clears the focus so the
    // screen returns to the normal line pick.
    if (url.pathname === "/api/fix/release" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const gate = wifiGate(req); if (gate) return json(403, { ok: false, error: gate });
      const { claimed_at } = await body(req);
      const [lastR] = await db(`clock_event?select=kind,line_id,claimed_at&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      const whenR = new Date(claimed_at || Date.now());
      if (lastR && lastR.kind === "clock_in" && lastR.line_id === FIX_LINE_ID) {
        await db("clock_event", { method: "POST", body: JSON.stringify({
          employee_id: empId, line_id: FIX_LINE_ID, kind: "clock_out_early",
          reason: "Done with the fix", claimed_at: whenR.toISOString() }) });
        await db("clock_event", { method: "POST", body: JSON.stringify({
          employee_id: empId, line_id: 14, kind: "clock_in",
          claimed_at: new Date(whenR.getTime() + 1000).toISOString() }) });
      }
      await db(`employee?id=eq.${empId}`, { method: "PATCH", body: JSON.stringify({ focus_build_id: null }) });
      logEvent("fix.release", empId, {});
      return json(200, { ok: true });
    }

    // TV BOARD (file 19 skeleton) — view-only; no login (it's a TV on shop Wi-Fi).
    // Q120: the unread count for the notifications bell (any signed-in user).
    if (url.pathname === "/api/inbox/unread") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false });
      const un = await db(`notification_log?select=id&intended_employee_id=eq.${empId}&read_at=is.null&limit=200`);
      return json(200, { ok: true, count: un.length });
    }

    // Q120: the in-app notification inbox — a person's own history, newest
    // first. Rendering it marks their unread notifications read.
    if (url.pathname === "/inbox") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [emp] = await db(`employee?select=first_name,role,department&id=eq.${empId}`);   // Block 196: role+dept feed the shared nav
      if (!emp) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const notes = await db(`notification_log?select=id,title,body,created_at,read_at&intended_employee_id=eq.${empId}&order=created_at.desc&limit=100`);
      const html = inboxPage(emp, notes);
      const unreadIds = notes.filter((n) => !n.read_at).map((n) => n.id);
      if (unreadIds.length)
        await db(`notification_log?id=in.(${unreadIds.join(",")})`, { method: "PATCH", body: JSON.stringify({ read_at: new Date().toISOString() }) });
      return send(200, "text/html; charset=utf-8", html);
    }

    // Block 95 (owner-rep): the TV and the staff board are SEPARATE surfaces.
    // /tv = the standalone TV URL — no sign-in, nothing clickable, sleep
    // overlay on. /board = the staff shop board — sign-in required, every
    // order (current and upcoming) taps through to the cab card.
    // Block 118 (owner-rep): plain-English addresses — /tvboard is the wall
    // TV (typed into its browser once; zero links, zero clicks) and
    // /shopboard is the staff board. The old /tv and /board forward forever,
    // so nothing bookmarked or already-typed ever breaks.
    if (url.pathname === "/tv" || url.pathname === "/board") { res.writeHead(302, { Location: url.pathname === "/tv" ? "/tvboard" : "/shopboard" }); return res.end(); }
    if (url.pathname === "/orderqueue") { res.writeHead(302, { Location: "/reconcile" }); return res.end(); }   // Block 156 (E1): the new name is typable
    if (url.pathname === "/tvboard") {
      // Block 173 (owner ruling): the wall board only renders on the shop network.
      if (!onShopNetwork(req)) return send(200, "text/html; charset=utf-8", offNet173());
      return send(200, "text/html; charset=utf-8", boardPage(true));
    }
    if (url.pathname === "/shopboard") {
      const empB95 = await liveSession(req);
      if (!empB95) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [empNavB196] = await db(`employee?select=role,department&id=eq.${empB95}`);   // Block 196: shared nav
      return send(200, "text/html; charset=utf-8", boardPage(false, empNavB196 || null));
    }

    // ORDER DETAIL (block 25) — public look-up from the board's order links.
    if (url.pathname.startsWith("/order/")) {
      // Block 88 (owner-rep): order DETAILS are signed-in-staff only. The TV
      // shows the basics on its tiles; clicking through asks for a sign-in.
      const empView88 = await liveSession(req);
      if (!empView88) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const ord = decodeURIComponent(url.pathname.slice(7));
      const [bO] = await db(`build?select=*&order_number=eq.${encodeURIComponent(ord)}`);
      if (!bO) return send(404, "text/html; charset=utf-8",
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Shop Board</title>${style}</head><body><div class="wrap" style="text-align:center"><h2>No order "${escH(ord)}" on the board</h2><p><a href="/shopboard" style="color:#8e8e93">← Back to the board</a></p></div></body></html>`);
      const [prodO] = bO.part_number ? await db(`product?select=family&part_number=eq.${encodeURIComponent(bO.part_number)}`) : [null];
      const [lnO] = bO.line_id ? await db(`line?select=name&id=eq.${bO.line_id}`) : [null];
      const tasksO = await db(`task?select=display_no,name,day_no,day_end,man_hours,state,is_background,source&build_id=eq.${bO.id}&order=day_no,sort_order`);
      const prodAll86 = await db(`product?select=part_number`);
      const allowSet86 = new Set(prodAll86.map((p) => String(p.part_number).toUpperCase()));
      const coyOrd86 = bO.coyote_root || String(bO.order_number || "").split(".")[0];
      let coyDetail86 = null;
      if (coyOrd86) { const [ci86] = await db(`coyote_intake?select=payload&order_number=eq.${encodeURIComponent(coyOrd86)}&order=received_at.desc&limit=1`); if (ci86 && ci86.payload) coyDetail86 = parseCoyoteDetail(ci86.payload, bO.part_number, allowSet86); }
      let canFull86 = false, empNav196 = null;
      const empId86 = empView88;
      if (empId86) { const [me86] = await db(`employee?select=role,department&id=eq.${empId86}`); if (me86) { canFull86 = me86.role === "admin" || me86.role === "manager" || me86.department === "Warehouse" || me86.department === "Accounting" || me86.department === "Owner"; empNav196 = { role: me86.role, department: me86.department }; }
        // Block 90 (owner-rep): admin-gated role PREVIEW for checking work while
        // building — ?viewas=production|build|body|warehouse|accounting renders
        // this page as that tier sees it. Real admin session required; rendering
        // only — no write endpoint honors it, no credentials involved.
        const va90 = String(url.searchParams.get("viewas") || "").toLowerCase();
        if (va90 && me86 && me86.role === "admin") canFull86 = !(va90 === "production" || va90 === "build" || va90 === "body"); }
      const flags94 = await db(`option_flag?select=id,kind,flag_text&build_id=eq.${bO.id}&resolved=is.false&order=created_at.asc`);
      let canHours94 = false, isAdmin97r = false;
      if (empId86) { const [meH94] = await db(`employee?select=role&id=eq.${empId86}`); canHours94 = !!meH94 && (meH94.role === "admin" || meH94.role === "manager"); isAdmin97r = !!meH94 && meH94.role === "admin"; }
      // Block 127 (M3, B2): fix labor booked to THIS order (Fix-work bucket, line
      // 15), so its history shows original build hours + any later rework. Scoped
      // to the techs who clocked a fix on it — cheap, and only shows when > 0.
      let fixHrs127 = 0;
      const fixSeed127 = await db(`clock_event?select=employee_id&voided=is.false&line_id=eq.${FIX_LINE_ID}&fix_build_id=eq.${bO.id}&kind=eq.clock_in&limit=2000`);
      if (fixSeed127.length) {
        const empsF127 = [...new Set(fixSeed127.map((s) => s.employee_id))];
        const fmF127 = fixHoursByBuild(await db(`clock_event?select=employee_id,line_id,kind,fix_build_id,claimed_at&voided=is.false&employee_id=in.(${empsF127.join(",")})&order=claimed_at.asc&limit=20000`));
        fixHrs127 = fmF127[bO.id] || 0;
      }
      return send(200, "text/html; charset=utf-8", orderPage(bO, prodO ? prodO.family : "", lnO ? lnO.name : "", tasksO, coyDetail86, canFull86, flags94, canHours94, isAdmin97r, fixHrs127, empNav196));
    }

    // Block 211: the Progress Reports HUB — admin-only front door.
    if (url.pathname === "/progress") {
      const empH = await liveSession(req);
      if (!empH) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [meH] = await db(`employee?select=first_name,last_name,role,department&id=eq.${empH}`);
      if (!meH || meH.role !== "admin") return send(403, "text/plain; charset=utf-8", "Admin only.");
      // Block 212 (v201 SPEED): two parallel waves instead of 7 serial reads.
      const [linesH, onB, doneEv, partsH] = await Promise.all([
        db(`line?select=id,name&enabled=is.true&order=id`),
        db(`build?select=id,order_number,cab_number,part_number,line_id&state=in.(active,rework,fix_job,awaiting_inspection)&order=line_id`),
        db(`event_log?select=at,payload&event_type=eq.build.production_complete&order=at.desc&limit=20`),
        db(`product?select=part_number,family`),
      ]);
      const lnName211 = Object.fromEntries(linesH.map((l) => [l.id, l.name]));
      const doneIds = [...new Set(doneEv.map((e) => e.payload && e.payload.build_id).filter(Boolean))];
      // photo/note batch runs over the on-line ids + candidate done ids (a
      // superset of the final doneB — mk211 filters per build, extras unused).
      const allIds = [...new Set([...onB.map((b2) => b2.id), ...doneIds])];
      const [doneB, phAll, ntAllB, tnAll218] = await Promise.all([
        doneIds.length ? db(`build?select=id,order_number,cab_number,part_number,line_id&id=in.(${doneIds.join(",")})&state=eq.production_complete`) : [],
        allIds.length ? db(`build_photo?select=build_id,hidden,created_at&build_id=in.(${allIds.join(",")})&kind=in.(progress,finish,task)&limit=2000`) : [],   // Block 218: step photos count
        allIds.length ? db(`build_note?select=build_id,hidden,created_at&build_id=in.(${allIds.join(",")})&limit=2000`) : [],
        allIds.length ? db(`task_note?select=build_id,hidden,created_at&build_id=in.(${allIds.join(",")})&limit=2000`) : [],   // Block 218: step notes count
      ]);
      const ntAll = [...ntAllB, ...tnAll218];
      const famOf211 = Object.fromEntries(partsH.map((p2) => [p2.part_number, p2.family]));
      const midH = phxDayStart(phxDate(Date.now()));
      const mk211 = (b2, withToday) => {
        const ph = phAll.filter((x) => x.build_id === b2.id), nt = ntAll.filter((x) => x.build_id === b2.id);
        const today = withToday && [...ph, ...nt].some((x) => !x.hidden && new Date(x.created_at).getTime() >= midH);
        return { order: b2.order_number, cab: b2.cab_number, line: lnName211[b2.line_id] || "", family: famOf211[b2.part_number] || "",
          photos: ph.filter((x) => !x.hidden).length, notes: nt.filter((x) => !x.hidden).length,
          hiddenN: ph.filter((x) => x.hidden).length + nt.filter((x) => x.hidden).length, todayOk: today };
      };
      const seenH = new Set();
      const movedOnRows = doneB.filter((b2) => !seenH.has(b2.id) && seenH.add(b2.id)).map((b2) => mk211(b2, false)).slice(0, 8);
      return send(200, "text/html; charset=utf-8", progressHubPage211(meH, onB.map((b2) => mk211(b2, true)), movedOnRows));
    }
    // Block 210 (owner, Sat 8/22): the CUSTOMER PROGRESS REPORT route —
    // admin-only (the front office generates it and sends it to the owner).
    // Print / Save-as-PDF from the page is the deliverable.
    if (url.pathname.startsWith("/report/progress/")) {
      const empRep = await liveSession(req);
      if (!empRep) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [meRep] = await db(`employee?select=role&id=eq.${empRep}`);
      if (!meRep || meRep.role !== "admin") return send(403, "text/plain; charset=utf-8", "Admin only — ask the front office for the customer report.");
      const ordRep = decodeURIComponent(url.pathname.slice("/report/progress/".length));
      if (!/^[\w.\- ]{1,40}$/.test(ordRep)) return send(404, "text/plain", "Not found");
      const [bRep] = await db(`build?select=id,order_number,part_number,cab_number,started_at&order_number=eq.${encodeURIComponent(ordRep)}&order=created_at.desc&limit=1`);
      if (!bRep) return send(404, "text/plain; charset=utf-8", "No build on record for that order.");
      // Block 212 (v201 SPEED): the reads only need bRep — one round trip.
      // Block 218 (Daniel): STEP photos + STEP notes join the report feed —
      // "the individual task photos and notes NEEDS to be in the customer
      // report" — so the under-every-step Add photo/note link now feeds the
      // customer document (admin hides anything that shouldn't ship).
      const [prodRep, tasksRep, photosRep, notesRep, milesRep, tnotesRep218, taskNamesRep218] = await Promise.all([
        db(`product?select=family&part_number=eq.${encodeURIComponent(bRep.part_number)}`),
        db(`task?select=name,completed_at&build_id=eq.${bRep.id}&state=eq.complete&is_background=is.false&order=completed_at.asc.nullslast&limit=500`),
        db(`build_photo?select=id,kind,created_at,hidden&build_id=eq.${bRep.id}&kind=in.(progress,finish,task)&order=created_at.asc&limit=300`),
        db(`build_note?select=id,note,note_date,hidden,created_at&build_id=eq.${bRep.id}&order=created_at.asc&limit=300`),
        db(`event_log?select=at,event_type&event_type=in.(build.manager_started,build.start,build.production_complete,build.self_passed)&payload->>build_id=eq.${bRep.id}&order=at.asc&limit=30`),
        db(`task_note?select=id,task_id,note,hidden,created_at&build_id=eq.${bRep.id}&order=created_at.asc&limit=300`),
        db(`task?select=id,name&build_id=eq.${bRep.id}&limit=600`),
      ]);
      const dayMap210 = {};
      const dayOf210 = (ts) => { const ds = phxDate(new Date(ts).getTime()); return dayMap210[ds] = dayMap210[ds] || { ds, milestones: [], steps: [], notes: [], photos: [] }; };
      for (const t of tasksRep) if (t.completed_at) dayOf210(t.completed_at).steps.push(t.name);
      for (const p of photosRep) dayOf210(p.created_at).photos.push({ id: p.id, kind: p.kind, hidden: !!p.hidden });
      for (const n of notesRep) { const dsN = n.note_date || phxDate(new Date(n.created_at).getTime());
        (dayMap210[dsN] = dayMap210[dsN] || { ds: dsN, milestones: [], steps: [], notes: [], photos: [] }).notes.push({ id: n.id, note: n.note, hidden: !!n.hidden, src: "build" }); }
      // Block 218: step notes ride under the day they were written, labeled
      // with their step's name.
      const stepName218 = {}; for (const tN of taskNamesRep218) stepName218[tN.id] = tN.name;
      for (const tn of tnotesRep218) { const dsT = phxDate(new Date(tn.created_at).getTime());
        (dayMap210[dsT] = dayMap210[dsT] || { ds: dsT, milestones: [], steps: [], notes: [], photos: [] }).notes.push({ id: tn.id, note: tn.note, hidden: !!tn.hidden, src: "task", step: stepName218[tn.task_id] || "" }); }
      const MLBL210 = { "build.manager_started": "Cab entered production", "build.start": "Cab entered production",
        "build.production_complete": "Metalwork complete — moved to the Body Shop", "build.self_passed": "Metalwork complete — moved to the Body Shop" };
      for (const m of milesRep) { const l = MLBL210[m.event_type]; if (l) dayOf210(m.at).milestones.push(l); }
      for (const k in dayMap210) dayMap210[k].milestones = [...new Set(dayMap210[k].milestones)];
      const daysRep = Object.values(dayMap210).sort((a, z) => (a.ds < z.ds ? -1 : 1));
      logEvent("report.progress_viewed", empRep, { build_id: bRep.id, order_number: bRep.order_number, days: daysRep.length });
      return send(200, "text/html; charset=utf-8", progressReportPage210(bRep, prodRep[0] ? prodRep[0].family : "", daysRep));
    }

    // ============ THE TIME ENGINE v1 (spec §4, Stage 2 begins) ============
    // Board data: active cab + PACE COLOR per line, from first principles:
    //   COVERAGE (Q103-2): the cab's pace clock only runs while somebody is
    //     clocked onto its line. We rebuild coverage intervals from the raw
    //     clock_event history (a clock_in opens an interval on its line; the
    //     tech's next clock_out of any kind closes it).
    //   EARNED (Q103-4 v1): completed tasks earn their standard man-hours.
    //     (In-progress partial credit — time-worked-capped — joins when
    //     per-task time attribution lands; noted simplification.)
    //   COLOR (Q6 defaults, crew-agnostic by construction Q104):
    //     behind = coverage man-hours − earned man-hours
    //     green < 1 · amber 1–4 · red > 4 (½ day). Ahead is just green.
    //   DAY COUNTER (Q57): clock-driven — ceil(covered WALL hours ÷ 8);
    //     day boundaries float per cab, a mid-day start wastes nothing.
    // Q117: the live-board stream. Held open per screen; boardTick() writes a
    // bump when a new event lands and the client re-fetches. A 25s keepalive
    // comment survives idle-proxy timeouts; retry:3000 tells EventSource to
    // auto-reconnect after a drop. Keys never leave the server.
    if (url.pathname === "/api/board-stream") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache",
        "Connection": "keep-alive", "X-Accel-Buffering": "no" });
      res.write("retry: 3000\n\n");
      res.write("event: board\ndata: hello\n\n");   // nudge an initial render
      sseClients.add(res);
      const ka = setInterval(() => { try { res.write(": ka\n\n"); } catch (e) {} }, 25000);
      req.on("close", () => { clearInterval(ka); sseClients.delete(res); });
      return;   // keep the connection OPEN — never res.end()
    }

    if (url.pathname === "/api/board-state") {
      // Block 134 (L9 audit fix): the free-typed down reason can carry personal
      // info ("out sick"), so it must NOT ride in the PUBLIC board JSON (the TV
      // board /tvboard is unauthenticated). Include it only for a signed-in
      // viewer; the public tile shows a "DOWN TODAY" badge with no reason anyway.
      const sessB133 = await liveSession(req);
      const showDownReason133 = Boolean(sessB133);
      // Block 212 (v201 SPEED): the board engine feeds the TV, the cockpit and
      // the projections — its six independent reads now land in one round trip.
      const [lines, emps, builds, namesTogRows212, prods, tmpls, stepRows104, hrsB] = await Promise.all([
        db(`line?select=id,name,manually_closed,down_today,down_reason&enabled=is.true&order=id`),
        db(`employee?select=id,first_name&active=is.true`),
        db(`build?select=id,order_number,part_number,line_id,started_at,promised_finish,state,created_at,queue_pos,customer_name,destination,rework_reason,rework_hours,rework_assigned_at,fix_kind,fix_reason,fix_hours,fix_assigned_at&state=in.(active,upcoming,awaiting_inspection,rework,fix_job)&order=created_at`),
        // Block 88 (owner-rep): the TV tile carries the order's BASIC info —
        // order #, customer or business name, ship-to state. The Q65 toggle
        // ("Customer names on the TV") still governs the name; missing row = ON.
        db(`feature_toggle?select=enabled&key=eq.customer_names_on_tv`),
        db(`product?select=part_number,family,template_id`),
        db(`build_template?select=id,total_days`),
        // Block 104c: template man-hour sums — the day counter's denominator.
        db(`step_template?select=template_id,man_hours&retired=is.false&limit=2000`),
        shopHours(),
      ]);
      const [namesTog88] = namesTogRows212;
      const namesOn88 = !namesTog88 || namesTog88.enabled !== false;
      // Block 173 (break-pass F4): customer name + destination (the only PII here)
      // show only to a signed-in viewer or a shop-network/internal caller — an
      // anonymous off-network client (the F4 leak vector) gets structure, no identity.
      const showCustomer133 = Boolean(sessB133) || onShopNetwork(req);
      const who88 = (x) => (namesOn88 && showCustomer133 && x && x.customer_name ? String(x.customer_name) : "");
      const dest88 = (x) => (showCustomer133 && x && x.destination ? String(x.destination) : "");
      // EVENT WINDOW FIX (risk sweep 2026-07-28): the old flat limit-2000 read
      // would silently drop a long-running cab's EARLIEST coverage after about
      // a month of real usage — corrupting pace math invisibly. Now the window
      // starts at the oldest live cab's start minus a 24h cushion (with the
      // sweeper running, no single interval can span longer than that).
      const liveStarts = builds.filter((b) => b.state === "active" || b.state === "rework")
        .map((b) => new Date(b.started_at).getTime()).filter((n) => !isNaN(n));
      const windowStart = new Date((liveStarts.length ? Math.min(...liveStarts) : Date.now() - 7 * 86400000) - 86400000).toISOString();
      const events = await db(`clock_event?select=employee_id,kind,line_id,claimed_at&voided=is.false&claimed_at=gte.${windowStart}&order=claimed_at.asc&limit=10000`);
      const tmplMh104 = {}; for (const st of stepRows104) tmplMh104[st.template_id] = (tmplMh104[st.template_id] || 0) + Number(st.man_hours || 0);
      const familyOf = Object.fromEntries(prods.map((p) => [p.part_number, p.family]));
      const daysOfTmpl = Object.fromEntries(tmpls.map((t) => [t.id, t.total_days]));
      const tmplOf = Object.fromEntries(prods.map((p) => [p.part_number, p.template_id]));
      const nameOf = Object.fromEntries(emps.map((e) => [e.id, e.first_name]));

      // Rebuild coverage intervals per line from the event stream.
      const open = {};                 // employee_id -> {line, start}
      const intervals = {};            // line_id -> [{s, e}]
      const lastKind = {};             // employee_id -> last event (for on-clock names)
      const now = Date.now();
      for (const ev of events) {
        const t = new Date(ev.claimed_at).getTime();
        if (ev.kind === "clock_in") open[ev.employee_id] = { line: ev.line_id, start: t };
        else if (open[ev.employee_id]) {
          const o = open[ev.employee_id];
          (intervals[o.line] = intervals[o.line] || []).push({ s: o.start, e: t });
          delete open[ev.employee_id];
        }
        lastKind[ev.employee_id] = ev;
      }
      const onLine = {};
      for (const [empId, o] of Object.entries(open)) {   // still on the clock now
        (intervals[o.line] = intervals[o.line] || []).push({ s: o.start, e: now });
        if (nameOf[empId]) (onLine[o.line] = onLine[o.line] || []).push(nameOf[empId]);
      }

      const cabOf = {}; // first (oldest-started) active cab per line = the one on the floor
      const deckOf = {}; // first UPCOMING cab per line = "on deck" (C19 single-owner)
      const upOf = {};   // Block 95: ALL upcoming cabs per line, White-Board order
      const waitOf = {}; // awaiting-inspection cab (shows if the line has no active cab)
      for (const b of builds) {
        // A rework cab owns the line tile exactly like an active one (file 18:
        // distinct badge, its own countdown vs the manager's time frame).
        if ((b.state === "active" || b.state === "rework") && !cabOf[b.line_id]) cabOf[b.line_id] = b;
        if (b.state === "awaiting_inspection" && !waitOf[b.line_id]) waitOf[b.line_id] = b;
        if (b.state === "upcoming") (upOf[b.line_id] = upOf[b.line_id] || []).push(b);
      }
      // Block 95: sort each line's queue the way the White Board orders it
      // (queue_pos, then age). On deck = the head of that queue — this also
      // fixes ON DECK ignoring an admin's reorder (it used created_at only).
      for (const k95 of Object.keys(upOf)) {
        upOf[k95].sort((x, y) => ((x.queue_pos == null ? 1e9 : Number(x.queue_pos)) - (y.queue_pos == null ? 1e9 : Number(y.queue_pos))) || (x.created_at < y.created_at ? -1 : x.created_at > y.created_at ? 1 : 0));
        deckOf[k95] = upOf[k95][0];
      }
      // Q85: a FIX JOB owns the tile ONLY on a line with no live build (it
      // "runs alongside", never displacing current work) — second pass so
      // active/rework always win the tile first.
      for (const b of builds) {
        if (b.state === "fix_job" && !cabOf[b.line_id]) cabOf[b.line_id] = b;
      }
      const ids = Object.values(cabOf).map((b) => b.id);
      const tasks = ids.length
        ? await db(`task?select=build_id,state,man_hours&build_id=in.(${ids.join(",")})`) : [];
      const agg = {};
      for (const t of tasks) {
        const a = (agg[t.build_id] = agg[t.build_id] || { done: 0, total: 0 });
        a.total += Number(t.man_hours);
        if (t.state === "complete") a.done += Number(t.man_hours);
      }

      // Q113: the master chip — open during shop hours; outside them,
      // AFTER HOURS if anyone is on an approved session, else CLOSED.
      // (hrsB fetched in the Block-212 wave above.)
      let shopState = { state: "open", detail: "" };
      if (isAfterHours(now, hrsB)) {
        const ahOpenB = await db(`after_hours_session?select=employee_id,line_id&ended_at=is.null`);
        shopState = ahOpenB.length
          ? { state: "after_hours", detail: ahOpenB.map((s2) => `${nameOf[s2.employee_id] || "?"} on ${(lines.find((l) => l.id === s2.line_id) || {}).name || (s2.line_id === 10 ? "Shop time" : "line " + s2.line_id)}`).join(" · ") }
          : { state: "closed", detail: "" };
      }
      // Q86: TV SLEEP — dim the shop-TV board outside working hours and on
      // closed days (burn-in + power). Awake = a work day AND within shop hours,
      // OR someone's on an approved after-hours session; asleep otherwise.
      // Admin toggle (default ON; a missing row = ON). Never sleeps on error.
      let tv = { asleep: false, message: "" };
      try {
        const [slp] = await db(`feature_toggle?select=enabled&key=eq.tv_sleep`);
        const sleepOn = !slp || slp.enabled !== false;
        const phxN = new Date(now - PHX_OFFSET_MS);
        const hrNow = phxN.getUTCHours() + phxN.getUTCMinutes() / 60;
        const workday = await isWorkDay(phxDate(now));
        const openForBiz = workday && hrNow >= hrsB.open && hrNow < hrsB.close;
        if (sleepOn && !openForBiz && shopState.state !== "after_hours") {
          const fmtH = (h) => { const ap = h < 12 ? "AM" : "PM"; let hh = Math.floor(h) % 12; if (hh === 0) hh = 12; return hh + ":00 " + ap; };
          tv = { asleep: true, message: !workday ? "Shop closed today" : (hrNow < hrsB.open ? ("Opens " + fmtH(hrsB.open)) : "Closed for the day") };
        }
      } catch (e) { /* toggle hiccup — never sleep on error */ }
      return json(200, { shop: shopState, tv, lines: lines.map((l) => {
        const b = cabOf[l.id];
        const deck = deckOf[l.id] ? { order: deckOf[l.id].order_number, family: familyOf[deckOf[l.id].part_number] || "", customer: who88(deckOf[l.id]), dest: dest88(deckOf[l.id]) } : null;
        const upcoming95 = (upOf[l.id] || []).map((u) => ({ order: u.order_number, family: familyOf[u.part_number] || "", customer: who88(u), dest: dest88(u) }));
        // No active cab but one waiting on Mike? The board says so plainly.
        if (!b && waitOf[l.id]) {
          const w = waitOf[l.id];
          return { id: l.id, name: l.name, closed: l.manually_closed, down: l.down_today ? (showDownReason133 ? { reason: l.down_reason || "" } : {}) : null, techs: onLine[l.id] || [], ondeck: deck, upcoming: upcoming95,
            cab: { order: w.order_number, family: familyOf[w.part_number] || "", customer: who88(w), dest: dest88(w),
              done_mh: "—", total_mh: "—", pct: 100, promised: w.promised_finish || null,
              remaining_mh: "0.0", color: "green", status: "AWAITING INSPECTION — ready for sign-off",
              day: 0, total_days: 0 } };
        }
        if (!b) return { id: l.id, name: l.name, closed: l.manually_closed, down: l.down_today ? (showDownReason133 ? { reason: l.down_reason || "" } : {}) : null, techs: onLine[l.id] || [], cab: null, ondeck: deck, upcoming: upcoming95 };
        const a = agg[b.id] || { done: 0, total: 0 };
        const startMs = new Date(b.started_at).getTime();
        // Clip this line's coverage to the cab's life (Q103-2).
        const clipped = (intervals[l.id] || [])
          .map((iv) => ({ s: Math.max(iv.s, startMs), e: Math.min(iv.e, now) }))
          .filter((iv) => iv.e > iv.s);
        const manHrs = clipped.reduce((sum, iv) => sum + (iv.e - iv.s), 0) / 3600000;
        // Union for WALL covered hours (the Q57 day counter).
        const sorted = [...clipped].sort((x, y) => x.s - y.s);
        let wallMs = 0, curS = null, curE = null;
        for (const iv of sorted) {
          if (curE === null || iv.s > curE) { if (curE !== null) wallMs += curE - curS; curS = iv.s; curE = iv.e; }
          else curE = Math.max(curE, iv.e);
        }
        if (curE !== null) wallMs += curE - curS;
        const wallHrs = wallMs / 3600000;
        const behind = manHrs - a.done;
        const color = manHrs === 0 ? "none" : behind > 4 ? "red" : behind >= 1 ? "amber" : "green";
        // File 17 voice: blame the cab, never the person.
        const status = manHrs === 0 ? "Waiting for first clock-in"
          : behind > 4 ? `Needs help — ${behind.toFixed(1)} hrs behind`
          : behind >= 1 ? `Running behind — ${behind.toFixed(1)} hrs`
          : behind <= -1 ? `${(-behind).toFixed(1)} hrs ahead` : "On pace";
        const baseDays104 = daysOfTmpl[tmplOf[b.part_number]] || 0;
        // Block 104c (owner-rep audit): options extend the day count the same
        // way they extend the promise — total frozen hours over the family's
        // day budget. An option-heavy cab reads DAY 3 of 10, not "of 7".
        const tmb104 = tmplMh104[tmplOf[b.part_number]] || 0;
        const totalDays = (a.total > 0 && tmb104 > 0 && baseDays104 > 0)
          ? Math.max(baseDays104, Math.ceil(a.total / (tmb104 / baseDays104) - 1e-9)) : baseDays104;
        const day = Math.min(Math.max(1, Math.ceil(wallHrs / 8 || 1)), totalDays || 99);
        // REWORK OVERRIDE (files 11/18): distinct badge + the cab's OWN
        // amber->red countdown against the manager's time frame — the normal
        // pace math stays out of it (rework hours are their own bucket, Q85).
        let rcolor = color, rstatus = status, badge = null;
        if (b.state === "rework") {
          badge = "REWORK";
          const rwStart = new Date(b.rework_assigned_at || b.started_at).getTime();
          const rwClipped = (intervals[l.id] || [])
            .map((iv) => ({ s: Math.max(iv.s, rwStart), e: Math.min(iv.e, now) }))
            .filter((iv) => iv.e > iv.s);
          const rwHrs = rwClipped.reduce((sum, iv) => sum + (iv.e - iv.s), 0) / 3600000;
          const frame = Number(b.rework_hours) || 0;
          rcolor = !frame ? "amber" : rwHrs > frame ? "red" : rwHrs > frame * 0.75 ? "amber" : "green";
          rstatus = `In extra time — ${b.rework_reason || "fixes"} · ${rwHrs.toFixed(1)} of ${frame || "—"} hrs used`;
        }
        // Q85 FIX JOB OVERRIDE: a returned/kicked-back cab. Distinct badge + its
        // OWN deadline countdown = ELAPSED wall-time since the fix opened vs the
        // manager's hour frame (a returned cab shares no clean line-labor with a
        // live build, so the honest measure is the wall-clock deadline). Fix
        // hours are their own bucket; the normal build pace math stays out of it.
        let fixJob = false;
        if (b.state === "fix_job") {
          fixJob = true; badge = "FIX JOB";
          const fxStart = new Date(b.fix_assigned_at || b.started_at).getTime();
          const elapsedH = Math.max(0, (now - fxStart) / 3600000);
          const frame = Number(b.fix_hours) || 0;
          rcolor = !frame ? "amber" : elapsedH > frame ? "red" : elapsedH > frame * 0.75 ? "amber" : "green";
          rstatus = `Returned for fix — ${b.fix_kind === "kickback" ? "kickback" : "customer return"}${b.fix_reason ? " · " + b.fix_reason : ""} · ${elapsedH.toFixed(1)} of ${frame || "—"} hrs`;
        }
        return { id: l.id, name: l.name, closed: l.manually_closed, down: l.down_today ? (showDownReason133 ? { reason: l.down_reason || "" } : {}) : null, techs: onLine[l.id] || [], ondeck: deck, upcoming: upcoming95,
          cab: { order: b.order_number, family: familyOf[b.part_number] || "", customer: who88(b), dest: dest88(b),
            done_mh: fixJob ? "—" : a.done.toFixed(1), total_mh: fixJob ? "—" : a.total.toFixed(1),
            pct: fixJob ? 100 : (a.total ? Math.round(100 * a.done / a.total) : 0),
            // Promised date is FIXED at start (Q103-6); remaining standard
            // man-hours is the honest v1 "how much is left" figure.
            promised: b.promised_finish || null,
            remaining_mh: fixJob ? "0.0" : (a.total - a.done).toFixed(1),
            color: rcolor, status: rstatus, badge, day: fixJob ? 0 : day, total_days: fixJob ? 0 : totalDays } };
      }) });
    }

    // MANAGER COCKPIT — manager + admin only (file 07 permissions).
    if (url.pathname === "/manager") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,department,must_change_pin&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin")) { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); } // Q114
      // Block 188 (owner ruling, day 2): the cockpit is DEPARTMENT-SCOPED.
      // A manager whose department is not Production (Body Shop today; other
      // departments until Daniel defines their own views) gets the
      // INSPECTION-ONLY cockpit: the inspection lane + the line boxes, with
      // production controls (line down/close, start next, active sign-off)
      // and the staff lanes (on-clock / running-long / after-hours / time
      // off / corrections / fix jobs / Tools) hidden. Admins always full.
      // Block 189 (owner ruling, same morning): ACCOUNTING manager = the
      // TIME & PAY view — On the clock + Time corrections (their whole job:
      // backfill the pay period from the physical punch clock, fix morning /
      // lunch / end-of-day punches) + Tools menu of Pay Worksheet & Reports.
      // No cab lines, no inspection — she thinks in punches, not lines.
      const acct189 = me.role === "manager" && me.department === "Accounting";
      const insp188 = me.role === "manager" && me.department !== "Production" && !acct189;
      // Block 212 (v201 SPEED): this cockpit had grown to ~45 db round-trips
      // asked ONE AT A TIME (~6 s render, Daniel's audit ask). Same queries,
      // same data, same assembly — now fired in TWO PARALLEL WAVES: wave 1 is
      // everything independent, wave 2 is everything that needs wave-1 ids.
      // The query strings are verbatim from their old positions; only the
      // awaiting moved. Assembly logic below is UNCHANGED.
      const tcEmpRaw = url.searchParams.get("tc_emp");
      const tcEmpSel = (tcEmpRaw && isUuid(tcEmpRaw)) ? tcEmpRaw : null;   // Block 172 (break-pass): isUuid-guard before the filter
      const tcDate = url.searchParams.get("tc_date") || phxDate(Date.now());
      const [lines, linesAll189, builds, reworkReasons, recentCk, empNames, open159,
             repTogRows212, ahRows, togLineRows212, downReasonRows212, tcEmps, allNames,
             toPendRows, toUpRows, toReasonRows212, fxOpenRows, fxCompleted, fxReasons,
             fxSeed127, sbEv207, mgrBoard, tcRawP212, evs191, hrs133, ov133, oddEvs215, toSel216] = await Promise.all([
        db(`line?select=id,name,manually_closed,down_today,down_reason&enabled=is.true&order=id`),
        // Block 190: EVERY line's name (dept-time areas included) for the
        // on-the-clock list and the punch corrector — an accounting or Body
        // Shop punch should read "Accounting time", not a blank or "line 16".
        db(`line?select=id,name&order=id`),
        db(`build?select=id,order_number,part_number,cab_number,line_id,state,final_note,rework_reason,rework_hours,started_at,created_at,kit_status,queue_pos,inspection_claimed_by,inspection_claimed_at&state=in.(active,upcoming,awaiting_inspection,rework)&order=created_at`),
        db(`pick_list_item?select=label&list_key=eq.rework_reason&retired=is.false&order=sort_order`),
        db("clock_event?select=employee_id,kind,line_id,claimed_at&voided=is.false&order=claimed_at.desc&limit=200"),
        db("employee?select=id,first_name,last_name&active=is.true"),
        db("task?select=started_by,is_background&state=eq.in_progress"),
        db(`feature_toggle?select=enabled&key=eq.manager_reports`),
        db(`after_hours_session?select=id,employee_id,line_id,approved_by,reason,plan,wrap_note,started_at,ended_at,confirmed_by,signed_off_by&signed_off_by=is.null&declined_by=is.null&order=started_at.desc&limit=20`),
        db(`feature_toggle?select=enabled&key=eq.manager_line_control`),
        db(`pick_list_item?select=label&list_key=eq.line_down_reason&retired=is.false&order=sort_order`),
        db(`employee?select=id,first_name,last_name,department,lines,pay_type&active=is.true&order=first_name`),   // Block 189/200: dept + usual lines + pay_type ride along
        db("employee?select=id,first_name"),
        db(`time_off_request?select=id,employee_id,start_date,end_date,reason,request_note&status=eq.pending&order=start_date`),
        db(`time_off_request?select=employee_id,start_date,end_date,reason&status=eq.approved&end_date=gte.${phxDate(Date.now())}&order=start_date&limit=40`),
        db(`pick_list_item?select=label&list_key=eq.time_off_reason&retired=is.false&order=sort_order`),
        db(`build?select=id,order_number,cab_number,line_id,fix_kind,fix_reason,fix_hours,fix_note&state=eq.fix_job&order=fix_assigned_at`),
        db(`build?select=id,order_number,cab_number&state=eq.production_complete&order=created_at.desc&limit=40`),
        db(`pick_list_item?select=label&list_key=eq.fixjob_reason&retired=is.false&order=sort_order`),
        db(`clock_event?select=employee_id&voided=is.false&line_id=eq.${FIX_LINE_ID}&kind=eq.clock_in&limit=5000`),
        db(`event_log?select=at,payload&event_type=eq.build.production_complete&order=at.desc&limit=15`),
        fetch(`http://127.0.0.1:${PORT}/api/board-state`).then((r) => r.json()).catch(() => null),
        tcEmpSel ? db(`clock_event?select=id,kind,line_id,reason,claimed_at,voided,corrected_by,added_by,correction_note&employee_id=eq.${tcEmpSel}&claimed_at=gte.${new Date(phxDayStart(tcDate)).toISOString()}&claimed_at=lt.${new Date(phxDayStart(tcDate) + 86400000).toISOString()}&order=claimed_at.asc`) : [],
        (acct189 && tcEmpSel) ? db(`clock_event?select=id,kind,claimed_at,reason&voided=is.false&employee_id=eq.${tcEmpSel}&claimed_at=gte.${new Date(phxDayStart(phxDate(Date.now() - 13 * 86400000))).toISOString()}&order=claimed_at.asc`) : [],
        shopHours(), calendarOverrides(),   // both in-process cached (60 s / 5 min) — near-free here
        acct189 ? db(`clock_event?select=employee_id,kind,claimed_at,corrected_by,added_by&voided=is.false&claimed_at=gte.${new Date(phxDayStart(phxDate(Date.now() - 13 * 86400000))).toISOString()}&order=claimed_at.asc&limit=20000`) : [],   // Block 215/216: the oddities scan — corrected_by rides along so a human-touched auto-close clears its flag
        (acct189 && tcEmpSel) ? db(`time_off_request?select=id,start_date,end_date,reason,hours&employee_id=eq.${tcEmpSel}&status=eq.approved&end_date=gte.${phxDate(Date.now() - 13 * 86400000)}&order=start_date`) : [],   // Block 216/217: the selected person's recorded time off (hours = partial day) — shows + cancels from the editor
      ]);
      const lname190 = Object.fromEntries(linesAll189.map((l) => [l.id, l.name]));
      // WAVE 2 — everything that needed wave-1 ids, still ONE round trip.
      const activeIds194 = builds.filter((b) => b.state === "active").map((b) => b.id);
      const parts194 = [...new Set(builds.filter((b) => b.state === "active").map((b) => b.part_number).filter(Boolean))];
      const waitIds = builds.filter((b) => b.state === "awaiting_inspection").map((b) => b.id);
      const workIds = builds.filter((b) => b.state === "active" || b.state === "rework").map((b) => b.id);
      const actIds133 = builds.filter((b) => b.state === "active" && lines.some((l) => l.id === b.line_id)).map((b) => b.id);
      const fxEmps127 = [...new Set(fxSeed127.map((s) => s.employee_id))];
      const [ts194, ph194, prods194, photos, doing212, dones212, ahPh107, dnRows133, fxPunches127, proj212] = await Promise.all([
        activeIds194.length ? db(`task?select=build_id,is_background,state&build_id=in.(${activeIds194.join(",")})`) : [],
        activeIds194.length ? db(`build_photo?select=build_id&kind=eq.finish&build_id=in.(${activeIds194.join(",")})`) : [],
        parts194.length ? db(`product?select=part_number,photo_min&part_number=in.(${parts194.map((p) => `"${encodeURIComponent(p)}"`).join(",")})`) : [],
        waitIds.length ? db(`build_photo?select=id,build_id&build_id=in.(${waitIds.join(",")})&order=created_at`) : [],
        workIds.length ? db(`task?select=id,name,display_no,build_id,started_by,started_at&build_id=in.(${workIds.join(",")})&state=eq.in_progress&order=started_at.asc`) : [],
        workIds.length ? db(`task?select=id,name,display_no,build_id,completed_by,completed_at&build_id=in.(${workIds.join(",")})&state=eq.complete&order=completed_at.desc.nullslast&limit=8`) : [],
        ahRows.length ? db(`after_hours_photo?select=id,session_id&session_id=in.(${ahRows.map((s) => s.id).join(",")})`) : [],
        actIds133.length ? db(`line_down?select=build_id,reason,down_at,up_at&build_id=in.(${actIds133.join(",")})&order=down_at.asc`) : [],
        fxEmps127.length ? db(`clock_event?select=employee_id,line_id,kind,fix_build_id,claimed_at&voided=is.false&employee_id=in.(${fxEmps127.join(",")})&order=claimed_at.asc&limit=20000`) : [],
        cabProjections(mgrBoard),
      ]);
      const [repTog] = repTogRows212; const [togLine] = togLineRows212;
      // Block 194 (Blazer lesson): the cockpit must SEE a done-but-not-finished
      // cab. For every ACTIVE build: step progress + whether every non-
      // background step is checked + completion-photo status — feeds the
      // "READY — send to inspection" state on the line card and the
      // inspection lane. One query each, active cabs only (≤4 rows).
      const ready194 = {};
      if (activeIds194.length) {
        const pmin194 = Object.fromEntries(prods194.map((p) => [p.part_number, p.photo_min]));
        for (const bid of activeIds194) {
          const mine = ts194.filter((t) => t.build_id === bid && !t.is_background);
          const done = mine.filter((t) => t.state === "complete").length;
          const bld = builds.find((b) => b.id === bid);
          ready194[bid] = { done, total: mine.length, allDone: mine.length > 0 && done === mine.length,
            photosHave: ph194.filter((p) => p.build_id === bid).length,
            photosNeed: bld && pmin194[bld.part_number] != null ? pmin194[bld.part_number] : 1 };
        }
      }
      // Who's on the clock right now — feeds the forgotten-clock-out tool.
      const latestCk = {};
      for (const ev of recentCk) if (!latestCk[ev.employee_id]) latestCk[ev.employee_id] = ev;
      // Block 159 (owner-rep F1): each on-clock person's OPEN (in-progress,
      // non-background) step count rides their row — a hoarder shows at a
      // glance, amber at 3+. Pairs with the soft cap on /api/task/state.
      const openBy159 = {};
      for (const t159 of open159 || []) if (t159.started_by && !t159.is_background) openBy159[t159.started_by] = (openBy159[t159.started_by] || 0) + 1;
      const onClock = Object.values(latestCk).filter((e) => e.kind === "clock_in")
        .map((e) => { const emp = empNames.find((x) => x.id === e.employee_id);
          return emp ? { id: e.employee_id, name: `${emp.first_name} ${emp.last_name}`,
            line: e.line_id === SHOP_LINE_ID ? "Shop time" : e.line_id === FIX_LINE_ID ? "Fix work" : lname190[e.line_id] || "",   // Block 190: dept-time punches show their area name
            open: openBy159[e.employee_id] || 0,
            // HH:MM in Phoenix time (UTC-7 fixed, Q82) — rendered server-side.
            since_hhmm: new Date(new Date(e.claimed_at).getTime() - 7 * 3600000).toISOString().slice(11, 16) } : null; })
        .filter(Boolean);
      // Completion photos for the inspection boxes (file 11: the manager
      // inspects note + photos together).
      const rows = lines.map((l) => ({ line: l,
        active: (() => { const a194 = builds.find((b) => b.line_id === l.id && b.state === "active") || null;
          return a194 ? { ...a194, ready194: ready194[a194.id] || null } : null; })(),
        rework: builds.filter((b) => b.line_id === l.id && b.state === "rework"),
        awaiting: builds.filter((b) => b.line_id === l.id && b.state === "awaiting_inspection")
          .map((b) => { // Block 184: the claim rides along with a display name + Phoenix HH:MM
            const ce184 = b.inspection_claimed_by ? empNames.find((x) => x.id === b.inspection_claimed_by) : null;
            return { ...b, photos: photos.filter((p) => p.build_id === b.id),
              claim_name184: b.inspection_claimed_by ? (ce184 ? `${ce184.first_name} ${(ce184.last_name || "")[0] || ""}.` : "a manager") : null,
              claim_hhmm184: b.inspection_claimed_at ? new Date(new Date(b.inspection_claimed_at).getTime() - 7 * 3600000).toISOString().slice(11, 16) : null }; }),
        queue: builds.filter((b) => b.line_id === l.id && b.state === "upcoming")
          .sort((a, b) => (a.queue_pos ?? 9999) - (b.queue_pos ?? 9999) || (a.created_at < b.created_at ? -1 : 1)) }));
      // Block 133 (logic audit L9): a line put DOWN with a live/held cab carries a
      // TYPED reason that rides with the ORDER + a TIMED hold (paused outside shop
      // hours). Load each active cab's down history, total the WORKING minutes the
      // hold cost, and pre-escape here (the cockpit page has no esc of its own).
      const escM133 = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      {
        if (dnRows133.length) {
          const fmtMin133 = (mins) => { const m = Math.max(0, Math.round(mins)); const h = Math.floor(m / 60), rm = m % 60; return h ? `${h}h ${rm}m` : `${rm}m`; };
          const byB133 = {};
          for (const d of dnRows133) {
            const upMs = d.up_at ? new Date(d.up_at).getTime() : Date.now();
            const mins = downWorkingMs(new Date(d.down_at).getTime(), upMs, hrs133, ov133) / 60000;
            (byB133[d.build_id] = byB133[d.build_id] || []).push({ open: !d.up_at, mins, reason: d.reason || "" });
          }
          for (const row133 of rows) {
            if (!row133.active || !byB133[row133.active.id]) continue;
            const list133 = byB133[row133.active.id];
            row133.active.downs = list133.map((d) => ({ open: d.open, label: `${fmtMin133(d.mins)} · ${escM133(d.reason)}` }));
            row133.active.downTotalLabel = list133.length > 1 ? fmtMin133(list133.reduce((s, d) => s + d.mins, 0)) : null;
          }
        }
      }
      // L9: escape the raw typed down reason for the line header/badge too.
      for (const row133 of rows) if (row133.line && row133.line.down_reason) row133.line = { ...row133.line, down_reason: escM133(row133.line.down_reason) };
      // Q107: two quiet watchdogs over the working cabs' tasks.
      //   LONG-RUNNERS — a step In Progress 4+ hrs with no completion. Zero
      //   crew taps required; the manager glances, sees who started it and
      //   when, and the mystery usually explains itself (helping elsewhere,
      //   parts run, forgot the tap). Also keeps stale spans from quietly
      //   feeding the future Q96 calibration.
      //   RECENTLY CHECKED OFF — the shared, audited undo. If a step got
      //   completed out from under a partner still working it, this is where
      //   it comes back (line-mates can also just tap the step itself).
      const orderOf = {}; for (const b of builds) orderOf[b.id] = b.order_number;
      const lineOf99 = {}; for (const b of builds) lineOf99[b.id] = (lines.find((l) => l.id === b.line_id) || {}).name || (b.line_id ? "Line " + b.line_id : "");
      const nameOf = {}; for (const p of allNames) nameOf[p.id] = p.first_name;
      const phx = (ts) => ts ? new Date(new Date(ts).getTime() - 7 * 3600000).toISOString().slice(11, 16) : "";
      let longRunners = [], recentDone = [];
      if (workIds.length) {
        longRunners = doing212.filter((t) => t.started_at && Date.now() - new Date(t.started_at).getTime() > 4 * 3600000)
          .map((t) => ({ ...t, order_number: orderOf[t.build_id], line: lineOf99[t.build_id], who: nameOf[t.started_by] || "?", hhmm: phx(t.started_at) }));
        recentDone = dones212.filter((t) => t.completed_at)
          .map((t) => ({ ...t, order_number: orderOf[t.build_id], line: lineOf99[t.build_id],
            who: nameOf[t.completed_by] || "", hhmm: phx(t.completed_at) }));
      }
      // Reports link only if the admin has shared the page (Q65 toggle,
      // owner-rep 2026-07-29: reports are admin work by default).
      // Q112 + block 107: every after-hours session surfaces here until it is
      // SIGNED OFF — sign-off is what releases its held hours to the timecard.
      // (repTog, ahRows, ahPh107 all fetched in the Block-212 waves above.)
      const phxDT = (ts) => ts ? new Date(new Date(ts).getTime() - 7 * 3600000).toISOString().slice(5, 16).replace("T", " ") : "";
      const afterHours = ahRows.map((s) => ({ id: s.id,
        who: nameOf[s.employee_id] || "?", appr: nameOf[s.approved_by] || "?",
        lineName: (lines.find((l) => l.id === s.line_id) || {}).name || (s.line_id === 10 ? "Shop time" : "Line " + s.line_id),
        when: phxDT(s.started_at), reason: s.reason, plan: s.plan, wrap: s.wrap_note,
        ended: Boolean(s.ended_at), confirmed: Boolean(s.confirmed_by),
        hrs: s.ended_at ? Math.round(Math.max(0, new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 360000) / 10 : null,
        photos: ahPh107.filter((p2) => p2.session_id === s.id).map((p2) => p2.id) }));
      // Q113: line open/close — admins always, managers behind the switch.
      const canCloseLines = me.role === "admin" || Boolean(togLine && togLine.enabled);
      // Q83: the "down for today" reason list (admin-editable pick list).
      const downReasons = downReasonRows212.map((r) => r.label);
      // Q111 pt 2: the time-corrections lane — a person + a Phoenix day
      // (tcEmpSel/tcDate parsed above the Block-212 wave; punches rode wave 1).
      let tcPunches = [];
      if (tcEmpSel) {
        tcPunches = tcRawP212.map((p2) => ({ id: p2.id, kind: p2.kind, hhmm: phxHHMM(p2.claimed_at),
          lineName: p2.line_id === 10 ? "Shop time" : lname190[p2.line_id] || "line " + p2.line_id,   // Block 190: dept-time punches read by name
          reason: p2.reason || "", voided: p2.voided, corrected: Boolean(p2.corrected_by),
          added: Boolean(p2.added_by), note: p2.correction_note || "" }));
      }
      // Block 189: the add-pair line picker now carries the DEPT-TIME lines too
      // (Warehouse 9 · Build 12 · Body Shop 13 · Accounting 16 — disabled on
      // the TV but fully clockable), so accounting can backfill a punch pair
      // for ANY department. Before this, only the enabled production lines +
      // Shop time were offered, which made a dept backfill land wrong.
      // (linesAll189 is fetched once at the top of this handler — Block 190.)
      const tcLines189 = [...linesAll189.filter((l) => l.id !== FIX_LINE_ID && l.id !== 14 && l.id !== 11 && l.id !== SHOP_LINE_ID).map((l) => ({ id: l.id, name: l.name })), { id: SHOP_LINE_ID, name: "Shop time" }];   // Block 190: 11 = the old __test__ line, never offer it
      // Block 189: preselect the SELECTED person's natural line — Production →
      // their first usual line; Warehouse/Build/Body → their dept-time line;
      // everyone else → Shop time. Accounting shouldn't have to know lines.
      const selRow189 = tcEmpSel ? tcEmps.find((e) => e.id === tcEmpSel) : null;
      const DEPT_LINE189 = { "Warehouse": 9, "Build": 12, "Body Shop": 13, "Accounting": 16 };   // Block 190: accounting's own dept-time line
      const defLine189 = !selRow189 ? null
        : selRow189.department === "Production" && Array.isArray(selRow189.lines) && selRow189.lines.length ? selRow189.lines[0]
        : DEPT_LINE189[selRow189.department] || SHOP_LINE_ID;
      const tc = { emps: tcEmps, lines: tcLines189,
        selEmp: tcEmpSel, date: tcDate, punches: tcPunches, defLine189 };
      // Block 191 (owner ruling, day 2): the ACCOUNTING TIMECARD EDITOR.
      // Daniel: the punch-level corrector is "100% not EASY" for accounting.
      // Her mental model is a TIMECARD — a person, a day, in-and-out times —
      // never lines, never "punch pairs". This view: pick a person → their
      // last 14 Phoenix days at once, each day's punches paired into STINTS
      // (IN → OUT), editable times, Remove (voids IN then OUT, the order the
      // v148 guards require), and an Add row per day. Lines are invisible:
      // every change auto-books to the person's natural line (Block 189
      // default). All of it rides the SAME audited /api/punch/correct
      // endpoint — this is a friendlier face, not a new power.
      let tcard191 = null;
      if (acct189) {
        let days191 = [];
        if (tcEmpSel) {
          // evs191 rode the Block-212 wave-1 fetch above.
          const byDay191 = {};
          for (const ev of evs191) { const dsE = phxDate(new Date(ev.claimed_at).getTime()); (byDay191[dsE] = byDay191[dsE] || []).push(ev); }
          for (let i191 = 0; i191 < 14; i191++) {
            const ds = phxDate(Date.now() - i191 * 86400000);
            const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(ds + "T12:00:00Z").getUTCDay()];
            const stints = [], orphans = [];
            let openIn191 = null;
            for (const p of byDay191[ds] || []) {
              const t = { id: p.id, hhmm: phxHHMM(p.claimed_at), kind: p.kind, at: p.claimed_at, rsn: p.reason || "" };
              if (p.kind === "clock_in") { if (openIn191) orphans.push(openIn191); openIn191 = t; }
              else if (openIn191) { stints.push({ in: openIn191, out: t }); openIn191 = null; }
              else orphans.push(t);
            }
            if (openIn191) stints.push({ in: openIn191, out: null });
            // Hours come from the RAW stints (matches pay math exactly —
            // the 1-second switch gaps stay excluded), BEFORE the display
            // merge below.
            let mins191 = 0, open191 = false;
            for (const s of stints) {
              if (!s.out) { open191 = true; continue; }
              const [ih, im] = s.in.hhmm.split(":").map(Number), [oh, om] = s.out.hhmm.split(":").map(Number);
              mins191 += (oh * 60 + om) - (ih * 60 + im);
            }
            // Block 199 (Daniel, day 4): SHOP-LEVEL VIEW. Accounting cares
            // about time IN THE SHOP — first punch, lunch, last punch —
            // never line moves. A line switch writes OUT+IN one second
            // apart (reason "Switched lines"), which made a normal day
            // read as four confusing mini-stints ("clocking in and out
            // within minutes of eachother"). Chain those into ONE row
            // here; the interior switch punches stay in the DB untouched
            // (they feed cab pace math). Save moves only the day's real
            // edges; Remove voids the whole chain atomically (void_run).
            const merged199 = [];
            for (const s of stints) {
              const prev = merged199[merged199.length - 1];
              if (prev && prev.out && prev.out.rsn === "Switched lines" && s.in &&
                  new Date(s.in.at).getTime() - new Date(prev.out.at).getTime() < 120000) {
                prev.mids.push(prev.out.hhmm);
                prev.midIds.push(prev.out.id, s.in.id);
                prev.out = s.out;   // may be null — still on the clock
              } else merged199.push({ in: s.in, out: s.out, mids: [], midIds: [] });
            }
            // Block 216: any approved time-off row covering this day rides along
            // (sick days show on the card; the office can cancel a mis-tap).
            const to216 = toSel216.find((tRow) => tRow.start_date <= ds && tRow.end_date >= ds) || null;
            days191.push({ ds, dow, stints: merged199, orphans, hours: Math.round(mins191 / 6) / 10, open: open191,
              off216: to216 ? { id: to216.id, reason: to216.reason || "time off", offHrs: to216.hours != null ? Number(to216.hours) : 8 } : null });
          }
        }
        tcard191 = { emps: tcEmps, selEmp: tcEmpSel, defLine: defLine189 || SHOP_LINE_ID, days: days191 };
      }
      // Block 215 (Daniel): the PAYROLL ODDITIES scan for the accounting view —
      // the tcard editor's alternation math run over EVERYONE's last 14 days so
      // tangles surface instead of waiting to be stumbled on. Flags per person
      // per Phoenix day: extra INs / extra OUTs (double-taps), a past day with
      // no clock-out, and system auto-closes (verify before the pay run).
      // Hourly people only; the Zz test account excluded (Block 215).
      let odd215 = [];
      if (acct189) {
        const byEmpDay215 = {};
        for (const ev of oddEvs215) { const dsO = phxDate(new Date(ev.claimed_at).getTime());
          ((byEmpDay215[ev.employee_id] = byEmpDay215[ev.employee_id] || {})[dsO] = byEmpDay215[ev.employee_id][dsO] || []).push(ev); }
        const todayO215 = phxDate(Date.now());
        for (const eO of tcEmps) {
          if (isTestAcct215(eO) || ["salary", "na"].includes(eO.pay_type)) continue;
          const daysO = byEmpDay215[eO.id] || {};
          for (const dsO in daysO) {
            let openP = null, extraIns = 0, extraOuts = 0, autoN = 0;
            for (const pO of daysO[dsO]) {
              if (pO.kind === "clock_in") { if (openP) extraIns++; openP = pO; }
              // Block 216 (Daniel: "we've adjusted their clock out times BUT
              // they dont seem to be going away"): an auto-close's KIND never
              // changes when accounting fixes its time — so a corrected or
              // replaced auto-out counts as VERIFIED and stops flagging.
              else { if (pO.kind === "clock_out_auto" && !pO.corrected_by && !pO.added_by) autoN++; if (!openP) extraOuts++; openP = null; }
            }
            const openEnd = Boolean(openP) && dsO !== todayO215;
            if (extraIns || extraOuts || openEnd || autoN) odd215.push({
              emp: eO.id, name: `${eO.first_name} ${eO.last_name}`, ds: dsO,
              bits: [extraIns ? `${extraIns} extra IN${extraIns > 1 ? "s" : ""} (double-tap?)` : "",
                     extraOuts ? `${extraOuts} extra OUT${extraOuts > 1 ? "s" : ""}` : "",
                     openEnd ? "no clock-out recorded" : "",
                     autoN ? "auto-closed by the system — verify" : ""].filter(Boolean).join(" · ") });
          }
        }
        odd215.sort((aO, zO) => (aO.ds < zO.ds ? 1 : aO.ds > zO.ds ? -1 : aO.name < zO.name ? -1 : 1));
      }
      // Q92: time-off — pending requests (the "needs you" queue), the upcoming
      // approved list, and the add-for-anyone picker inputs.
      const toReasonsM = toReasonRows212.map((r) => r.label);
      const toNameOf = (eid) => { const p = empNames.find((x) => x.id === eid); return p ? `${p.first_name} ${p.last_name}` : (nameOf[eid] || "?"); };
      const toDates = (a, b) => (a === b ? a : `${a} → ${b}`);
      const timeoff = {
        pending: toPendRows.map((t) => ({ id: t.id, who: toNameOf(t.employee_id), dates: toDates(t.start_date, t.end_date), reason: t.reason, reqnote: t.request_note })),
        upcoming: toUpRows.map((t) => ({ who: toNameOf(t.employee_id), dates: toDates(t.start_date, t.end_date), reason: t.reason })),
        emps: tcEmps, reasons: toReasonsM };
      // Q85: fix jobs — the currently-open ones + the recent signed-off cabs a
      // manager can send back, + the fixjob reason list.
      const fxLineName = Object.fromEntries(lines.map((l) => [l.id, l.name]));
      // Block 127 (M3, B2): hours-to-date per open fix — Fix-work punches summed by
      // the order they were booked to (cheap: only techs who've clocked fix work;
      // rows fetched in the Block-212 waves above).
      const fxMap127 = fxEmps127.length ? fixHoursByBuild(fxPunches127) : {};
      // Block 207: the ONE-TAP Body send-back list — the last few cabs to
      // LEAVE production (manager sign-off or crew self-pass), newest first,
      // still in production_complete (an already-returned cab drops off).
      const sbSeen207 = new Set(); const sendback207 = [];
      for (const evS of sbEv207) {
        const bidS = evS.payload && evS.payload.build_id; if (!bidS || sbSeen207.has(bidS)) continue; sbSeen207.add(bidS);
        const cS = fxCompleted.find((x) => x.id === bidS);
        if (cS && sendback207.length < 6) sendback207.push({ id: cS.id, order: cS.order_number, cab: cS.cab_number });
      }
      const fixjob = {
        open: fxOpenRows.map((f) => ({ order: f.order_number, cab: f.cab_number, line: fxLineName[f.line_id] || ("Line " + f.line_id), kind: f.fix_kind, reason: f.fix_reason, hours: f.fix_hours, note: f.fix_note, spent: fxMap127[f.id] || 0 })),
        completed: fxCompleted.map((c) => ({ id: c.id, order: c.order_number, cab: c.cab_number })),
        sendback: sendback207,
        reasons: fxReasons, lines: lines.map((l) => ({ id: l.id, name: l.name })) };
      // Block 61: projected finish per in-progress cab, shown on each active
      // line card. Same shared helper as /coverage + /meeting (one board read).
      const { byOrder: mgrProj } = proj212;
      return send(200, "text/html; charset=utf-8", managerPage(rows, reworkReasons, me.role === "admin", onClock, longRunners, recentDone, Boolean(repTog && repTog.enabled), afterHours, (insp188 || acct189) ? false : canCloseLines, (insp188 || acct189) ? null : tc, downReasons, timeoff, fixjob, mgrProj, insp188, acct189, tcard191, odd215));
    }

    // Q92 (part 2): THE MEETING PACK — a read-only living snapshot. Manager +
    // admin, like the cockpit. Reuses the board engine (internal fetch) plus a
    // few light reads; no data entry, no new tables.
    if (url.pathname === "/meeting") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,department,must_change_pin&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin")) { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const board = await fetch(`http://127.0.0.1:${PORT}/api/board-state`, { headers: { cookie: req.headers.cookie || "" } }).then((r) => r.json()).catch(() => null);
      const prods = await db(`product?select=part_number,family`);
      const familyOf = Object.fromEntries(prods.map((p) => [p.part_number, p.family]));
      const lns = await db(`line?select=id,name`);
      const lineName = Object.fromEntries(lns.map((l) => [l.id, l.name]));
      // Finishing = cabs awaiting sign-off (done building, on the manager's desk).
      const awaitRows = await db(`build?select=order_number,part_number,line_id&state=eq.awaiting_inspection&order=created_at`);
      const awaiting = awaitRows.map((b) => ({ order: b.order_number, family: familyOf[b.part_number] || "", line: lineName[b.line_id] || "" }));
      // Completed in the last 7 days = the production_complete events (payload
      // carries order_number; join the build for family + cab #).
      const sinceISO = new Date(Date.now() - 7 * 86400000).toISOString();
      // Q86: names + roles resolved once, used for both the sign-off "by" tag
      // (who passed steel; ADMIN sign-offs flagged) and the who's-out list.
      const emps = await db(`employee?select=id,first_name,last_name,role`);
      const nameOf = Object.fromEntries(emps.map((e) => [e.id, `${e.first_name} ${e.last_name ? e.last_name[0] + "." : ""}`.trim()]));
      const roleOf = Object.fromEntries(emps.map((e) => [e.id, e.role]));
      const compEv = await db(`event_log?select=at,actor_id,payload&event_type=eq.build.production_complete&at=gte.${sinceISO}&order=at.desc&limit=100`);
      const compIds = compEv.map((e) => e.payload && e.payload.build_id).filter((x) => isUuid(x));
      const compBuilds = compIds.length ? await db(`build?select=id,part_number,cab_number&id=in.(${compIds.join(",")})`) : [];
      const bById = Object.fromEntries(compBuilds.map((b) => [b.id, b]));
      const completed = compEv.map((e) => { const p = e.payload || {}, bb = bById[p.build_id] || {}; const byRole = (p.by_role) || roleOf[e.actor_id] || null; return { order: p.order_number || "?", family: familyOf[bb.part_number] || "", cab: bb.cab_number || "", when: phxHM(e.at), by: nameOf[e.actor_id] || "", byAdmin: byRole === "admin" }; });
      // Who's out ahead = approved time off not yet ended.
      const today = phxDate(Date.now());
      const outRows = await db(`time_off_request?select=employee_id,start_date,end_date,reason&status=eq.approved&end_date=gte.${today}&order=start_date&limit=60`);
      const fmtD = (d) => String(d).slice(5).replace("-", "/"); // MM/DD from YYYY-MM-DD
      const out = outRows.map((t) => ({ who: nameOf[t.employee_id] || "?", dates: t.start_date === t.end_date ? fmtD(t.start_date) : `${fmtD(t.start_date)}–${fmtD(t.end_date)}`, reason: t.reason || "" }));
      // Block 61: projected finish on the floor lines — shared helper, reusing
      // the board we already fetched above (no extra board read).
      const { byOrder: mtProj } = await cabProjections(board);
      return send(200, "text/html; charset=utf-8", meetingPage(phxHM(Date.now()), board, awaiting, completed, out, mtProj, me.role === "admin", me));
    }

    // Q92 pt 2: the COVERAGE CALENDAR — the next 14 days of who's out, laid
    // against the shop calendar, so a manager sees a thin day coming. Same
    // manager/admin gate as /meeting; read-only, nothing goes out.
    if (url.pathname === "/coverage") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,department,must_change_pin&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin")) { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const N = 14, HORIZON = 180;   // grid shows 14 days; projection scans up to 180 ahead
      const phxMid = Math.floor((Date.now() - PHX_OFFSET_MS) / 86400000) * 86400000 + PHX_OFFSET_MS;
      const dates = [];
      for (let i = 0; i < N; i++) dates.push(phxDate(phxMid + i * 86400000));
      const today = dates[0];
      const horizonEnd = phxDate(phxMid + HORIZON * 86400000);
      // Shop-calendar overrides (holidays / worked Saturdays) + their reasons —
      // widened to the whole projection horizon so a far-off finish is exact.
      const calRows = await db(`shop_calendar?select=cal_date,is_open,reason&cal_date=gte.${today}&cal_date=lte.${horizonEnd}`).catch(() => []);
      const calOv = {}, calReason = {};
      for (const r of calRows) { const d = String(r.cal_date).slice(0, 10); calOv[d] = r.is_open === true; calReason[d] = r.reason || ""; }
      // Approved time off overlapping the horizon.
      const offRows = await db(`time_off_request?select=employee_id,start_date,end_date,reason&status=eq.approved&end_date=gte.${today}&start_date=lte.${horizonEnd}&order=start_date`).catch(() => []);
      const emps = await db(`employee?select=id,first_name,last_name,role,lines&active=is.true`);
      const nameOf = {}, roleOf = {};
      for (const e of emps) { nameOf[e.id] = `${e.first_name} ${e.last_name ? e.last_name[0] + "." : ""}`.trim(); roleOf[e.id] = e.role; }
      const builderCount = emps.filter((e) => e.role === "production").length;
      const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const isOpenDay = (d) => (d in calOv ? calOv[d] : (() => { const dw = new Date(d + "T12:00:00Z").getUTCDay(); return dw >= 1 && dw <= 5; })());
      const days = dates.map((d) => {
        const dow = new Date(d + "T12:00:00Z").getUTCDay();
        const open = isOpenDay(d);
        const outAll = offRows.filter((t) => t.start_date <= d && t.end_date >= d)
          .map((t) => ({ who: nameOf[t.employee_id] || "?", reason: t.reason || "", role: roleOf[t.employee_id] || "" }));
        const buildersOut = outAll.filter((o) => o.role === "production").length;
        const present = Math.max(0, builderCount - buildersOut);
        const thin = builderCount > 0 && present > 0 && present < Math.ceil(builderCount / 2);
        return { date: d, dow: WD[dow], label: MON[Number(d.slice(5, 7)) - 1] + " " + Number(d.slice(8, 10)),
          closed: !open, closedReason: (d in calOv && !calOv[d]) ? (calReason[d] || "Holiday") : (!open ? "Weekend" : ""),
          out: outAll, buildersOut, present, thin, isToday: d === today };
      });
      // Per-cab finish projection — now the SHARED helper (block 61), the one
      // source of truth the Meeting Pack floor + the cockpit also read.
      const board = await fetch(`http://127.0.0.1:${PORT}/api/board-state`).then((r) => r.json()).catch(() => null);
      const { cabs } = await cabProjections(board);
      return send(200, "text/html; charset=utf-8", coveragePage(phxHM(Date.now()), days, builderCount, cabs, me.role === "admin", me));
    }

    // REPORTS v1 (file 12 / Q26): manager + admin only, like the cockpit.
    // Staff-level numbers never reach the floor (file 12 privacy rule).
    // PAY WORKSHEET (payroll hours export) — admin-only (payroll is sensitive).
    if (url.pathname === "/payroll" || url.pathname === "/payroll.csv") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,department,must_change_pin&id=eq.${empId}`);
      // Block 189 (owner ruling): the ACCOUNTING manager runs payroll — the
      // Pay Worksheet is literally her deliverable. Admins as before.
      const payOk189 = me && (me.role === "admin" || (me.role === "manager" && me.department === "Accounting"));
      if (!payOk189) { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const period = payPeriod(url.searchParams);
      const data = await payrollData(period.startMs, period.endMs);
      Object.assign(data, { preset: period.preset, from: period.from, to: period.to, pay: period.pay, qs: period.qs, label: period.label, rangeText: period.rangeText });
      if (url.pathname === "/payroll.csv") {
        const tag = period.preset === "custom" ? `${period.from}_to_${period.to}` : (period.to || period.preset);
        res.writeHead(200, { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="shopboard-payroll-${tag}.csv"` });
        return res.end(payrollCsv(data));
      }
      return send(200, "text/html; charset=utf-8", payrollPage(data, me.role === "admin"));
    }

    if (url.pathname === "/reports" || url.pathname === "/reports.csv") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,department&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin")) { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      // Reports are ADMIN work (owner-rep 2026-07-29); a manager only gets in
      // if an admin flipped the "Managers can see Reports" switch (Q65).
      // Block 189 gave the Accounting manager a free pass; Block 215 (Daniel)
      // REVOKED it — "this position does not need access to reports, only pay
      // worksheet." Accounting managers now go through the same toggle as
      // every other manager.
      if (me.role === "manager") {
        const [tog] = await db(`feature_toggle?select=enabled&key=eq.manager_reports`);
        if (!tog || !tog.enabled)
          return send(403, "text/html; charset=utf-8", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board"><title>Shop Board</title>${style}</head><body><div class="wrap" style="text-align:center;max-width:560px"><h2>Reports are admin-only right now</h2><p style="opacity:.7">An admin can share them with managers from the console &mdash; Features, "Managers can see Reports".</p><p><a href="/home" style="color:#8e8e93">&#8962; Home</a></p></div></body></html>`);
      }
      const period = reportPeriod(url.searchParams);
      const data = await reportData(period.startMs, period.endMs);
      Object.assign(data, { preset: period.preset, from: period.from, to: period.to,
        qs: period.qs, label: period.label, rangeText: period.rangeText });
      if (url.pathname === "/reports.csv") {
        const which = ["products", "labor", "cabs", "timecards"].includes(url.searchParams.get("which"))
          ? url.searchParams.get("which") : "cabs";
        const tag = period.preset === "custom" ? `${period.from}_to_${period.to}` : period.preset;
        res.writeHead(200, { "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="shopboard-${which}-${tag}.csv"` });
        return res.end(reportCsv(which, data));
      }
      return send(200, "text/html; charset=utf-8", reportsPage(data, me.role === "admin", me));
    }

    // Q84: MANAGER-INTEGRITY DIAGNOSTICS — ADMIN ONLY (file 25). The player-coach
    // manager is inside the circle of temptation (he shares the bonus and holds
    // the pause buttons), so his integrity signals surface to the ADMIN, above
    // him — never to the floor, never auto-acted on. Read-only, derived from the
    // append-only audit log; reuses the reports period picker.
    if (url.pathname === "/integrity") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,must_change_pin&id=eq.${empId}`);
      if (!me || me.role !== "admin") { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const period = reportPeriod(url.searchParams);
      const data = await integrityData(period.startMs, period.endMs);
      Object.assign(data, { preset: period.preset, from: period.from, to: period.to, qs: period.qs, label: period.label, rangeText: period.rangeText });
      return send(200, "text/html; charset=utf-8", integrityPage(data));
    }

    // COYOTE INTAKE INBOX (Track A) — admin-only, read-only review of the
    // orders Coyote has pushed, before the mapping job builds them into cabs.
    if (url.pathname === "/intake") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,must_change_pin&id=eq.${empId}`);
      if (!me || me.role !== "admin") { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const data = await intakeInboxData();
      return send(200, "text/html; charset=utf-8", intakeInboxPage(data));
    }

    // COYOTE -> BOARD MAPPER — dry-run preview (admin-only, read-only). Shows
    // what the mapping job WOULD create for each fresh order; writes nothing.
    if (url.pathname === "/mapper") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,must_change_pin&id=eq.${empId}`);
      if (!me || me.role !== "admin") { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const data = await mapperPreviewData();
      return send(200, "text/html; charset=utf-8", mapperPreviewPage(data));
    }

    // LATEST PUSH — WHAT CHANGED (admin-only, read-only). Push-to-push diff.
    if (url.pathname === "/changes") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,must_change_pin&id=eq.${empId}`);
      if (!me || me.role !== "admin") { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const data = await pushDiffData();
      return send(200, "text/html; charset=utf-8", pushDiffPage(data));
    }

    // COYOTE FEED MONITOR (admin-only, read-only). Data health + push log.
    if (url.pathname === "/feed") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,must_change_pin&id=eq.${empId}`);
      if (!me || me.role !== "admin") { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const data = await feedMonitorData();
      return send(200, "text/html; charset=utf-8", feedMonitorPage(data));
    }

    // ORDER HISTORY (admin-only, read-only). One order's full Coyote push
    // history + how it maps. n is shape-guarded + URL-encoded in the data fn.
    if (url.pathname === "/order") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,must_change_pin&id=eq.${empId}`);
      if (!me || me.role !== "admin") { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const data = await orderHistoryData(url.searchParams.get("n"));
      return send(200, "text/html; charset=utf-8", orderHistoryPage(data));
    }

    // LINES & PARTS MANAGER (admin-only). Config for production lines + the cab
    // part numbers Coyote routes to them. Read here; write via /api/admin/line
    // and /api/admin/catalog below.
    if (url.pathname === "/lines") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,must_change_pin&id=eq.${empId}`);
      if (!me || me.role !== "admin") { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const data = await linesManagerData();
      return send(200, "text/html; charset=utf-8", linesManagerPage(data));
    }

    // SYNC (admin-only). GET = PREVIEW the Coyote→board write engine (writes
    // NOTHING — shows exactly what it would place/hold/complete/cancel/park).
    // The apply run is /api/admin/sync {mode:"apply"} (scheduler / on-demand).
    if (url.pathname === "/sync") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,must_change_pin&id=eq.${empId}`);
      if (!me || me.role !== "admin") { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118: pages never dead-end
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const sum = await syncRun(false, empId);
      return send(200, "text/html; charset=utf-8", syncPage({ sum, preview: true }));
    }

    // RECONCILE (admin-only): the board ↔ wall bridge. Lists every open board
    // cab grouped by line with its Coyote context + the family's next-up number
    // as a hint, so an admin walks the wall and types each its real cab number.
    // Reuses /api/admin/cab-number for the (audited, dup-guarded) writes.
    if (url.pathname === "/reconcile") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,department,must_change_pin&id=eq.${empId}`);
      if (!me || (me.role !== "admin" && me.role !== "manager" && me.department !== "Warehouse")) { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); }
      const data = await reconcileData();
      const vaR90 = String(url.searchParams.get("viewas") || "").toLowerCase();
      return send(200, "text/html; charset=utf-8", reconcilePage(data, (vaR90 && me.role === "admin") ? "viewer-preview" : me.role));
    }

    // TECH FINISH (file 11, builder half): every non-background step complete
    // -> final note -> AWAITING INSPECTION. Any clocked-on tech may send it
    // (Q104); the paused clock there is management's bottleneck (Q53/C11).
    // Block 98: live finish-photo count (feeds the gate + the hand-off poll).
    if (url.pathname === "/api/build/photocount") {
      const empPC = await liveSession(req);
      if (!empPC) return json(401, { ok: false, error: "Signed out" });
      const bidPC = url.searchParams.get("build_id");
      if (!isUuid(bidPC)) return json(400, { ok: false, error: "Bad reference" });
      const shotsPC = await db(`build_photo?select=id&build_id=eq.${bidPC}&kind=eq.finish`);
      return json(200, { ok: true, count: shotsPC.length });
    }

    if (url.pathname === "/api/build/finish" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      // Block 194 (Blazer lesson, day 3): a MANAGER can send a done cab to
      // inspection from the cockpit — no clock-in required (they're at the
      // console, not on a line), and photo_pass lets them waive the
      // completion-photo minimum (loudly audited below). The Blazer finished
      // all 26 steps at 7:22 and got red-buttoned past inspection at 7:34
      // because this path didn't exist. Crew path is unchanged: clocked in,
      // photos required.
      const [meF194] = await db(`employee?select=role&id=eq.${empId}`);
      const mgrF194 = Boolean(meF194 && (meF194.role === "manager" || meF194.role === "admin"));
      if (!mgrF194) {
        const [lastCk] = await db(`clock_event?select=kind&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
        if (!lastCk || lastCk.kind !== "clock_in")
          return json(403, { ok: false, error: "Clock in first" });
      }
      const { build_id, note, claimed_at, photo_pass } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [b] = await db(`build?select=id,state,order_number,cab_number,line_id,part_number&id=eq.${build_id}`);
      // Accepts ACTIVE (first finish), REWORK (resubmit after fixes, file 18),
      // and FIX_JOB (Q85: a returned/kicked-back cab resubmitting for re-inspection).
      if (!b || (b.state !== "active" && b.state !== "rework" && b.state !== "fix_job"))
        return json(400, { ok: false, error: "Cab is not in a finishable state" });
      const open = await db(`task?select=id&build_id=eq.${build_id}&is_background=is.false&state=neq.complete&limit=1`);
      if (open.length) return json(400, { ok: false, error: "There are still open steps on this cab" });
      // Q86: HARD per-product completion-photo gate (product.photo_min; 0 exempts).
      const [prodF] = await db(`product?select=photo_min&part_number=eq.${encodeURIComponent(b.part_number)}`);
      const photoNeed = prodF ? prodF.photo_min : 1;
      if (photoNeed > 0) {
        const shots = await db(`build_photo?select=id&build_id=eq.${build_id}&kind=eq.finish`);
        if (shots.length < photoNeed) {
          // Block 194: a manager may WAIVE the photo minimum to unstick the
          // hand-off — but it's a loud, separate audit event, same honesty
          // pattern as Block 132's "started by management" flag.
          if (!(mgrF194 && photo_pass))
            return json(400, { ok: false, error: `This product needs at least ${photoNeed} completion photo${photoNeed === 1 ? "" : "s"} — attach ${photoNeed === 1 ? "one" : "them"} before finishing.` });
          logEvent("build.photos_waived", empId, { build_id, order_number: b.order_number, have: shots.length, need: photoNeed });
        }
      }
      // Block 207 (owner ruling, Sat 8/22): ONE-INSPECTION SYSTEM. A cab in
      // REWORK already had its manager inspection — that's where the rework
      // list came from. Once the crew checks off every rework item, they
      // push their OWN cab through to Body: no second manager inspection.
      // (This supersedes the file-18 "rework can never jump straight to
      // production complete" rule — the owner's call, with the safety valve
      // that Body managers send a bad fix back with ONE tap, which opens a
      // kickback FIX JOB: off-line, own hours bucket, never blocks the new
      // cab on the line. A kickback resubmit — state fix_job below — DOES
      // still route through a manager sign-off: the bar rises only after
      // the work has missed twice.) Loudly logged + bell-noticed so no
      // manager is surprised the cab moved.
      if (b.state === "rework") {
        await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({
          state: "production_complete", final_note: note || null,
          rework_reason: null, rework_hours: null, rework_note: null, rework_assigned_at: null,
          inspection_claimed_by: null, inspection_claimed_at: null }) });
        logEvent("build.self_passed", empId, { build_id, order_number: b.order_number, note: note || "", at: claimed_at });
        logEvent("build.production_complete", empId, { build_id, order_number: b.order_number, from_state: "rework", self_pass: true, signed_off_at: claimed_at });
        const [lnSP] = await db(`line?select=name&id=eq.${b.line_id}`);
        notify("build.line_clear", await warehouseIds(),
          `${lnSP ? lnSP.name : "Line"} is CLEAR`,
          `Order ${b.order_number}${b.cab_number ? ` (Cab #${b.cab_number})` : ""} — rework done, crew sent it to Body. Deliver the next kit when it's ready.`, "/home");
        const mgrsSP = await floorMgrIds220("inspect");
        if (mgrsSP.length) notify("build.self_passed", mgrsSP,
          `ORDER ${b.order_number} — rework done, sent to Body by the crew`,
          `Every rework item is checked off and production pushed the cab through (one-inspection system). If the fixes aren't right, Body sends it back with one tap on the Manager console.`, "/manager");
        return json(200, { ok: true, self_passed: true });
      }
      await db(`build?id=eq.${build_id}`, { method: "PATCH",
        body: JSON.stringify({ state: "awaiting_inspection", final_note: note || null,
          inspection_claimed_by: null, inspection_claimed_at: null }) });   // Block 184: a (re-)finished cab arrives at inspection UNCLAIMED
      // Block 125 (M3): a finished FIX leaves the finisher's screen — drop their
      // focus and step them off the Fix-work bucket to "off the line" so their
      // clock stops accruing against a cab that's now at inspection. (Other techs
      // who shared the fix auto-release: the cab screen ignores a focus whose
      // build is no longer a fix_job.)
      if (b.state === "fix_job") {
        const [lastFF] = await db(`clock_event?select=kind,line_id,claimed_at&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
        if (lastFF && lastFF.kind === "clock_in" && lastFF.line_id === FIX_LINE_ID) {
          const nowFF = new Date(claimed_at || Date.now());
          await db("clock_event", { method: "POST", body: JSON.stringify({
            employee_id: empId, line_id: FIX_LINE_ID, kind: "clock_out_early",
            reason: "Fix finished", claimed_at: nowFF.toISOString() }) });
          await db("clock_event", { method: "POST", body: JSON.stringify({
            employee_id: empId, line_id: 14, kind: "clock_in",
            claimed_at: new Date(nowFF.getTime() + 1000).toISOString() }) });
        }
        await db(`employee?id=eq.${empId}`, { method: "PATCH", body: JSON.stringify({ focus_build_id: null }) });
      }
      logEvent("build.finish", empId, { build_id, order_number: b.order_number, note: note || "", from_state: b.state, at: claimed_at });
      // Q109-7: heading-to-inspection IS warehouse's firm "go pull the next
      // kit" signal — the first real event on the notification matrix.
      // Q106: sandboxed to the owner-rep until cutover, like everything.
      const [lnF] = await db(`line?select=name&id=eq.${b.line_id}`);
      notify("build.awaiting_inspection", await warehouseIds(),
        `${lnF ? lnF.name : "Line"} — pull the next kit`,
        `Order ${b.order_number}${b.cab_number ? ` (Cab #${b.cab_number})` : ""} is heading to inspection. The line frees soon.`, "/home");
      // Block 99 (owner-rep): the DIRECT review signal — a finished cab is the
      // manager's ACTION ITEM, not just planning info. Always on; delivery
      // obeys the Q106 sandbox until cutover like everything else.
      const mgrsI99 = await floorMgrIds220("inspect");
      // Block 226 (Daniel, 8/26): LINE-FIRST title — inspectors know which
      // LINE to walk to, not which cab number. Order stays in the body.
      if (mgrsI99.length) notify("build.ready_inspection", mgrsI99,
        `${lnF ? lnF.name : "A line"} — ready for inspection`,
        `Order ${b.order_number}${b.cab_number ? ` (Cab #${b.cab_number})` : ""} — production finished. Sign off on the Manager console, or send it back with a reason and hours.`, "/manager");
      // Q91: the manager-facing "line frees up soon" heads-up (distinct from the
      // warehouse pull signal above) — for on-deck planning. Toggle-gated, OFF
      // by default; delivery still obeys the Q106 sandbox.
      const [lfsTog] = await db(`feature_toggle?select=enabled&key=eq.line_frees_soon_alert`);
      if (lfsTog && lfsTog.enabled === true) {
        const mgrs = await floorMgrIds220();
        if (mgrs.length) notify("touch.linefrees", mgrs, `${lnF ? lnF.name : "A line"} frees up soon`,
          `Order ${b.order_number}${b.cab_number ? ` (Cab #${b.cab_number})` : ""} is heading to inspection — the line will be ready for the next cab shortly.`, "/manager");
      }
      return json(200, { ok: true });
    }

    // MANAGER CLOCK-OUT (risk sweep 2026-07-28): the same-day correction tool
    // for a forgotten clock-out — manager/admin taps the person out from the
    // cockpit's "On the clock" list. Audited: who forced it is in the event.
    if (url.pathname === "/api/clock/force-out" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { employee_id } = await body(req);
      const [lastCk] = await db(`clock_event?select=kind,line_id&voided=is.false&employee_id=eq.${employee_id}&order=claimed_at.desc&limit=1`);
      if (!lastCk || lastCk.kind !== "clock_in")
        return json(400, { ok: false, error: "They're not on the clock" });
      await db("clock_event", { method: "POST", body: JSON.stringify({
        employee_id, line_id: lastCk.line_id, kind: "clock_out_auto",
        reason: "Manager clock-out", claimed_at: new Date().toISOString() }) });
      logEvent("clock.force_out", empId, { employee_id, cause: "manager" });
      return json(200, { ok: true });
    }

    // REWORK ASSIGNMENT (files 11/18, manager half of a FAILED inspection):
    // Block 184 (owner design, launch day 1): INSPECTION CLAIM. Three
    // inspectors (Mike + the Body Shop managers) share one ready-for-
    // inspection signal; the first "I've got this one" tap stamps the cab so
    // the others don't cross the shop for nothing. SOFT claim by design — it
    // coordinates, it never locks: any manager can still sign off, take over,
    // or release. The claim clears on sign-off, rework, and (re-)finish.
    if (url.pathname === "/api/inspect/claim" && req.method === "POST") {
      const empC = await liveSession(req);
      if (!empC) return json(401, { ok: false, error: "Signed out" });
      const [meC] = await db(`employee?select=role&id=eq.${empC}`);
      if (!meC || (meC.role !== "manager" && meC.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { build_id, action } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      if (!["claim", "takeover", "release"].includes(action)) return json(400, { ok: false, error: "Unknown action" });   // Block 185: no fall-through to claim
      const [bC] = await db(`build?select=id,state,order_number,inspection_claimed_by&id=eq.${build_id}`);
      if (!bC || bC.state !== "awaiting_inspection")
        return json(400, { ok: false, stale: true, error: "That cab isn't awaiting inspection anymore" });
      const nowC = new Date().toISOString();
      if (action === "release") {
        if (bC.inspection_claimed_by)
          await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({ inspection_claimed_by: null, inspection_claimed_at: null }) });
        logEvent("inspection.released", empC, { build_id, order_number: bC.order_number, was: bC.inspection_claimed_by });
        return json(200, { ok: true });
      }
      if (action === "takeover") {
        await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({ inspection_claimed_by: empC, inspection_claimed_at: nowC }) });
        logEvent("inspection.taken_over", empC, { build_id, order_number: bC.order_number, from: bC.inspection_claimed_by });
        return json(200, { ok: true });
      }
      // Plain claim: FIRST TAP WINS — the PATCH's filter only matches while
      // the cab is unclaimed, so a same-second race has exactly one winner.
      const wonC = await db(`build?id=eq.${build_id}&inspection_claimed_by=is.null`, {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ inspection_claimed_by: empC, inspection_claimed_at: nowC }) });
      if (!wonC || !wonC.length) {
        const [curC] = await db(`build?select=inspection_claimed_by&id=eq.${build_id}`);
        const [whoC] = curC && curC.inspection_claimed_by ? await db(`employee?select=first_name&id=eq.${curC.inspection_claimed_by}`) : [];
        return json(409, { ok: false, stale: true, error: `${(whoC && whoC.first_name) || "Someone"} beat you to it — they've got this one` });
      }
      logEvent("inspection.claimed", empC, { build_id, order_number: bC.order_number, at: nowC });
      return json(200, { ok: true });
    }

    // awaiting_inspection -> rework, manager-only, reason-coded (Q77 list)
    // with a note and a TIME FRAME in hours. A fix task (day_no 0, source
    // 'rework', 0 standard hours — rework hours live in their OWN bucket,
    // Q85, so pace/earned never gains from fix work) lands on the cab's
    // screen, and (block 23) the line's techs get a push the moment it's
    // assigned — Q106-sandboxed to the owner-rep until cutover.
    if (url.pathname === "/api/build/rework" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { build_id, reason, note, hours, claimed_at } = await body(req);
      if (!reason) return json(400, { ok: false, error: "Pick a reason" });
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [b] = await db(`build?select=id,state,order_number,cab_number,line_id&id=eq.${build_id}`);
      if (!b || b.state !== "awaiting_inspection")
        return json(400, { ok: false, error: "Only a cab awaiting inspection can be sent back" });
      const when = claimed_at || new Date().toISOString();
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({
        state: "rework", rework_reason: reason, rework_note: note || null,
        rework_hours: Number(hours) || null, rework_assigned_at: when,
        inspection_claimed_by: null, inspection_claimed_at: null }) });   // Block 184: leaving inspection clears the claim
      const priors = await db(`task?select=id&build_id=eq.${build_id}&source=eq.rework`);
      await db("task", { method: "POST", body: JSON.stringify({
        build_id, display_no: `R${priors.length + 1}`,
        name: `Fix: ${reason}${note ? ` — ${note}` : ""}`,
        day_no: 0, man_hours: 0, is_background: false,
        source: "rework", state: "not_started", sort_order: 1000 + priors.length }) });
      logEvent("build.rework_assigned", empId, { build_id, order_number: b.order_number,
        reason, note: note || "", hours: Number(hours) || null, at: when });
      // File 16: the line's usual techs hear it the moment it's assigned —
      // no walking to the board to discover the cab came back. Q106 sandbox.
      const techsR = await db(`employee?select=id&active=is.true&lines=cs.{${b.line_id}}`);
      // Block 223 (Daniel, 8/26): KID-GLOVES COPY — the crew's bell should
      // never read like a verdict. Facts stay (reason, note, hours, where);
      // the failure reason moves out of the HEADLINE, "sent back" becomes
      // "one more pass", "hrs given" becomes "hrs set aside".
      notify("build.rework_assigned", techsR.map((t) => t.id),
        `Order ${b.order_number} — one more pass`,
        `A fix step is on the cab screen: ${reason}${note ? " — " + note : ""}. ${Number(hours) || "?"} hrs set aside for it. Grab it when you're ready.`, "/home");
      return json(200, { ok: true });
    }

    // Q85: OPEN A FIX JOB — a signed-off (production_complete) cab comes BACK
    // for a production fix: a Body Shop kickback or a customer return. It
    // re-opens its ORIGINAL record as a FIX JOB (never a new build): reason-
    // coded, own deadline, own hours bucket (fix task = 0 standard hours, like
    // rework — pace/earned never gains from fix work), and it must pass
    // RE-INSPECTION to close. Opening one logs a "sign-off escape".
    if (url.pathname === "/api/build/fixjob" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { build_id, kind, reason, note, hours, line_id, claimed_at } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      if (kind !== "kickback" && kind !== "customer_return")
        return json(400, { ok: false, error: "Pick kickback or customer return" });
      if (!reason) return json(400, { ok: false, error: "Pick a reason" });
      const [b] = await db(`build?select=id,state,order_number,cab_number,line_id&id=eq.${build_id}`);
      if (!b || b.state !== "production_complete")
        return json(400, { ok: false, error: "Only a signed-off cab can come back as a fix job" });
      // Which line it runs on: the manager's pick, else the cab's original line.
      let lineId = b.line_id;
      if (line_id !== undefined && line_id !== null && line_id !== "") {
        if (!Number.isInteger(Number(line_id))) return json(400, { ok: false, error: "That line isn't valid" });
        lineId = Number(line_id);
      }
      const when = claimed_at || new Date().toISOString();
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({
        state: "fix_job", line_id: lineId, fix_kind: kind, fix_reason: reason,
        fix_note: note || null, fix_hours: Number(hours) || null, fix_assigned_at: when }) });
      const priors = await db(`task?select=id&build_id=eq.${build_id}&source=eq.fix`);
      await db("task", { method: "POST", body: JSON.stringify({
        build_id, display_no: `F${priors.length + 1}`,
        name: `Fix: ${reason}${note ? ` — ${note}` : ""}`,
        day_no: 0, man_hours: 0, is_background: false,
        source: "fix", state: "not_started", sort_order: 2000 + priors.length }) });
      // THE SIGN-OFF ESCAPE record (management scoreboard, Q85 report suite 5) —
      // a return AFTER manager sign-off, the number the inspection gate zeroes out.
      logEvent("build.fixjob_opened", empId, { build_id, order_number: b.order_number,
        kind, reason, note: note || "", hours: Number(hours) || null, line_id: lineId, was_signed_off: true, at: when });
      // The chosen line's techs hear it (Q106 sandbox holds delivery to owner-rep).
      const techsFx = await db(`employee?select=id&active=is.true&lines=cs.{${lineId}}`);
      // Block 223 (Daniel, 8/26): KID-GLOVES COPY — "kickback" is scoreboard
      // language; the crew's version is neutral. kind stays in the event log
      // and the manager lanes where it belongs.
      const [lnFx223] = await db(`line?select=name&id=eq.${lineId}`);
      notify("build.fixjob_opened", techsFx.map((t) => t.id),
        `Order ${b.order_number} is back${lnFx223 ? ` on ${lnFx223.name}` : ""}`,
        `It needs a fix after sign-off: ${reason}${note ? " — " + note : ""}. ${Number(hours) || "?"} hrs set aside. The fix step is on the cab screen.`, "/home");
      return json(200, { ok: true });
    }

    // SIGN-OFF: manager completes the cab (file 11 gate, manager half).
    // Normal path = from AWAITING INSPECTION; direct from active allowed too
    // (manager judgment call — both are logged with the state they came from).
    if (url.pathname === "/api/build/complete" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { build_id, claimed_at, force } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [b] = await db(`build?select=id,state,order_number,cab_number,line_id,fix_kind,fix_reason,fix_assigned_at&id=eq.${build_id}`);
      if (!b || (b.state !== "active" && b.state !== "awaiting_inspection"))
        return json(400, { ok: false, error: "Cab is not active or awaiting inspection" });
      // Block 109 (owner-rep): advancing a cab to BODY with steps still open
      // must never happen by accident. The manager override stays (block 99
      // judgment call) but it is INFORMED now — the first tap reports how
      // many steps are open, the second tap confirms; overrides are audited.
      const openT109 = await db(`task?select=id&build_id=eq.${build_id}&state=neq.complete&is_background=is.false`);
      if (openT109.length && !force)
        return json(400, { ok: false, needs_force: true, open: openT109.length, error: `${openT109.length} step${openT109.length > 1 ? "s" : ""} still open on this cab — signing off advances it out of production anyway.` });
      if (openT109.length) logEvent("build.signoff_override", empId, { build_id, order_number: b.order_number, open_steps: openT109.length });
      // Q85: if this cab carried a fix job (fix_assigned_at set), signing off is
      // the RE-INSPECTION pass — close the fix episode and clear its fields.
      const wasFix = !!b.fix_assigned_at;
      // Block 123 (logic audit L12): a signed-off cab shouldn't keep stale
      // rework fields — clear them too (a cab that never reworked has null).
      const patchC = { state: "production_complete", rework_reason: null, rework_hours: null, rework_note: null, rework_assigned_at: null, inspection_claimed_by: null, inspection_claimed_at: null };   // Block 184: sign-off clears the claim
      if (wasFix) { patchC.fix_kind = null; patchC.fix_reason = null; patchC.fix_note = null; patchC.fix_hours = null; patchC.fix_assigned_at = null; }
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify(patchC) });
      logEvent("build.production_complete", empId, { build_id, order_number: b.order_number, from_state: b.state, signed_off_at: claimed_at, re_inspection: wasFix, by_role: me.role });
      if (wasFix) logEvent("build.fixjob_closed", empId, { build_id, order_number: b.order_number, kind: b.fix_kind, reason: b.fix_reason, signed_off_at: claimed_at });
      // Q109: sign-off frees the line — warehouse can deliver the next
      // verified kit the moment this fires. Q106 sandbox applies.
      const [lnC] = await db(`line?select=name&id=eq.${b.line_id}`);
      notify("build.line_clear", await warehouseIds(),
        `${lnC ? lnC.name : "Line"} is CLEAR`,
        `Order ${b.order_number}${b.cab_number ? ` (Cab #${b.cab_number})` : ""} signed off — deliver the next kit when it's ready.`, "/home");
      return json(200, { ok: true });
    }

    // START NEXT BUILD: upcoming -> active, and the Q97 FREEZE happens here —
    // the template's steps are copied into this cab's own task list, so later
    // template edits never rewrite a started cab's checklist.
    // Q109 gate, shared by the four kit endpoints: warehouse department OR
    // a manager/admin (they can always step in).
    const requireWarehouse = async (mustClock = false) => {
      const empId = await liveSession(req);
      if (!empId) return [null, json(401, { ok: false, error: "Signed out" })];
      const [me] = await db(`employee?select=role,department&id=eq.${empId}`);
      if (!me || (me.department !== "Warehouse" && me.role !== "manager" && me.role !== "admin"))
        return [null, json(403, { ok: false, error: "Warehouse, manager or admin only" })];
      // Block 97 (owner-rep): signed in is NOT on the clock. Working the line
      // requires an open clock-in for warehouse staff (managers/admins exempt —
      // they fix things). The tap works the moment they punch in.
      if (mustClock && me.department === "Warehouse" && me.role !== "manager" && me.role !== "admin") {
        const [lastP97] = await db(`clock_event?select=kind&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
        if (!lastP97 || lastP97.kind !== "clock_in")
          return [null, json(403, { ok: false, error: "Clock in first — tap Clock in at the top, then work the line" })];
      }
      return [empId, null];
    };

    // Block 97 (owner-rep): UNDO START — the escape hatch for a fat-fingered
    // "Delivered — start the cab". ADMIN only, SAME Phoenix day only. The cab
    // returns to upcoming at the FRONT of its line's queue; the frozen task
    // rows (a derived copy of the template + options) are removed and the
    // freeze runs fresh on the next start; unresolved option flags from the
    // mistaken start go too (the next freeze re-raises what still applies).
    // Kit stays verified + pulled so warehouse can re-deliver in one tap.
    // Fully audited with row counts. Completed work blocks the undo.
    if (url.pathname === "/api/build/unstart" && req.method === "POST") {
      const empU = await liveSession(req);
      if (!empU) return json(401, { ok: false, error: "Signed out" });
      const [meU] = await db(`employee?select=role&id=eq.${empU}`);
      if (!meU || meU.role !== "admin") return json(403, { ok: false, error: "Admin only" });
      const { build_id, claimed_at } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [bU] = await db(`build?select=id,order_number,line_id,state,started_at&id=eq.${build_id}`);
      if (!bU || bU.state !== "active") return json(400, { ok: false, error: "Only an ACTIVE cab can be un-started" });
      const phx97 = (ms) => new Date(ms - 7 * 3600000).toISOString().slice(0, 10);
      if (!bU.started_at || phx97(new Date(bU.started_at).getTime()) !== phx97(Date.now()))
        return json(400, { ok: false, error: "Same-day only — this cab started on an earlier day" });
      // Block 123 (logic audit M1): also refuse while a step is IN PROGRESS —
      // a tech is actively working it. Un-starting would delete that task out
      // from under them and leave their clock-in accruing against a cab with no
      // tasks. Completed OR in-progress both send you to the manager tools.
      const doneU = await db(`task?select=id,state&build_id=eq.${build_id}&state=in.(complete,in_progress)&limit=1`);
      if (doneU.length) return json(400, { ok: false, error: doneU[0].state === "in_progress" ? "Someone's working a step right now — can't un-start. Have them stop first, or use the manager tools." : "Steps are already checked off — handle this with the manager tools instead" });
      const allT = await db(`task?select=id&build_id=eq.${build_id}`);
      await db(`task?build_id=eq.${build_id}`, { method: "DELETE" });
      const openF = await db(`option_flag?select=id&build_id=eq.${build_id}&resolved=is.false`);
      if (openF.length) await db(`option_flag?build_id=eq.${build_id}&resolved=is.false`, { method: "DELETE" });
      // Front of the queue: one less than the line's smallest queue_pos.
      const qMin = await db(`build?select=queue_pos&line_id=eq.${bU.line_id}&state=eq.upcoming&queue_pos=not.is.null&order=queue_pos.asc&limit=1`);
      const newPos = qMin.length && qMin[0].queue_pos != null ? Number(qMin[0].queue_pos) - 1 : 0;
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({
        state: "upcoming", started_at: null, kit_delivered_at: null, kit_delivered_by: null,
        options_sig: null, queue_pos: newPos, pace_alert_color: null, promised_finish: null }) });
      logEvent("build.unstarted", empU, { build_id, order_number: bU.order_number, line_id: bU.line_id,
        task_rows_removed: allT.length, open_flags_removed: openF.length, at: claimed_at || new Date().toISOString() });
      boardTick();
      return json(200, { ok: true });
    }

    if (url.pathname === "/api/build/start" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { build_id, claimed_at } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [b] = await db(`build?select=id,state,line_id,part_number,order_number&id=eq.${build_id}`);
      if (!b || b.state !== "upcoming") return json(400, { ok: false, error: "Cab is not waiting to start" });
      // Block 121 (owner-rep): a line holds ONE cab until a manager SIGNS IT
      // OFF — the finished cab stays on the line through inspection/rework and
      // only leaves when it's signed off and carried to Body. So any cab that
      // isn't yet signed off (active / awaiting_inspection / rework) holds it.
      const clash = await db(`build?select=id,order_number,state&line_id=eq.${b.line_id}&state=in.(active,awaiting_inspection,rework)&limit=1`);
      if (clash.length) return json(400, { ok: false, error: `That line still has ORDER ${clash[0].order_number} on it (${String(clash[0].state).replace(/_/g, " ")}) — it stays until a manager signs it off.` }); // one-per-line
      // Q113: a manually-closed line takes no new cabs (manager override = reopen first).
      const [lnGateB] = await db(`line?select=manually_closed&id=eq.${b.line_id}`);
      if (lnGateB && lnGateB.manually_closed)
        return json(400, { ok: false, error: "That line is closed right now — reopen it first" });
      const whenS132 = claimed_at || new Date().toISOString();
      // Block 132 (logic audit L8, owner-rep ruling): a cockpit start also closes
      // the warehouse side — stamp it DELIVERED so it shows on the warehouse
      // "Delivered — now in production" list (a cab can't finish without its kit
      // physically pulled anyway). The record notes MANAGEMENT started it, not
      // warehouse: kit_delivered_by = the manager + a build.manager_started event.
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({ kit_delivered_at: whenS132, kit_delivered_by: empId }) });
      await freezeAndStart(b, empId, whenS132);
      logEvent("build.manager_started", empId, { build_id, order_number: b.order_number });
      return json(200, { ok: true });
    }

    // KIT STATUS (Q109 three-state gate): unverified -> verified -> short.
    // Warehouse dept, or manager/admin. SHORT is a FLAG — part-level detail
    // lives in Coyote and is out of launch scope; the note is optional.
    // Block 97 (owner-rep): the parts note is its OWN saved thing — editable
    // any time (before or after a Short), survives refresh, stays on the
    // warehouse screen (the cab card only shows kit info while a cab waits).
    if (url.pathname === "/api/kit/note" && req.method === "POST") {
      const [whoN97, wnFail] = await requireWarehouse(true); if (wnFail) return wnFail;
      const { build_id, note } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const noteN97 = String(note || "").trim().slice(0, 200);
      const [bN97] = await db(`build?select=id,order_number,state&id=eq.${build_id}`);
      if (!bN97 || bN97.state !== "upcoming") return json(400, { ok: false, error: "Cab is not waiting to start" });
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({ kit_note: noteN97 || null }) });
      logEvent("kit.note", whoN97, { build_id, order_number: bN97.order_number, note: noteN97 });
      return json(200, { ok: true });
    }

    // Block 97 (owner-rep): back up a step — un-does "Pull started" (harmless;
    // the kit stays verified). Delivered/started stays one-way for warehouse;
    // the admin undo-start is the escape hatch for that.
    if (url.pathname === "/api/kit/unpull" && req.method === "POST") {
      const [whoU97, wuFail] = await requireWarehouse(true); if (wuFail) return wuFail;
      const { build_id } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [bU97] = await db(`build?select=id,order_number,state,kit_pull_started_at&id=eq.${build_id}`);
      if (!bU97 || bU97.state !== "upcoming") return json(400, { ok: false, error: "Cab is not waiting to start" });
      if (!bU97.kit_pull_started_at) return json(400, { ok: false, error: "No pull to undo" });
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({ kit_pull_started_at: null, kit_pull_started_by: null }) });
      logEvent("kit.pull_undone", whoU97, { build_id, order_number: bU97.order_number });
      return json(200, { ok: true });
    }

    if (url.pathname === "/api/kit/status" && req.method === "POST") {
      const [whoId, whFail] = await requireWarehouse(true); if (whFail) return whFail;
      const { build_id, status, note } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      if (!["unverified", "verified", "short"].includes(status))
        return json(400, { ok: false, error: "Unknown kit status" });
      const [b] = await db(`build?select=id,state,order_number,line_id&id=eq.${build_id}`);
      if (!b || b.state !== "upcoming") return json(400, { ok: false, error: "Only an upcoming cab's kit gets verified" });
      const patchK = {
        kit_status: status, kit_note: status === "short" ? (note || null) : null,
        kit_verified_by: status === "verified" ? whoId : null,
        kit_verified_at: status === "verified" ? new Date().toISOString() : null };
      // Block 123 (logic audit M7): leaving "verified" must also drop any pull
      // in progress — else re-verifying shows the cab already-pulled (one tap
      // from Deliver) and the pull-minutes metric spans the whole gap.
      if (status !== "verified") { patchK.kit_pull_started_at = null; patchK.kit_pull_started_by = null; }
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify(patchK) });
      logEvent("kit.status", whoId, { build_id, order_number: b.order_number, status, note: note || "" });
      // Block 222 (Daniel, 8/26): a SHORT kit means parts are MISSING for an
      // on-deck cab — until now nobody heard about it unless they happened to
      // look at the queue screen. Admins get one notice per marking so
      // ordering starts immediately.
      if (status === "short") {
        const adminsK222 = await db(`employee?select=id&active=is.true&role=eq.admin`);
        void notify("kit.short", adminsK222.map((a) => a.id),
          `Kit SHORT — order ${b.order_number}`,
          `Warehouse marked this on-deck kit short${note ? `: "${String(note).slice(0, 140)}"` : " (no note left)"}. Parts are missing — the sooner they're chased, the less the line waits.`,
          "/reconcile");
      }
      // Block 131 (L6): verifying a stuck pin can change who's on deck — revert any pull now stranded.
      await revertStrandedPull(b.line_id, whoId);
      return json(200, { ok: true });
    }

    // KIT QUEUE MOVE (Q109): reorder the UPCOMING queue only — priority/display
    // only, clocks untouched (C9). A short kit slides back; a complete one
    // slides forward; the line never idles waiting on a part.
    if (url.pathname === "/api/kit/move" && req.method === "POST") {
      const [whoId, whFail] = await requireWarehouse(true); if (whFail) return whFail;
      const { build_id, dir } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [b] = await db(`build?select=id,line_id,state,queue_pos,order_number,queue_pinned&id=eq.${build_id}`);
      if (!b || b.state !== "upcoming") return json(400, { ok: false, error: "Only upcoming cabs can be reordered" });
      // Block 89 (owner-pin): a pinned cab holds the spot the front office gave
      // it — the warehouse can reorder above it and below it, but nothing moves
      // it and nothing crosses it. Admin moves (/api/queue/move) stay free.
      if (b.queue_pinned) return json(400, { ok: false, error: "That spot is held by the front office" });
      const q = (await db(`build?select=id,queue_pos,queue_pinned&line_id=eq.${b.line_id}&state=eq.upcoming&order=queue_pos.asc.nullslast,created_at.asc`));
      const idx = q.findIndex((x) => x.id === b.id);
      const swap = dir === "up" ? q[idx - 1] : q[idx + 1];
      if (!swap) return json(400, { ok: false, error: "Already at the end" });
      if (swap.queue_pinned) return json(400, { ok: false, error: "That spot is held by the front office" });
      // Re-stamp both positions explicitly so nulls can never make order ambiguous.
      await db(`build?id=eq.${b.id}`, { method: "PATCH", body: JSON.stringify({ queue_pos: swap.queue_pos ?? (idx + (dir === "up" ? 0 : 2)) }) });
      await db(`build?id=eq.${swap.id}`, { method: "PATCH", body: JSON.stringify({ queue_pos: b.queue_pos ?? (idx + 1) }) });
      logEvent("kit.queue_move", whoId, { build_id, order_number: b.order_number, dir });
      // Block 131 (L6): a reorder can change who's on deck — revert any pull now stranded.
      await revertStrandedPull(b.line_id, whoId);
      return json(200, { ok: true });
    }

    // KIT PULL (Q109 two-step, first tap): only a VERIFIED kit can be pulled.
    if (url.pathname === "/api/kit/pull" && req.method === "POST") {
      const [whoId, whFail] = await requireWarehouse(true); if (whFail) return whFail;
      const { build_id, claimed_at } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [b] = await db(`build?select=id,state,kit_status,order_number,line_id&id=eq.${build_id}`);
      if (!b || b.state !== "upcoming") return json(400, { ok: false, error: "Cab is not waiting to start" });
      if (b.kit_status !== "verified") return json(400, { ok: false, error: "Verify the kit first — every part accounted for" });
      // Block 131 (logic audit L6): only the ON-DECK cab may start a pull — a
      // pull tied to a cab that isn't next would be stranded by any reorder.
      if (await onDeckId(b.line_id) !== build_id)
        return json(400, { ok: false, error: "Only the on-deck cab can start a pull — this one isn't next in line." });
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({
        kit_pull_started_at: claimed_at || new Date().toISOString(), kit_pull_started_by: whoId }) });
      logEvent("kit.pull_started", whoId, { build_id, order_number: b.order_number });
      return json(200, { ok: true });
    }

    // KIT DELIVERED (Q109 second tap, ARMED on the client): the kit is on the
    // line — THIS is what starts the cab's clock now. Same freeze-and-start
    // path as the manager override; one-active-per-line still enforced.
    if (url.pathname === "/api/kit/deliver" && req.method === "POST") {
      const [whoId, whFail] = await requireWarehouse(true); if (whFail) return whFail;
      const { build_id, claimed_at } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [b] = await db(`build?select=id,state,line_id,part_number,order_number,kit_status,kit_pull_started_at&id=eq.${build_id}`);
      if (!b || b.state !== "upcoming") return json(400, { ok: false, error: "Cab is not waiting to start" });
      if (b.kit_status !== "verified") return json(400, { ok: false, error: "Verify the kit first" });
      if (!b.kit_pull_started_at) return json(400, { ok: false, error: "Tap Pull started first" });
      // Block 121 (owner-rep): the line isn't free until its current cab is
      // signed off — active / awaiting_inspection / rework all hold it.
      const clashW = await db(`build?select=id,order_number,state&line_id=eq.${b.line_id}&state=in.(active,awaiting_inspection,rework)&limit=1`);
      if (clashW.length) return json(400, { ok: false, error: `That line still has ORDER ${clashW[0].order_number} on it (${String(clashW[0].state).replace(/_/g, " ")}) — it stays until a manager signs it off.` });
      // Q113: a manually-closed line takes no new cabs. Q83/L9: read the down
      // hold too — a down line still takes the kit drop but NOT the clock.
      const [lnGateD] = await db(`line?select=manually_closed,down_today&id=eq.${b.line_id}`);
      if (lnGateD && lnGateD.manually_closed)
        return json(400, { ok: false, error: "That line is closed right now — reopen it first" });
      const when = claimed_at || new Date().toISOString();
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({
        kit_delivered_at: when, kit_delivered_by: whoId }) });
      const pullMin = Math.round((new Date(when) - new Date(b.kit_pull_started_at)) / 60000);
      if (lnGateD && lnGateD.down_today) {
        // Block 133 (logic audit L9): the line is DOWN — warehouse drops the kit
        // nearby (delivered, warehouse is clear) but the clock does NOT start. The
        // cab waits; it starts the moment a manager clears the down or a production
        // role clocks in. Attach the running hold to THIS order so the down time
        // rides with it.
        await db(`line_down?line_id=eq.${b.line_id}&up_at=is.null&build_id=is.null`, { method: "PATCH", body: JSON.stringify({ build_id }) });
        logEvent("kit.delivered_held", whoId, { build_id, order_number: b.order_number, pull_minutes: pullMin });
        return json(200, { ok: true, held: true });
      }
      await freezeAndStart(b, whoId, when);
      logEvent("kit.delivered", whoId, { build_id, order_number: b.order_number, pull_minutes: pullMin });
      return json(200, { ok: true });
    }

    // Q83: "Down for today" — mark a line EXPECTED-idle (staff out / equipment
    // / no work) so its tile goes calm-slate and alerts stay quiet. Manager +
    // admin (the everyday quiet tool — no toggle gate like the hard Q113
    // close). Auto-clears at day roll; auto-resumes on clock-in. Audited.
    if (url.pathname === "/api/line/down" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { line_id, down, reason } = await body(req);
      if (!Number.isInteger(Number(line_id))) return json(400, { ok: false, error: "Pick a valid line" });
      const [lnD] = await db(`line?select=id,name&id=eq.${line_id}`);
      if (!lnD) return json(404, { ok: false, error: "Line not found" });
      if (down) {
        // Block 133 (logic audit L9, owner-rep ruling): a down ALWAYS carries a
        // TYPED free-text reason (no pick-list) and opens a TIMED record that
        // rides with whatever cab is on the line — the ACTIVE one, or a cab whose
        // kit warehouse already delivered while the line was held. The hold pauses
        // that cab's production time (labor-based pace accrues nothing with no one
        // clocked in) until Back up or a production clock-in.
        const why = String(reason || "").trim();
        if (why.length < 2) return json(400, { ok: false, error: "Type a reason — it rides with the order" });
        const openRec133 = await db(`line_down?select=id&line_id=eq.${line_id}&up_at=is.null&limit=1`);
        if (!openRec133.length) {
          const [cab133] = await db(`build?select=id,order_number&line_id=eq.${line_id}&state=in.(active,awaiting_inspection,rework)&limit=1`);
          let held133 = cab133;
          if (!held133) { const [w133] = await db(`build?select=id,order_number&line_id=eq.${line_id}&state=eq.upcoming&kit_delivered_at=not.is.null&started_at=is.null&order=queue_pos.asc.nullslast,created_at.asc&limit=1`); held133 = w133; }
          await db("line_down", { method: "POST", body: JSON.stringify({
            line_id, build_id: held133 ? held133.id : null, reason: why, down_by: empId, down_at: new Date().toISOString() }) });
          logEvent("line.down", empId, { line_id, name: lnD.name, reason: why, order_number: held133 ? held133.order_number : null });
        }
        await db(`line?id=eq.${line_id}`, { method: "PATCH", body: JSON.stringify({
          down_today: true, down_reason: why, down_by: empId, down_at: new Date().toISOString() }) });
      } else {
        // Back up (manual): close the open timed hold, clear the flag, then start
        // any cab whose kit was delivered while the line was held.
        await closeOpenDowns(line_id, empId, "manual");
        await db(`line?id=eq.${line_id}`, { method: "PATCH", body: JSON.stringify({
          down_today: false, down_reason: null, down_by: null, down_at: null }) });
        logEvent("line.down_cleared", empId, { line_id, name: lnD.name, cause: "manual" });
        await startDeliveredWaiting(line_id, empId);
      }
      return json(200, { ok: true });
    }

    // Q113: close a line for the day / reopen it. Admins always; managers
    // only when the "Managers can open/close lines" switch is ON. Audited.
    if (url.pathname === "/api/line/closed" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      if (me.role === "manager") {
        const [togL] = await db(`feature_toggle?select=enabled&key=eq.manager_line_control`);
        if (!togL || !togL.enabled)
          return json(403, { ok: false, error: "Line control is admin-only right now. An admin can share it — Features, 'Managers can open/close lines'." });
      }
      const { line_id, closed } = await body(req);
      // Q115: a non-integer line_id used to throw a 500 in the DB query.
      if (!Number.isInteger(Number(line_id)))
        return json(400, { ok: false, error: "Pick a valid line" });
      const [lnC2] = await db(`line?select=id,name&id=eq.${line_id}`);
      if (!lnC2) return json(404, { ok: false, error: "Line not found" });
      await db(`line?id=eq.${line_id}`, { method: "PATCH", body: JSON.stringify({ manually_closed: Boolean(closed) }) });
      logEvent(closed ? "line.closed" : "line.reopened", empId, { line_id, name: lnC2.name });
      return json(200, { ok: true });
    }

    // ── Q92: TIME-OFF REQUESTS (block 34) ─────────────────────────
    // A builder asks for time off (date range + reason). Gated by the
    // "Time-off requests" toggle. Lands PENDING in the manager queue; a
    // manager/admin approves or denies. Delivery is Q106-sandboxed.
    if (url.pathname === "/api/timeoff/request" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [toTog] = await db(`feature_toggle?select=enabled&key=eq.time_off_requests`);
      if (toTog && toTog.enabled === false)
        return json(403, { ok: false, error: "Time-off requests are turned off right now." });
      const { start_date, end_date, reason, note } = await body(req);
      const okDate = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
      if (!okDate(start_date)) return json(400, { ok: false, error: "Pick a start date" });
      const end = okDate(end_date) ? end_date : start_date;
      if (end < start_date) return json(400, { ok: false, error: "The end date is before the start" });
      const okR = await db(`pick_list_item?select=label&list_key=eq.time_off_reason&retired=is.false`);
      const rsn = reason && okR.some((r) => r.label === reason) ? reason : null;
      // Q92 (owner-rep 2026-08-03): the requester may leave an optional note.
      const rnote = note && String(note).trim() ? String(note).trim().slice(0, 200) : null;
      const [row] = await db(`time_off_request`, { method: "POST",
        body: JSON.stringify({ employee_id: empId, start_date, end_date: end, reason: rsn, requested_by: empId, request_note: rnote }) });
      logEvent("timeoff.requested", empId, { request_id: row && row.id, start_date, end_date: end, reason: rsn });
      const [meT] = await db(`employee?select=first_name,last_name&id=eq.${empId}`);
      // Approvals are admin-only now, so the new-request heads-up goes to admins.
      const recips = (await db(`employee?select=id&role=eq.admin&active=is.true`)).map((e) => e.id);
      await notify("timeoff.requested", recips, "Time-off request",
        `${meT ? meT.first_name + " " + meT.last_name : "Someone"} asked for ${start_date === end ? start_date : start_date + " → " + end}${rsn ? " · " + rsn : ""}.${rnote ? ` — "${rnote}"` : ""}`, "/manager");
      return json(200, { ok: true });
    }

    // Q92: approve/deny a pending request. Manager + admin. Optional note.
    if (url.pathname === "/api/timeoff/decide" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      // Q92 (owner-rep 2026-08-03): approving/denying time off is an ADMIN
      // function, not a manager one.
      if (!me || me.role !== "admin")
        return json(403, { ok: false, error: "Time-off approvals are admin-only" });
      const { id, decision, note } = await body(req);
      if (!isUuid(id)) return json(400, { ok: false, error: "That request reference isn't valid" });
      if (decision !== "approve" && decision !== "deny")
        return json(400, { ok: false, error: "Approve or deny" });
      const [reqRow] = await db(`time_off_request?select=id,employee_id,start_date,end_date,status&id=eq.${id}`);
      if (!reqRow) return json(404, { ok: false, error: "Request not found" });
      if (reqRow.status !== "pending") return json(409, { ok: false, error: "That request was already decided" });
      const status = decision === "approve" ? "approved" : "denied";
      const cleanNote = note && String(note).trim() ? String(note).trim() : null;
      await db(`time_off_request?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({
        status, decided_by: empId, decided_at: new Date().toISOString(), decision_note: cleanNote }) });
      logEvent(status === "approved" ? "timeoff.approved" : "timeoff.denied", empId,
        { request_id: id, employee_id: reqRow.employee_id, start_date: reqRow.start_date, end_date: reqRow.end_date });
      const range = reqRow.start_date === reqRow.end_date ? reqRow.start_date : reqRow.start_date + " → " + reqRow.end_date;
      await notify("timeoff." + status, [reqRow.employee_id], "Time off " + status,
        `Your ${range} request was ${status}.${cleanNote ? " Note: " + cleanNote : ""}`, "/home");
      return json(200, { ok: true });
    }

    // Q92: a manager/admin enters time off for someone directly — lands
    // already approved (recording a known absence, not requesting one).
    if (url.pathname === "/api/timeoff/add" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role,department&id=eq.${empId}`);
      // Q92 (owner-rep 2026-08-03): entering time off for someone lands it
      // already approved, so it was ADMIN-only. Block 216 (Daniel): the
      // ACCOUNTING manager records sick time on timecards — "she needs to be
      // able to add in sick time hours whenever needed manually for any
      // employee" — so she gets this power too (works regardless of the
      // staff-requests Features toggle, which stays OFF).
      const acctMgr216 = me && me.role === "manager" && me.department === "Accounting";
      if (!me || (me.role !== "admin" && !acctMgr216))
        return json(403, { ok: false, error: "Time-off entry is for admins and accounting" });
      const { employee_id, start_date, end_date, reason, hours } = await body(req);
      if (!isUuid(employee_id)) return json(400, { ok: false, error: "Pick a person" });
      // Block 217 (Daniel): PARTIAL sick time — optional hours (quarter-hour
      // steps, up to a standard day). Absent/blank = the full 8-hour day.
      let hours217 = null;
      if (hours != null && hours !== "") {
        hours217 = Math.round(Number(hours) * 4) / 4;
        if (!(hours217 > 0) || hours217 > PAY_STD_DAY) return json(400, { ok: false, error: `Hours must be between 0.25 and ${PAY_STD_DAY}` });
        if (hours217 === PAY_STD_DAY) hours217 = null;   // a full day stores as the default
      }
      const okDate = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
      if (!okDate(start_date)) return json(400, { ok: false, error: "Pick a start date" });
      const end = okDate(end_date) ? end_date : start_date;
      if (end < start_date) return json(400, { ok: false, error: "The end date is before the start" });
      const [who] = await db(`employee?select=id&id=eq.${employee_id}&active=is.true`);
      if (!who) return json(404, { ok: false, error: "Person not found" });
      const okR = await db(`pick_list_item?select=label&list_key=eq.time_off_reason&retired=is.false`);
      // Block 216: "Sick" / "Unpaid" always work even if the pick list drifts —
      // payroll math keys on those words, not the list.
      const rsn = reason && (okR.some((r) => r.label === reason) || /^(sick|unpaid)$/i.test(String(reason))) ? reason : null;
      const [row] = await db(`time_off_request`, { method: "POST",
        body: JSON.stringify({ employee_id, start_date, end_date: end, reason: rsn, hours: hours217, requested_by: empId,
          added_by_manager: true, status: "approved", decided_by: empId, decided_at: new Date().toISOString() }) });
      logEvent("timeoff.added", empId, { request_id: row && row.id, employee_id, start_date, end_date: end, reason: rsn, hours: hours217 });
      void acctEditNotice221(empId, `added ${hours217 ? hours217 + "h of" : "a day of"} ${rsn || "time off"}`, employee_id, start_date === end ? start_date : `${start_date} → ${end}`, `/manager?tc_emp=${employee_id}#timecorrections`);
      await notify("timeoff.added", [employee_id], "Time off added",
        `Time off was recorded for you: ${start_date === end ? start_date : start_date + " → " + end}${rsn ? " · " + rsn : ""}.`, "/home");
      return json(200, { ok: true });
    }

    // Block 216: CANCEL an office-entered time-off row (a mis-tapped sick day
    // in the timecard editor). Cancel-never-delete: the row flips to denied
    // with a note, so history keeps it while payroll stops counting it.
    // Admins + the accounting manager, same gate as /api/timeoff/add.
    if (url.pathname === "/api/timeoff/cancel" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role,department&id=eq.${empId}`);
      const acctC216 = me && me.role === "manager" && me.department === "Accounting";
      if (!me || (me.role !== "admin" && !acctC216))
        return json(403, { ok: false, error: "Time-off entry is for admins and accounting" });
      const { request_id } = await body(req);
      if (!isUuid(request_id)) return json(400, { ok: false, error: "That entry reference isn't valid" });
      const [rowC] = await db(`time_off_request?select=id,employee_id,start_date,end_date,status&id=eq.${request_id}`);
      if (!rowC) return json(404, { ok: false, error: "Entry not found" });
      if (rowC.status !== "approved") return json(400, { ok: false, error: "Only an approved entry can be cancelled" });
      await db(`time_off_request?id=eq.${request_id}`, { method: "PATCH", body: JSON.stringify({
        status: "denied", decided_by: empId, decided_at: new Date().toISOString(), decision_note: "cancelled by the office" }) });
      logEvent("timeoff.cancelled", empId, { request_id, employee_id: rowC.employee_id, start_date: rowC.start_date, end_date: rowC.end_date });
      void acctEditNotice221(empId, "removed a time-off entry", rowC.employee_id, rowC.start_date, `/manager?tc_emp=${rowC.employee_id}#timecorrections`);
      return json(200, { ok: true });
    }

    // Q111 pt 2 — MISSED-PUNCH CORRECTIONS. The physical punch clock can't
    // retire until somebody can fix a forgotten punch. Managers + admins;
    // a note is REQUIRED; every change is event-logged and stamps the
    // timecard. Managers reach back 14 days, admins anytime. The tangle
    // guard: a correction must leave the day's punches alternating in/out.
    if (url.pathname === "/api/punch/correct" && req.method === "POST") {
      const meId = await liveSession(req);
      if (!meId) return json(401, { ok: false, error: "Signed out" });
      const [meP] = await db(`employee?select=role&id=eq.${meId}`);
      if (!meP || (meP.role !== "manager" && meP.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { action, punch_id, new_at, employee_id, line_id, in_at, out_at, note, in_id, out_id, ids } = await body(req);   // Block 192: in_id/out_id feed void_pair · Block 199: ids feeds void_run
      if (!note || !String(note).trim()) return json(400, { ok: false, error: "Say why — the note is required" });
      // Q115: reject malformed ids before they reach Postgres (a non-uuid id
      // used to throw a 500). The UI only ever sends real ids.
      if ((action === "move" || action === "void") && !isUuid(punch_id))
        return json(400, { ok: false, error: "That punch reference isn't valid" });
      if (action === "add" && !isUuid(employee_id))
        return json(400, { ok: false, error: "That person reference isn't valid" });
      if (action === "add" && !Number.isInteger(Number(line_id)))
        return json(400, { ok: false, error: "Pick a valid line" });
      const nowP = Date.now();
      const tooOld = (ms) => meP.role !== "admin" && ms < nowP - 14 * 86400000;
      // Simulate the person's Phoenix day around `ms` with a change applied,
      // and ask: do the punches still alternate?
      // Block 199 (Kailey's lockout, 8/20): a day that ALREADY had a tangle
      // (Michael's 8/18 triple-tap left two duplicate clock-ins) used to
      // refuse EVERY correction — including the exact removal that would
      // heal it, so the whole day was locked. The rule is now "no worse":
      // a change passes as long as it doesn't ADD a tangle. A clean day
      // keeps the exact old behavior (zero tangles must stay zero).
      const tangles199 = (evs) => {
        const sorted = [...evs].sort((a, b) => new Date(a.claimed_at) - new Date(b.claimed_at));
        let n = 0;
        for (let i = 1; i < sorted.length; i++)
          if ((sorted[i - 1].kind === "clock_in") === (sorted[i].kind === "clock_in")) n++;
        return n;
      };
      const daySane = async (empIdP, ms, mutate) => {
        const d0 = phxDayStart(phxDate(ms));
        const evsD = await db(`clock_event?select=id,kind,claimed_at&voided=is.false&employee_id=eq.${empIdP}&claimed_at=gte.${new Date(d0).toISOString()}&claimed_at=lt.${new Date(d0 + 86400000).toISOString()}&order=claimed_at.asc`);
        return tangles199(mutate(evsD)) <= tangles199(evsD);
      };
      if (action === "move") {
        const [p] = await db(`clock_event?select=id,employee_id,kind,claimed_at,original_claimed_at&id=eq.${punch_id}&voided=is.false`);
        if (!p) return json(404, { ok: false, error: "Punch not found" });
        const toMs = new Date(new_at).getTime(), fromMs = new Date(p.claimed_at).getTime();
        if (!Number.isFinite(toMs)) return json(400, { ok: false, error: "Bad time" });
        if (toMs > nowP) return json(400, { ok: false, error: "Can't punch the future" });
        if (tooOld(fromMs) || tooOld(toMs)) return json(403, { ok: false, error: "Older than 14 days — that one belongs to an admin" });
        // v148: a punch stays on its own Phoenix day (days end at 11:59 PM), so
        // a move can never drag half a pair across midnight. Wrong day entirely?
        // Void the pair and re-add it on the right date.
        if (phxDate(toMs) !== phxDate(fromMs))
          return json(400, { ok: false, error: "A punch stays on its own day — days end at 11:59 PM. To move a stint to another day, void the pair and re-add it" });
        const moved = { id: p.id, kind: p.kind, claimed_at: new Date(toMs).toISOString() };
        let sane = await daySane(p.employee_id, toMs, (evs) => [...evs.filter((e) => e.id !== p.id), moved]);
        if (sane && phxDate(toMs) !== phxDate(fromMs))
          sane = await daySane(p.employee_id, fromMs, (evs) => evs.filter((e) => e.id !== p.id));
        if (!sane) return json(400, { ok: false, error: "That would tangle the day's punches — check the times" });
        await db(`clock_event?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({
          claimed_at: new Date(toMs).toISOString(), original_claimed_at: p.original_claimed_at || p.claimed_at,
          corrected_by: meId, corrected_at: new Date(nowP).toISOString(), correction_note: note }) });
        logEvent("punch.moved", meId, { punch_id: p.id, employee_id: p.employee_id, from: p.claimed_at, to: new Date(toMs).toISOString(), note });
        void acctEditNotice221(meId, "moved a punch", p.employee_id, phxDate(toMs), `/manager?tc_emp=${p.employee_id}&tc_date=${phxDate(toMs)}#timecorrections`);
        return json(200, { ok: true });
      }
      // Block 192: VOID_PAIR — the timecard editor's Remove erases a whole
      // stint (its IN and its OUT) as ONE atomic action. The two-call client
      // version could die halfway (it did, on the "+00:00" bug above) and
      // leave a voided IN with a live OUT — a half-removed stint and a
      // confusing "Punch not found" on retry. Both punches are validated
      // together, the day is sanity-checked with BOTH gone, then both void
      // in one pass. Dangling-punch guards don't apply: the pair leaves
      // together, so nothing can be left dangling by design.
      if (action === "void_pair") {
        if (!isUuid(in_id) || !isUuid(out_id)) return json(400, { ok: false, error: "That punch reference isn't valid" });
        const [pIn] = await db(`clock_event?select=id,employee_id,kind,claimed_at&id=eq.${in_id}&voided=is.false`);
        const [pOut] = await db(`clock_event?select=id,employee_id,kind,claimed_at&id=eq.${out_id}&voided=is.false`);
        if (!pIn && !pOut) return json(404, { ok: false, error: "Those punches are already gone — reload to see the day fresh" });
        // Tolerate a half-removed stint from a past partial failure: whichever
        // half is still alive gets voided, so a retry HEALS instead of 404ing.
        const alive = [pIn, pOut].filter(Boolean);
        if (alive.some((p2) => p2.employee_id !== alive[0].employee_id)) return json(400, { ok: false, error: "Those punches belong to different people" });
        for (const p2 of alive) if (tooOld(new Date(p2.claimed_at).getTime())) return json(403, { ok: false, error: "Older than 14 days — that one belongs to an admin" });
        const goneIds = new Set(alive.map((p2) => p2.id));
        const sane = await daySane(alive[0].employee_id, new Date(alive[0].claimed_at).getTime(), (evs) => evs.filter((e) => !goneIds.has(e.id)));
        if (!sane) return json(400, { ok: false, error: "Removing that would tangle the day's punches — check the other rows" });
        for (const p2 of alive)
          await db(`clock_event?id=eq.${p2.id}`, { method: "PATCH", body: JSON.stringify({
            voided: true, corrected_by: meId, corrected_at: new Date(nowP).toISOString(), correction_note: note }) });
        logEvent("punch.pair_voided", meId, { in_id, out_id, employee_id: alive[0].employee_id,
          at: alive.map((p2) => p2.claimed_at), note });
        void acctEditNotice221(meId, "removed a punch pair", alive[0].employee_id, phxDate(new Date(alive[0].claimed_at).getTime()), `/manager?tc_emp=${alive[0].employee_id}&tc_date=${phxDate(new Date(alive[0].claimed_at).getTime())}#timecorrections`);
        return json(200, { ok: true });
      }
      // Block 199: VOID_RUN — the shop-level Remove. In the accounting
      // editor a stint can now SPAN line-switch punches (IN … out/in … OUT);
      // erasing it means voiding the WHOLE chain in one atomic, audited
      // action — voiding only the edges would strand the interior pair as
      // lone punches. Same retry tolerance as void_pair: rows already gone
      // are skipped, so a retry heals a half-removed chain.
      if (action === "void_run") {
        const idsR = Array.isArray(ids) ? ids.filter(isUuid) : [];
        if (!idsR.length || idsR.length > 12 || !Array.isArray(ids) || ids.length !== idsR.length)
          return json(400, { ok: false, error: "Those punch references aren't valid" });
        const rowsR = await db(`clock_event?select=id,employee_id,kind,claimed_at&id=in.(${idsR.join(",")})&voided=is.false`);
        if (!rowsR.length) return json(404, { ok: false, error: "Those punches are already gone — reload to see the day fresh" });
        if (rowsR.some((p2) => p2.employee_id !== rowsR[0].employee_id))
          return json(400, { ok: false, error: "Those punches belong to different people" });
        if (new Set(rowsR.map((p2) => phxDate(new Date(p2.claimed_at).getTime()))).size > 1)
          return json(400, { ok: false, error: "One day at a time — those punches span days" });
        for (const p2 of rowsR) if (tooOld(new Date(p2.claimed_at).getTime()))
          return json(403, { ok: false, error: "Older than 14 days — that one belongs to an admin" });
        const goneR = new Set(rowsR.map((p2) => p2.id));
        const saneR = await daySane(rowsR[0].employee_id, new Date(rowsR[0].claimed_at).getTime(), (evs) => evs.filter((e) => !goneR.has(e.id)));
        if (!saneR) return json(400, { ok: false, error: "Removing that would tangle the day's punches — check the other rows" });
        for (const p2 of rowsR)
          await db(`clock_event?id=eq.${p2.id}`, { method: "PATCH", body: JSON.stringify({
            voided: true, corrected_by: meId, corrected_at: new Date(nowP).toISOString(), correction_note: note }) });
        logEvent("punch.run_voided", meId, { ids: rowsR.map((p2) => p2.id), employee_id: rowsR[0].employee_id,
          at: rowsR.map((p2) => p2.claimed_at), note });
        void acctEditNotice221(meId, "removed a stint of punches", rowsR[0].employee_id, phxDate(new Date(rowsR[0].claimed_at).getTime()), `/manager?tc_emp=${rowsR[0].employee_id}&tc_date=${phxDate(new Date(rowsR[0].claimed_at).getTime())}#timecorrections`);
        return json(200, { ok: true });
      }
      if (action === "void") {
        const [p] = await db(`clock_event?select=id,employee_id,kind,claimed_at&id=eq.${punch_id}&voided=is.false`);
        if (!p) return json(404, { ok: false, error: "Punch not found" });
        const atMs = new Date(p.claimed_at).getTime();
        if (tooOld(atMs)) return json(403, { ok: false, error: "Older than 14 days — that one belongs to an admin" });
        const sane = await daySane(p.employee_id, atMs, (evs) => evs.filter((e) => e.id !== p.id));
        if (!sane) return json(400, { ok: false, error: "Voiding that would tangle the day — fix its partner too" });
        // v148 (M2): the one tangle the DAY window can't see — voiding an OUT can
        // leave its IN dangling OPEN (ghost "on the clock", hours balloon or
        // vanish, the sweeper may re-close the stint fatter). Rule: a void may
        // never leave a PAST day ending in an open clock-in, and never splice
        // two clock-ins together. Erasing a whole past stint: void its IN
        // first, then the OUT. Fixing a wrong time: that's Move.
        if (p.kind !== "clock_in") {
          // Block 192 (live find, day 2): p.claimed_at comes back from PostgREST
          // as "...+00:00" — a RAW "+" in a URL query decodes to a SPACE, so
          // these two filters 500'd on EVERY out-punch void (the guard's only
          // callers never voided an OUT until the Block-191 Remove button).
          // toISOString() emits the "Z" form, which is URL-safe.
          const [prevV] = await db(`clock_event?select=kind,claimed_at&voided=is.false&employee_id=eq.${p.employee_id}&claimed_at=lt.${new Date(p.claimed_at).toISOString()}&order=claimed_at.desc&limit=1`);
          const [nextV] = await db(`clock_event?select=kind&voided=is.false&employee_id=eq.${p.employee_id}&claimed_at=gt.${new Date(p.claimed_at).toISOString()}&order=claimed_at.asc&limit=1`);
          const prevIn148 = prevV && prevV.kind === "clock_in";
          if (prevIn148 && nextV && nextV.kind === "clock_in")
            return json(400, { ok: false, error: "That would splice two clock-ins together — to erase the stint, void its clock-in first, then this one; to fix a wrong time, use Move" });
          if (prevIn148 && !nextV && phxDate(new Date(prevV.claimed_at).getTime()) !== phxDate(nowP))
            return json(400, { ok: false, error: `That would leave ${phxDate(new Date(prevV.claimed_at).getTime())} ending in an open clock-in — void its clock-in first, then this one (or use Move to fix the time)` });
        }
        await db(`clock_event?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({
          voided: true, corrected_by: meId, corrected_at: new Date(nowP).toISOString(), correction_note: note }) });
        logEvent("punch.voided", meId, { punch_id: p.id, employee_id: p.employee_id, at: p.claimed_at, note });
        void acctEditNotice221(meId, "removed a punch", p.employee_id, phxDate(new Date(p.claimed_at).getTime()), `/manager?tc_emp=${p.employee_id}&tc_date=${phxDate(new Date(p.claimed_at).getTime())}#timecorrections`);
        return json(200, { ok: true });
      }
      if (action === "add") {
        if (!employee_id || !line_id || !in_at) return json(400, { ok: false, error: "Person, line, and the IN time are needed" });
        const inMs = new Date(in_at).getTime(), outMs = out_at ? new Date(out_at).getTime() : null;
        if (!Number.isFinite(inMs) || (out_at && !Number.isFinite(outMs))) return json(400, { ok: false, error: "Bad time" });
        if (inMs > nowP || (outMs && outMs > nowP)) return json(400, { ok: false, error: "Can't punch the future" });
        if (outMs && outMs <= inMs) return json(400, { ok: false, error: "OUT has to come after IN" });
        // v148: days end at 11:59 PM — no pair may straddle Phoenix midnight.
        if (outMs && phxDate(outMs) !== phxDate(inMs))
          return json(400, { ok: false, error: "Days end at 11:59 PM — enter each day as its own IN and OUT" });
        if (tooOld(inMs)) return json(403, { ok: false, error: "Older than 14 days — that one belongs to an admin" });
        if (!outMs && phxDate(inMs) !== phxDate(nowP)) return json(400, { ok: false, error: "A past day needs BOTH times — an open punch only makes sense today" });
        // (kind must satisfy the DB's check: out-kinds are _shift/_lunch/_early/_auto —
        // an added closing punch is a shift-out. Block-29 E2E caught the plain
        // "clock_out" attempt as a 42501-style check violation.)
        const fakeIn = { id: "new-in", kind: "clock_in", claimed_at: new Date(inMs).toISOString() };
        const fakeOut = outMs ? { id: "new-out", kind: "clock_out_shift", claimed_at: new Date(outMs).toISOString() } : null;
        let sane = await daySane(employee_id, inMs, (evs) => [...evs, fakeIn, ...(fakeOut && phxDate(outMs) === phxDate(inMs) ? [fakeOut] : [])]);
        if (sane && fakeOut && phxDate(outMs) !== phxDate(inMs))
          sane = await daySane(employee_id, outMs, (evs) => [...evs, fakeOut]);
        if (!sane) return json(400, { ok: false, error: "That would tangle the day's punches — check the times" });
        await db("clock_event", { method: "POST", body: JSON.stringify({
          employee_id, line_id, kind: "clock_in", claimed_at: new Date(inMs).toISOString(),
          added_by: meId, correction_note: note }) });
        if (outMs) await db("clock_event", { method: "POST", body: JSON.stringify({
          employee_id, line_id, kind: "clock_out_shift", reason: "Added by correction",
          claimed_at: new Date(outMs).toISOString(), added_by: meId, correction_note: note }) });
        logEvent("punch.added", meId, { employee_id, line_id, in_at: new Date(inMs).toISOString(),
          out_at: outMs ? new Date(outMs).toISOString() : null, note });
        void acctEditNotice221(meId, "added punches", employee_id, phxDate(inMs), `/manager?tc_emp=${employee_id}&tc_date=${phxDate(inMs)}#timecorrections`);
        return json(200, { ok: true });
      }
      return json(400, { ok: false, error: "Unknown action" });
    }

    // Q112 claim-then-confirm: the named approver (or any manager/admin)
    // owns an after-hours claim with one tap. Until then the session wears
    // its UNCONFIRMED flag on the cockpit and the timecards.
    if (url.pathname === "/api/afterhours/confirm" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { session_id } = await body(req);
      if (!isUuid(session_id)) return json(400, { ok: false, error: "That session reference isn't valid" });
      const [sAh] = await db(`after_hours_session?select=id,confirmed_by&id=eq.${session_id}`);
      if (!sAh) return json(404, { ok: false, error: "Session not found" });
      if (sAh.confirmed_by) return json(400, { ok: false, error: "Already confirmed" });
      await db(`after_hours_session?id=eq.${session_id}`, { method: "PATCH", body: JSON.stringify({
        confirmed_by: empId, confirmed_at: new Date().toISOString() }) });
      logEvent("afterhours.confirmed", empId, { session_id });
      return json(200, { ok: true });
    }

    // Block 107: SIGN-OFF — the closing half of the after-hours loop. Once the
    // wrap-up lands (session ended), a manager/admin signs off; that releases
    // the session's HELD hours onto the timecard. Signing off also counts as
    // confirming the approval claim if nobody had yet.
    if (url.pathname === "/api/afterhours/signoff" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      // Block 108 (owner-rep): sign-off is an ADMIN approval job — it releases
      // pay hours. Managers still confirm the approval claim from the cockpit.
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || me.role !== "admin")
        return json(403, { ok: false, error: "Admin only — sign-off releases pay hours" });
      const { session_id } = await body(req);
      if (!isUuid(session_id)) return json(400, { ok: false, error: "That session reference isn't valid" });
      const [sAh2] = await db(`after_hours_session?select=id,employee_id,ended_at,confirmed_by,signed_off_by&id=eq.${session_id}`);
      if (!sAh2) return json(404, { ok: false, error: "Session not found" });
      if (!sAh2.ended_at) return json(400, { ok: false, error: "They're still on the clock — sign off after the wrap-up lands" });
      if (sAh2.signed_off_by) return json(400, { ok: false, error: "Already signed off" });
      const nowSg = new Date().toISOString();
      const patch107 = { signed_off_by: empId, signed_off_at: nowSg };
      if (!sAh2.confirmed_by) { patch107.confirmed_by = empId; patch107.confirmed_at = nowSg; }
      await db(`after_hours_session?id=eq.${session_id}`, { method: "PATCH", body: JSON.stringify(patch107) });
      logEvent("afterhours.signed_off", empId, { session_id, employee_id: sAh2.employee_id });
      return json(200, { ok: true });
    }

    // Block 110 (owner-rep): DECLINE — the other verdict. An admin refuses
    // the session with a TYPED reason; the hours stay off the timecard for
    // good, the reason rides the timecard flag + the audit log, and the
    // person is notified (Q106 sandbox applies until cutover).
    if (url.pathname === "/api/afterhours/decline" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || me.role !== "admin")
        return json(403, { ok: false, error: "Admin only — declining refuses pay hours" });
      const { session_id, reason } = await body(req);
      if (!isUuid(session_id)) return json(400, { ok: false, error: "That session reference isn't valid" });
      if (String(reason || "").trim().length < 3)
        return json(400, { ok: false, error: "Type the reason — it goes on the record" });
      const [sAh3] = await db(`after_hours_session?select=id,employee_id,ended_at,signed_off_by,declined_by&id=eq.${session_id}`);
      if (!sAh3) return json(404, { ok: false, error: "Session not found" });
      if (!sAh3.ended_at) return json(400, { ok: false, error: "They're still on the clock — decide after the wrap-up lands" });
      if (sAh3.signed_off_by) return json(400, { ok: false, error: "Already signed off — hours already counted" });
      if (sAh3.declined_by) return json(400, { ok: false, error: "Already declined" });
      const rsn110 = String(reason).trim().slice(0, 200);
      await db(`after_hours_session?id=eq.${session_id}`, { method: "PATCH", body: JSON.stringify({
        declined_by: empId, declined_at: new Date().toISOString(), decline_reason: rsn110 }) });
      logEvent("afterhours.declined", empId, { session_id, employee_id: sAh3.employee_id, reason: rsn110 });
      notify("afterhours.declined", [sAh3.employee_id],
        "Your after-hours session was DECLINED",
        `"${rsn110}" — those hours don't count on your timecard. Talk to the office if this looks wrong.`, "/home");
      return json(200, { ok: true });
    }

    // ---------- NOTIFICATIONS (block 23) ----------
    // The tiny service worker every subscribed device runs: show what
    // arrives, open the board when tapped. Served from root scope.
    if (url.pathname === "/sw.js")
      return send(200, "application/javascript; charset=utf-8",
`self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) {}
  e.waitUntil(self.registration.showNotification(d.title || "Shop Board", {
    body: d.body || "", data: { url: d.url || "/home" } }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow((e.notification.data && e.notification.data.url) || "/home"));
});`);

    // A signed-in person registers THIS device for pushes. Re-subscribing
    // the same device just refreshes its row (endpoint is unique).
    if (url.pathname === "/api/push/subscribe" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      // Block 224: a SHARED tablet never registers for push — server-side
      // backstop for the client-side skip, so no future screen can leak one.
      if (/sb_shared=1/.test(req.headers.cookie || "")) return json(200, { ok: false, shared: true });
      const { endpoint, p256dh, auth } = await body(req);
      if (!endpoint || !p256dh || !auth) return json(400, { ok: false, error: "Incomplete subscription" });
      await db(`push_subscription?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE" });
      await db("push_subscription", { method: "POST", body: JSON.stringify({
        employee_id: empId, endpoint, p256dh, auth, user_agent: req.headers["user-agent"] || "" }) });
      logEvent("push.subscribed", empId, { endpoint_host: new URL(endpoint).host });
      return json(200, { ok: true });
    }

    // Block 224: DEACTIVATE a push subscription by endpoint — used by the
    // shared-tablet self-clean (a device marked shared unsubscribes itself
    // on its next visit). Deactivate-not-delete, like everything else.
    if (url.pathname === "/api/push/unsubscribe" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const { endpoint } = await body(req);
      if (!endpoint || typeof endpoint !== "string") return json(400, { ok: false, error: "No endpoint" });
      await db(`push_subscription?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "PATCH", body: JSON.stringify({ active: false }) });
      let host224 = ""; try { host224 = new URL(endpoint).host; } catch (e) {}
      logEvent("push.unsubscribed", empId, { endpoint_host: host224, shared_device: /sb_shared=1/.test(req.headers.cookie || "") });
      return json(200, { ok: true });
    }

    // ⚙ MY SETTINGS (block 117): every signed-in person can pick their own
    // notification CHANNELS and keep their own contact info current. The
    // role decides WHICH events; role-critical notices ignore the mutes.
    // Admin can set all of it for anyone from the console panel.
    if (url.pathname === "/settings") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me117] = await db(`employee?select=first_name,last_name,mobile,email,notify_push,notify_sms,notify_email,role,department&id=eq.${empId}`);   // Block 196: role+dept feed the shared nav
      if (!me117) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      return send(200, "text/html; charset=utf-8", settingsPage117(me117));
    }
    if (url.pathname === "/api/settings/channels" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const p117 = await body(req);
      const ch117 = String(p117.channel || "");
      // Block 204 (owner ruling, day 5): staff control their OWN push AND
      // text — the Block-154 "staff can't mute push" refusal is retired.
      // Email stays refused (Block 171: channel hidden, revisit later).
      if (ch117 !== "sms" && ch117 !== "push") return json(400, { ok: false, error: ch117 === "email" ? "Email notifications are turned off for now." : "Unknown channel" });
      const on117 = p117.enabled === true || p117.enabled === "true";
      await db(`employee?id=eq.${empId}`, { method: "PATCH", body: JSON.stringify({ ["notify_" + ch117]: on117 }) });
      logEvent("settings.channel", empId, { channel: ch117, enabled: on117, by: "self" });
      return json(200, { ok: true });
    }
    if (url.pathname === "/api/settings/contact" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const p117 = await body(req);
      const mob117 = String(p117.mobile || "").trim().slice(0, 30);
      const eml117 = String(p117.email || "").trim().slice(0, 120);
      if (mob117 && mob117.replace(/\D/g, "").length < 10) return json(400, { ok: false, error: "That doesn't look like a full phone number" });
      if (eml117 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eml117)) return json(400, { ok: false, error: "That doesn't look like an email address" });
      // Block 171: the settings page no longer sends an email key (field hidden).
      // Only touch the stored address when the key is actually present, so the
      // hidden channel's data survives every contact save untouched.
      const patch171 = { mobile: mob117 || null };
      if ("email" in p117) patch171.email = eml117 || null;
      await db(`employee?id=eq.${empId}`, { method: "PATCH", body: JSON.stringify(patch171) });
      logEvent("settings.contact", empId, { mobile_set: Boolean(mob117), email_set: "email" in p117 ? Boolean(eml117) : "untouched", by: "self" });
      return json(200, { ok: true });
    }

    // Admin test: one real message through the WHOLE pipe — chokepoint,
    // sandbox rewrite, sealing, delivery. What the E2E and the owner-rep's
    // phone both use to prove the plumbing.
    if (url.pathname === "/api/push/test" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || me.role !== "admin") return json(403, { ok: false, error: "Admin only" });
      await notify("test.push", [empId], "Shop Board test",
        "If you can read this, the push pipe works end to end.", "/home");
      return json(200, { ok: true });
    }

    // ---------- ADMIN CONSOLE (file 21) — admin role only ----------
    // One shared gate for the page + its three APIs.
    const requireAdmin = async () => {
      const empId = await liveSession(req);
      if (!empId) return [null, json(401, { ok: false, error: "Signed out — sign in again" })];
      const [me] = await db(`employee?select=id,role&id=eq.${empId}`);
      if (!me || me.role !== "admin") return [null, json(403, { ok: false, error: "Admin only" })];
      return [empId, null];
    };

    if (url.pathname === "/admin") {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role,must_change_pin&id=eq.${empId}`);
      if (!me || me.role !== "admin") { res.writeHead(302, { Location: "/home" }); return res.end(); }
      if (me.must_change_pin) { res.writeHead(302, { Location: "/change-pin" }); return res.end(); } // Q114
      // Block 212 (v201 SPEED): ~15 one-at-a-time reads → two parallel waves
      // (same queries verbatim; only the awaiting moved).
      const today = phxDate(Date.now());
      const [emps, tmpls, toggles, cabRows, allNums, hrsAdmin, pickRows, products, calDays, ntRows, ahRowsA] = await Promise.all([
        db("employee?select=id,first_name,last_name,role,department,lines,active,pin_hash,temp_pin,must_change_pin,mobile,email,notify_push,notify_sms,notify_email,pay_type&order=active.desc,first_name"),   // Block 200: pay_type feeds the People panel
        db("build_template?select=id,family&order=family"),
        db("feature_toggle?select=key,enabled&order=key"),
        // Q110: the cab-number editor works the OPEN cabs (upcoming through
        // rework) — signed-off history is corrected by support, not this page.
        db("build?select=id,order_number,part_number,cab_number,state&state=in.(upcoming,active,awaiting_inspection,rework)&order=created_at"),
        // "Next up" per family = highest number seen per letter + 1, computed
        // across ALL cabs ever (finished ones count — the counter never rewinds).
        db("build?select=cab_number&cab_number=not.is.null"),
        shopHours(),
        // Q77: reason lists for the pick-list editor.
        db(`pick_list_item?select=id,list_key,label,sort_order,retired&order=list_key,sort_order`),
        // Q86: per-product completion-photo minimums.
        db("product?select=part_number,family,photo_min&order=family,part_number"),
        // Q91: the shop calendar (upcoming overrides only) + the nudge times.
        db(`shop_calendar?select=cal_date,is_open,reason&cal_date=gte.${today}&order=cal_date`).catch(() => []),
        db(`shop_setting?select=key,value&key=in.(nudge_mon,nudge_tue,nudge_wed,nudge_thu,nudge_fri)`).catch(() => []),
        // Block 108: the after-hours SIGN-OFF queue.
        db(`after_hours_session?select=id,employee_id,line_id,approved_by,reason,plan,wrap_note,started_at,ended_at,confirmed_by&signed_off_by=is.null&declined_by=is.null&order=started_at.desc&limit=20`),
      ]);
      const tplId = url.searchParams.get("tpl") || (tmpls[0] || {}).id;
      const fam94 = ((tmpls.find((t) => t.id === tplId) || {}).family) || "";
      const [steps, optItems94, ahPhA, linesA108] = await Promise.all([
        (tplId && isUuid(tplId)) ? db(`step_template?select=id,display_no,name,day_no,day_end,man_hours,is_background&template_id=eq.${tplId}&retired=is.false&order=sort_order`) : [],
        fam94 ? db(`option_item?select=id,match_text,man_hours,day_no,retired,kit_only&family=eq.${encodeURIComponent(fam94)}&order=retired.asc,day_no.asc,match_text.asc`) : [],
        ahRowsA.length ? db(`after_hours_photo?select=id,session_id&session_id=in.(${ahRowsA.map((s) => s.id).join(",")})`) : [],
        ahRowsA.length ? db(`line?select=id,name`) : [],
      ]);
      const hi = {};
      for (const r of allNums) {
        const m = String(r.cab_number).trim().toUpperCase().match(/^(\d+)\s*([A-Z]{1,2})$/);
        if (m) hi[m[2]] = Math.max(hi[m[2]] || 0, Number(m[1]));
      }
      const nextUp = ["T", "A", "C", "F", "B", "D"].filter((f) => hi[f]).map((f) => `${hi[f] + 1}${f}`).join(" · ");
      // Q77: assemble the reason lists for the pick-list editor — every
      // pick_list_item grouped by list_key, active items and retired split.
      const plByKey = {};
      for (const r of pickRows) {
        const g = plByKey[r.list_key] || (plByKey[r.list_key] = { key: r.list_key, label: PICK_LIST_INFO[r.list_key] || r.list_key, items: [], retired: [] });
        (r.retired ? g.retired : g.items).push(r);
      }
      const pickOrder = Object.keys(PICK_LIST_INFO).concat(Object.keys(plByKey).filter((k) => !(k in PICK_LIST_INFO)));
      const pickLists = pickOrder.filter((k) => plByKey[k]).map((k) => plByKey[k]);
      const nudgeTimes = {}; for (const r of ntRows) nudgeTimes[r.key.replace("nudge_", "")] = r.value;
      // Block 108 (owner-rep): the after-hours SIGN-OFF queue is an ADMIN
      // approval job — it lives here now, front and center under the title.
      const nmA108 = {}; for (const p of emps) nmA108[p.id] = `${p.first_name} ${p.last_name ? p.last_name[0] + "." : ""}`.trim();
      const phxDTA = (ts) => ts ? new Date(new Date(ts).getTime() - 7 * 3600000).toISOString().slice(5, 16).replace("T", " ") : "";
      const ahAdmin = ahRowsA.map((s) => ({ id: s.id,
        who: nmA108[s.employee_id] || "?", appr: nmA108[s.approved_by] || "?",
        lineName: (linesA108.find((l) => l.id === s.line_id) || {}).name || (s.line_id === 10 ? "Shop time" : "Line " + s.line_id),
        when: phxDTA(s.started_at), reason: s.reason, plan: s.plan, wrap: s.wrap_note,
        ended: Boolean(s.ended_at), confirmed: Boolean(s.confirmed_by),
        hrs: s.ended_at ? Math.round(Math.max(0, new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 360000) / 10 : null,
        photos: ahPhA.filter((p2) => p2.session_id === s.id).map((p2) => p2.id) }));
      return send(200, "text/html; charset=utf-8", adminPage(emps, tmpls, tplId, steps, toggles, cabRows, nextUp, hrsAdmin, pickLists, products, calDays, nudgeTimes, optItems94, ahAdmin));
    }

    // PEOPLE: department / role / usual lines / active + the C18 PIN reset.
    if (url.pathname === "/api/admin/employee" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const p94 = await body(req);
      const { id, department, role, lines, active, reset_pin, pay_type } = p94;   // Block 200: pay_type (hourly / salary / na)
      // Block 93 (owner-rep note 1): ADD a person from the console. Creates the
      // row + issues a temp passcode via the proven Q114 path (first sign-in
      // forces them to pick their own PIN). Lines only make sense for Production.
      if (p94.add) {
        const fn = String(p94.first_name || "").trim(), ln = String(p94.last_name || "").trim();
        if (!/^[A-Za-z][A-Za-z' -]{0,39}$/.test(fn) || !/^[A-Za-z][A-Za-z' -]{0,39}$/.test(ln)) return json(400, { ok: false, error: "Give a first and last name (letters only)" });
        if (!DEPTS.includes(p94.department)) return json(400, { ok: false, error: "Pick a department" });
        if (!ROLES.includes(p94.role)) return json(400, { ok: false, error: "Pick a role" });
        const dupes = await db(`employee?select=id&first_name=eq.${encodeURIComponent(fn)}&last_name=eq.${encodeURIComponent(ln)}`);
        if (dupes.length) return json(400, { ok: false, error: "That name already exists — reactivate or rename instead" });
        const wantL = p94.department === "Production" && Array.isArray(p94.lines) ? p94.lines.map(Number).filter(Number.isInteger) : [];
        const [neu] = await db("employee", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ first_name: fn, last_name: ln, department: p94.department, role: p94.role, lines: wantL, active: true }) });
        const code = await assignTempPin(neu.id);
        logEvent("employee.added", adminId, { employee_id: neu.id, name: fn + " " + ln, department: p94.department, role: p94.role });
        return json(200, { ok: true, id: neu.id, temp_pin: code });
      }
      if (!id) return json(400, { ok: false, error: "Missing employee" });
      if (!isUuid(id)) return json(400, { ok: false, error: "That employee reference isn't valid" });
      if (reset_pin) {
        // Q114: never null the PIN (that reopened the Q68 hole) — issue a
        // fresh temp code instead; the person is forced to replace it.
        const code = await assignTempPin(id);
        logEvent("pin.reset", adminId, { employee_id: id });
        return json(200, { ok: true, temp_pin: code });
      }
      const patch = {};
      if (department !== undefined) { if (!DEPTS.includes(department)) return json(400, { ok: false, error: "Unknown department" }); patch.department = department; }
      if (role !== undefined) { if (!ROLES.includes(role)) return json(400, { ok: false, error: "Unknown role" }); patch.role = role; }
      // Block 123 (logic audit M4): lines only make sense for Production —
      // match the add path. A save that sets a non-Production department clears
      // the line roster (else a moved-to-Warehouse person keeps stale lines and
      // still receives that line's rework/fix-job alerts); Production keeps the
      // integer-filtered list.
      if (department !== undefined) patch.lines = (department === "Production" && Array.isArray(lines)) ? lines.map(Number).filter(Number.isInteger) : [];
      else if (lines !== undefined) patch.lines = Array.isArray(lines) ? lines.map(Number).filter(Number.isInteger) : [];
      if (active !== undefined) patch.active = Boolean(active);
      // Block 200: hourly = on the Pay Worksheet; salary / na (owners) are
      // listed informationally only. Whitelisted — anything else is refused.
      if (pay_type !== undefined) { if (!["hourly", "salary", "na"].includes(pay_type)) return json(400, { ok: false, error: "Pay type must be Hourly, Salary, or Owner — n/a" }); patch.pay_type = pay_type; }
      await db(`employee?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      // Deactivating someone still ON the clock used to leave their interval
      // open forever (risk sweep) — close it at the moment of deactivation.
      if (active === false) {
        const [lastCk] = await db(`clock_event?select=kind,line_id&voided=is.false&employee_id=eq.${id}&order=claimed_at.desc&limit=1`);
        if (lastCk && lastCk.kind === "clock_in") {
          await db("clock_event", { method: "POST", body: JSON.stringify({
            employee_id: id, line_id: lastCk.line_id, kind: "clock_out_auto",
            reason: "Deactivated while on the clock", claimed_at: new Date().toISOString() }) });
          logEvent("clock.force_out", adminId, { employee_id: id, cause: "deactivation" });
        }
      }
      logEvent("employee.updated", adminId, { employee_id: id, changes: patch });
      return json(200, { ok: true });
    }

    // Q114 backfill: one tap covers every active name without a PIN. The
    // response only carries the count — codes are read off the roster.
    if (url.pathname === "/api/admin/temp-pins" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const bare = await db(`employee?select=id&active=is.true&pin_hash=is.null`);
      for (const e of bare) await assignTempPin(e.id);
      logEvent("pin.temp_backfill", adminId, { count: bare.length });
      return json(200, { ok: true, count: bare.length });
    }

    // SHOP HOURS (Q113): the two numbers everything derives from. Admin
    // only; sane-range checked; audited; the 60-second cache picks them up.
    if (url.pathname === "/api/admin/shop-hours" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const { open, close } = await body(req);
      // Q115: only real numbers — {open:[7]} used to coerce through Number() and pass.
      if (typeof open !== "number" || typeof close !== "number")
        return json(400, { ok: false, error: "Hours need to be 24-hour numbers with open before close — like 7 and 16" });
      const o = Number(open), c = Number(close);
      if (!Number.isInteger(o) || !Number.isInteger(c) || o < 0 || o > 23 || c < 1 || c > 23 || o >= c)
        return json(400, { ok: false, error: "Hours need to be 24-hour numbers with open before close — like 7 and 16" });
      for (const [k, val] of [["shop_open_hour", o], ["shop_close_hour", c]]) {
        await db(`shop_setting?key=eq.${k}`, { method: "DELETE" });
        await db("shop_setting", { method: "POST", body: JSON.stringify({ key: k, value: String(val) }) });
      }
      SHOP_HOURS.loadedAt = 0; // next read refreshes immediately
      logEvent("shop.hours_set", adminId, { open: o, close: c });
      return json(200, { ok: true });
    }

    // Q91: SHOP CALENDAR — mark a date closed/open, or clear the override.
    if (url.pathname === "/api/admin/calendar" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const { action, cal_date, is_open, reason } = await body(req);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(cal_date || "")) || isNaN(new Date(cal_date + "T12:00:00Z").getTime()))
        return json(400, { ok: false, error: "Pick a real date first" });
      if (action === "remove") {
        await db(`shop_calendar?cal_date=eq.${cal_date}`, { method: "DELETE" });
        logEvent("calendar.cleared", adminId, { cal_date });
      } else {
        // upsert: clear any prior override for the date, then set the new one
        await db(`shop_calendar?cal_date=eq.${cal_date}`, { method: "DELETE" });
        await db("shop_calendar", { method: "POST", body: JSON.stringify({
          cal_date, is_open: Boolean(is_open), reason: String(reason || "").slice(0, 120) || null, created_by: adminId }) });
        logEvent("calendar.set", adminId, { cal_date, is_open: Boolean(is_open) });
      }
      SHOP_CAL.loadedAt = 0; // next read refreshes immediately
      return json(200, { ok: true });
    }

    // Q91: DAY-START NUDGE TIMES — per-weekday HH:MM (Phoenix).
    if (url.pathname === "/api/admin/nudge-times" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const b = await body(req);
      const days = ["mon", "tue", "wed", "thu", "fri"];
      for (const d of days) {
        const t = String(b[d] || "").trim();
        if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(t))
          return json(400, { ok: false, error: `${d.toUpperCase()} time needs to look like 7:05 or 07:35` });
      }
      for (const d of days) {
        const t = String(b[d]).trim();
        await db(`shop_setting?key=eq.nudge_${d}`, { method: "DELETE" });
        await db("shop_setting", { method: "POST", body: JSON.stringify({ key: `nudge_${d}`, value: t }) });
      }
      logEvent("nudge.times_set", adminId, { mon: b.mon, tue: b.tue, wed: b.wed, thu: b.thu, fri: b.fri });
      return json(200, { ok: true });
    }

    // Q116: run the pace patrol on demand (admin) — powers a "check now"
    // button and the block-31 E2E. Same edge-triggered logic as the timer.
    if (url.pathname === "/api/admin/pace-run" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      await pacePatrol();
      const reds = await db(`build?select=order_number&state=in.(active,rework)&pace_alert_color=eq.red`);
      logEvent("pace.run", adminId, { reds: reds.length });
      return json(200, { ok: true, red_now: reds.map((r) => r.order_number) });
    }

    // CAB NUMBER (Q110): set/correct a cab's wall number. Admin only. The
    // format is checked (digits + 1-2 letters), duplicates are refused
    // (numbers are never shared or reused), and every set is audited with
    // the old and new value. Blank = clear (rare; audited the same way).
    if (url.pathname === "/api/admin/cab-number" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const { build_id, cab_number } = await body(req);
      if (!build_id) return json(400, { ok: false, error: "Missing cab" });
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const clean = String(cab_number || "").trim().toUpperCase();
      if (clean && !/^\d{1,5}[A-Z]{1,2}$/.test(clean))
        return json(400, { ok: false, error: "Format is number + letter, like 244T" });
      const [b] = await db(`build?select=id,order_number,cab_number&id=eq.${build_id}`);
      if (!b) return json(404, { ok: false, error: "Cab not found" });
      if (clean) {
        const dupes = await db(`build?select=id&cab_number=eq.${encodeURIComponent(clean)}&id=neq.${build_id}`);
        if (dupes.length) return json(400, { ok: false, error: `Cab #${clean} is already taken — numbers are never shared` });
      }
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({ cab_number: clean || null }) });
      logEvent("build.cab_number_set", adminId, { build_id, order_number: b.order_number, from: b.cab_number || null, to: clean || null });
      return json(200, { ok: true });
    }

    // CHANNEL TEST (block 116): an admin proves the email/SMS credentials
    // work by sending ONE message to an explicitly typed address/number.
    // Admin-only, audited (notify.channel_test). Bypasses the sandbox TARGET
    // logic on purpose — the admin typed the destination — and the content
    // is unmistakably a test message.
    if (url.pathname === "/api/notify/test" && req.method === "POST") {
      const [adminId116, fail116] = await requireAdmin(); if (fail116) return fail116;
      const p116 = await body(req);
      const ch116 = p116.channel === "sms" ? "sms" : "email";
      const to116 = String(p116.to || "").trim().slice(0, 120);
      if (!to116) return json(400, { ok: false, error: "Type where the test should go" });
      if (ch116 === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to116)) return json(400, { ok: false, error: "That doesn't look like an email address" });
      if (ch116 === "sms" && to116.replace(/\D/g, "").length < 10) return json(400, { ok: false, error: "That doesn't look like a full phone number" });
      try {
        if (ch116 === "email") await sendEmail116(to116, "Shop Board test email",
          "This is the Shop Board proving the info@premierstreetrod.com mailbox can send.\nIf you're reading this, email is working.");
        else await sendSms116(to116, "Shop Board test text: if you're reading this, texting is working.");
      } catch (e) { return json(400, { ok: false, error: String(e.message || "Send failed").slice(0, 200) }); }
      logEvent("notify.channel_test", adminId116, { channel: ch116, to: to116 });
      return json(200, { ok: true });
    }

    // Block 117: admin sets anyone's channel switches / contact info.
    if (url.pathname === "/api/admin/channels" && req.method === "POST") {
      const [adminId117, fail117] = await requireAdmin(); if (fail117) return fail117;
      const p117 = await body(req);
      if (!isUuid(p117.employee_id)) return json(400, { ok: false, error: "Bad person reference" });
      const ch117 = String(p117.channel || "");
      if (!["push", "sms"].includes(ch117)) return json(400, { ok: false, error: ch117 === "email" ? "Email notifications are turned off for now." : "Unknown channel" });   // Block 171 (owner ruling): email hidden — a stale admin page can't flip it either
      const on117 = p117.enabled === true || p117.enabled === "true";
      await db(`employee?id=eq.${p117.employee_id}`, { method: "PATCH", body: JSON.stringify({ ["notify_" + ch117]: on117 }) });
      logEvent("settings.channel", adminId117, { employee_id: p117.employee_id, channel: ch117, enabled: on117, by: "admin" });
      return json(200, { ok: true });
    }
    if (url.pathname === "/api/admin/contact" && req.method === "POST") {
      const [adminId117b, fail117b] = await requireAdmin(); if (fail117b) return fail117b;
      const p117 = await body(req);
      if (!isUuid(p117.employee_id)) return json(400, { ok: false, error: "Bad person reference" });
      const mob117 = String(p117.mobile || "").trim().slice(0, 30);
      const eml117 = String(p117.email || "").trim().slice(0, 120);
      if (mob117 && mob117.replace(/\D/g, "").length < 10) return json(400, { ok: false, error: "That phone number looks short" });
      if (eml117 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eml117)) return json(400, { ok: false, error: "That email address looks off" });
      // Block 171: same guard as the self endpoint — the admin table no longer
      // sends an email key, and an absent key must never wipe a stored address.
      const patch171b = { mobile: mob117 || null };
      if ("email" in p117) patch171b.email = eml117 || null;
      await db(`employee?id=eq.${p117.employee_id}`, { method: "PATCH", body: JSON.stringify(patch171b) });
      logEvent("settings.contact", adminId117b, { employee_id: p117.employee_id, mobile_set: Boolean(mob117), email_set: "email" in p117 ? Boolean(eml117) : "untouched", by: "admin" });
      return json(200, { ok: true });
    }
    // Block 117 (owner-rep: "wouldnt mind sending out a few text pushes so i
    // can see what they are going to look like"): ONE realistic example of
    // each notice the system sends, fired through the REAL chokepoint —
    // sandbox rules apply, so until go-live the whole set lands on the
    // owner-rep, on every channel that's on for him. Admin-only, audited.
    if (url.pathname === "/api/notify/samples" && req.method === "POST") {
      const [adminId118, fail118] = await requireAdmin(); if (fail118) return fail118;
      const set117 = [
        ["build.ready_inspection", "ORDER 23417 — ready for inspection", "Production finished its checklist on Line 1. Sign off in the Manager console, or send it back with a reason.", "/manager"],
        ["afterhours.claimed", "After hours: Jonathan is clocking in", "Reason: Making up hours — plan: finish crating 23445. Confirm in the Manager console if this is approved.", "/manager"],
        ["afterhours.wrapped", "After hours ended: Jonathan, 2.1h", "Wrap note: \"Finished the crate, swept bay 2.\" 1 photo attached. An ADMIN signs off in the Admin console before the hours count.", "/admin"],
        ["build.promise_conflict", "ORDER 23536 — can't make the sold ship date", "The math says this cab finishes after the date it was sold to ship. Day one is the time to re-plan or re-promise.", "/order/23536"],
        ["pace.warn", "Line 2: TEST-23702 needs help", "This cab just crossed into RED — it's 4.5 hours behind its checklist. A look now beats a surprise at 4pm.", "/board"],
        ["option.flagged", "Order 23539: 2 upgrades need hours", "Coyote sent options the library doesn't price yet. Open the order and set hours (or tap Not production).", "/order/23539"],
      ];
      for (const [ev117, ti117, bo117, li117] of set117) await notify(ev117, [adminId118], ti117, bo117, li117);
      logEvent("notify.samples", adminId118, { count: set117.length });
      return json(200, { ok: true });
    }

    // QUEUE MOVE (White Board): admin reorders the UPCOMING queue on a line — the
    // SAME one queue (queue_pos) the warehouse's kit-move uses, so the two surfaces
    // never fork. Priority/display only; clocks untouched. Audited (queue.move).
    if (url.pathname === "/api/queue/move" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const { build_id, dir } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [b] = await db(`build?select=id,line_id,state,queue_pos,order_number&id=eq.${build_id}`);
      if (!b || b.state !== "upcoming") return json(400, { ok: false, error: "Only upcoming cabs can be reordered" });
      const q = await db(`build?select=id,queue_pos&line_id=eq.${b.line_id}&state=eq.upcoming&order=queue_pos.asc.nullslast,created_at.asc`);
      const idx = q.findIndex((x) => x.id === b.id);
      const swap = dir === "up" ? q[idx - 1] : q[idx + 1];
      if (!swap) return json(400, { ok: false, error: dir === "up" ? "Already on deck" : "Already last" });
      await db(`build?id=eq.${b.id}`, { method: "PATCH", body: JSON.stringify({ queue_pos: swap.queue_pos ?? (idx + (dir === "up" ? 0 : 2)) }) });
      await db(`build?id=eq.${swap.id}`, { method: "PATCH", body: JSON.stringify({ queue_pos: b.queue_pos ?? (idx + 1) }) });
      logEvent("queue.move", adminId, { build_id, order_number: b.order_number, dir });
      // Block 131 (L6): a reorder can change who's on deck — revert any pull now stranded.
      await revertStrandedPull(b.line_id, adminId);
      return json(200, { ok: true });
    }

    // ADD HOURS (block 94, owner-rep): a manager OR admin adds extra hours to a
    // cab's clock — reason REQUIRED, lands as a tagged step on that cab, pace
    // math extends automatically, audited. Also resolves option/custom flags.
    if (url.pathname === "/api/build/addhours" && req.method === "POST") {
      const empIdH = await liveSession(req);
      if (!empIdH) return json(401, { ok: false, error: "Signed out" });
      const [meH] = await db(`employee?select=role&id=eq.${empIdH}`);
      if (!meH || (meH.role !== "admin" && meH.role !== "manager")) return json(403, { ok: false, error: "Managers and admins only" });
      const p = await body(req);
      if (!isUuid(p.build_id)) return json(400, { ok: false, error: "Bad cab reference" });
      const hrs = Number(p.hours), day = Number(p.day_no);
      // Block 104: 0 is a legal answer WHEN resolving a flag — it means
      // "confirmed: no shop labor" (ships loose / config choice). The flag
      // resolves, NO task is added, and the confirmation is audited.
      const zeroFlag104 = hrs === 0 && p.flag_id && isUuid(p.flag_id);
      if (!zeroFlag104 && !(hrs > 0 && hrs < 200)) return json(400, { ok: false, error: "Hours look wrong" });
      if (!Number.isInteger(day) || day < 1 || day > 30) return json(400, { ok: false, error: "Day looks wrong" });
      const reason = String(p.reason || "").trim();
      if (reason.length < 3) return json(400, { ok: false, error: "Give the reason — it shows on the cab and in the log" });
      const [bH] = await db(`build?select=id,order_number&id=eq.${p.build_id}`);
      if (!bH) return json(404, { ok: false, error: "Cab not found" });
      if (!zeroFlag104) await db("task", { method: "POST", body: JSON.stringify({ build_id: p.build_id, display_no: "X",
        name: "EXTRA — " + reason, day_no: day, man_hours: hrs, is_background: false,
        source: "manual", state: "not_started", sort_order: 9500 }) });
      const s138 = String(p.scope || "");   // Block 138: body_build = pushed along (kept for the future dept boards); none = no action
      const scope104 = zeroFlag104 ? (s138 === "other" || s138 === "body_build" ? s138 : "none") : "production";
      if (p.flag_id && isUuid(p.flag_id)) await db(`option_flag?id=eq.${p.flag_id}`, { method: "PATCH", body: JSON.stringify({ resolved: true, scope: scope104 }) });
      logEvent("hours.added", empIdH, { build_id: p.build_id, order_number: bH.order_number, hours: hrs, day_no: day, reason, flag_id: p.flag_id || null, scope: scope104 });
      return json(200, { ok: true });
    }

    // QUEUE PIN (block 89, owner-pin authority): an admin pins an upcoming cab
    // to its spot — the warehouse kit-slide can't move it or cross it (enforced
    // in /api/kit/move); admin reorders stay unrestricted. The pin clears
    // automatically when the build starts (freezeAndStart) or manually here.
    if (url.pathname === "/api/queue/pin" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const p = await body(req);
      const build_id = p.build_id; const want = !!p.pinned;
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [b] = await db(`build?select=id,state,order_number,queue_pinned&id=eq.${build_id}`);
      if (!b) return json(404, { ok: false, error: "Cab not found" });
      if (want && b.state !== "upcoming") return json(400, { ok: false, error: "Only an upcoming cab can be pinned" });
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({ queue_pinned: want }) });
      logEvent(want ? "queue.pinned" : "queue.unpinned", adminId, { build_id, order_number: b.order_number });
      return json(200, { ok: true, pinned: want });
    }

    // QUEUE STATE: a tiny version signature of the on-deck order across every line,
    // so the White Board and Warehouse Board can poll and refresh whenever anyone
    // (admin OR warehouse) reorders — nobody stares at a stale queue.
    if (url.pathname === "/api/queue/state") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role,department&id=eq.${empId}`);
      if (!me || (me.role !== "admin" && me.role !== "manager" && me.department !== "Warehouse")) return json(403, { ok: false, error: "Not allowed" });
      const rows = await db(`build?select=id,queue_pos,state,queue_pinned&state=in.(upcoming,active,awaiting_inspection,rework)&limit=100000`);
      rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      let seed = ""; for (const r of rows) seed += r.id + ":" + (r.queue_pos == null ? "" : r.queue_pos) + ":" + r.state + ":" + (r.queue_pinned ? 1 : 0) + "|";
      let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      return json(200, { v: String(h) });
    }

    // LINES manager (admin): add / rename / enable-disable a production line.
    if (url.pathname === "/api/admin/line" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const p = await body(req);
      const act = String(p.action || "");
      if (act === "add") {
        const name = String(p.name || "").trim();
        if (!name) return json(400, { ok: false, error: "Give the line a name" });
        if (name.length > 80) return json(400, { ok: false, error: "That name is too long" });
        const existing = await db(`line?select=id`);
        const nextId = Math.max(0, ...existing.map((l) => Number(l.id))) + 1;
        await db("line", { method: "POST", body: JSON.stringify({ id: nextId, name, enabled: true }) });
        logEvent("line.added", adminId, { id: nextId, name });
        return json(200, { ok: true, id: nextId });
      }
      if (act === "rename") {
        const id = Number(p.id), name = String(p.name || "").trim();
        if (!Number.isInteger(id)) return json(400, { ok: false, error: "Bad line reference" });
        if (!name) return json(400, { ok: false, error: "Give the line a name" });
        if (name.length > 80) return json(400, { ok: false, error: "That name is too long" });
        const [ln] = await db(`line?select=id,name&id=eq.${id}`);
        if (!ln) return json(404, { ok: false, error: "Line not found" });
        await db(`line?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
        logEvent("line.renamed", adminId, { id, from: ln.name, to: name });
        return json(200, { ok: true });
      }
      if (act === "toggle") {
        const id = Number(p.id), enabled = p.enabled === true || p.enabled === "true";
        if (!Number.isInteger(id)) return json(400, { ok: false, error: "Bad line reference" });
        const [ln] = await db(`line?select=id,name,enabled&id=eq.${id}`);
        if (!ln) return json(404, { ok: false, error: "Line not found" });
        if (!enabled) {
          const routed = await db(`product?select=part_number&lines=cs.{${id}}`);
          if (routed.length) return json(400, { ok: false, error: `Line ${id} still has ${routed.length} part${routed.length === 1 ? "" : "s"} routing to it — move those to another line first` });
        }
        await db(`line?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ enabled }) });
        logEvent("line.toggled", adminId, { id, name: ln.name, enabled });
        return json(200, { ok: true });
      }
      return json(400, { ok: false, error: "Unknown line action" });
    }

    // CATALOG manager (admin): reroute a cab family, or add a part number that
    // becomes accepted Coyote push data. The product catalog IS the accept-list.
    if (url.pathname === "/api/admin/catalog" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const p = await body(req);
      const act = String(p.action || "");
      // Block 91: retire-not-delete for part numbers. A retired part keeps its
      // history and its cabs on the board, but drops off every accept-list —
      // a NEW order carrying it parks ("unrecognized") until restored here.
      if (act === "retire" || act === "restore") {
        const part = String(p.part || "").trim().toUpperCase();
        if (!/^[A-Z0-9-]{2,40}$/.test(part)) return json(400, { ok: false, error: "That part number doesn't look right" });
        const [pr] = await db(`product?select=part_number,retired&part_number=eq.${encodeURIComponent(part)}`);
        if (!pr) return json(404, { ok: false, error: "Part not found" });
        await db(`product?part_number=eq.${encodeURIComponent(part)}`, { method: "PATCH", body: JSON.stringify({ retired: act === "retire" }) });
        logEvent(act === "retire" ? "catalog.part_retired" : "catalog.part_restored", adminId, { part_number: part });
        return json(200, { ok: true });
      }
      const allLines = await db(`line?select=id,enabled`);
      const okLine = new Set(allLines.filter((l) => l.enabled).map((l) => Number(l.id)));
      const wantLines = Array.isArray(p.lines)
        ? [...new Set(p.lines.map(Number).filter((n) => Number.isInteger(n) && okLine.has(n)))]
        : [];
      if (act === "route") {
        const family = String(p.family || "").trim();
        if (!family) return json(400, { ok: false, error: "Missing cab" });
        if (!wantLines.length) return json(400, { ok: false, error: "Pick at least one active line" });
        const parts = await db(`product?select=part_number&family=eq.${encodeURIComponent(family)}`);
        if (!parts.length) return json(404, { ok: false, error: "No parts found for that cab" });
        await db(`product?family=eq.${encodeURIComponent(family)}`, { method: "PATCH", body: JSON.stringify({ lines: wantLines }) });
        logEvent("catalog.family_routed", adminId, { family, lines: wantLines, parts: parts.length });
        return json(200, { ok: true });
      }
      if (act === "add-part") {
        const pn = String(p.part_number || "").trim().toUpperCase();
        const family = String(p.family || "").trim();
        if (!pn) return json(400, { ok: false, error: "Enter a part number" });
        if (!/^[A-Z0-9][A-Z0-9._-]{1,39}$/.test(pn)) return json(400, { ok: false, error: "That part number has unexpected characters" });
        if (!family) return json(400, { ok: false, error: "Enter a cab / family" });
        if (family.length > 60) return json(400, { ok: false, error: "That family name is too long" });
        if (!wantLines.length) return json(400, { ok: false, error: "Pick at least one active line" });
        const [exist] = await db(`product?select=part_number&part_number=eq.${encodeURIComponent(pn)}`);
        if (exist) return json(400, { ok: false, error: `${pn} is already in the catalog` });
        let [tmpl] = await db(`build_template?select=id&family=eq.${encodeURIComponent(family)}`);
        let newFamily = false;
        if (!tmpl) {
          // Brand-new family: create a DRAFT build template (no steps yet, ready=false).
          // The cab is accepted + routed, but held off the live board until an admin
          // fills in its build steps/hours and marks it ready (migration 0028).
          [tmpl] = await db("build_template", { method: "POST", body: JSON.stringify({ family, total_man_hours: 0, total_days: 0, ready: false }) });
          newFamily = true;
          logEvent("template.created_draft", adminId, { template_id: tmpl ? tmpl.id : null, family });
        }
        await db("product", { method: "POST", body: JSON.stringify({ part_number: pn, family, lines: wantLines, template_id: tmpl ? tmpl.id : null, is_smk: /SMK/.test(pn) }) });
        logEvent("catalog.part_added", adminId, { part_number: pn, family, lines: wantLines, new_family: newFamily });
        return json(200, { ok: true, new_family: newFamily });
      }
      return json(400, { ok: false, error: "Unknown catalog action" });
    }

    // TEMPLATE ready-gate (admin): mark a cab's build template ready — allowed
    // only once it has real steps that add up to > 0 hours — or set it back to
    // draft. A draft template's cab is accepted + routed but held off the board.
    // Block 97 (owner-rep): SHARED TABLET setup. An admin walks to the tablet,
    // signs in, opens Tools -> Tablet setup, and flips it ONCE. The device
    // keeps a year-long marker cookie; from then on EVERY sign-in on it mints
    // a 30-minute sliding session (renewed per page view in send()), so a
    // walked-away tablet signs itself out. Personal phones stay 12-hour.
    if (url.pathname === "/tablet") {
      const empT97 = await liveSession(req);
      if (!empT97) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [meT97] = await db(`employee?select=role&id=eq.${empT97}`);
      if (!meT97 || meT97.role !== "admin") { res.writeHead(302, { Location: "/home" }); return res.end(); } // block 118
      const isShared97 = /sb_shared=1/.test(req.headers.cookie || "");
      return send(200, "text/html; charset=utf-8", `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board">
<meta name="robots" content="noindex, nofollow"><title>Shop Board — Tablet setup</title>${style}</head>
<body><div class="wrap" style="max-width:640px">
  <div class="logo">SHOP <span>BOARD</span></div><p style="text-align:center;margin:2px 0 10px"><a href="/home" onclick="if(window.history.length>1){history.back();return false}" style="color:#8e8e93;font-size:.9rem;text-decoration:none">&#8592; Back</a></p>
  ${navBar95(true)}
  <h2>This device</h2>
  <div style="text-align:center;margin:8px 0 18px;padding:16px;border-radius:14px;font-weight:800;font-size:1.15rem;${isShared97 ? "background:#3a2f10;color:#ffd60a;border:2px solid #7a5900" : "background:#1c1c1e;color:#8e8e93;border:2px solid #3a3a3c"}">
    ${isShared97 ? "SHARED TABLET — signs out after 2 quiet minutes" : "PERSONAL DEVICE — normal 12-hour sign-in"}</div>
  <p style="text-align:center;opacity:.7;font-size:.95rem">Mark the shop's shared tablets so a walked-away screen signs itself out — 2 minutes with no touches brings up the login screen for the next person (time in the camera doesn't count, so photo runs are safe). Staff phones should stay unmarked.</p>
  <p style="text-align:center;margin-top:16px">
    ${isShared97
      ? `<button class="name" style="display:inline-block;width:auto;padding:14px 26px" onclick="setT97(false,this)">Unmark — back to personal device</button>`
      : `<button class="name" style="display:inline-block;width:auto;padding:14px 26px" onclick="setT97(true,this)">Mark as a SHARED TABLET</button>`}
  </p>
  <p class="msg err" id="terr97" style="text-align:center"></p>
  <script>
    async function setT97(shared, btn){ btn.disabled = true;
      try { const r = await fetch("/api/admin/tablet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shared }) });
        const o = await r.json(); if (o.ok) return location.reload();
        document.getElementById("terr97").textContent = o.error || "Something went wrong";
      } catch (e) { document.getElementById("terr97").textContent = "Network hiccup — try again"; }
      btn.disabled = false; }
  </script>
</div></body></html>`);
    }

    if (url.pathname === "/api/admin/tablet" && req.method === "POST") {
      const [adminT97, failT97] = await requireAdmin(); if (failT97) return failT97;
      const pT97 = await body(req);
      res.setHeader("Set-Cookie", pT97.shared
        ? ["sb_shared=1; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax",
           "sb_shared_ui=1; Path=/; Max-Age=31536000; SameSite=Lax"]   // Block 214: readable twin — the walk-away watchdog checks this one
        : ["sb_shared=; Path=/; Max-Age=0", "sb_shared_ui=; Path=/; Max-Age=0"]);
      logEvent(pT97.shared ? "device.shared_marked" : "device.shared_unmarked", adminT97, {});
      return json(200, { ok: true });
    }

    // OPTION LIBRARY (block 94a): per-family upgrade options — exact Coyote
    // text + hours + build-day. Retire-not-delete. Matching happens at build
    // start; an option not in this library gets FLAGGED, never guessed.
    if (url.pathname === "/api/admin/option" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const p = await body(req);
      const act = String(p.action || "");
      if (act === "add") {
        if (!isUuid(p.template_id)) return json(400, { ok: false, error: "Bad template reference" });
        const [tp] = await db(`build_template?select=family&id=eq.${p.template_id}`);
        if (!tp) return json(404, { ok: false, error: "Template not found" });
        const mt = String(p.match_text || "").trim();
        if (mt.length < 3 || mt.length > 160) return json(400, { ok: false, error: "Type the option exactly as Coyote sends it" });
        const hrs = Number(p.man_hours), day = Number(p.day_no);
        if (!(hrs >= 0 && hrs < 200)) return json(400, { ok: false, error: "Hours look wrong" });
        if (!Number.isInteger(day) || day < 1 || day > 30) return json(400, { ok: false, error: "Day looks wrong" });
        await db("option_item", { method: "POST", body: JSON.stringify({ family: tp.family, match_text: mt, man_hours: hrs, day_no: day }) });
        logEvent("option.added", adminId, { family: tp.family, match_text: mt, man_hours: hrs, day_no: day });
        return json(200, { ok: true });
      }
      if (!isUuid(p.id)) return json(400, { ok: false, error: "Bad option reference" });
      if (act === "update") {
        const hrs = Number(p.man_hours), day = Number(p.day_no);
        if (!(hrs >= 0 && hrs < 200) || !Number.isInteger(day) || day < 1 || day > 30) return json(400, { ok: false, error: "Hours/day look wrong" });
        await db(`option_item?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ man_hours: hrs, day_no: day }) });
        logEvent("option.updated", adminId, { id: p.id, man_hours: hrs, day_no: day });
        return json(200, { ok: true });
      }
      if (act === "retire" || act === "restore") {
        await db(`option_item?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ retired: act === "retire" }) });
        logEvent(act === "retire" ? "option.retired" : "option.restored", adminId, { id: p.id });
        return json(200, { ok: true });
      }
      return json(400, { ok: false, error: "Unknown action" });
    }

    if (url.pathname === "/api/admin/template" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const p = await body(req);
      if (!isUuid(p.template_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const [t] = await db(`build_template?select=id,family,ready&id=eq.${p.template_id}`);
      if (!t) return json(404, { ok: false, error: "Cab template not found" });
      if (p.action === "mark-ready") {
        const steps = await db(`step_template?select=man_hours&template_id=eq.${t.id}&retired=is.false`);
        if (!steps.length) return json(400, { ok: false, error: "Add the build steps before marking this cab ready" });
        const totalHrs = steps.reduce((s, x) => s + (Number(x.man_hours) || 0), 0);
        if (totalHrs <= 0) return json(400, { ok: false, error: "The build steps add up to 0 hours — set real hours before marking ready" });
        await db(`build_template?id=eq.${t.id}`, { method: "PATCH", body: JSON.stringify({ ready: true }) });
        logEvent("template.marked_ready", adminId, { template_id: t.id, family: t.family, steps: steps.length, total_hours: totalHrs });
        return json(200, { ok: true });
      }
      if (p.action === "mark-draft") {
        await db(`build_template?id=eq.${t.id}`, { method: "PATCH", body: JSON.stringify({ ready: false }) });
        logEvent("template.set_draft", adminId, { template_id: t.id, family: t.family });
        return json(200, { ok: true });
      }
      return json(400, { ok: false, error: "Unknown template action" });
    }

    // SYNC RUN (admin / scheduler): the Coyote→board write engine.
    // {mode:"preview"} computes the plan and writes nothing; {mode:"apply"}
    // executes it (places/updates/completes/cancels cabs + stamps processed_at).
    // Idempotent, audited. This is what the hourly scheduled task will call.
    if (url.pathname === "/api/admin/sync" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const p = await body(req);
      const apply = p.mode === "apply";
      const sum = await syncRun(apply, adminId);
      return json(200, { ok: true, summary: sum });
    }

    // BUILD STEPS: the Q97 editor. Template edits shape FUTURE cabs only —
    // started cabs keep the frozen copy made at start. Delete = retire (history kept).
    // Block 152 (owner-rep, B3): the DAYS field accepts a carry-over range —
    // "4,5" (or "4-5") means the step starts Day 4 and runs into Day 5. PURE
    // DISPLAY: the verified day/pace math is hours-driven and never reads
    // day_no, so the range only changes the label a tech sees. The step still
    // groups under its START day; day_end rides along (frozen onto the cab's
    // tasks like every other step field).
    if (url.pathname === "/api/admin/step" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const p = await body(req);
      if (p.action === "update") {
        const patch = Object.assign({ display_no: String(p.display_no || ""), name: String(p.name || ""),
          man_hours: Number(p.man_hours) || 0 }, parseDays152(p.day_no));   // Block 152: "4,5" carry-over
        if (!patch.name) return json(400, { ok: false, error: "A step needs a name" });
        await db(`step_template?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify(patch) });
        logEvent("template.step_updated", adminId, { step_id: p.id, changes: patch });
        return json(200, { ok: true });
      }
      if (p.action === "move") {
        const [s] = await db(`step_template?select=id,template_id,sort_order&id=eq.${p.id}`);
        if (!s) return json(404, { ok: false, error: "Step not found" });
        const dirOp = p.dir === "up" ? `sort_order=lt.${s.sort_order}&order=sort_order.desc` : `sort_order=gt.${s.sort_order}&order=sort_order.asc`;
        const [n] = await db(`step_template?select=id,sort_order&template_id=eq.${s.template_id}&retired=is.false&${dirOp}&limit=1`);
        if (!n) return json(400, { ok: false, error: "Already at the end" });
        await db(`step_template?id=eq.${s.id}`, { method: "PATCH", body: JSON.stringify({ sort_order: n.sort_order }) });
        await db(`step_template?id=eq.${n.id}`, { method: "PATCH", body: JSON.stringify({ sort_order: s.sort_order }) });
        logEvent("template.step_moved", adminId, { step_id: s.id, dir: p.dir, swapped_with: n.id });
        return json(200, { ok: true });
      }
      if (p.action === "retire") {
        // Block 25 symmetry: retiring numeric step 7 pulls 8, 9… back UP by
        // one, so the list stays a clean 1..N instead of growing gaps.
        const [gone] = await db(`step_template?select=id,template_id,display_no&id=eq.${p.id}`);
        await db(`step_template?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ retired: true }) });
        if (gone && /^\d+$/.test(String(gone.display_no))) {
          const gN = Number(gone.display_no);
          const restR = await db(`step_template?select=id,display_no&template_id=eq.${gone.template_id}&retired=is.false`);
          for (const s of restR)
            if (/^\d+$/.test(String(s.display_no)) && Number(s.display_no) > gN)
              await db(`step_template?id=eq.${s.id}`, { method: "PATCH", body: JSON.stringify({ display_no: String(Number(s.display_no) - 1) }) });
        }
        logEvent("template.step_retired", adminId, { step_id: p.id });
        return json(200, { ok: true });
      }
      if (p.action === "add") {
        if (!p.name) return json(400, { ok: false, error: "A step needs a name" });
        // Block 25 (owner-rep): adding a step AS #7 used to just append a
        // second 7. Now a numeric display number INSERTS: every numeric step
        // at or after it shifts down by one (7→8, 8→9…) and the new step
        // takes that spot in the running order. Non-numeric numbers (rework
        // R1…) are never touched. Q97 still applies — future cabs only.
        const stepsA = await db(`step_template?select=id,display_no,sort_order&template_id=eq.${p.template_id}&retired=is.false&order=sort_order`);
        const wantNo = String(p.display_no || "").trim();
        const nA = /^\d+$/.test(wantNo) ? Number(wantNo) : null;
        const bumped = nA === null ? null
          : stepsA.find((s) => /^\d+$/.test(String(s.display_no)) && Number(s.display_no) >= nA);
        let newSort = ((stepsA[stepsA.length - 1] || {}).sort_order || 0) + 1;
        if (bumped) {
          newSort = bumped.sort_order;
          for (const s of stepsA) {
            const patch = {};
            if (s.sort_order >= newSort) patch.sort_order = s.sort_order + 1;
            if (/^\d+$/.test(String(s.display_no)) && Number(s.display_no) >= nA) patch.display_no = String(Number(s.display_no) + 1);
            if (Object.keys(patch).length) await db(`step_template?id=eq.${s.id}`, { method: "PATCH", body: JSON.stringify(patch) });
          }
        }
        const [row] = await db("step_template", { method: "POST", body: JSON.stringify(Object.assign({
          template_id: p.template_id, display_no: wantNo, name: String(p.name),
          man_hours: Number(p.man_hours) || 0,
          is_background: false, sort_order: newSort }, parseDays152(p.day_no))) });
        logEvent("template.step_added", adminId, { step_id: row ? row.id : null, template_id: p.template_id, name: p.name, display_no: wantNo, renumbered: Boolean(bumped) });
        return json(200, { ok: true });
      }
      return json(400, { ok: false, error: "Unknown action" });
    }

    // Q77: REASON-LIST (pick-list) EDITOR — admin-only. Manage the choices in
    // any admin-editable reason list: rename, reorder (swap sort_order with the
    // neighbour, like steps), add (deduped, appended), retire/restore
    // (retire-not-delete). Adds only to a list that already exists (code owns
    // which lists exist). Every change is audited.
    if (url.pathname === "/api/admin/picklist" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const p = await body(req);
      if (p.action === "rename") {
        if (!isUuid(p.id)) return json(400, { ok: false, error: "That choice reference isn't valid" });
        const label = String(p.label || "").trim();
        if (!label) return json(400, { ok: false, error: "A choice needs a name" });
        await db(`pick_list_item?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ label }) });
        logEvent("picklist.renamed", adminId, { id: p.id, label });
        return json(200, { ok: true });
      }
      if (p.action === "move") {
        if (!isUuid(p.id)) return json(400, { ok: false, error: "That choice reference isn't valid" });
        const [it] = await db(`pick_list_item?select=id,list_key,sort_order&id=eq.${p.id}`);
        if (!it) return json(404, { ok: false, error: "Choice not found" });
        const dirOp = p.dir === "up" ? `sort_order=lt.${it.sort_order}&order=sort_order.desc` : `sort_order=gt.${it.sort_order}&order=sort_order.asc`;
        const [n] = await db(`pick_list_item?select=id,sort_order&list_key=eq.${encodeURIComponent(it.list_key)}&retired=is.false&${dirOp}&limit=1`);
        if (!n) return json(400, { ok: false, error: "Already at the end" });
        await db(`pick_list_item?id=eq.${it.id}`, { method: "PATCH", body: JSON.stringify({ sort_order: n.sort_order }) });
        await db(`pick_list_item?id=eq.${n.id}`, { method: "PATCH", body: JSON.stringify({ sort_order: it.sort_order }) });
        logEvent("picklist.moved", adminId, { id: it.id, dir: p.dir, swapped_with: n.id });
        return json(200, { ok: true });
      }
      if (p.action === "retire") {
        if (!isUuid(p.id)) return json(400, { ok: false, error: "That choice reference isn't valid" });
        await db(`pick_list_item?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ retired: Boolean(p.retired) }) });
        logEvent(p.retired ? "picklist.retired" : "picklist.restored", adminId, { id: p.id });
        return json(200, { ok: true });
      }
      if (p.action === "add") {
        const label = String(p.label || "").trim();
        const listKey = String(p.list_key || "").trim();
        if (!label) return json(400, { ok: false, error: "A choice needs a name" });
        if (!listKey) return json(400, { ok: false, error: "Pick a list" });
        // Add only to a list the code already defines (has at least one row).
        const existing = await db(`pick_list_item?select=id,label,sort_order&list_key=eq.${encodeURIComponent(listKey)}`);
        if (!existing.length) return json(400, { ok: false, error: "That list doesn't exist" });
        if (existing.some((e) => String(e.label).toLowerCase() === label.toLowerCase()))
          return json(400, { ok: false, error: "That choice is already in this list" });
        const nextSort = Math.max(0, ...existing.map((e) => e.sort_order || 0)) + 1;
        const [row] = await db("pick_list_item", { method: "POST", body: JSON.stringify({ list_key: listKey, label, sort_order: nextSort, retired: false }) });
        logEvent("picklist.added", adminId, { id: row ? row.id : null, list_key: listKey, label });
        return json(200, { ok: true });
      }
      return json(400, { ok: false, error: "Unknown action" });
    }

    // FEATURES: the Q65 switches. Flip is stamped with who + when and event-logged.
    // Q86: set a product's completion-photo minimum (0-20; 0 exempts it).
    if (url.pathname === "/api/admin/product" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const { part_number, photo_min } = await body(req);
      if (!part_number || typeof part_number !== "string") return json(400, { ok: false, error: "Missing product" });
      const n = Number(photo_min);
      if (!Number.isInteger(n) || n < 0 || n > 20) return json(400, { ok: false, error: "Min photos must be a whole number from 0 to 20" });
      const [prod] = await db(`product?select=part_number&part_number=eq.${encodeURIComponent(part_number)}`);
      if (!prod) return json(404, { ok: false, error: "Unknown product" });
      await db(`product?part_number=eq.${encodeURIComponent(part_number)}`, { method: "PATCH", body: JSON.stringify({ photo_min: n }) });
      logEvent("product.photo_min", adminId, { part_number, photo_min: n });
      return json(200, { ok: true });
    }

    if (url.pathname === "/api/admin/toggle" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const { key, enabled } = await body(req);
      await db(`feature_toggle?key=eq.${encodeURIComponent(key)}`, { method: "PATCH",
        body: JSON.stringify({ enabled: Boolean(enabled), changed_by: adminId, changed_at: new Date().toISOString() }) });
      logEvent("toggle.flipped", adminId, { key, enabled: Boolean(enabled) });
      return json(200, { ok: true });
    }

    // ---------- COMPLETION PHOTOS (file 11 — the finish gate's photo half) ----------
    // Upload: the phone camera file is POSTed as a RAW image body (no
    // multipart — zero-dependency rule), metadata in the query string.
    // 8 MB cap per photo. Stored in the PRIVATE cab-photos bucket; the
    // metadata row lands in build_photo. Q86's per-product minimum becomes
    // a hard gate when product settings arrive; today the gate nudges.
    // Q86 hand-off: mint a short code so a phone can add photos to this cab.
    if (url.pathname === "/api/handoff/new" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [lastCk] = await db(`clock_event?select=kind&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (!lastCk || lastCk.kind !== "clock_in") return json(403, { ok: false, error: "Clock in first" });
      const { build_id, task_id } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      if (task_id != null && !isUuid(task_id)) return json(400, { ok: false, error: "That step reference isn't valid" });
      const [b] = await db(`build?select=id&id=eq.${build_id}`);
      if (!b) return json(404, { ok: false, error: "Cab not found" });
      const code = newHandoff(build_id, task_id || null, empId);
      logEvent("handoff.opened", empId, { build_id, task_id: task_id || null });
      const origin = "https://" + (req.headers.host || "shopboard.premierstreetrod.com");
      const qrUrl = origin + "/h?c=" + code;
      return json(200, { ok: true, code, path: "/h?c=" + code, url: qrUrl, qr: qrSvg(qrUrl) });
    }

    // Q86 hand-off: the NO-LOGIN phone page (validates the code itself).
    if (url.pathname === "/h") {
      const c = url.searchParams.get("c");
      const h = c ? getHandoff(c) : null;
      if (!h) return send(200, "text/html; charset=utf-8", handoffPage(null));
      const [b] = await db(`build?select=order_number,cab_number&id=eq.${h.build_id}`);
      return send(200, "text/html; charset=utf-8", handoffPage({ code: c, order: b ? b.order_number : "", cab: b ? b.cab_number : "", task: Boolean(h.task_id) }));
    }

    // Q86 hand-off: the NO-LOGIN photo upload. Guarded by the code alone — it can
    // ONLY add a photo to that code's one cab, capped, and time-limited.
    if (url.pathname === "/api/handoff/upload" && req.method === "POST") {
      const h = getHandoff(url.searchParams.get("code"));
      if (!h) return json(410, { ok: false, error: "This code expired - ask for a fresh one on the tablet" });
      if (h.count >= HANDOFF_MAX_PHOTOS) return json(429, { ok: false, error: "That's plenty - this code has taken its limit of photos" });
      const ctype = String(req.headers["content-type"] || "");
      if (!ctype.startsWith("image/")) return json(400, { ok: false, error: "Photos only" });
      if (/hei[cf]/.test(ctype)) return json(415, { ok: false, error: "That photo format (HEIC) can't be shown on the shop screens - retake or re-pick it so the phone converts it" });
      const chunks = []; let size = 0, over = false;
      await new Promise((resolve) => {
        req.on("data", (c) => { size += c.length; if (size > 8000000) { over = true; req.destroy(); } else chunks.push(c); });
        req.on("end", resolve); req.on("close", resolve);
      });
      if (over) return json(413, { ok: false, error: "Photo too large (8 MB max)" });
      const buf = Buffer.concat(chunks);
      const ext = ctype.includes("png") ? "png" : ctype.includes("webp") ? "webp" : "jpg";
      const path = `${h.build_id}/${Date.now()}.${ext}`;
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/cab-photos/${path}`, {
        method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": ctype }, body: buf });
      if (!up.ok) { console.error("handoff store failed:", up.status, await up.text()); return json(500, { ok: false, error: "Could not store the photo" }); }
      const [row] = await db("build_photo", { method: "POST", body: JSON.stringify({
        build_id: h.build_id, task_id: h.task_id, uploaded_by: h.created_by, storage_path: path, kind: h.task_id ? "task" : "finish" }) });
      h.count += 1;
      logEvent("handoff.photo", h.created_by, { build_id: h.build_id, task_id: h.task_id, photo_id: row ? row.id : null, bytes: buf.length });
      return json(200, { ok: true, count: h.count });
    }

    if (url.pathname === "/api/photo/upload" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [lastCk] = await db(`clock_event?select=kind&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (!lastCk || lastCk.kind !== "clock_in") return json(403, { ok: false, error: "Clock in first" });
      const build_id = url.searchParams.get("build_id");
      const ctype = String(req.headers["content-type"] || "");
      if (!build_id) return json(400, { ok: false, error: "Missing build" });
      // Block 172 (break-pass): guard the id — becomes a storage path + insert value.
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      if (!ctype.startsWith("image/")) return json(400, { ok: false, error: "Photos only" });
      // HEIC backstop: phones convert before upload; if a raw HEIC still
      // arrives (odd browser path), answer in plain English instead of
      // storing a photo desktop screens can't show.
      if (/hei[cf]/.test(ctype))
        return json(415, { ok: false, error: "That photo format (HEIC) can't be shown on the shop screens — retake it with the camera, or pick it again so the phone converts it" });
      const chunks = []; let size = 0, over = false;
      await new Promise((resolve) => {
        req.on("data", (c) => { size += c.length; if (size > 8000000) { over = true; req.destroy(); } else chunks.push(c); });
        req.on("end", resolve); req.on("close", resolve);
      });
      if (over) return json(413, { ok: false, error: "Photo too large (8 MB max)" });
      const buf = Buffer.concat(chunks);
      // task_id present = a PER-TASK photo (file 11); absent = a finish-gate photo.
      const task_id = url.searchParams.get("task_id") || null;
      if (task_id != null && !isUuid(task_id)) return json(400, { ok: false, error: "That step reference isn't valid" }); // Block 172 (break-pass)
      const ext = ctype.includes("png") ? "png" : ctype.includes("webp") ? "webp" : "jpg";
      const path = `${build_id}/${Date.now()}.${ext}`;
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/cab-photos/${path}`, {
        method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": ctype },
        body: buf });
      if (!up.ok) { console.error("photo store failed:", up.status, await up.text()); return json(500, { ok: false, error: "Could not store the photo" }); }
      // Block 209 (owner, Sat 8/22): kind=progress marks an END-OF-DAY cab
      // progress photo — the feed the customer build reports will draw from.
      const kindQ209 = url.searchParams.get("kind") === "progress" && !task_id ? "progress" : null;
      const [row] = await db("build_photo", { method: "POST", body: JSON.stringify({
        build_id, task_id, uploaded_by: empId, storage_path: path, kind: kindQ209 || (task_id ? "task" : "finish") }) });
      logEvent("photo.added", empId, { build_id, task_id, photo_id: row ? row.id : null, bytes: buf.length, kind: kindQ209 || undefined });
      return json(200, { ok: true, id: row ? row.id : null });
    }

    // Block 107: after-hours wrap-up photos — optional evidence riding the
    // wrap-up. Raw image body like every other upload; tied to the caller's
    // own OPEN after-hours session (no ids from the client to trust).
    if (url.pathname === "/api/afterhours/photo" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [openAhP] = await db(`after_hours_session?select=id&employee_id=eq.${empId}&ended_at=is.null&order=started_at.desc&limit=1`);
      if (!openAhP) return json(400, { ok: false, error: "No open after-hours session" });
      const ctype = String(req.headers["content-type"] || "");
      if (!ctype.startsWith("image/")) return json(400, { ok: false, error: "Photos only" });
      if (/hei[cf]/.test(ctype)) return json(415, { ok: false, error: "That photo format (HEIC) can't be shown on the shop screens — retake or re-pick it so the phone converts it" });
      const chunks = []; let size = 0, over = false;
      await new Promise((resolve) => {
        req.on("data", (c) => { size += c.length; if (size > 8000000) { over = true; req.destroy(); } else chunks.push(c); });
        req.on("end", resolve); req.on("close", resolve);
      });
      if (over) return json(413, { ok: false, error: "Photo too large (8 MB max)" });
      const buf = Buffer.concat(chunks);
      const ext = ctype.includes("png") ? "png" : ctype.includes("webp") ? "webp" : "jpg";
      const path = `afterhours/${openAhP.id}/${Date.now()}.${ext}`;
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/cab-photos/${path}`, {
        method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": ctype }, body: buf });
      if (!up.ok) { console.error("ah photo store failed:", up.status, await up.text()); return json(500, { ok: false, error: "Could not store the photo" }); }
      const [row] = await db("after_hours_photo", { method: "POST", body: JSON.stringify({
        session_id: openAhP.id, uploaded_by: empId, storage_path: path }) });
      logEvent("afterhours.photo", empId, { session_id: openAhP.id, photo_id: row ? row.id : null, bytes: buf.length });
      return json(200, { ok: true, id: row ? row.id : null });
    }

    // PER-TASK NOTE (file 11): a written note attached to one step —
    // documents a problem or the work right where it happened. Append-only
    // from the floor; who wrote it is recorded.
    // Block 209 (owner, Sat 8/22): an END-OF-DAY progress NOTE on the cab —
    // the words half of the customer build-report feed (photo OR note counts
    // toward the mandatory gate once the toggle flips). Event-logged; no new
    // table needed.
    // Block 211 (owner, Sat 8/22): MODERATION — "i can forsee staff trying
    // to be funny or grammer errors... i dont want to send a raunchy photo
    // to a customer." Admin-only: edit or hide/unhide any progress note,
    // hide/unhide any photo, and ADD a note onto any date of the build.
    // Hidden items never print on the customer report (and never satisfy
    // the end-of-day gate); everything is audited.
    if (url.pathname === "/api/build/note-admin" && req.method === "POST") {
      const empA = await liveSession(req);
      if (!empA) return json(401, { ok: false, error: "Signed out" });
      const [meA] = await db(`employee?select=role&id=eq.${empA}`);
      if (!meA || meA.role !== "admin") return json(403, { ok: false, error: "Admin only" });
      const pA = await body(req);
      if (pA.action === "add") {
        if (!isUuid(pA.build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
        const txtA = String(pA.note || "").trim().slice(0, 500);
        if (!txtA) return json(400, { ok: false, error: "Write the note first" });
        const rowA = { build_id: pA.build_id, author_id: empA, note: txtA };
        if (pA.note_date && /^\d{4}-\d{2}-\d{2}$/.test(pA.note_date)) rowA.note_date = pA.note_date;
        await db("build_note", { method: "POST", body: JSON.stringify(rowA) });
        logEvent("build.note_admin", empA, { action: "add", build_id: pA.build_id, note: txtA, note_date: rowA.note_date || null });
        return json(200, { ok: true });
      }
      // Block 218: STEP notes are moderatable too — src:"task" targets
      // task_note (uuid ids), the default targets build_note. AUDIT FIX
      // caught here: build_note ids are BIGINTs (migration 0053), so the old
      // isUuid-only check would have refused every real crew-note edit/hide.
      const src218 = pA.src === "task" ? "task_note" : "build_note";
      const idOk218 = src218 === "task_note" ? isUuid(String(pA.note_id)) : /^\d{1,12}$/.test(String(pA.note_id));
      if (!idOk218) return json(400, { ok: false, error: "That note reference isn't valid" });
      if (pA.action === "edit") {
        const txtE = String(pA.note || "").trim().slice(0, 500);
        if (!txtE) return json(400, { ok: false, error: "Write the note first" });
        await db(`${src218}?id=eq.${pA.note_id}`, { method: "PATCH", body: JSON.stringify({ note: txtE, edited_by: empA, edited_at: new Date().toISOString() }) });
        logEvent("build.note_admin", empA, { action: "edit", note_id: pA.note_id, src: src218, note: txtE });
        return json(200, { ok: true });
      }
      if (pA.action === "hide" || pA.action === "unhide") {
        await db(`${src218}?id=eq.${pA.note_id}`, { method: "PATCH", body: JSON.stringify({ hidden: pA.action === "hide", edited_by: empA, edited_at: new Date().toISOString() }) });
        logEvent("build.note_admin", empA, { action: pA.action, note_id: pA.note_id, src: src218 });
        return json(200, { ok: true });
      }
      return json(400, { ok: false, error: "Unknown action" });
    }
    if (url.pathname === "/api/photo/moderate" && req.method === "POST") {
      const empM = await liveSession(req);
      if (!empM) return json(401, { ok: false, error: "Signed out" });
      const [meM] = await db(`employee?select=role&id=eq.${empM}`);
      if (!meM || meM.role !== "admin") return json(403, { ok: false, error: "Admin only" });
      const { photo_id, hidden } = await body(req);
      if (!isUuid(photo_id)) return json(400, { ok: false, error: "That photo reference isn't valid" });
      await db(`build_photo?id=eq.${photo_id}`, { method: "PATCH", body: JSON.stringify({ hidden: hidden === true }) });
      logEvent("photo.moderated", empM, { photo_id, hidden: hidden === true });
      return json(200, { ok: true });
    }
    if (url.pathname === "/api/build/prognote" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const { build_id, note } = await body(req);
      if (!isUuid(build_id)) return json(400, { ok: false, error: "That cab reference isn't valid" });
      const txt209 = String(note || "").trim().slice(0, 500);
      if (!txt209) return json(400, { ok: false, error: "Write the note first" });
      const [bP209] = await db(`build?select=id,order_number&id=eq.${build_id}`);
      if (!bP209) return json(404, { ok: false, error: "Cab not found" });
      // Block 211 (owner): notes live in build_note now — a REAL row an admin
      // can edit or hide before anything reaches a customer (event_log stays
      // as the immutable audit of what was originally written).
      await db("build_note", { method: "POST", body: JSON.stringify({ build_id, author_id: empId, note: txt209 }) });
      logEvent("build.progress_note", empId, { build_id, order_number: bP209.order_number, note: txt209 });
      return json(200, { ok: true });
    }
    if (url.pathname === "/api/task/note" && req.method === "POST") {
      const empId = await liveSession(req);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [lastCk] = await db(`clock_event?select=kind&voided=is.false&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (!lastCk || lastCk.kind !== "clock_in") return json(403, { ok: false, error: "Clock in first" });
      const { task_id, note, claimed_at } = await body(req);
      if (!task_id || !note || !String(note).trim()) return json(400, { ok: false, error: "Write the note first" });
      if (!isUuid(task_id)) return json(400, { ok: false, error: "That step reference isn't valid" });
      const [t] = await db(`task?select=id,build_id,display_no&id=eq.${task_id}`);
      if (!t) return json(404, { ok: false, error: "Task not found" });
      const [row] = await db("task_note", { method: "POST", body: JSON.stringify({
        task_id, build_id: t.build_id, author_id: empId, note: String(note).trim() }) });
      logEvent("task.note_added", empId, { task_id, build_id: t.build_id,
        display_no: t.display_no, note_id: row ? row.id : null, at: claimed_at });
      return json(200, { ok: true });
    }

    // Serve a photo to any SIGNED-IN person — the bucket is private and the
    // app is the only door (spec §10: anon reaches nothing directly).
    // Block 98 (owner-rep): photos open in a wrapper page with a one-tap CLOSE
    // (the raw image tab had no way back). window.close() works for tabs the
    // app opened; the fallback line covers the rest.
    if (url.pathname.startsWith("/photo-view/")) {
      const pidV = url.pathname.slice(12);
      if (!isUuid(pidV)) return send(404, "text/plain", "Not found");
      return send(200, "text/html; charset=utf-8", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-title" content="Shop Board"><meta name="robots" content="noindex, nofollow"><title>Photo — Shop Board</title><style>body{margin:0;background:#000;display:flex;flex-direction:column;min-height:100vh}img{max-width:100vw;max-height:88vh;object-fit:contain;margin:auto}#xb{position:fixed;top:14px;right:14px;background:#C8102E;color:#fff;border:none;border-radius:12px;padding:14px 26px;font-size:1.05rem;font-weight:800;cursor:pointer}</style></head><body><button id="xb" onclick="window.close();document.getElementById('cm').style.display='block'">&#10005; Close</button><img src="/photo/${pidV}"><div id="cm" style="display:none;color:#8e8e93;text-align:center;padding:12px;font-family:system-ui">If this tab didn't close itself, swipe it away — nothing is lost.</div></body></html>`);
    }

    if (url.pathname.startsWith("/photo/")) {
      const empId = await liveSession(req);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const pid = url.pathname.slice("/photo/".length);
      if (!isUuid(pid)) return send(404, "text/plain", "Not found"); // Block 172 (break-pass): guard the read-proxy id (write-sweep missed this READ)
      let [p] = await db(`build_photo?select=storage_path&id=eq.${pid}`);
      // Block 107: after-hours wrap-up photos live in their own table.
      if (!p) [p] = await db(`after_hours_photo?select=storage_path&id=eq.${pid}`);
      if (!p) return send(404, "text/plain", "Not found");
      const f = await fetch(`${SUPABASE_URL}/storage/v1/object/cab-photos/${p.storage_path}`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
      if (!f.ok) return send(404, "text/plain", "Not found");
      const buf = Buffer.from(await f.arrayBuffer());
      res.writeHead(200, { "content-type": f.headers.get("content-type") || "image/jpeg", "cache-control": "private, max-age=3600" });
      return res.end(buf);
    }

    // ---------- HOME-SCREEN ICON (block 178, owner request post-install) ----
    // The add-to-home-screen tile was the browser's letter fallback ("S").
    // These serve a real icon — black tile, "PSR" with the R in Premier red —
    // plus a minimal manifest so iPhone AND Android pick it up, and the
    // apple-mobile-web-app-title meta fixes the truncated label. display
    // stays "browser" on purpose: install behavior is unchanged, icon only.
    // PNGs are tiny palette-optimized files embedded as base64 (zero-dep rule).
    if (url.pathname === "/icon-180.png" || url.pathname === "/icon-192.png" || url.pathname === "/icon-512.png") {
      const ICONS178 = {
        "/icon-180.png": "iVBORw0KGgoAAAANSUhEUgAAALQAAAC0BAMAAADP4xsBAAAAMFBMVEX////4+PjX19eXl5dRUVHTLy+9Ly/NLS2HHh4gICAvCgoQDg4XBQUGAgIBAAAAAAAg0YWzAAAEIElEQVR42u2aS2gTQRjHv92oxRdsrC8QNLZRFDxEa3qoKNVKRfugPrBeCgWrgr0IIh700HP1IKKCYLGoB62XRapCSaFgbX0k2kNF0aTmqGLTIFUhbXc87Gwyu9mZnY0IHr69zMxm59fdb/7fY4YqBP7VpQKiEY1oRCMa0YhGNKIRjWhEIxrRiEY0ohGNaEQjWvaaJ/mcsS8zNaUEFS14oVZyimKeBOfKmHvBYHB1v/2xd21v8zMqNj6x+iNXCp+/7kcofNgLDQBQebGdGY3vzNp+3KIXoQEAoLz+oLdBUh1QYP9sytp/nOXMmrxPDnkv41zHUL7fmJZdOvJAl1DI3GmrNz0kLwvyWkZ8H1pop8mP5FK6BJq8MtvcmB+0MSjjMl9NQ+Syvjzluwza6AIAgB5/Tjg3JuPoHwEAoJd6wPb9g59u1m3zZA+565oAwEB3gprgGwAAmAOlZhgAwifhes9bJ2xRLxiJiUTaMzzVx+5afygLADlzRmCY3uyM12kuYS7aajnilMggjRFqbB0AZsz+jgIldk9zm1VN704Ibf2Itjq1EQCwtAZXOQZoSDSE6GW0ZWTX4q2NkEwqWKgVoXVv9FYZtFpsTH9+I9C1xtG4H6R3blTM5kuzLLpCjC7+fPI46hW1qSsFhWgjW7ykRrwqelvGw0NC9O9sweSFJc3Ej4cPCOKS+VVqRIjOsKvJyJWknoa5Nu+jwSYkTLvNrJ/cWWvLIhM1I24mTExQU68QZvR+6shqC+ua1puPFrF/HWWkt0eg64G9bZbuNACAxRHHA6O7BGtZ3sJ5a8U2Wmk2z5Y6pj/vbed6wQm5cnKj2SxxvrZxmUs+FpFCq12089IR0+A9x3sCrQfliuBVVk26YNjBNtr/rr5WqvPdNeOOgJnkeA1Tl4nQm5jHFsfr1ttKFO+6TIAO3LB9XSx5jakTDN6sTxLlZOCWo/pXOxMFOOFGQe9ysvKWy0p1xuss9BlbHdJ3/5y1GMm0CB2sqGpIumpAiV3lqCF6ngqa8CpVQgghmVS8n/e9pzSe1M5aO4NSN3cLQrw0VBZx6NL3vpHvLNQR5/RS0SFeyocwbdPS6FyNbcjPvfM1u/wk3vqFjS2ooqRqPrtqbOw0vwR0GFvG1mR0Q357N03Tdrtgv5/2s4zJI43U8DvdspGFpsZO+DpZmHwcXt9aOXNpckyAVmpNU8z6O7SAVCrGjDa7PrNbp3uwyF8ctVS43l1uq9BKQ6u97oFYY8NIaehV7kFKrWXDSEloJmu6bjnIWMnocl28BMaQHHpe0Q408NArjEzKodXYPXuloDZyz8zUEGNsGYM0vGGTeWWPIEIdYrKyIvlvmQPdU1ny2eWYzvOc719ceFyLaEQjGtGIRjSiEY1oRCMa0YhGNKIRjWhEIxrR/wX6D1fMDWpY5VnSAAAAAElFTkSuQmCC",
        "/icon-192.png": "iVBORw0KGgoAAAANSUhEUgAAAMAAAADABAMAAACg8nE0AAAAMFBMVEX////39/fh4eG8vLyoqKiNjY1nZ2dKSkrTLy+6Ly+bIyNgFRUkFxcRBgYBAAAAAABkXvPuAAAER0lEQVR42u2aS2gTURRAbzJV6q6JK3djGtHqJtpirKt+qBXc1Fb8oiAqKIIfsO2iRYPVhQW1pUqplQiKC7GpAVHBKGRVFbVmZUWTNLtCMTYrra2ZuMi8yXzf3GnUhdzZZD5v3nn3f9+0rgL83cMNBCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAA/xhQgR+aP5FOz7k8Hp/3eAD/lkv+E0tjXHXT4/Wt7avSDix0P8woYtcGh5QHi9fU03k8ntoqWwAAgH/fRc38R8Pax9uHzABFfBPGBsnLh9SX58K6xzctlSK9jaCMLN0/Xbr4EXZi2OQ4youkmwnlfH/OkeskEyg3zR9kZ9+jznyzMImLg49sIT1Ovf9rBgWQZDtLUaeAAg4An4o/8xnHATyJAywWdZR1niEkZC4KAQAACyVhT286+6qrqcoBQJeLlv8EgNSIkhVeAgCAfCX0hgBgyxb41DNunDLYAIV0elIxgmgtQXX/BFvjAgAAyM60IyTfXReZME13ruqWdnae46po1WEWCgAAheJg92BpQP27dnPV+EUUAC6rVSkVBwuiaoAwZpGdA7iCUylPVkio3kW5jw8HUBYSBYBFJ/7pQpZMkeN5f6Qmt6nOlxV/foX+JCBqIvWwk5xd5aCrcMv6mt2cQKQ5nY6tABkzg3ypbT1vB0jL89pIoLhnm8bi0vO+Nce5qZW96LaxAUvQRXc9q66GI9V7OYhkRhcOFoAezWO/1l0f1J2yWH4qxrLgan5nN3OHZQQ5rrVrzt6Yu2d4580bdSYJ8CRIdW1lDrm8OGinfqn3D/FNXWfVmy7oIr1Zzn3XDQQfL+yEBmx3Lc+y4rAhbwzzAmcXtn1fxlQ5ashNs2es528RsYB1iswTBkLEMp+2BLAbEPfdUo17qifMWMZaLIEFrFctpWZKVyTzllaWXiABgsbZKyMTWkTcuql9hAK4Turqa31k6qhoSGtmRwoDcB8YNBp9NHlE6bpmOX153B7g77lnqrbbij/pSmiw+1iHaJTONBeZbQJL1n6yQVtalMPr9bGWMAu81tHmWN8QNwcAuDuuytIlAmVsxDlZqIIpabqcnf4mzrNGvR8tBcBr8VYyD8g5AbTmzBoHU46g7zlRgNmgpqJN8wQJ6IyAU9Hnber8dYEHYNU+68wGX+pKDdF8VF1ODTrSGQFr5PylVlmI/D4WV9w2kBkB/b2o8PxF86bdq7/din2Q72y06Mszmi2Ogw9SUix2xcyc+iiJayJh6Z/UhBC/X5fKBVjJziJBSpQJ2A42m6NMeQBhwC5VpcoD1Ih2myYJDzCpPRWPrWXTGAEFeGbY1rtPitbDNUZAASrHOgO6hmAAUS9SeBu4+t93qgLX33sXs3OVAEofZhHH63B6ei7n8fiCfU6qE/33PgEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAT47wC/AVG9FXxZ2noIAAAAAElFTkSuQmCC",
        "/icon-512.png": "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIABAMAAAAGVsnJAAAAMFBMVEX////t7e22trZzc3NFRUU3NzfTLy+QLy+jJCQ+Dg4qIiIXFxcdBwcJAwMCAAAAAAAuyGWaAAANJklEQVR42u3dX2wUxx0H8Nk720G0au/OQBVSVWffGSqbSgcGU4FpjUkeGgw1f/pQGRM3kSipVJW2EpUqRY0UqYpSNYWqUpUoCadA+4Cc1MTQSi02lgNRMLY5KdhS7Tv7Xkpag+9WFVCK7d0+kKjg+83t7O7s7Jp89+32dmd3Pzfzm9/s7R/NZJ/tKcQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMCDqcKXrU4+rxdNnRW1CNMiWiR2eK9vAJqpfJPXdxemF8+LxqJrT302AK7vmtLpb2LRtX+IBAFg+4DlShEW1SKxn7fY3pzx1KheLiLVbHm77Pr3fmi5iVpWrA3viHsK8Om6NbFf2TMY2zVttUgscTruCuD+VPPv/Rs87wXMqeHWugEbK5xttjx+VriS2NTjvmZPz7728psKukEz21qniy58qlNoUWN4b1ICAZseOvyWgjzAzCa+LbZkb6colZnbWycjwJmXX8krSIQKvc0ii107aKt1yYnxuZfTCjJB81KD9UK3t+nMh8m8fEJFKjy+xrJhN/ty/IwZQydUjAUm11kscC7jV65rDKVVDIbGv1G+ARxkvk3Gh3kFAObFsj1Xm+4fADNfUTEcNveX+fLWAPNzWkirOB+wUCYMbPN50P+hruKEyDi3EdzK+Axg/kYFgHmI980u5vf0LxUA7GYXPX8u4zuA+aIKAPMcPf8vuu8AbEYFAJulq8CP/D9+tpBRAWCep+beyQcAgF1QAcA+po41G4TjZ39XAmC0EzOfCQSAmVEBwMZKZ80HogUw1qMEYKE0572rBwNgVgmAeaRkVn8wjp/NKQEg2sAvAgJg5pUALCyu8EZAQgBj9IhU9p+jZvui7fyHFwK0mmjsUKxmYXrmRLE4rQBAVwLAFh+KwTn8xk//VEqyDsbGDxY8N8gpaQLsugXI/am6/0rLg5/rh6dObfAYYMFNDVh++4HMbuLVaf5pe0NkIJCcLJ3X0THWedXRkT2f+qT5TZt9RpEbc0xZNSD59Pnc2RouwKIBEbU/1ZPkqg2jvTVufmKtNnHo8M/Wx3l7pktsAjuz63lf5S1Dj/YGb922bGvEZUUPHX4uLrZn7mJAaHi9UBScJwDq2/nF9l2scdvWV/2UI5CRGgRDQ3GRKPhfogL8rly5DdlWtwJVexTUAMYqekViDRF5wi3lZft63TaDr9IFRCR3g+tSzgAs/0ltuxZ3KfATGzXZxWYG6WA7YAGQsiz4iYn17gBWqmgCjH2O/qGOPfihWBoC0tYlVw6nXAGEUiIpimuA0IvWOXfG2RZDI+6qQLtwJuQqFd5nDZBmvkzVSmIAWxaxBNC9H31QU1gNQAUJUCgPUKkEIC46GnL3e6TER13/D4JK2oCupAaw49TMeywAU1wNQFR82BksH1kATqqz6duxhoMBYCg52JSaGlDl4Cc2db9qgCYfIOykCXQ9QgCO1h71C6BGPgBzMnL/xyPUCzgSMloUHFdGNDlyCWAZ0KgG/34+QMmROwDrLo3qjoymR6YJLDgLPDfWeH5cuuhJAncA9yx7GzpVmkx63Aqo/8JDEfkA1mktJ1fMNe72FGBOeFd8AmCF3qSXF08ZwlmbO4Ci5TE/xl03dzLZ5hkA9Z90wgOAZywHCBX8VMnMnaveNOANwIBw0uYOIG89QCh7ZqIw3Jr0IhiQF8a2yAegLwGMiQMwZuZ6q5ukdwk3qZYZlw9wVyD7PW5ZSuFKbfJPcjvBV4mZlR4kQp0CADGRHc7tk9oSJqg0qFo+gJERAHhM7DfLSewW773LRPNAdwC36bZ77OGaFxcsLXeyTk4smPk1VU44RS/t5jI5+l7J0KIjTokelplt3Pqe+xTodfpKK97t6C4APsoI5X5vf0G4xMLZNRNuYl+5q8S2SweY2y3WqJbZOYTJ5Bv2T5f8XmAZXgtwHgOMzRzqxxd3P3E7xeb2e5MbNsk+HzC/8aroGYAztgqe3dHjwfFr7ZIBzq3hXtR5ZPGMpM2q5UUd+FJEIkD2z08m2riXNodKrJenbCby+6WnxtqPuV8JBsE7wn+CEaLvfcXe7s42zUgG+HqEyY4B3Gl16awn4jbLuPFNufsU7mLqAIgL3ELH7RZyUWoYCB1i6gDIi+CetlsFjA6pXWBKIUCYam0Vv7VbzMft8nZp1feYQgD6OtiddqsA70Z0B1PiJaYQQDtGb+Uj24mWrCqQOMpUAvCuBP/8HrslfSCp/h9lSgG4V4J328yG2E0ZHUFo80tMKUCIm8eHLtkMA8RNuPZ35/vPMrUAj/OPcvn7EXtlXXO/O8Zrb6oF0J4s8+WXbQoYEtqAMfSCUoDqdLlv19kTkNEGGJt5QSGAtrP89+vs3QozLmWnZtLqAFZYbMvmrTALcvbqcl4VgPa65SKVo/vEm4HRJWW3jHdUAdSLJG/dY+KVICNnvybSagDCYv3WavEbhG9K2rMhJQBat+iSbVMnxQj+KWnXyj1OUBqA1mxj9HJg6qzIwwKkXVg/ogCgftDW4jtHxjZYhkMZqRBjjLF7Gc8B6mwnrvUjNywfAX9MVhXo9xqg3slfehXnc/vKB4O8LIAJbwG0rWMOR2vdovHQ5WTyw6CEp8jEms84X/lAx3f6dN6Xgg8Yv/8MkaniyHSBGwa7PAPQEn+Lu1q/e24z72+2u3YKqmWNbKiP02rmvWoCWqJ/Mu6SsHKE98wI2/dXNR3ldC1G2gsArXZjf7ZFQgzpk/aWnfAvOT/HqFQALRqtTTQ+1Z+70iJnv9/ZLisTCj/HSQVcxoAHH6TkxfRXSRdIMbYqlaH7gS7vzwe4mCoGpeXCnCpQZIEGsP8PMneqSpGzJwMOQP6D7Gw0RFeBhXywARjZFeqOqgDdFQ4EHIB8HIcjAM5ThEYDDkDeWeGsa1hhpyMMzgsXI9JKoi+K5DxZOTgAR4h5DrsGOrHsCThASh4A3QZmAw5AnBhw+sAZ8jodzpOVH82XrpJpL/1k5UcTgL5FMO0HwJ0GFys7fuYSPcQr+FIDxkUFLshMrFPCmYD3TUBUIC2xBtA3SZJBQEEMEBTIex8EBnwKguN1DgGc14AK4eGAkl4gu8L6571NDHyqJAeBed+6wdmNA1aLUCE6zOQGAeqcgKI8YHaH1atpqXvQaqXmlXQQUJUIGb1by7eAjNwBYpVoEFCWCZofJMs1g12SR8j0E1PmfU2Fczv47ye+dUF0hCw6tZO/gu7rWMC4xHul9vzXyEy4xcXGyGuxjB6fB0O5veTL2ueb5A/U6OclFP0eDZrZ1tJ3y1+vuyp/qE6fE5j0fzhsDu9NPvSDz+9o4KRJq11tSDAIVDDlk5nL1dZEYyv3NH6xMPRWcUrnLRh3tZn1aTIIdPkPwD55ufwfrZY6whQEgQCfEQq1u1qdfLp2aRAIMEDY5fr0OYElBFDvcn3yYtSSa2UCDBB3uT59NkFfMgD8O9BEx0Ok4MSSAVjmuoSISBAILsAm1yU8KxIEAgsg8jIaGUEgsAAr4q6LoINAbokAbJFQBhkE5pcGQLhHQiHkdQKLnoEXVIAGGYWQbwBZdKFEQAFCZ2SUQj/Fa3YpADTEZZSikUFgbgkAhAbllEMGgYevlgomwLaInHIEgkAgAVYOSCqIPikyqxJg+Un7rTl0Wlo6mbIMAp7XgAO23x6p7WqRtvUWyyDgfROwdcs8Y0xr7pG38YRlEFARA7pn7LxWvH5Q4qatr5ZSEgQrR66J3h+pbb0mc8vWV0sp6gUaBG8RDTVflLthOgjkfegGD4gQJDoHJW+W3mbalzzgwNTZ8rfMh7Zk07I3WmUVBDS1r/+b+9Z0Qae/iiVOx5n6SVP+/sMb3y0WS55JG4uuPcd8mTRfXgA5+YOiqRcZK2oRpkWi2tpTvqXdmn9vwAzIwJMBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5E//A2KJ1J7zcj6NAAAAAElFTkSuQmCC",
      };
      res.writeHead(200, { "content-type": "image/png", "cache-control": "public, max-age=86400" });
      return res.end(Buffer.from(ICONS178[url.pathname], "base64"));
    }
    if (url.pathname === "/manifest.json") {
      res.writeHead(200, { "content-type": "application/manifest+json", "cache-control": "public, max-age=86400" });
      return res.end(JSON.stringify({ name: "Shop Board \u2014 Premier Street Rod", short_name: "Shop Board",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
        display: "browser", background_color: "#000000", theme_color: "#000000", start_url: "/" }));
    }

    // Q52 cutover helper: echoes the caller's public IP so the shop's real
    // egress address can be confirmed on-site before SHOP_EGRESS_IP is set.
    if (url.pathname === "/api/my-ip")
      return json(200, { ip: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null });

    // ---------- COYOTE INTAKE (file 28 §5, option 1: HTTPS POST) ----------
    // Coyote/FileMaker posts ONE full order snapshot per order event to
    // /api/coyote/order. Guarded by a secret header (X-Shopboard-Key) whose
    // value lives in the COYOTE_INTAKE_KEY env var on Railway.
    // This endpoint deliberately does the DUMBEST safe thing: authenticate,
    // store the payload EXACTLY as received in coyote_intake, answer 200 OK.
    // Dedup / multi-cab auto-split / field mapping run OFF the stored rows in
    // a later block (file 28 internal notes) — so the FileMaker side can go
    // live and start sending before our mapping logic exists. "When in doubt,
    // send" (packet §2) is safe because storage is cheap and append-only.
    if (url.pathname === "/api/coyote/order" && req.method === "POST") {
      const key = process.env.COYOTE_INTAKE_KEY;
      if (!key) return json(503, { ok: false, error: "Intake not configured yet" });
      if (String(req.headers["x-shopboard-key"] || "") !== key) {
        console.error("coyote intake: bad or missing key from", String(req.headers["x-forwarded-for"] || "unknown"));
        return json(401, { ok: false, error: "Bad key" });
      }
      // Read the raw body ourselves (2 MB cap) instead of using body(), so a
      // malformed JSON still gets STORED for debugging instead of becoming {}.
      const raw = await new Promise((resolve) => {
        let data = "", over = false;
        req.on("data", (c) => { data += c; if (data.length > 2000000) { over = true; req.destroy(); } });
        req.on("end", () => resolve(over ? null : data));
        req.on("close", () => resolve(over ? null : data));
      });
      if (raw === null) return json(413, { ok: false, error: "Payload too large" });
      let parsed = null, parseOk = true;
      try { parsed = JSON.parse(raw || "{}"); } catch { parseOk = false; }
      // Best-effort Order # pull for at-a-glance queries — Coyote's own field
      // name first (packet §4: sent as TEXT, exactly as stored, never reformatted).
      // Aaron's REAL payload nests the order under `order` (order.order_number);
      // the old bare `parsed.order` fallback stringified that OBJECT -> stored
      // "[object Object]". Read the nested number; only accept `order` if SCALAR.
      const _oo = parseOk && parsed && typeof parsed === "object" ? parsed : null;
      const _ord = _oo && _oo.order && typeof _oo.order === "object" ? _oo.order : null;
      const _orderNoRaw = _oo ? (
        _oo["Order #"] ?? _oo.order_number ?? _oo.OrderNumber ??
        (_ord ? (_ord.order_number ?? _ord["Order #"] ?? _ord.OrderNumber) : undefined) ??
        (typeof _oo.order === "string" || typeof _oo.order === "number" ? _oo.order : undefined)
      ) : undefined;
      const orderNo = (_orderNoRaw == null) ? "" : String(_orderNoRaw);
      const [row] = await db("coyote_intake", { method: "POST",
        body: JSON.stringify({ order_number: orderNo || null, payload: parseOk ? parsed : null,
          raw_text: parseOk ? null : raw, parse_ok: parseOk }) });
      logEvent("coyote.order_received", null, { intake_id: row ? row.id : null,
        order_number: orderNo, parse_ok: parseOk, bytes: raw.length });
      return json(200, { ok: true });
    }

    if (url.pathname === "/logout") {
      const empId = await liveSession(req);
      if (empId) logEvent("employee.logout", empId, {});
      res.setHeader("Set-Cookie", "sb_session=; Path=/; Max-Age=0");
      res.writeHead(302, { Location: "/login" });
      return res.end();
    }

    return send(404, "text/plain", "Not found");
  } catch (e) {
    console.error(e);
    return json(500, { ok: false, error: "Server error" });
  }
}).listen(PORT, () => console.log(`Shop Board v25 on :${PORT} (db ${DB_READY ? "connected" : "NOT configured"}, notifications ${NOTIFY_LIVE ? "LIVE" : "SANDBOXED (Q106)"})`));

// ============================================================
// AUTO-SYNC SCHEDULER (block 80) — the hands-off engine.
// A self-rescheduling server-side timer inside the always-on Railway
// process runs syncRun(true) at :45 past each hour across the ARIZONA
// work window (catches Aaron's 6 AM-6 PM on-the-hour pushes; our :45 read
// lets his :00 push land first). No browser, no Claude session, no
// create_trigger, so it never touches the write-classifier and is truly
// hands-off. Idempotent + change-only (a quiet hour writes nothing) and
// fully audited (sync.run per apply + a sync.auto heartbeat).
// KILL SWITCH: set env AUTO_SYNC=off on Railway to pause it (default on).
const AUTO_SYNC = String(process.env.AUTO_SYNC || "on").toLowerCase() !== "off";
function azNow() { return new Date(Date.now() - 7 * 3600 * 1000); } // Arizona = UTC-7 all year (no DST)
function msToNextSync() {
  const a = azNow(), min = a.getUTCMinutes(), sec = a.getUTCSeconds(), ms = a.getUTCMilliseconds();
  let delay = ((45 - min + 60) % 60) * 60000 - sec * 1000 - ms;
  if (delay <= 0) delay += 3600000;
  return delay;
}
let __autoSyncBusy = false;
async function autoSyncTick() {
  try {
    const hr = azNow().getUTCHours(); // Arizona wall-clock hour
    if (hr >= 6 && hr <= 18 && !__autoSyncBusy) {
      __autoSyncBusy = true;
      const sum = await syncRun(true, null);
      logEvent("sync.auto", null, { hour_az: hr, placed: sum.placed, updated: sum.updated, parked: sum.parked, completed: sum.completed, cancelled: sum.cancelled, flagged: sum.flagged });
      console.log(`[auto-sync] ${hr}:45 AZ - placed ${sum.placed}, updated ${sum.updated}, parked ${sum.parked}, shipped ${sum.completed}, cancelled ${sum.cancelled}`);
    }
  } catch (e) {
    console.error("[auto-sync] error:", e && e.message);
    logEvent("sync.auto_error", null, { error: String((e && e.message) || e) });
  } finally {
    __autoSyncBusy = false;
    setTimeout(autoSyncTick, msToNextSync());
  }
}
if (AUTO_SYNC) { console.log("[auto-sync] scheduler ON - next run at :45 past the hour (6 AM-6 PM Arizona)"); setTimeout(autoSyncTick, msToNextSync()); }
else console.log("[auto-sync] scheduler OFF (env AUTO_SYNC=off)");

// ============================================================
// COYOTE INTAKE RETENTION (block 176, Fable-5) — keeps the raw feed log
// PERMANENTLY BOUNDED so the daily push can never fill the database.
// Coyote sends the WHOLE order (all ~80 line items, ~13 KB) on every change,
// and the old hourly re-push stored near-duplicate snapshots over and over
// (today 750 of 866 order-bearing rows are redundant re-pushes — 73% waste).
// RULE, once a day: for every order KEEP ITS MOST RECENT push (the app only
// ever reads latest-per-order plus a per-order history page), and among the
// OLDER pushes delete those past the retention window. Rows with no parseable
// order number are pruned on the same age rule (nothing references them). The
// derived `build` rows — the real cab records — are NEVER touched, and nothing
// inside the window is ever removed. Tunable via INTAKE_RETENTION_DAYS
// (default 60; "off" or 0 disables pruning entirely). Self-rescheduling daily
// timer, idempotent, every prune fully logged (coyote.retention_prune).
const INTAKE_RETENTION_DAYS = (() => {
  const v = String(process.env.INTAKE_RETENTION_DAYS ?? "60").trim().toLowerCase();
  if (v === "off" || v === "") return 0;
  const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60;
})();
// Block 176 (Fable-5): the two LOG tables are the only other unbounded growers
// (event_log ~ a few hundred rows/day live, notification_log per notice sent).
// Same daily sweep bounds them: event_log keeps 2 YEARS (730 d — reports read
// months, never years back; the audit trail stays deep), notification_log
// keeps 180 d (pure delivery history). clock_event (pay records), builds, and
// every business table are NEVER touched by any sweep. Env-tunable, "off"
// disables each independently. Worst-case steady state, all three sweeps on:
// intake ~50-60 MB + latest-per-order forever (~10 KB/order), event_log
// ~300-400 MB, notification_log tens of MB — permanently flat from there,
// far under the database plan's limit, no matter how many years it runs.
const EVENT_RETENTION_DAYS = (() => {
  const v = String(process.env.EVENT_RETENTION_DAYS ?? "730").trim().toLowerCase();
  if (v === "off" || v === "") return 0;
  const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 730;
})();
const NOTICE_RETENTION_DAYS = (() => {
  const v = String(process.env.NOTICE_RETENTION_DAYS ?? "180").trim().toLowerCase();
  if (v === "off" || v === "") return 0;
  const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 180;
})();
// Prune one log table by age: SELECT ids past the cutoff (bounded batch),
// DELETE in chunks of 100. Runs daily, so it self-drains any backlog a few
// thousand rows a day without ever issuing an unbounded ranged DELETE.
async function pruneLogTable176(table, tsCol, days) {
  if (!days) return 0;
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const rows = await db(`${table}?select=id&${tsCol}=lt.${encodeURIComponent(cutoff)}&order=${tsCol}.asc&limit=5000`);
  let deleted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100).map((r) => r.id);
    await db(`${table}?id=in.(${batch.join(",")})`, { method: "DELETE" });
    deleted += batch.length;
  }
  return deleted;
}
let __retentionBusy = false;
async function intakeRetentionSweep() {
  if ((!INTAKE_RETENTION_DAYS && !EVENT_RETENTION_DAYS && !NOTICE_RETENTION_DAYS) || __retentionBusy) return { skipped: true };
  __retentionBusy = true;
  try {
    const cutoff = new Date(Date.now() - INTAKE_RETENTION_DAYS * 86400000).toISOString();
    const seenLatest = new Set();
    const doomed = [];
    let scanned176 = 0;
    if (INTAKE_RETENTION_DAYS) {
      // Tiny columns only; grouped so each order's rows are contiguous, newest first.
      const rows = await db(`coyote_intake?select=id,order_number,received_at&order=order_number.asc,received_at.desc&limit=200000`);
      scanned176 = rows.length;
      for (const r of rows) {
        const on = r.order_number;
        if (on == null || on === "") { if (r.received_at < cutoff) doomed.push(r.id); continue; } // no order to preserve
        if (!seenLatest.has(on)) { seenLatest.add(on); continue; }   // first row for this order = latest -> KEEP forever
        if (r.received_at < cutoff) doomed.push(r.id);               // an older redundant push, past the window
      }
    }
    let deleted = 0;
    for (let i = 0; i < doomed.length; i += 100) {
      const batch = doomed.slice(i, i + 100);
      await db(`coyote_intake?id=in.(${batch.join(",")})`, { method: "DELETE" });
      deleted += batch.length;
    }
    if (deleted) logEvent("coyote.retention_prune", null, { deleted, window_days: INTAKE_RETENTION_DAYS, kept_latest_per_order: seenLatest.size, scanned: scanned176 });
    if (INTAKE_RETENTION_DAYS) console.log(`[retention] pruned ${deleted} old intake rows (window ${INTAKE_RETENTION_DAYS}d; kept ${seenLatest.size} latest-per-order of ${scanned176} scanned)`);
    // Block 176 (Fable-5): bound the log tables on the same daily tick.
    let evDel = 0, ntDel = 0;
    try { evDel = await pruneLogTable176("event_log", "at", EVENT_RETENTION_DAYS); } catch (eEv) { console.error("[retention] event_log:", (eEv && eEv.message) || eEv); }
    try { ntDel = await pruneLogTable176("notification_log", "created_at", NOTICE_RETENTION_DAYS); } catch (eNt) { console.error("[retention] notification_log:", (eNt && eNt.message) || eNt); }
    if (evDel || ntDel) { logEvent("log.retention_prune", null, { event_log: evDel, notification_log: ntDel, event_days: EVENT_RETENTION_DAYS, notice_days: NOTICE_RETENTION_DAYS }); console.log(`[retention] pruned logs: event_log ${evDel} (${EVENT_RETENTION_DAYS}d), notification_log ${ntDel} (${NOTICE_RETENTION_DAYS}d)`); }
    return { deleted, kept: seenLatest.size, scanned: scanned176, event_log: evDel, notification_log: ntDel };
  } catch (e) {
    console.error("[retention] error:", (e && e.message) || e);
    logEvent("coyote.retention_error", null, { error: String((e && e.message) || e) });
    return { error: String((e && e.message) || e) };
  } finally { __retentionBusy = false; }
}
if (INTAKE_RETENTION_DAYS || EVENT_RETENTION_DAYS || NOTICE_RETENTION_DAYS) {
  console.log(`[retention] daily sweep ON - intake ${INTAKE_RETENTION_DAYS || "off"}d, event_log ${EVENT_RETENTION_DAYS || "off"}d, notification_log ${NOTICE_RETENTION_DAYS || "off"}d`);
  // First sweep ~2 min after boot (let the app settle), then every 24 h.
  setTimeout(function retentionTick() { intakeRetentionSweep().finally(() => setTimeout(retentionTick, 24 * 3600 * 1000)); }, 120000);
} else console.log("[retention] all retention sweeps OFF");
