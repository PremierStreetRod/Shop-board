// Shop Board - Stage 1 shell server. ZERO dependencies on purpose:
// proves the pipeline (GitHub -> Railway -> shopboard.premierstreetrod.com) with nothing to break.
// The real app framework lands in Stage 3 when screens begin (spec section 7).
const http = require("http");
const PORT = process.env.PORT || 3000;

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><!-- Q48: never crawlable -->
<title>Shop Board - Premier Street Rod</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#111;color:#fff;display:grid;place-items:center;height:100vh;text-align:center}
.logo{font-size:clamp(2rem,8vw,4rem);font-weight:800;letter-spacing:.05em}
.red{color:#C8102E}.sub{opacity:.6;margin-top:.75rem}
</style></head>
<body><div>
<div class="logo">SHOP <span class="red">BOARD</span></div>
<div class="sub">Premier Street Rod &mdash; under construction, Stage 1</div>
</div></body></html>`;

http.createServer((req, res) => {
if (req.url === "/health") { // Q74: the external watchdog pings this
res.writeHead(200, {"content-type":"application/json"});
return res.end(JSON.stringify({ ok: true, at: new Date().toISOString() }));
}
res.writeHead(200, {"content-type":"text/html; charset=utf-8"});
res.end(page);
}).listen(PORT, () => console.log("Shop Board shell on :" + PORT));
