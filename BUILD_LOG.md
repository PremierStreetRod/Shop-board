# BUILD_LOG — Shop Board
Chronological build journal. Every work chunk gets an entry (Q99). Newest first.

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
