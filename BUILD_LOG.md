# BUILD_LOG - Shop Board
Chronological build journal. Every work chunk gets an entry (Q99). Newest first.

## 2026-07-24 - GO - Stage 1 begins
- Owner-rep approved Build Spec v1.0 + SPEC-DEFAULTs and said GO.
- Repo created via GitHub web (cloud sandbox cannot push directly - see design folder 02 log).
- Files: package.json, server.js (zero-dep shell + /health for the Q74 watchdog),
supabase/migrations/0001_core.sql (core schema + append-only event log), docs/EVENT_TAXONOMY.md.
- NEXT: run 0001 in Supabase SQL editor, deploy to Railway, custom domain + GoDaddy CNAME.
- Standing note: build blocks should run as 'On your computer' tasks so pushes/deploys are direct.
