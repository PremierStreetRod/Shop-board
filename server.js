// ============================================================
// SHOP BOARD — server.js (v19.1, 2026-07-29: Reports v1 is ADMIN-first — managers see it only via the "Managers can see Reports" switch (Q65, default OFF). Reports: actual-vs-standard, aging, labor, rework, CSV. See BUILD_LOG.md for the block-by-block history.)
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
// ============================================================
const http = require("http");
const crypto = require("crypto");
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-secret";
const DB_READY = Boolean(SUPABASE_URL && SUPABASE_KEY);

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

// Signed session cookie: "employeeId.expiresMs.signature".
// The signature (HMAC) means a phone can't forge someone else's login.
function makeSession(empId) {
  const exp = Date.now() + 12 * 60 * 60 * 1000; // 12 h — floor day plus margin
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

// ---------- FORGOTTEN-CLOCK-OUT SWEEPER (risk sweep 2026-07-28) ----------
// The human truth: someone WILL walk out at 4:00 without tapping clock-out,
// and an interval left open accrues coverage all night and corrupts pace
// math. Q82's answer: the day auto-stops at 4:00 as a backup. Phoenix time
// is UTC-7 year-round (no DST — Q82 America/Phoenix), so the math is plain.
const PHX_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_END_HOUR_PHX = 16;   // 4:00 PM shop day end (Q82; admin-adjustable later)
const SWEEP_GRACE_MS = 4 * 60 * 60 * 1000; // only close 4+ hrs past day end — never cuts real late work short
// 4:00 PM Phoenix on the same Phoenix DAY as the given timestamp, in ms UTC.
function dayEndOf(ms) {
  const phxMidnight = Math.floor((ms - PHX_OFFSET_MS) / 86400000) * 86400000 + PHX_OFFSET_MS;
  return phxMidnight + DAY_END_HOUR_PHX * 3600000;
}
// Close every interval still open long past its day end. Runs at boot (catches
// anything that happened while the server was down) and every 10 minutes.
async function sweepForgottenClockOuts() {
  if (!DB_READY) return;
  try {
    const recent = await db("clock_event?select=employee_id,kind,line_id,claimed_at&order=claimed_at.desc&limit=400");
    const latest = {};
    for (const ev of recent) if (!latest[ev.employee_id]) latest[ev.employee_id] = ev;
    const now = Date.now();
    for (const ev of Object.values(latest)) {
      if (ev.kind !== "clock_in") continue;
      const inMs = new Date(ev.claimed_at).getTime();
      const end = dayEndOf(inMs);
      // Clock-in AFTER day end (opt-in Saturday / evening, Q82): give that
      // stint its own day-end at +8h so it can never run forever either.
      const closeAt = inMs >= end ? inMs + 8 * 3600000 : end;
      if (now < closeAt + SWEEP_GRACE_MS) continue; // still plausibly working — leave it
      await db("clock_event", { method: "POST", body: JSON.stringify({
        employee_id: ev.employee_id, line_id: ev.line_id, kind: "clock_out_auto",
        reason: "Auto — day end (no clock-out recorded)",
        claimed_at: new Date(closeAt).toISOString() }) });
      logEvent("clock.auto_out", null, { employee_id: ev.employee_id, line_id: ev.line_id,
        opened_at: ev.claimed_at, closed_at: new Date(closeAt).toISOString() });
      console.log("sweeper: auto clock-out", ev.employee_id, "opened", ev.claimed_at);
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
  .wrap{max-width:640px;margin:0 auto;padding:24px 16px}
  .logo{font-weight:800;letter-spacing:.05em;font-size:1.6rem;text-align:center;margin:8px 0 20px}
  .logo span{color:var(--red)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
  .name{display:block;width:100%;padding:26px 12px;font-size:1.35rem;font-weight:700;
        background:var(--card);border:1px solid var(--line);border-radius:14px;color:#fff;
        text-align:center;cursor:pointer}
  .name:active{background:#2a2a2c}
  .name small{display:block;font-weight:400;opacity:.55;font-size:.85rem;margin-top:6px}
  .pinpad{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:320px;margin:18px auto}
  .key{padding:20px;font-size:1.6rem;font-weight:700;background:var(--card);
       border:1px solid var(--line);border-radius:14px;color:#fff;cursor:pointer}
  .key:active{background:#2a2a2c}
  .dots{text-align:center;font-size:2rem;letter-spacing:.5rem;min-height:2.6rem}
  .msg{text-align:center;opacity:.75;min-height:1.4rem}
  .err{color:#ff6b6b}
  .back{background:none;border:none;color:#8e8e93;font-size:1rem;cursor:pointer;padding:10px}
  h2{text-align:center;font-weight:600}
</style>`;

const loginPage = (employees) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><!-- Q48 -->
<title>Sign in — Shop Board</title>${style}</head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div>

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

  <!-- SCREEN 2: the PIN pad. First-timers set a PIN (Q68); everyone
       else enters theirs. 5 wrong tries = 5-minute lock (C17). -->
  <div id="pin" style="display:none">
    <button class="back" id="backBtn">&larr; not you? go back</button>
    <h2 id="pinTitle"></h2>
    <div class="dots" id="dots"></div>
    <div class="msg" id="msg"></div>
    <div class="pinpad">
      ${[1,2,3,4,5,6,7,8,9].map((n)=>`<button class="key" data-k="${n}">${n}</button>`).join("")}
      <button class="key" data-k="back">&#9003;</button>
      <button class="key" data-k="0">0</button>
      <button class="key" data-k="go">&#10003;</button>
    </div>
  </div>
</div>
<script>
  // Plain-English note: this is deliberately simple phone/kiosk JS —
  // pick a name, tap digits, submit. No framework until Stage 3.
  let who=null, firstTime=false, entered="", stage="enter", firstPin="";
  const q=(s)=>document.querySelector(s);
  q("#who").addEventListener("click",(ev)=>{
    const b=ev.target.closest(".name"); if(!b) return;
    who=b.dataset.id; firstTime=b.dataset.haspin!=="true";
    stage = firstTime ? "set1" : "enter"; entered=""; firstPin="";
    q("#who").style.display="none"; q("#pin").style.display="block";
    q("#pinTitle").textContent = firstTime
      ? "Hi "+b.dataset.name+" — choose a 4-digit PIN"
      : "Hi "+b.dataset.name+" — enter your PIN";
    paint("");
  });
  q("#backBtn").onclick=()=>{ q("#pin").style.display="none"; q("#who").style.display="block"; };
  function paint(msg,isErr){ q("#dots").textContent="•".repeat(entered.length);
    const m=q("#msg"); m.textContent=msg||""; m.className="msg"+(isErr?" err":""); }
  q(".pinpad").addEventListener("click",async(ev)=>{
    const k=ev.target.closest(".key"); if(!k) return;
    const v=k.dataset.k;
    if(v==="back"){ entered=entered.slice(0,-1); return paint(""); }
    if(v==="go"){
      if(entered.length!==4) return paint("PIN is 4 digits",true);
      if(stage==="set1"){ firstPin=entered; entered=""; stage="set2";
        q("#pinTitle").textContent="Type it once more to confirm"; return paint(""); }
      if(stage==="set2"){
        if(entered!==firstPin){ stage="set1"; entered=""; firstPin="";
          q("#pinTitle").textContent="They didn't match — choose a 4-digit PIN";
          return paint("Try again",true); }
        return send("/api/pin/set",{id:who,pin:entered});
      }
      return send("/api/login",{id:who,pin:entered});
    }
    if(entered.length<4){ entered+=v; paint(""); }
  });
  async function send(url,payload){
    paint("Checking…");
    const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)});
    const out=await r.json();
    if(out.ok){ location.href="/home"; }
    else { entered=""; paint(out.error||"Something went wrong",true); }
  }
</script></body></html>`;

// THE HOME SCREEN, v2 — clock-in / clock-out (the floor's first real tool).
// Q90: your USUAL lines are the big one-tap buttons; other lines sit below.
// Clock-out asks WHY from the admin-managed reason list (Q77).
// `state` = { clockedIn: bool, lineName } derived from the latest clock event.
const homePage = (emp, state, usualLines, otherLines, reasons) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Shop Board</title>${style}</head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div>
  <h2 id="hi">${state.clockedIn
    ? `${emp.first_name} — ON THE CLOCK · ${state.lineName}`
    : `Hi ${emp.first_name} — clock in to start`}</h2>

  <!-- CLOCK IN: shown when off the clock. Usual lines first (Q90). -->
  <div id="in" style="display:${state.clockedIn ? "none" : "block"}">
    <div class="grid">
      ${usualLines.map((l) => `<button class="name" data-line="${l.id}">${l.name}<small>your usual line — one tap</small></button>`).join("")}
    </div>
    ${otherLines.length ? `<p class="msg" style="margin-top:18px">Other lines</p>
    <div class="grid">
      ${otherLines.map((l) => `<button class="name" style="opacity:.75" data-line="${l.id}">${l.name}</button>`).join("")}
    </div>` : ""}
  </div>

  <!-- CLOCK OUT: shown when on the clock. Reason list = Q77 pick list. -->
  <div id="out" style="display:${state.clockedIn ? "block" : "none"}">
    <p class="msg">Clocking out — what kind?</p>
    <div class="grid">
      ${reasons.map((r) => `<button class="name" data-reason="${r.label}">${r.label}</button>`).join("")}
    </div>
  </div>

  <div class="msg err" id="err" style="margin-top:14px"></div>
  <p style="text-align:center;margin-top:22px">
    <a href="/board" style="color:#8e8e93;margin-right:24px">TV board</a>
    <a href="/logout" style="color:#8e8e93">Sign out</a>
  </p>
</div>
<script>${netJs}
  // claimed_at rides with every tap (Q103-1: the REAL tap time governs;
  // the server separately stamps received_at) — and it is stamped ONCE at
  // the tap, so Wi-Fi retries still land the true time.
  async function act(url, payload){
    const err = document.getElementById("err");
    const out = await sbPost(url, {...payload, claimed_at:new Date().toISOString()},
      (m) => { err.textContent = m; });
    if(out.ok) location.reload(); else err.textContent = out.error||"Something went wrong";
  }
  document.getElementById("in").addEventListener("click",(e)=>{
    const b=e.target.closest("[data-line]"); if(b) act("/api/clock/in",{line_id:Number(b.dataset.line)});
  });
  document.getElementById("out").addEventListener("click",(e)=>{
    const b=e.target.closest("[data-reason]"); if(b) act("/api/clock/out",{reason:b.dataset.reason});
  });
</script></body></html>`;

// THE CAB TASK SCREEN — shown to a clocked-in Production tech/manager.
// One cab front-center (Q90: ORDER # + LINE is the identity), Mike's
// numbered steps grouped by day, two-step check-off (Q45): tap to start,
// tap again to complete; tap a completed task to undo (Q90 instant+undo).
// ANY clocked-on tech can move any task (Q104) — who tapped is recorded.
const cabPage = (emp, build, tasks, lineName, notes = [], tphotos = [], otherLines = [], people = {}) => {
  const inRework = build.state === "rework";
  // Per-task documentation (file 11): count what's attached to each step.
  const notesOf = {}; for (const n of notes) (notesOf[n.task_id] = notesOf[n.task_id] || []).push(n);
  const photosOf = {}; for (const p of tphotos) (photosOf[p.task_id] = photosOf[p.task_id] || []).push(p);
  // Q107: who's-on-it line under a step. Times shown in Phoenix (Q82, UTC-7 fixed).
  const phx = (ts) => ts ? new Date(new Date(ts).getTime() - 7 * 3600000).toISOString().slice(11, 16) : "";
  const whoLine = (t) =>
    t.state === "in_progress" && t.started_by ? `Started by ${people[t.started_by] || "?"} · ${phx(t.started_at)}` :
    t.state === "complete" && t.completed_by ? `Done by ${people[t.completed_by] || "?"} · ${phx(t.completed_at)}` : "";
  const days = [...new Set(tasks.map((t) => t.day_no))].sort((a, b) => a - b);
  const doneMh = tasks.filter((t) => t.state === "complete").reduce((s, t) => s + Number(t.man_hours), 0);
  const totalMh = tasks.reduce((s, t) => s + Number(t.man_hours), 0);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
  <div class="logo">SHOP <span>BOARD</span></div>
  <div class="cabbar">
    <b>ORDER ${build.order_number}</b> · ${lineName}<br>
    <span style="opacity:.7">${build.part_number} · Cab ${build.cab_number || "—"} · ${build.destination || ""}</span><br>
    <span style="opacity:.7">${doneMh.toFixed(1)} of ${totalMh.toFixed(1)} standard hours complete</span>
  </div>
  ${build.note_flagged && build.invoice_note ? `<div class="note">⚠ ORDER NOTE: ${build.invoice_note}</div>` : ""}
  ${inRework ? `
  <!-- REWORK BANNER (files 11/18): the manager sent this cab back with a
       reason + a time frame. The fix tasks sit in the REWORK group below
       (day_no 0 sorts first). Finish them all and the finish gate returns —
       resubmit sends the cab back to AWAITING INSPECTION (file 18: rework
       can NEVER jump straight to production complete). -->
  <div class="note" style="background:#3a1200;border-color:#ff9f0a">
    ⟲ SENT BACK FOR REWORK — ${build.rework_reason || "see note"} · fix within ${Number(build.rework_hours) || "—"} hrs
    ${build.rework_note ? `<br><span style="opacity:.8">Manager's note: ${build.rework_note}</span>` : ""}
  </div>` : ""}
  ${days.map((d) => `
    <div class="dayhead">${d === 0 ? "REWORK — fix these first" : `DAY ${d}`}</div>
    ${tasks.filter((t) => t.day_no === d).map((t) => `
      <button class="task ${t.state === "complete" ? "done" : t.state === "in_progress" ? "doing" : ""}"
              data-id="${t.id}" data-state="${t.state}">
        <span class="no">${t.display_no}</span> ${t.name}
        <span class="tag">${t.is_background ? "background" : t.state === "complete" ? "done — tap to undo" : t.state === "in_progress" ? "IN PROGRESS — tap when done" : "tap to start"}</span>
      </button>
      <!-- Per-task notes/photos (file 11): document a problem or the work
           right where it happened. Lives OUTSIDE the task button so a
           documentation tap never moves the check-off state. -->
      <div style="margin:-6px 0 10px 8px;font-size:.85rem">
        ${whoLine(t) ? `<span style="opacity:.55">${whoLine(t)}</span> · ` : ""}<a style="color:#8e8e93;cursor:pointer" onclick="toggleAtt('${t.id}')">${
          (notesOf[t.id] || []).length + (photosOf[t.id] || []).length
            ? `📎 ${(notesOf[t.id] || []).length + (photosOf[t.id] || []).length} attached — view / add`
            : "＋ note / photo"}</a>
        <div id="att-${t.id}" hidden style="background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:6px">
          ${(notesOf[t.id] || []).map((n) => `<div style="opacity:.85;padding:3px 0;border-bottom:1px solid var(--line)">${String(n.note).replace(/</g, "&lt;")}</div>`).join("")}
          ${(photosOf[t.id] || []).length ? `<div style="margin-top:6px">${(photosOf[t.id] || []).map((p) =>
            `<a href="/photo/${p.id}" target="_blank"><img src="/photo/${p.id}" style="height:56px;border-radius:8px;margin-right:6px"></a>`).join("")}</div>` : ""}
          <textarea id="an-${t.id}" placeholder="Note about this step"
            style="width:100%;min-height:44px;margin-top:8px;background:#111;color:#fff;border:1px solid var(--line);border-radius:8px;padding:8px;font-family:inherit"></textarea>
          <input type="file" id="ap-${t.id}" accept="image/*" capture="environment" multiple style="color:#8e8e93;margin-top:6px">
          <button class="back" style="color:#fff;background:#3a3a3c;border-radius:8px;margin-top:6px"
            onclick="saveAtt('${t.id}','${build.id}',this)">Save</button>
        </div>
      </div>`).join("")}`).join("")}
  ${tasks.every((t) => t.is_background || t.state === "complete") ? `
  <!-- FINISH GATE (file 11, builder half): every step done -> final note ->
       cab goes AWAITING INSPECTION for the manager. Photos join when
       storage plumbing lands (noted in BUILD_LOG). -->
  <div class="cabbar" style="border-color:#30d158;margin-top:18px">
    <b>Every step is checked off.</b><br>
    <textarea id="fnote" placeholder="Final note for this cab (what the next set of eyes should know)"
      style="width:100%;min-height:80px;margin-top:10px;background:#111;color:#fff;
             border:1px solid var(--line);border-radius:10px;padding:10px;font-family:inherit"></textarea>
    <!-- Completion photos (file 11): captured on the phone camera. -->
    <div style="margin-top:10px;opacity:.85">Completion photos:
      <input type="file" id="fphotos" accept="image/*" capture="environment" multiple style="color:#8e8e93"></div>
    <div class="msg" id="upmsg"></div>
    <button class="name" style="background:#1d3a24;border-color:#30d158;margin-top:10px"
      onclick="finishCab('${build.id}',this)">${inRework ? "Fixes done — send back for re-inspection" : "Finished — send for inspection"}</button>
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
    <a href="/board" style="color:#8e8e93">TV board</a> ·
    <a href="/logout" style="color:#8e8e93">Sign out</a>
  </p>
</div>
<script>${netJs}
  // Q107 one-tap line switch: the server does the clock-out + clock-in as
  // one audited move, stamped at the tap (Q103-1 — retries keep true time).
  async function switchLine(lineId, btn) {
    btn.disabled = true; btn.textContent = "Switching…";
    const err = document.getElementById("err");
    const out = await sbPost("/api/clock/switch",
      { line_id: lineId, claimed_at: new Date().toISOString() },
      (m) => { err.textContent = m; });
    if (out.ok) return location.href = "/home";
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
  async function finishCab(id, btn) {
    const files = document.getElementById("fphotos").files;
    // Q86 nudge (per-product minimum, default 1 — hard gate arrives with
    // product settings): one warning tap, second tap sends without photos.
    if (!files.length && !btn.dataset.warned) {
      btn.dataset.warned = "1";
      btn.textContent = "No photos attached — tap again to send without";
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
</script></body></html>`;
};

// THE WATCHER HOME — owners + not-yet-live departments (Q95 amendment
// 2026-07-25: everyone's on the grid; functionality follows later).
const watcherPage = (emp) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Shop Board</title>${style}</head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div>
  <h2>Welcome, ${emp.first_name}.</h2>
  <p style="text-align:center;opacity:.75">
    The production board is live and building.<br>
    ${emp.department === "Owner" || emp.department === "Admin"
      ? "Watch the floor in real time below."
      : `The ${emp.department} board is coming in a later phase — your login is ready for it.`}
  </p>
  <p style="text-align:center;margin-top:26px">
    <a href="/board" class="name" style="display:inline-block;padding:18px 42px">Open the live board</a>
  </p>
  ${emp.role === "admin" ? `<p style="text-align:center;margin-top:6px">
    <a href="/admin" style="color:#8e8e93">Admin console</a> ·
    <a href="/manager" style="color:#8e8e93">Manager cockpit</a>
  </p>` : ""}
  <p style="text-align:center"><a href="/logout" style="color:#8e8e93">Sign out</a></p>
</div></body></html>`;

// THE TV BOARD skeleton (file 19) — view-only, dark, no buttons (Q-design).
// Today it shows each enabled line + who's clocked on; cab tiles, colors,
// and pace arrive with the time engine (Stage 2). Refreshes itself every 30 s.
const boardPage = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
</style></head>
<body>
  <div class="logo" style="margin-top:18px">SHOP <span>BOARD</span></div>
  <div class="board" id="board"></div>
  <div class="stamp" id="stamp"></div>
<script>
  // Plain fetch-poll every 30 s — Realtime push replaces this in Stage 3.
  async function refresh(){
    try{
      const r = await fetch("/api/board-state"); const s = await r.json();
      const bar = { green:"#30d158", amber:"#ffd60a", red:"#C8102E", none:"#5a5a5e" };
      document.getElementById("board").innerHTML = s.lines.map(l => \`
        <div class="tile \${l.cab ? "c-"+l.cab.color : "idle c-none"}" \${l.cab && l.cab.badge ? 'style="border-style:dashed;border-color:#ff9f0a;border-left-width:8px"' : ""}>
          \${l.cab && l.cab.badge ? \`<span style="float:right;background:#ff9f0a;color:#111;font-weight:800;border-radius:6px;padding:2px 8px;margin-left:8px">\${l.cab.badge}</span>\` : ""}
          \${l.cab && l.cab.total_days ? \`<span class="day">DAY \${l.cab.day} of \${l.cab.total_days}</span>\` : ""}
          <h3>\${l.name}</h3>
          \${l.cab ? \`<div style="font-size:1.3rem;font-weight:700">ORDER \${l.cab.order} <span style="opacity:.6;font-weight:400">· \${l.cab.family}</span></div>
            <div class="status s-\${l.cab.color}">\${l.cab.status}</div>
            <div style="opacity:.8;margin-top:4px">\${l.cab.done_mh} / \${l.cab.total_mh} hrs · \${l.cab.pct}%</div>
            <div style="background:#2c2c2e;border-radius:6px;height:10px;margin-top:8px"><div style="background:\${bar[l.cab.color]};height:10px;border-radius:6px;width:\${l.cab.pct}%"></div></div>
            <div style="opacity:.7;margin-top:8px">\${l.cab.promised ? "Promised " + l.cab.promised + " · " : ""}\${l.cab.remaining_mh} hrs of work left</div>\`
          : \`<div>Idle line</div>\`}
          \${l.ondeck ? \`<div style="opacity:.6;margin-top:8px">ON DECK: ORDER \${l.ondeck.order} · \${l.ondeck.family}</div>\` : ""}
          <div class="techs">\${l.techs.length ? "On the clock: " + l.techs.join(" · ") : ""}</div>
        </div>\`).join("");
      document.getElementById("stamp").textContent = "Updated " + new Date().toLocaleTimeString();
    }catch(e){ /* board never crashes; next poll retries */ }
  }
  refresh(); setInterval(refresh, 30000);
  // TV hygiene (risk sweep 2026-07-28): browsers running one tab for weeks
  // leak — a full reload every 6 hours keeps the board fresh forever.
  setTimeout(() => location.reload(), 6 * 60 * 60 * 1000);
</script></body></html>`;

const shellPage = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
const managerPage = (rows, reworkReasons = [], isAdmin = false, onClock = [], longRunners = [], recentDone = [], showReports = false) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
  <div class="logo">SHOP <span>BOARD</span></div>
  <!-- Top nav (Sonnet UX escalation 2026-07-28, C16: there was no way BACK
       from Manager to Admin — nav now lives at the top of every console,
       same placement everywhere per file 22.4). -->
  <p style="text-align:center;margin:-4px 0 14px">
    ${isAdmin ? `<a href="/admin" style="color:#8e8e93;margin-right:18px">Admin console</a>` : ""}
    ${isAdmin || showReports ? `<a href="/reports" style="color:#8e8e93;margin-right:18px">Reports</a>` : ""}
    <a href="/board" style="color:#8e8e93;margin-right:18px">TV board</a>
    <a href="/logout" style="color:#8e8e93">Sign out</a>
  </p>
  <h2>Manager</h2>
  ${onClock.length ? `
  <!-- ON THE CLOCK (risk sweep 2026-07-28): the same-day fix for a forgotten
       clock-out. The sweeper auto-closes anything 4+ hrs past day end; this
       button is for catching it sooner. Audited (who forced it is logged). -->
  <div class="lane"><h3>On the clock</h3>
    ${onClock.map((p) => `<div class="qrow">${p.name} · ${p.line} · since ${p.since_hhmm}
      <button class="btn gray" style="padding:6px 12px;margin-left:10px" onclick="forceOut('${p.id}',this)">Clock out</button></div>`).join("")}
    <div style="opacity:.5;font-size:.85rem">For the tap somebody forgot. Anything still open 4+ hrs past day end closes itself automatically.</div>
  </div>` : ""}
  ${longRunners.length ? `
  <!-- RUNNING LONG (Q107): a step In Progress 4+ hrs, no completion. Not an
       alarm — a glance. Usually it's "went to help elsewhere" or a parts
       run; the who + since makes it self-explanatory. -->
  <div class="lane" style="border-color:#7a5900"><h3>Running long</h3>
    ${longRunners.map((t) => `<div class="qrow">ORDER ${t.order_number} · step ${t.display_no} ${t.name}
      <span style="opacity:.6">— started by ${t.who} at ${t.hhmm}, still open</span></div>`).join("")}
    <div style="opacity:.5;font-size:.85rem">Steps in progress 4+ hours. Worth a glance — nothing here changes any math.</div>
  </div>` : ""}
  ${recentDone.length ? `
  <!-- RECENTLY CHECKED OFF (Q107): the shared undo. A step completed out
       from under a partner comes back here — audited, and the engine's
       earned-value math nets it out automatically (earned = completed
       steps, so un-completing IS the reversal; no side math to fix). -->
  <div class="lane"><h3>Recently checked off</h3>
    ${recentDone.map((t) => `<div class="qrow">ORDER ${t.order_number} · step ${t.display_no} ${t.name}
      <span style="opacity:.6">— by ${t.who} at ${t.hhmm}</span>
      <button class="btn gray" style="padding:6px 12px;margin-left:10px" onclick="undoTask('${t.id}',this)">Un-complete</button></div>`).join("")}
  </div>` : ""}
  ${rows.map((r) => `
    <div class="lane">
      <h3>${r.line.name}</h3>
      ${(r.awaiting || []).map((w) => `
        <div style="border:1px solid #ffd60a;border-radius:10px;padding:10px;margin-bottom:8px">
          <b>ORDER ${w.order_number}</b> · AWAITING INSPECTION
          ${w.final_note ? `<div style="opacity:.75;font-size:.9rem;margin-top:4px">Final note: ${w.final_note}</div>` : ""}
          ${(w.photos || []).length ? `<div style="margin-top:6px">${w.photos.map((p) =>
            `<a href="/photo/${p.id}" target="_blank"><img src="/photo/${p.id}" style="height:64px;border-radius:8px;margin-right:6px"></a>`).join("")}</div>`
            : `<div style="opacity:.5;font-size:.85rem;margin-top:4px">No completion photos attached.</div>`}
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
          <b>ORDER ${w.order_number}</b> · IN REWORK — ${w.rework_reason || ""} (${Number(w.rework_hours) || "—"} hrs given)
          <div style="opacity:.6;font-size:.9rem">Comes back for re-inspection when the fixes are checked off.</div>
        </div>`).join("")}
      ${r.active ? `
        <div><b>ORDER ${r.active.order_number}</b> · ${r.active.part_number} · active</div>
        <button class="btn" onclick="act('complete','${r.active.id}',this)">Sign off — production complete</button>`
      : `<div style="opacity:.6">No active cab</div>
        ${r.queue.length ? `<button class="btn" onclick="act('start','${r.queue[0].id}',this)">Start next: ORDER ${r.queue[0].order_number}</button>` : ""}`}
      ${r.queue.length ? `<div style="margin-top:10px;opacity:.6">Waiting:</div>
        ${r.queue.map((q) => `<div class="qrow">ORDER ${q.order_number} · ${q.part_number}</div>`).join("")}` : ""}
    </div>`).join("")}
  <div class="msg err" id="err"></div>
  <p style="text-align:center"><a href="/board" style="color:#8e8e93;margin-right:24px">TV board</a>
  <a href="/logout" style="color:#8e8e93">Sign out</a></p>
</div>
<script>
  // Plain global handler wired by onclick= on each button — sturdier than
  // delegated listeners under automation and on older shop tablets.
  async function act(kind, id, btn) {
    btn.disabled = true; btn.textContent = "Working…";
    try {
      const r = await fetch("/api/build/" + kind, { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build_id: id, claimed_at: new Date().toISOString() }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false;
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
  // Failed-inspection path: reason + note + time frame -> /api/build/rework.
  async function sendBack(id, btn) {
    btn.disabled = true; btn.textContent = "Working…";
    try {
      const r = await fetch("/api/build/rework", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build_id: id,
          reason: document.getElementById("rr-" + id).value,
          note: document.getElementById("rn-" + id).value,
          hours: Number(document.getElementById("rh-" + id).value),
          claimed_at: new Date().toISOString() }) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch (e) { document.getElementById("err").textContent = "Network hiccup — try again"; }
    btn.disabled = false; btn.textContent = "Send back — rework";
  }
</script></body></html>`;

// THE ADMIN CONSOLE v1 (file 21) — admin role only.
// Three panels this block: EMPLOYEES (roles/departments/lines/active +
// the C18 PIN reset — clearing the PIN sends them back through Q68
// choose-your-PIN at next login) · BUILD STEPS (the Q97 editor: rename,
// hours, day, reorder, retire, add — template edits NEVER touch a started
// cab, its task list froze at start) · FEATURES (the Q65 plain-language
// switches; data keeps computing while OFF, flips are audit-logged).
const DEPTS = ["Production", "Admin", "Warehouse", "Build", "Body Shop", "Accounting"];
const ROLES = ["production", "manager", "admin"];
// Plain-language names for every toggle key (file 22: no jargon on screens).
const TOGGLE_INFO = {
  tv_board: ["The TV board", "The big board on the shop TV."],
  sms_alerts: ["Text alerts", "Text messages for red lines and daily events. Stays OFF until cutover."],
  email_notifications: ["Email notifications", "System emails. Stays OFF until cutover."],
  morning_prebrief: ["Morning pre-brief", "A short summary to the manager before the day starts."],
  line_frees_soon_alert: ["Line-frees-soon heads-up", "A nudge when a line looks like it will open up soon."],
  inspect_before_close_nudge: ["Inspect-before-close nudge", "A reminder to sign off finished cabs before day end."],
  early_red_standards_guard: ["Early-red standards guard", "Flags a cab that goes red unusually early — usually the standard, not the crew."],
  customer_names_on_tv: ["Customer names on the TV", "Show customer names on the board tiles."],
  time_off_requests: ["Time-off requests", "Techs can ask for time off from their phones."],
  // Owner-rep call 2026-07-29: reports are an ADMIN thing; the manager's job
  // is running the floor. This switch lets an admin share the page if wanted.
  manager_reports: ["Managers can see Reports", "Let the manager role open the Reports page. OFF = admins only."],
};
const adminPage = (emps, tmpls, tplId, steps, toggles) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
  <div class="logo">SHOP <span>BOARD</span></div>
  <!-- Sticky console nav (Sonnet UX escalation 2026-07-28, C17: the admin
       console was one long scroll with nav buried at the bottom). Tabs jump
       to sections; room to grow toward file 21's nine sections. Same top
       placement as the Manager cockpit (file 22.4: learn it once). -->
  <div style="position:sticky;top:0;z-index:5;background:var(--bg);padding:10px 0;margin-bottom:8px;
              text-align:center;border-bottom:1px solid var(--line)">
    <a href="#people" style="color:#fff;font-weight:700;margin-right:16px">People</a>
    <a href="#steps" style="color:#fff;font-weight:700;margin-right:16px">Build steps</a>
    <a href="#features" style="color:#fff;font-weight:700;margin-right:16px">Features</a>
    <span style="opacity:.35">|</span>
    <a href="/manager" style="color:#8e8e93;margin-left:16px;margin-right:16px">Manager cockpit</a>
    <a href="/reports" style="color:#8e8e93;margin-right:16px">Reports</a>
    <a href="/board" style="color:#8e8e93;margin-right:16px">TV board</a>
    <a href="/logout" style="color:#8e8e93">Sign out</a>
  </div>
  <h2>Admin</h2>

  <div class="panel" id="people"><h3>People</h3>
  <table><tr><th>Name</th><th>Department</th><th>Role</th><th>Usual lines</th><th></th><th></th><th></th></tr>
  ${emps.map((e) => `<tr class="${e.active ? "" : "off"}">
    <td><b>${e.first_name} ${e.last_name}</b></td>
    <td><select id="d-${e.id}">${DEPTS.map((d) => `<option ${e.department === d ? "selected" : ""}>${d}</option>`).join("")}</select></td>
    <td><select id="r-${e.id}">${ROLES.map((r) => `<option ${e.role === r ? "selected" : ""}>${r}</option>`).join("")}</select></td>
    <td><input class="ln" id="l-${e.id}" value="${(e.lines || []).join(",")}" placeholder="1,2"></td>
    <td><button class="b" onclick="saveEmp('${e.id}',this)">Save</button></td>
    <td><button class="b ${e.active ? "" : "grn"}" onclick="arm(this,()=>setActive('${e.id}',${e.active ? "false" : "true"},this))">${e.active ? "Deactivate" : "Reactivate"}</button></td>
    <td><button class="b" onclick="arm(this,()=>resetPin('${e.id}'))">${e.pin_hash ? "Reset PIN" : "No PIN yet"}</button></td>
  </tr>`).join("")}</table>
  <p style="opacity:.5;font-size:.85rem">Deactivated people vanish from the sign-in screen but their history stays. Resetting a PIN lets that person choose a new one at their next sign-in.</p>
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
    <td><input class="num" id="sd-${s.id}" value="${s.day_no}"></td>
    <td><input class="num" id="sh-${s.id}" value="${Number(s.man_hours)}"></td>
    <td><button class="b" onclick="saveStep('${s.id}',this)">Save</button></td>
    <td>${i > 0 ? `<button class="b" onclick="moveStep('${s.id}','up',this)">&uarr;</button>` : ""}
        ${i < steps.length - 1 ? `<button class="b" onclick="moveStep('${s.id}','down',this)">&darr;</button>` : ""}</td>
    <td><button class="b red" onclick="arm(this,()=>retireStep('${s.id}'))">Retire</button></td>
  </tr>`).join("")}</table>
  <p style="margin-top:10px">Add a step:
    <input class="dno" id="new-no" placeholder="#"> <input class="nm" id="new-name" style="min-width:220px" placeholder="Step name">
    Day <input class="num" id="new-day" value="1"> Hrs <input class="num" id="new-hrs" value="1">
    <button class="b" onclick="addStep('${tplId}',this)">Add</button></p>
  <p style="opacity:.5;font-size:.85rem">Changes apply to FUTURE cabs only — a cab already started keeps the exact list it started with. Retired steps keep their history and drop off new builds.</p>
  </div>

  <div class="panel" id="features"><h3>Features</h3>
  ${toggles.map((t) => { const info = TOGGLE_INFO[t.key] || [t.key, ""]; return `
    <div class="tglrow"><div style="flex:1"><b>${info[0]}</b><small>${info[1]}</small></div>
    <b style="opacity:.7">${t.enabled ? "ON" : "OFF"}</b>
    <button class="b ${t.enabled ? "red" : "grn"}" onclick="flip('${t.key}',${t.enabled ? "false" : "true"},this)">Turn ${t.enabled ? "OFF" : "ON"}</button></div>`; }).join("")}
  <p style="opacity:.5;font-size:.85rem">Everything keeps tracking underneath while a feature is OFF — turning it back ON reveals full history. Every flip is logged.</p>
  </div>

  <div class="msg err" id="err"></div>
  <p style="text-align:center"><a href="/manager" style="color:#8e8e93;margin-right:24px">Manager cockpit</a>
  <a href="/board" style="color:#8e8e93;margin-right:24px">TV board</a>
  <a href="/logout" style="color:#8e8e93">Sign out</a></p>
</div>
<script>
  // Same sturdy pattern as the cockpit: plain global handlers, no dialogs.
  // Destructive taps use arm(): first tap arms the button, second fires.
  function arm(btn, fn){ if (btn.dataset.armed) { fn(); } else { btn.dataset.armed = "1"; btn.textContent = "Sure? Tap again"; setTimeout(() => { btn.dataset.armed = ""; }, 4000); } }
  async function post(url, payload, btn){
    if (btn) { btn.disabled = true; }
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const out = await r.json();
      if (out.ok) return location.reload();
      document.getElementById("err").textContent = out.error || "Something went wrong";
    } catch(e){ document.getElementById("err").textContent = "Network hiccup — try again"; }
    if (btn) { btn.disabled = false; }
  }
  const v = (id) => document.getElementById(id).value;
  function saveEmp(id, btn){ post("/api/admin/employee", { id, department: v("d-"+id), role: v("r-"+id),
    lines: v("l-"+id).split(",").map(s=>Number(s.trim())).filter(n=>n>0) }, btn); }
  function setActive(id, to, btn){ post("/api/admin/employee", { id, active: to === "true" || to === true }, btn); }
  function resetPin(id){ post("/api/admin/employee", { id, reset_pin: true }); }
  function saveStep(id, btn){ post("/api/admin/step", { action: "update", id, display_no: v("sn-"+id),
    name: v("sm-"+id), day_no: Number(v("sd-"+id)), man_hours: Number(v("sh-"+id)) }, btn); }
  function moveStep(id, dir, btn){ post("/api/admin/step", { action: "move", id, dir }, btn); }
  function retireStep(id){ post("/api/admin/step", { action: "retire", id }); }
  function addStep(tplId, btn){ post("/api/admin/step", { action: "add", template_id: tplId,
    display_no: v("new-no"), name: v("new-name"), day_no: Number(v("new-day")), man_hours: Number(v("new-hrs")) }, btn); }
  function flip(key, to, btn){ post("/api/admin/toggle", { key, enabled: to === true || to === "true" }, btn); }
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

async function reportData(days) {
  const nowMs = Date.now();
  const sinceMs = nowMs - days * 86400000;
  const lines = await db(`line?select=id,name&order=id`);
  const emps = await db(`employee?select=id,first_name,last_name,active`);
  const builds = await db(`build?select=id,order_number,part_number,line_id,state,started_at,promised_finish,rework_reason&order=created_at`);
  // Sign-off + rework moments live in the append-only event log (spec §3).
  const compEv = await db(`event_log?select=at,payload&event_type=eq.build.production_complete&order=at.asc&limit=2000`);
  const rwEv = await db(`event_log?select=at,payload&event_type=eq.build.rework_assigned&order=at.asc&limit=2000`);
  // Same windowing caveat as the board engine: fine for years at this shop's
  // event volume; revisit alongside the engine if history ever outgrows it.
  const events = await db(`clock_event?select=employee_id,line_id,kind,claimed_at&order=claimed_at.asc&limit=10000`);
  const ivs = workIntervals(events, nowMs);
  const lineName = {}; for (const l of lines) lineName[l.id] = l.name;
  // Latest sign-off per build (a rework loop can sign off twice — last wins).
  const doneAt = {}; for (const e of compEv) if (e.payload && e.payload.build_id) doneAt[e.payload.build_id] = new Date(e.at).getTime();
  const finished = builds.filter((b) => b.state === "production_complete" && doneAt[b.id] && doneAt[b.id] >= sinceMs && b.started_at);
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
    return { order: b.order_number, part: b.part_number || "?", line: lineName[b.line_id] || "?",
      std, actual, varPct: std ? Math.round(((actual - std) / std) * 100) : null,
      started: phxHM(b.started_at), completed: phxHM(new Date(e).toISOString()) };
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
  const openCabs = live.map((b) => ({ order: b.order_number, part: b.part_number || "?",
    line: lineName[b.line_id] || "?", state: b.state.replace(/_/g, " "),
    daysOpen: b.started_at ? Math.round((nowMs - new Date(b.started_at).getTime()) / 86400000 * 10) / 10 : null,
    doneMh: Math.round((doneMhOf[b.id] || 0) * 10) / 10, stdMh: Math.round((stdOf[b.id] || 0) * 10) / 10,
    promised: b.promised_finish || "" }));
  // Labor per employee for the window (suite 3) — clock truth only (C15).
  const labor = emps.map((p) => {
    const mine = ivs.filter((iv) => iv.emp === p.id);
    const hrs = mine.reduce((s, iv) => s + overlapHrs(iv, sinceMs, nowMs), 0);
    const daysSet = new Set(mine.filter((iv) => iv.end > sinceMs).map((iv) => phxDate(Math.max(iv.start, sinceMs))));
    return { name: `${p.first_name} ${p.last_name}`, active: p.active, hrs, days: daysSet.size };
  }).filter((r) => r.hrs > 0).sort((a, b) => b.hrs - a.hrs);
  // Rework in the window (suite 5) — count + reasons from the audit trail.
  const rw = rwEv.filter((e) => new Date(e.at).getTime() >= sinceMs);
  const rwReasons = {};
  for (const e of rw) { const r = (e.payload && e.payload.reason) || "(no reason)"; rwReasons[r] = (rwReasons[r] || 0) + 1; }
  return { days, cabs, products, openCabs, labor, rework: { n: rw.length, reasons: rwReasons } };
}

const h1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
const reportsPage = (d, isAdmin = false) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
</style></head>
<body><div class="wrap">
  <div class="logo">SHOP <span>BOARD</span></div>
  <p style="text-align:center;margin:-4px 0 14px">
    ${isAdmin ? `<a href="/admin" style="color:#8e8e93;margin-right:18px">Admin console</a>` : ""}
    <a href="/manager" style="color:#8e8e93;margin-right:18px">Manager cockpit</a>
    <a href="/board" style="color:#8e8e93;margin-right:18px">TV board</a>
    <a href="/logout" style="color:#8e8e93">Sign out</a>
  </p>
  <h2>Reports</h2>
  <p class="per">Period:
    ${[7, 30, 90, 365].map((n) => `<a href="/reports?days=${n}" class="${d.days === n ? "on" : ""}">${n === 7 ? "Week" : n === 30 ? "Month" : n === 90 ? "Quarter" : "Year"}</a>`).join("")}
  </p>
  <div class="lane">
    <a class="csv" href="/reports.csv?which=products&days=${d.days}">⬇ CSV</a>
    <h3>Actual vs standard — by product (${d.cabs.length} cab${d.cabs.length === 1 ? "" : "s"} signed off)</h3>
    ${d.products.length ? `<table><tr><th>Product</th><th class="num">Cabs</th><th class="num">Avg standard</th><th class="num">Avg actual</th><th class="num">Variance</th></tr>
      ${d.products.map((p) => `<tr><td>${p.part}</td><td class="num">${p.n}</td><td class="num">${h1(p.avgStd)} h</td><td class="num">${h1(p.avgActual)} h</td>
        <td class="num ${p.varPct === null ? "" : p.varPct > 25 ? "way" : p.varPct > 0 ? "over" : "under"}">${p.varPct === null ? "—" : (p.varPct > 0 ? "+" : "") + p.varPct + "%"}</td></tr>`).join("")}</table>
      <div style="opacity:.5;font-size:.85rem;margin-top:8px">Actual = clocked man-hours on the cab's line from start to sign-off — never task timers. This table is what trues the standards up over time.</div>`
    : `<div style="opacity:.6">No cabs signed off in this period.</div>`}
  </div>
  <div class="lane">
    <a class="csv" href="/reports.csv?which=cabs&days=${d.days}">⬇ CSV</a>
    <h3>Signed-off cabs — the detail</h3>
    ${d.cabs.length ? `<table><tr><th>Order</th><th>Product</th><th>Line</th><th class="num">Std</th><th class="num">Actual</th><th class="num">Var</th><th>Signed off</th></tr>
      ${d.cabs.map((c) => `<tr><td><b>${c.order}</b></td><td>${c.part}</td><td>${c.line}</td><td class="num">${h1(c.std)}</td><td class="num">${h1(c.actual)}</td>
        <td class="num ${c.varPct === null ? "" : c.varPct > 25 ? "way" : c.varPct > 0 ? "over" : "under"}">${c.varPct === null ? "—" : (c.varPct > 0 ? "+" : "") + c.varPct + "%"}</td><td style="opacity:.7">${c.completed}</td></tr>`).join("")}</table>`
    : `<div style="opacity:.6">Nothing in this period.</div>`}
  </div>
  <div class="lane">
    <h3>Open cabs — aging</h3>
    ${d.openCabs.length ? `<table><tr><th>Order</th><th>Product</th><th>Line</th><th>State</th><th class="num">Days open</th><th class="num">Done / std</th><th>Promised</th></tr>
      ${d.openCabs.map((c) => `<tr><td><b>${c.order}</b></td><td>${c.part}</td><td>${c.line}</td><td>${c.state}</td>
        <td class="num">${c.daysOpen === null ? "—" : c.daysOpen}</td><td class="num">${c.doneMh} / ${c.stdMh} h</td><td style="opacity:.7">${c.promised}</td></tr>`).join("")}</table>`
    : `<div style="opacity:.6">No open cabs.</div>`}
  </div>
  <div class="lane">
    <a class="csv" href="/reports.csv?which=labor&days=${d.days}">⬇ CSV</a>
    <h3>Labor — clocked hours per person</h3>
    ${d.labor.length ? `<table><tr><th>Name</th><th class="num">Hours</th><th class="num">Days present</th></tr>
      ${d.labor.map((r) => `<tr><td>${r.name}${r.active ? "" : ' <span style="opacity:.4">(inactive)</span>'}</td><td class="num">${h1(r.hrs)}</td><td class="num">${r.days}</td></tr>`).join("")}</table>
      <div style="opacity:.5;font-size:.85rem;margin-top:8px">Coaching and coverage view — never shown on the floor board (file 12 privacy rule).</div>`
    : `<div style="opacity:.6">No clocked hours in this period.</div>`}
  </div>
  <div class="lane">
    <h3>Rework (${d.rework.n} in period)</h3>
    ${d.rework.n ? Object.entries(d.rework.reasons).map(([r, n]) => `<div style="padding:3px 0;opacity:.85">${r} — ${n}</div>`).join("")
    : `<div style="opacity:.6">No rework assigned in this period. Good.</div>`}
  </div>
</div></body></html>`;

// CSV export (file 12 universal controls) — same numbers as the page,
// straight into the owner's spreadsheet.
function reportCsv(which, d) {
  const esc = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const row = (arr) => arr.map(esc).join(",") + "\r\n";
  if (which === "products")
    return row(["product", "cabs", "avg_standard_hours", "avg_actual_hours", "variance_pct"]) +
      d.products.map((p) => row([p.part, p.n, h1(p.avgStd), h1(p.avgActual), p.varPct])).join("");
  if (which === "labor")
    return row(["employee", "hours", "days_present"]) +
      d.labor.map((r) => row([r.name, h1(r.hrs), r.days])).join("");
  return row(["order", "product", "line", "standard_hours", "actual_hours", "variance_pct", "started", "signed_off"]) +
    d.cabs.map((c) => row([c.order, c.part, c.line, h1(c.std), h1(c.actual), c.varPct, c.started, c.completed])).join("");
}

// ---------- the server ----------
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const send = (code, type, data) => { res.writeHead(code, { "content-type": type }); res.end(data); };
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
      const view = emps.map((e) => ({ ...e, has_pin: Boolean(e.pin_hash),
        dept_label: e.department || (e.role === "manager" ? "Manager" : e.role === "admin" ? "Admin" : "Production"),
      })).map((e) => ({ ...e, dept_label: e.role === "manager" ? "Manager" : e.dept_label }));
      return send(200, "text/html; charset=utf-8", loginPage(view));
    }

    // FIRST-TIME PIN SET (Q68). Only allowed while the person has NO pin —
    // after that, changing a PIN is a manager/admin reset flow (C18, later stage).
    if (url.pathname === "/api/pin/set" && req.method === "POST") {
      const { id, pin } = await body(req);
      if (!/^\d{4}$/.test(String(pin))) return json(400, { ok: false, error: "PIN must be 4 digits" });
      // Q70 hardening (2026-07-29 soak-test find): the grid HIDES retired
      // accounts but this endpoint used to accept any id — a deactivated
      // account could still authenticate. Now the API enforces it too.
      const [emp] = await db(`employee?select=id,pin_hash&id=eq.${id}&active=is.true`);
      if (!emp) return json(404, { ok: false, error: "Unknown employee" });
      if (emp.pin_hash) return json(400, { ok: false, error: "PIN already set — enter it instead" });
      await db(`employee?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ pin_hash: hashPin(pin) }) });
      logEvent("pin.set", id, {});
      logEvent("employee.login", id, { first_login: true });
      res.setHeader("Set-Cookie", `sb_session=${makeSession(id)}; Path=/; HttpOnly; SameSite=Lax`);
      return json(200, { ok: true });
    }

    // LOGIN — verify PIN, with the C17 per-person lockout.
    if (url.pathname === "/api/login" && req.method === "POST") {
      const { id, pin } = await body(req);
      if (locked(id)) return json(429, { ok: false, error: "Too many tries — locked for 5 minutes" });
      // Q70 hardening (2026-07-29 soak-test find): same active enforcement
      // as /api/pin/set above — a retired account can't sign in by id.
      const [emp] = await db(`employee?select=id,pin_hash&id=eq.${id}&active=is.true`);
      if (!emp || !emp.pin_hash) return json(404, { ok: false, error: "No PIN on file — go back and tap your name" });
      if (!checkPin(pin, emp.pin_hash)) {
        const s = strike(id);
        logEvent("pin.fail", id, {});
        return json(401, { ok: false, error: s.lockedUntil > Date.now() ? "Locked for 5 minutes (5 wrong tries)" : "Wrong PIN — try again" });
      }
      pinStrikes.delete(id);
      logEvent("employee.login", id, {});
      res.setHeader("Set-Cookie", `sb_session=${makeSession(id)}; Path=/; HttpOnly; SameSite=Lax`);
      return json(200, { ok: true });
    }

    // HOME — three shapes, gated by DEPARTMENT (Q94: role=can-do, dept=where):
    //  Production dept  -> clock in/out; while ON the clock -> the cab task screen.
    //  Everyone else    -> watcher home (owners watch the board; future
    //                      departments see "your board is coming" — Q95 amendment).
    if (url.pathname === "/home") {
      const empId = readSession(req.headers.cookie);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [emp] = await db(`employee?select=first_name,lines,department,role&id=eq.${empId}`);
      if (!emp) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      if (emp.department !== "Production")
        return send(200, "text/html; charset=utf-8", watcherPage(emp));
      const [last] = await db(`clock_event?select=kind,line_id&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      const allLines = await db(`line?select=id,name&enabled=is.true&order=id`);
      const clockedIn = last && last.kind === "clock_in";
      const lineName = clockedIn ? (allLines.find((l) => l.id === last.line_id) || {}).name || "" : "";
      const reasons = await db(`pick_list_item?select=label&list_key=eq.clock_out_reason&retired=is.false&order=sort_order`);
      // ?clockout=1 = the task screen's Clock-out button — show the reason picker.
      if (clockedIn && url.searchParams.get("clockout") !== "1") {
        // ON THE CLOCK: front-center cab = the active build on YOUR line (Q90).
        // A cab in REWORK still owns its line and its screen (files 11/18).
        const [build] = await db(`build?select=id,order_number,part_number,cab_number,destination,invoice_note,note_flagged,state,rework_reason,rework_note,rework_hours&line_id=eq.${last.line_id}&state=in.(active,rework)&order=started_at&limit=1`);
        if (build) {
          // Q107: started_by/completed_by ride along so the screen can show
          // WHO is on a step — two techs sharing a cab see each other's work.
          const tasks = await db(`task?select=id,display_no,name,day_no,man_hours,is_background,state,started_by,started_at,completed_by,completed_at&build_id=eq.${build.id}&order=day_no,sort_order`);
          // Per-task documentation (file 11) rides along with the task list.
          const notes = await db(`task_note?select=task_id,note&build_id=eq.${build.id}&order=created_at`);
          const tphotos = await db(`build_photo?select=id,task_id&build_id=eq.${build.id}&kind=eq.task&order=created_at`);
          // First names for the attribution lines (includes retired accounts
          // so history never shows a blank), and the OTHER lines for the
          // one-tap Switch line control (Q107 — helping another line moves
          // your labor truth with you).
          const folks = await db(`employee?select=id,first_name`);
          const people = {}; for (const p of folks) people[p.id] = p.first_name;
          const otherLines = allLines.filter((l) => l.id !== last.line_id);
          return send(200, "text/html; charset=utf-8", cabPage(emp, build, tasks, lineName, notes, tphotos, otherLines, people));
        }
        // No active cab on this line -> fall through to the clock screen.
      }
      const usual = allLines.filter((l) => (emp.lines || []).includes(l.id));
      const other = allLines.filter((l) => !(emp.lines || []).includes(l.id));
      return send(200, "text/html; charset=utf-8",
        homePage(emp, { clockedIn, lineName }, usual, other, reasons));
    }

    // TASK STATE CHANGE — the two-step check-off engine (Q45/Q90/Q104).
    // Rules enforced here: you must be signed in AND clocked on (Q104);
    // only legal transitions; who-did-what recorded; everything event-logged.
    if (url.pathname === "/api/task/state" && req.method === "POST") {
      const empId = readSession(req.headers.cookie);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const { task_id, to, claimed_at } = await body(req);
      const [t] = await db(`task?select=id,state,build_id,display_no&id=eq.${task_id}`);
      if (!t) return json(404, { ok: false, error: "Task not found" });
      const [lastCk] = await db(`clock_event?select=kind&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (!lastCk || lastCk.kind !== "clock_in") {
        // Q107: the ONE exception to "on the clock" — a manager/admin backing
        // a wrongly-completed step out from the cockpit. It's a correction,
        // not floor work; still audited below like every state change.
        const [me] = await db(`employee?select=role&id=eq.${empId}`);
        const managerUndo = me && (me.role === "manager" || me.role === "admin")
          && t.state === "complete" && to === "in_progress";
        if (!managerUndo)
          return json(403, { ok: false, error: "Clock in first — task changes need you on the clock" });
      }
      const legal = { not_started: ["in_progress"], in_progress: ["complete"], complete: ["in_progress"] };
      if (!(legal[t.state] || []).includes(to))
        return json(400, { ok: false, error: `Can't go ${t.state} → ${to}` });
      const patch = { state: to };
      if (to === "in_progress" && t.state === "not_started") { patch.started_by = empId; patch.started_at = claimed_at || new Date().toISOString(); }
      if (to === "complete") { patch.completed_by = empId; patch.completed_at = claimed_at || new Date().toISOString(); }
      if (to === "in_progress" && t.state === "complete") { patch.completed_by = null; patch.completed_at = null; }
      await db(`task?id=eq.${task_id}`, { method: "PATCH", body: JSON.stringify(patch) });
      logEvent(t.state === "complete" ? "task.undo" : to === "complete" ? "task.complete" : "task.start",
        empId, { task_id, build_id: t.build_id, display_no: t.display_no, from: t.state, to });
      return json(200, { ok: true });
    }

    // CLOCK IN (Q90 one-tap; Q52 Wi-Fi gate below). Payroll-grade rows (C3.8).
    if (url.pathname === "/api/clock/in" && req.method === "POST") {
      const empId = readSession(req.headers.cookie);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const gate = wifiGate(req); if (gate) return json(403, { ok: false, error: gate });
      const { line_id, claimed_at } = await body(req);
      if (!line_id) return json(400, { ok: false, error: "Pick a line" });
      // Double clock-in guard (risk sweep 2026-07-28): a second clock-in used
      // to silently orphan the first interval — real coverage lost. Refuse it
      // plainly instead; the reload shows the clock-out screen.
      const [already] = await db(`clock_event?select=kind,line_id&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (already && already.kind === "clock_in") {
        const [l] = await db(`line?select=name&id=eq.${already.line_id}`);
        return json(400, { ok: false, error: `You're already on the clock${l ? " — " + l.name : ""}. Clock out first, then switch.` });
      }
      await db("clock_event", { method: "POST", body: JSON.stringify({
        employee_id: empId, line_id, kind: "clock_in", claimed_at: claimed_at || new Date().toISOString() }) });
      logEvent("clock.in", empId, { line_id });
      return json(200, { ok: true });
    }

    // CLOCK OUT — reason label maps to the event kind (Q77 list drives the UI).
    if (url.pathname === "/api/clock/out" && req.method === "POST") {
      const empId = readSession(req.headers.cookie);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const gate = wifiGate(req); if (gate) return json(403, { ok: false, error: gate });
      const { reason, claimed_at } = await body(req);
      const kind = reason === "Lunch" ? "clock_out_lunch"
        : reason === "End of shift" ? "clock_out_shift" : "clock_out_early";
      await db("clock_event", { method: "POST", body: JSON.stringify({
        employee_id: empId, kind, reason: reason || null, claimed_at: claimed_at || new Date().toISOString() }) });
      logEvent("clock.out", empId, { reason, kind });
      return json(200, { ok: true });
    }

    // SWITCH LINE (Q107): one tap = clock out of the current line + clock in
    // on the line you're walking over to help, as a single audited move.
    // Why it exists: cab color runs off clocked labor vs earned value
    // (C15/Q103), so helping ANOTHER line while clocked into your own quietly
    // feeds your hours to the wrong cab's pace math. Making the honest path
    // one tap is the fix — the friction was the problem.
    if (url.pathname === "/api/clock/switch" && req.method === "POST") {
      const empId = readSession(req.headers.cookie);
      if (!empId) return json(401, { ok: false, error: "Signed out — sign in again" });
      const gate = wifiGate(req); if (gate) return json(403, { ok: false, error: gate });
      const { line_id, claimed_at } = await body(req);
      if (!line_id) return json(400, { ok: false, error: "Pick a line" });
      const [last] = await db(`clock_event?select=kind,line_id,reason,claimed_at&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
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
      return json(200, { ok: true });
    }

    // TV BOARD (file 19 skeleton) — view-only; no login (it's a TV on shop Wi-Fi).
    if (url.pathname === "/board") return send(200, "text/html; charset=utf-8", boardPage);

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
    if (url.pathname === "/api/board-state") {
      const lines = await db(`line?select=id,name&enabled=is.true&order=id`);
      const emps = await db(`employee?select=id,first_name&active=is.true`);
      const builds = await db(`build?select=id,order_number,part_number,line_id,started_at,promised_finish,state,created_at,rework_reason,rework_hours,rework_assigned_at&state=in.(active,upcoming,awaiting_inspection,rework)&order=created_at`);
      // EVENT WINDOW FIX (risk sweep 2026-07-28): the old flat limit-2000 read
      // would silently drop a long-running cab's EARLIEST coverage after about
      // a month of real usage — corrupting pace math invisibly. Now the window
      // starts at the oldest live cab's start minus a 24h cushion (with the
      // sweeper running, no single interval can span longer than that).
      const liveStarts = builds.filter((b) => b.state === "active" || b.state === "rework")
        .map((b) => new Date(b.started_at).getTime()).filter((n) => !isNaN(n));
      const windowStart = new Date((liveStarts.length ? Math.min(...liveStarts) : Date.now() - 7 * 86400000) - 86400000).toISOString();
      const events = await db(`clock_event?select=employee_id,kind,line_id,claimed_at&claimed_at=gte.${windowStart}&order=claimed_at.asc&limit=10000`);
      const prods = await db(`product?select=part_number,family,template_id`);
      const tmpls = await db(`build_template?select=id,total_days`);
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
      const waitOf = {}; // awaiting-inspection cab (shows if the line has no active cab)
      for (const b of builds) {
        // A rework cab owns the line tile exactly like an active one (file 18:
        // distinct badge, its own countdown vs the manager's time frame).
        if ((b.state === "active" || b.state === "rework") && !cabOf[b.line_id]) cabOf[b.line_id] = b;
        if (b.state === "awaiting_inspection" && !waitOf[b.line_id]) waitOf[b.line_id] = b;
        if (b.state === "upcoming" && !deckOf[b.line_id]) deckOf[b.line_id] = b;
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

      return json(200, { lines: lines.map((l) => {
        const b = cabOf[l.id];
        const deck = deckOf[l.id] ? { order: deckOf[l.id].order_number, family: familyOf[deckOf[l.id].part_number] || "" } : null;
        // No active cab but one waiting on Mike? The board says so plainly.
        if (!b && waitOf[l.id]) {
          const w = waitOf[l.id];
          return { id: l.id, name: l.name, techs: onLine[l.id] || [], ondeck: deck,
            cab: { order: w.order_number, family: familyOf[w.part_number] || "",
              done_mh: "—", total_mh: "—", pct: 100, promised: w.promised_finish || null,
              remaining_mh: "0.0", color: "green", status: "AWAITING INSPECTION — ready for sign-off",
              day: 0, total_days: 0 } };
        }
        if (!b) return { id: l.id, name: l.name, techs: onLine[l.id] || [], cab: null, ondeck: deck };
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
        const totalDays = daysOfTmpl[tmplOf[b.part_number]] || 0;
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
        return { id: l.id, name: l.name, techs: onLine[l.id] || [], ondeck: deck,
          cab: { order: b.order_number, family: familyOf[b.part_number] || "",
            done_mh: a.done.toFixed(1), total_mh: a.total.toFixed(1),
            pct: a.total ? Math.round(100 * a.done / a.total) : 0,
            // Promised date is FIXED at start (Q103-6); remaining standard
            // man-hours is the honest v1 "how much is left" figure.
            promised: b.promised_finish || null,
            remaining_mh: (a.total - a.done).toFixed(1),
            color: rcolor, status: rstatus, badge, day, total_days: totalDays } };
      }) });
    }

    // MANAGER COCKPIT — manager + admin only (file 07 permissions).
    if (url.pathname === "/manager") {
      const empId = readSession(req.headers.cookie);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return send(403, "text/plain", "Manager or admin only");
      const lines = await db(`line?select=id,name&enabled=is.true&order=id`);
      const builds = await db(`build?select=id,order_number,part_number,line_id,state,final_note,rework_reason,rework_hours,started_at,created_at&state=in.(active,upcoming,awaiting_inspection,rework)&order=created_at`);
      const reworkReasons = await db(`pick_list_item?select=label&list_key=eq.rework_reason&retired=is.false&order=sort_order`);
      // Who's on the clock right now — feeds the forgotten-clock-out tool.
      const recentCk = await db("clock_event?select=employee_id,kind,line_id,claimed_at&order=claimed_at.desc&limit=200");
      const latestCk = {};
      for (const ev of recentCk) if (!latestCk[ev.employee_id]) latestCk[ev.employee_id] = ev;
      const empNames = await db("employee?select=id,first_name,last_name&active=is.true");
      const onClock = Object.values(latestCk).filter((e) => e.kind === "clock_in")
        .map((e) => { const emp = empNames.find((x) => x.id === e.employee_id);
          return emp ? { id: e.employee_id, name: `${emp.first_name} ${emp.last_name}`,
            line: (lines.find((l) => l.id === e.line_id) || {}).name || "",
            // HH:MM in Phoenix time (UTC-7 fixed, Q82) — rendered server-side.
            since_hhmm: new Date(new Date(e.claimed_at).getTime() - 7 * 3600000).toISOString().slice(11, 16) } : null; })
        .filter(Boolean);
      // Completion photos for the inspection boxes (file 11: the manager
      // inspects note + photos together).
      const waitIds = builds.filter((b) => b.state === "awaiting_inspection").map((b) => b.id);
      const photos = waitIds.length
        ? await db(`build_photo?select=id,build_id&build_id=in.(${waitIds.join(",")})&order=created_at`) : [];
      const rows = lines.map((l) => ({ line: l,
        active: builds.find((b) => b.line_id === l.id && b.state === "active") || null,
        rework: builds.filter((b) => b.line_id === l.id && b.state === "rework"),
        awaiting: builds.filter((b) => b.line_id === l.id && b.state === "awaiting_inspection")
          .map((b) => ({ ...b, photos: photos.filter((p) => p.build_id === b.id) })),
        queue: builds.filter((b) => b.line_id === l.id && b.state === "upcoming") }));
      // Q107: two quiet watchdogs over the working cabs' tasks.
      //   LONG-RUNNERS — a step In Progress 4+ hrs with no completion. Zero
      //   crew taps required; the manager glances, sees who started it and
      //   when, and the mystery usually explains itself (helping elsewhere,
      //   parts run, forgot the tap). Also keeps stale spans from quietly
      //   feeding the future Q96 calibration.
      //   RECENTLY CHECKED OFF — the shared, audited undo. If a step got
      //   completed out from under a partner still working it, this is where
      //   it comes back (line-mates can also just tap the step itself).
      const workIds = builds.filter((b) => b.state === "active" || b.state === "rework").map((b) => b.id);
      const orderOf = {}; for (const b of builds) orderOf[b.id] = b.order_number;
      const allNames = await db("employee?select=id,first_name");
      const nameOf = {}; for (const p of allNames) nameOf[p.id] = p.first_name;
      const phx = (ts) => ts ? new Date(new Date(ts).getTime() - 7 * 3600000).toISOString().slice(11, 16) : "";
      let longRunners = [], recentDone = [];
      if (workIds.length) {
        const doing = await db(`task?select=id,name,display_no,build_id,started_by,started_at&build_id=in.(${workIds.join(",")})&state=eq.in_progress&order=started_at.asc`);
        longRunners = doing.filter((t) => t.started_at && Date.now() - new Date(t.started_at).getTime() > 4 * 3600000)
          .map((t) => ({ ...t, order_number: orderOf[t.build_id], who: nameOf[t.started_by] || "?", hhmm: phx(t.started_at) }));
        const dones = await db(`task?select=id,name,display_no,build_id,completed_by,completed_at&build_id=in.(${workIds.join(",")})&state=eq.complete&order=completed_at.desc.nullslast&limit=8`);
        recentDone = dones.filter((t) => t.completed_at)
          .map((t) => ({ ...t, order_number: orderOf[t.build_id], who: nameOf[t.completed_by] || "?", hhmm: phx(t.completed_at) }));
      }
      // Reports link only if the admin has shared the page (Q65 toggle,
      // owner-rep 2026-07-29: reports are admin work by default).
      const [repTog] = await db(`feature_toggle?select=enabled&key=eq.manager_reports`);
      return send(200, "text/html; charset=utf-8", managerPage(rows, reworkReasons, me.role === "admin", onClock, longRunners, recentDone, Boolean(repTog && repTog.enabled)));
    }

    // REPORTS v1 (file 12 / Q26): manager + admin only, like the cockpit.
    // Staff-level numbers never reach the floor (file 12 privacy rule).
    if (url.pathname === "/reports" || url.pathname === "/reports.csv") {
      const empId = readSession(req.headers.cookie);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return send(403, "text/plain", "Manager or admin only");
      // Reports are ADMIN work (owner-rep 2026-07-29); a manager only gets in
      // if an admin flipped the "Managers can see Reports" switch (Q65).
      if (me.role === "manager") {
        const [tog] = await db(`feature_toggle?select=enabled&key=eq.manager_reports`);
        if (!tog || !tog.enabled)
          return send(403, "text/plain", "Reports are admin-only right now. An admin can share them from the console — Features, 'Managers can see Reports'.");
      }
      const days = [7, 30, 90, 365].includes(Number(url.searchParams.get("days")))
        ? Number(url.searchParams.get("days")) : 30;
      const data = await reportData(days);
      if (url.pathname === "/reports.csv") {
        const which = ["products", "labor", "cabs"].includes(url.searchParams.get("which"))
          ? url.searchParams.get("which") : "cabs";
        res.writeHead(200, { "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="shopboard-${which}-${days}d.csv"` });
        return res.end(reportCsv(which, data));
      }
      return send(200, "text/html; charset=utf-8", reportsPage(data, me.role === "admin"));
    }

    // TECH FINISH (file 11, builder half): every non-background step complete
    // -> final note -> AWAITING INSPECTION. Any clocked-on tech may send it
    // (Q104); the paused clock there is management's bottleneck (Q53/C11).
    if (url.pathname === "/api/build/finish" && req.method === "POST") {
      const empId = readSession(req.headers.cookie);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [lastCk] = await db(`clock_event?select=kind&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (!lastCk || lastCk.kind !== "clock_in")
        return json(403, { ok: false, error: "Clock in first" });
      const { build_id, note, claimed_at } = await body(req);
      const [b] = await db(`build?select=id,state,order_number&id=eq.${build_id}`);
      // Accepts ACTIVE (first finish) and REWORK (resubmit after fixes, file 18).
      if (!b || (b.state !== "active" && b.state !== "rework"))
        return json(400, { ok: false, error: "Cab is not in a finishable state" });
      const open = await db(`task?select=id&build_id=eq.${build_id}&is_background=is.false&state=neq.complete&limit=1`);
      if (open.length) return json(400, { ok: false, error: "There are still open steps on this cab" });
      await db(`build?id=eq.${build_id}`, { method: "PATCH",
        body: JSON.stringify({ state: "awaiting_inspection", final_note: note || null }) });
      logEvent("build.finish", empId, { build_id, order_number: b.order_number, note: note || "", from_state: b.state, at: claimed_at });
      return json(200, { ok: true });
    }

    // MANAGER CLOCK-OUT (risk sweep 2026-07-28): the same-day correction tool
    // for a forgotten clock-out — manager/admin taps the person out from the
    // cockpit's "On the clock" list. Audited: who forced it is in the event.
    if (url.pathname === "/api/clock/force-out" && req.method === "POST") {
      const empId = readSession(req.headers.cookie);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { employee_id } = await body(req);
      const [lastCk] = await db(`clock_event?select=kind,line_id&employee_id=eq.${employee_id}&order=claimed_at.desc&limit=1`);
      if (!lastCk || lastCk.kind !== "clock_in")
        return json(400, { ok: false, error: "They're not on the clock" });
      await db("clock_event", { method: "POST", body: JSON.stringify({
        employee_id, line_id: lastCk.line_id, kind: "clock_out_auto",
        reason: "Manager clock-out", claimed_at: new Date().toISOString() }) });
      logEvent("clock.force_out", empId, { employee_id, cause: "manager" });
      return json(200, { ok: true });
    }

    // REWORK ASSIGNMENT (files 11/18, manager half of a FAILED inspection):
    // awaiting_inspection -> rework, manager-only, reason-coded (Q77 list)
    // with a note and a TIME FRAME in hours. A fix task (day_no 0, source
    // 'rework', 0 standard hours — rework hours live in their OWN bucket,
    // Q85, so pace/earned never gains from fix work) lands on the cab's
    // screen. The admin notification rides with the notification block
    // (Q106 sandbox ships with the first notification code — logged for now).
    if (url.pathname === "/api/build/rework" && req.method === "POST") {
      const empId = readSession(req.headers.cookie);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { build_id, reason, note, hours, claimed_at } = await body(req);
      if (!reason) return json(400, { ok: false, error: "Pick a reason" });
      const [b] = await db(`build?select=id,state,order_number&id=eq.${build_id}`);
      if (!b || b.state !== "awaiting_inspection")
        return json(400, { ok: false, error: "Only a cab awaiting inspection can be sent back" });
      const when = claimed_at || new Date().toISOString();
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({
        state: "rework", rework_reason: reason, rework_note: note || null,
        rework_hours: Number(hours) || null, rework_assigned_at: when }) });
      const priors = await db(`task?select=id&build_id=eq.${build_id}&source=eq.rework`);
      await db("task", { method: "POST", body: JSON.stringify({
        build_id, display_no: `R${priors.length + 1}`,
        name: `Fix: ${reason}${note ? ` — ${note}` : ""}`,
        day_no: 0, man_hours: 0, is_background: false,
        source: "rework", state: "not_started", sort_order: 1000 + priors.length }) });
      logEvent("build.rework_assigned", empId, { build_id, order_number: b.order_number,
        reason, note: note || "", hours: Number(hours) || null, at: when });
      return json(200, { ok: true });
    }

    // SIGN-OFF: manager completes the cab (file 11 gate, manager half).
    // Normal path = from AWAITING INSPECTION; direct from active allowed too
    // (manager judgment call — both are logged with the state they came from).
    if (url.pathname === "/api/build/complete" && req.method === "POST") {
      const empId = readSession(req.headers.cookie);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { build_id, claimed_at } = await body(req);
      const [b] = await db(`build?select=id,state,order_number&id=eq.${build_id}`);
      if (!b || (b.state !== "active" && b.state !== "awaiting_inspection"))
        return json(400, { ok: false, error: "Cab is not active or awaiting inspection" });
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({ state: "production_complete" }) });
      logEvent("build.production_complete", empId, { build_id, order_number: b.order_number, from_state: b.state, signed_off_at: claimed_at });
      return json(200, { ok: true });
    }

    // START NEXT BUILD: upcoming -> active, and the Q97 FREEZE happens here —
    // the template's steps are copied into this cab's own task list, so later
    // template edits never rewrite a started cab's checklist.
    if (url.pathname === "/api/build/start" && req.method === "POST") {
      const empId = readSession(req.headers.cookie);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || (me.role !== "manager" && me.role !== "admin"))
        return json(403, { ok: false, error: "Manager or admin only" });
      const { build_id, claimed_at } = await body(req);
      const [b] = await db(`build?select=id,state,line_id,part_number,order_number&id=eq.${build_id}`);
      if (!b || b.state !== "upcoming") return json(400, { ok: false, error: "Cab is not waiting to start" });
      const clash = await db(`build?select=id&line_id=eq.${b.line_id}&state=eq.active`);
      if (clash.length) return json(400, { ok: false, error: "That line already has an active cab" }); // one-per-line
      const startedAt = claimed_at || new Date().toISOString();
      await db(`build?id=eq.${build_id}`, { method: "PATCH", body: JSON.stringify({ state: "active", started_at: startedAt }) });
      const [prod] = await db(`product?select=template_id&part_number=eq.${encodeURIComponent(b.part_number)}`);
      const steps = await db(`step_template?select=display_no,name,day_no,man_hours,is_background,sort_order&template_id=eq.${prod.template_id}&retired=is.false&order=sort_order`);
      for (const st of steps)   // frozen copy (Q97) — sequential inserts keep it simple at this scale
        await db("task", { method: "POST", body: JSON.stringify({ build_id, display_no: st.display_no,
          name: st.name, day_no: st.day_no, man_hours: st.man_hours, is_background: st.is_background,
          source: "template", state: "not_started", sort_order: st.sort_order }) });
      logEvent("build.start", empId, { build_id, order_number: b.order_number, tasks_frozen: steps.length });
      return json(200, { ok: true });
    }

    // ---------- ADMIN CONSOLE (file 21) — admin role only ----------
    // One shared gate for the page + its three APIs.
    const requireAdmin = async () => {
      const empId = readSession(req.headers.cookie);
      if (!empId) return [null, json(401, { ok: false, error: "Signed out — sign in again" })];
      const [me] = await db(`employee?select=id,role&id=eq.${empId}`);
      if (!me || me.role !== "admin") return [null, json(403, { ok: false, error: "Admin only" })];
      return [empId, null];
    };

    if (url.pathname === "/admin") {
      const empId = readSession(req.headers.cookie);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [me] = await db(`employee?select=role&id=eq.${empId}`);
      if (!me || me.role !== "admin") { res.writeHead(302, { Location: "/home" }); return res.end(); }
      const emps = await db("employee?select=id,first_name,last_name,role,department,lines,active,pin_hash&order=active.desc,first_name");
      const tmpls = await db("build_template?select=id,family&order=family");
      const tplId = url.searchParams.get("tpl") || (tmpls[0] || {}).id;
      const steps = tplId ? await db(`step_template?select=id,display_no,name,day_no,man_hours,is_background&template_id=eq.${tplId}&retired=is.false&order=sort_order`) : [];
      const toggles = await db("feature_toggle?select=key,enabled&order=key");
      return send(200, "text/html; charset=utf-8", adminPage(emps, tmpls, tplId, steps, toggles));
    }

    // PEOPLE: department / role / usual lines / active + the C18 PIN reset.
    if (url.pathname === "/api/admin/employee" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const { id, department, role, lines, active, reset_pin } = await body(req);
      if (!id) return json(400, { ok: false, error: "Missing employee" });
      if (reset_pin) {
        await db(`employee?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ pin_hash: null }) });
        logEvent("pin.reset", adminId, { employee_id: id }); // next login = Q68 choose-your-PIN
        return json(200, { ok: true });
      }
      const patch = {};
      if (department !== undefined) { if (!DEPTS.includes(department)) return json(400, { ok: false, error: "Unknown department" }); patch.department = department; }
      if (role !== undefined) { if (!ROLES.includes(role)) return json(400, { ok: false, error: "Unknown role" }); patch.role = role; }
      if (lines !== undefined) patch.lines = lines;
      if (active !== undefined) patch.active = Boolean(active);
      await db(`employee?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      // Deactivating someone still ON the clock used to leave their interval
      // open forever (risk sweep) — close it at the moment of deactivation.
      if (active === false) {
        const [lastCk] = await db(`clock_event?select=kind,line_id&employee_id=eq.${id}&order=claimed_at.desc&limit=1`);
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

    // BUILD STEPS: the Q97 editor. Template edits shape FUTURE cabs only —
    // started cabs keep the frozen copy made at start. Delete = retire (history kept).
    if (url.pathname === "/api/admin/step" && req.method === "POST") {
      const [adminId, fail] = await requireAdmin(); if (fail) return fail;
      const p = await body(req);
      if (p.action === "update") {
        const patch = { display_no: String(p.display_no || ""), name: String(p.name || ""),
          day_no: Number(p.day_no) || 1, man_hours: Number(p.man_hours) || 0 };
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
        await db(`step_template?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ retired: true }) });
        logEvent("template.step_retired", adminId, { step_id: p.id });
        return json(200, { ok: true });
      }
      if (p.action === "add") {
        if (!p.name) return json(400, { ok: false, error: "A step needs a name" });
        const [last] = await db(`step_template?select=sort_order&template_id=eq.${p.template_id}&order=sort_order.desc&limit=1`);
        const [row] = await db("step_template", { method: "POST", body: JSON.stringify({
          template_id: p.template_id, display_no: String(p.display_no || ""), name: String(p.name),
          day_no: Number(p.day_no) || 1, man_hours: Number(p.man_hours) || 0,
          is_background: false, sort_order: ((last || {}).sort_order || 0) + 1 }) });
        logEvent("template.step_added", adminId, { step_id: row ? row.id : null, template_id: p.template_id, name: p.name });
        return json(200, { ok: true });
      }
      return json(400, { ok: false, error: "Unknown action" });
    }

    // FEATURES: the Q65 switches. Flip is stamped with who + when and event-logged.
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
    if (url.pathname === "/api/photo/upload" && req.method === "POST") {
      const empId = readSession(req.headers.cookie);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [lastCk] = await db(`clock_event?select=kind&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (!lastCk || lastCk.kind !== "clock_in") return json(403, { ok: false, error: "Clock in first" });
      const build_id = url.searchParams.get("build_id");
      const ctype = String(req.headers["content-type"] || "");
      if (!build_id) return json(400, { ok: false, error: "Missing build" });
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
      const ext = ctype.includes("png") ? "png" : ctype.includes("webp") ? "webp" : "jpg";
      const path = `${build_id}/${Date.now()}.${ext}`;
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/cab-photos/${path}`, {
        method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": ctype },
        body: buf });
      if (!up.ok) { console.error("photo store failed:", up.status, await up.text()); return json(500, { ok: false, error: "Could not store the photo" }); }
      const [row] = await db("build_photo", { method: "POST", body: JSON.stringify({
        build_id, task_id, uploaded_by: empId, storage_path: path, kind: task_id ? "task" : "finish" }) });
      logEvent("photo.added", empId, { build_id, task_id, photo_id: row ? row.id : null, bytes: buf.length });
      return json(200, { ok: true, id: row ? row.id : null });
    }

    // PER-TASK NOTE (file 11): a written note attached to one step —
    // documents a problem or the work right where it happened. Append-only
    // from the floor; who wrote it is recorded.
    if (url.pathname === "/api/task/note" && req.method === "POST") {
      const empId = readSession(req.headers.cookie);
      if (!empId) return json(401, { ok: false, error: "Signed out" });
      const [lastCk] = await db(`clock_event?select=kind&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (!lastCk || lastCk.kind !== "clock_in") return json(403, { ok: false, error: "Clock in first" });
      const { task_id, note, claimed_at } = await body(req);
      if (!task_id || !note || !String(note).trim()) return json(400, { ok: false, error: "Write the note first" });
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
    if (url.pathname.startsWith("/photo/")) {
      const empId = readSession(req.headers.cookie);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const pid = url.pathname.slice("/photo/".length);
      const [p] = await db(`build_photo?select=storage_path&id=eq.${pid}`);
      if (!p) return send(404, "text/plain", "Not found");
      const f = await fetch(`${SUPABASE_URL}/storage/v1/object/cab-photos/${p.storage_path}`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
      if (!f.ok) return send(404, "text/plain", "Not found");
      const buf = Buffer.from(await f.arrayBuffer());
      res.writeHead(200, { "content-type": f.headers.get("content-type") || "image/jpeg", "cache-control": "private, max-age=3600" });
      return res.end(buf);
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
      const orderNo = parseOk && parsed && typeof parsed === "object"
        ? String(parsed["Order #"] ?? parsed.order_number ?? parsed.OrderNumber ?? parsed.order ?? "") : "";
      const [row] = await db("coyote_intake", { method: "POST",
        body: JSON.stringify({ order_number: orderNo || null, payload: parseOk ? parsed : null,
          raw_text: parseOk ? null : raw, parse_ok: parseOk }) });
      logEvent("coyote.order_received", null, { intake_id: row ? row.id : null,
        order_number: orderNo, parse_ok: parseOk, bytes: raw.length });
      return json(200, { ok: true });
    }

    if (url.pathname === "/logout") {
      const empId = readSession(req.headers.cookie);
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
}).listen(PORT, () => console.log(`Shop Board v17 on :${PORT} (db ${DB_READY ? "connected" : "NOT configured"})`));
