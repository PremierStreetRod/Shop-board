// ============================================================
// SHOP BOARD — server.js (v5: Stage-1 screens + Stage-2 time engine v1 — pace colors live)
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

// Read a JSON request body (small, so no streaming worries).
function body(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); } });
  });
}

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
<script>
  // claimed_at rides with every tap (Q103-1: the REAL tap time governs;
  // the server separately stamps received_at). Offline queueing = later stage.
  async function act(url, payload){
    const r = await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({...payload, claimed_at:new Date().toISOString()})});
    const out = await r.json();
    if(out.ok) location.reload(); else document.getElementById("err").textContent = out.error||"Something went wrong";
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
const cabPage = (emp, build, tasks, lineName) => {
  const inRework = build.state === "rework";
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
      </button>`).join("")}`).join("")}
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
  <p style="text-align:center;margin:22px 0">
    <button class="back" id="clockout">Clock out</button> ·
    <a href="/board" style="color:#8e8e93">TV board</a> ·
    <a href="/logout" style="color:#8e8e93">Sign out</a>
  </p>
</div>
<script>
  // Two-step check-off (Q45): not_started -> in_progress -> complete.
  // Tapping a completed task backs it up one step (undo, Q90).
  const next = { not_started: "in_progress", in_progress: "complete", complete: "in_progress" };
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(".task");
    if (b) {
      const r = await fetch("/api/task/state", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: b.dataset.id, to: next[b.dataset.state],
          claimed_at: new Date().toISOString() }) });
      const out = await r.json();
      if (out.ok) location.reload();
      else document.getElementById("err").textContent = out.error || "Something went wrong";
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
      for (let i = 0; i < files.length; i++) {
        document.getElementById("upmsg").textContent = "Uploading photo " + (i + 1) + " of " + files.length + "…";
        const f = await toJpeg(files[i]);
        const up = await fetch("/api/photo/upload?build_id=" + id, { method: "POST",
          headers: { "Content-Type": f.type || "image/jpeg" }, body: f });
        const uo = await up.json();
        if (!uo.ok) throw new Error(uo.error || "Photo upload failed");
      }
      document.getElementById("upmsg").textContent = "";
      const r = await fetch("/api/build/finish", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build_id: id, note: document.getElementById("fnote").value,
          claimed_at: new Date().toISOString() }) });
      const out = await r.json();
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
const managerPage = (rows, reworkReasons = []) => `<!doctype html>
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
  <h2>Manager</h2>
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
  <h2>Admin</h2>

  <div class="panel"><h3>People</h3>
  <table><tr><th>Name</th><th>Department</th><th>Role</th><th>Usual lines</th><th></th><th></th><th></th></tr>
  ${emps.map((e) => `<tr class="${e.active ? "" : "off"}">
    <td><b>${e.first_name} ${e.last_name}</b></td>
    <td><select id="d-${e.id}">${DEPTS.map((d) => `<option ${e.department === d ? "selected" : ""}>${d}</option>`).join("")}</select></td>
    <td><select id="r-${e.id}">${ROLES.map((r) => `<option ${e.role === r ? "selected" : ""}>${r}</option>`).join("")}</select></td>
    <td><input class="ln" id="l-${e.id}" value="${(e.lines || []).join(",")}" placeholder="1,2"></td>
    <td><button class="b" onclick="saveEmp('${e.id}',this)">Save</button></td>
    <td><button class="b ${e.active ? "" : "grn"}" onclick="setActive('${e.id}',${e.active ? "false" : "true"},this)">${e.active ? "Deactivate" : "Reactivate"}</button></td>
    <td><button class="b" onclick="arm(this,()=>resetPin('${e.id}'))">${e.pin_hash ? "Reset PIN" : "No PIN yet"}</button></td>
  </tr>`).join("")}</table>
  <p style="opacity:.5;font-size:.85rem">Deactivated people vanish from the sign-in screen but their history stays. Resetting a PIN lets that person choose a new one at their next sign-in.</p>
  </div>

  <div class="panel"><h3>Build steps</h3>
  <p>${tmpls.map((t) => t.id === tplId
    ? `<b style="color:var(--red)">${t.family}</b>`
    : `<a href="/admin?tpl=${t.id}" style="color:#8e8e93">${t.family}</a>`).join(" · ")}</p>
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

  <div class="panel"><h3>Features</h3>
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
      const [emp] = await db(`employee?select=id,pin_hash&id=eq.${id}`);
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
      const [emp] = await db(`employee?select=id,pin_hash&id=eq.${id}`);
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
          const tasks = await db(`task?select=id,display_no,name,day_no,man_hours,is_background,state&build_id=eq.${build.id}&order=day_no,sort_order`);
          return send(200, "text/html; charset=utf-8", cabPage(emp, build, tasks, lineName));
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
      const [lastCk] = await db(`clock_event?select=kind&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      if (!lastCk || lastCk.kind !== "clock_in")
        return json(403, { ok: false, error: "Clock in first — task changes need you on the clock" });
      const { task_id, to, claimed_at } = await body(req);
      const [t] = await db(`task?select=id,state,build_id,display_no&id=eq.${task_id}`);
      if (!t) return json(404, { ok: false, error: "Task not found" });
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
      const events = await db(`clock_event?select=employee_id,kind,line_id,claimed_at&order=claimed_at.asc&limit=2000`);
      const emps = await db(`employee?select=id,first_name&active=is.true`);
      const builds = await db(`build?select=id,order_number,part_number,line_id,started_at,promised_finish,state,created_at,rework_reason,rework_hours,rework_assigned_at&state=in.(active,upcoming,awaiting_inspection,rework)&order=created_at`);
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
      return send(200, "text/html; charset=utf-8", managerPage(rows, reworkReasons));
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
      const ext = ctype.includes("png") ? "png" : ctype.includes("webp") ? "webp" : "jpg";
      const path = `${build_id}/${Date.now()}.${ext}`;
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/cab-photos/${path}`, {
        method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": ctype },
        body: buf });
      if (!up.ok) { console.error("photo store failed:", up.status, await up.text()); return json(500, { ok: false, error: "Could not store the photo" }); }
      const [row] = await db("build_photo", { method: "POST", body: JSON.stringify({
        build_id, uploaded_by: empId, storage_path: path, kind: "finish" }) });
      logEvent("photo.added", empId, { build_id, photo_id: row ? row.id : null, bytes: buf.length });
      return json(200, { ok: true, id: row ? row.id : null });
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
}).listen(PORT, () => console.log(`Shop Board v13 on :${PORT} (db ${DB_READY ? "connected" : "NOT configured"})`));
