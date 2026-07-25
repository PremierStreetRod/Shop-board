// ============================================================
// SHOP BOARD — server.js (Stage 1, v3: sign-in + clock-in/out + TV board skeleton)
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
          <small>${e.role === "production" ? "Production" : e.role === "manager" ? "Manager" : "Admin"}</small>
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

// THE TV BOARD skeleton (file 19) — view-only, dark, no buttons (Q-design).
// Today it shows each enabled line + who's clocked on; cab tiles, colors,
// and pace arrive with the time engine (Stage 2). Refreshes itself every 30 s.
const boardPage = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Shop Board</title>${style}
<style>
  .board{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px;padding:10px}
  .tile{background:#1c1c1e;border:1px solid #2c2c2e;border-radius:18px;padding:26px;min-height:170px}
  .tile h3{margin:0 0 6px;font-size:1.5rem}
  .idle{opacity:.45}
  .techs{font-size:1.15rem;opacity:.85;margin-top:10px}
  .stamp{position:fixed;bottom:12px;right:18px;opacity:.35;font-size:.85rem}
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
      document.getElementById("board").innerHTML = s.lines.map(l => \`
        <div class="tile \${l.techs.length ? "" : "idle"}">
          <h3>\${l.name}</h3>
          <div>\${l.techs.length ? "Working now" : "Idle line"}</div>
          <div class="techs">\${l.techs.join(" · ")}</div>
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
    if (url.pathname === "/login") {
      const emps = await db("employee?select=id,first_name,last_name,role,pin_hash&active=is.true&order=first_name");
      const view = emps.map((e) => ({ ...e, has_pin: Boolean(e.pin_hash) }));
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

    // HOME — clock in / clock out (real cab task screen = Stage 3).
    if (url.pathname === "/home") {
      const empId = readSession(req.headers.cookie);
      if (!empId) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      const [emp] = await db(`employee?select=first_name,lines&id=eq.${empId}`);
      if (!emp) { res.writeHead(302, { Location: "/login" }); return res.end(); }
      // Latest clock event tells us on/off the clock (the time engine proper
      // arrives in Stage 2 — this is just current state).
      const [last] = await db(`clock_event?select=kind,line_id&employee_id=eq.${empId}&order=claimed_at.desc&limit=1`);
      const allLines = await db(`line?select=id,name&enabled=is.true&order=id`);
      const usual = allLines.filter((l) => (emp.lines || []).includes(l.id));
      const other = allLines.filter((l) => !(emp.lines || []).includes(l.id));
      const clockedIn = last && last.kind === "clock_in";
      const lineName = clockedIn ? (allLines.find((l) => l.id === last.line_id) || {}).name || "" : "";
      const reasons = await db(`pick_list_item?select=label&list_key=eq.clock_out_reason&retired=is.false&order=sort_order`);
      return send(200, "text/html; charset=utf-8",
        homePage(emp, { clockedIn, lineName }, usual, other, reasons));
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

    // Board data: who is clocked on each line RIGHT NOW (latest event per person).
    if (url.pathname === "/api/board-state") {
      const lines = await db(`line?select=id,name&enabled=is.true&order=id`);
      const events = await db(`clock_event?select=employee_id,kind,line_id,claimed_at&order=claimed_at.desc&limit=500`);
      const emps = await db(`employee?select=id,first_name&active=is.true`);
      const nameOf = Object.fromEntries(emps.map((e) => [e.id, e.first_name]));
      const seen = new Set(); const onLine = {}; // employee's LATEST event wins
      for (const ev of events) {
        if (seen.has(ev.employee_id)) continue;
        seen.add(ev.employee_id);
        if (ev.kind === "clock_in" && nameOf[ev.employee_id])
          (onLine[ev.line_id] = onLine[ev.line_id] || []).push(nameOf[ev.employee_id]);
      }
      return json(200, { lines: lines.map((l) => ({ id: l.id, name: l.name, techs: onLine[l.id] || [] })) });
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
}).listen(PORT, () => console.log(`Shop Board v3 on :${PORT} (db ${DB_READY ? "connected" : "NOT configured"})`));
