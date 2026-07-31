-- 0018: Q116 — PACE EARLY-WARNING PUSHES.
-- A background patrol pushes (Q106-sandboxed) the moment a cab crosses INTO
-- red on the board. pace_alert_color remembers the last colour we saw per
-- active cab so the alert is edge-triggered (one push per crossing, silent
-- while it stays red, re-arms on recovery) and survives a redeploy. The
-- monitor is gated by a pace_warnings feature toggle (seeded ON; delivery is
-- ALSO held by the Q106 sandbox until cutover).
alter table build add column if not exists pace_alert_color text;
insert into feature_toggle (key, enabled)
select 'pace_warnings', true
 where not exists (select 1 from feature_toggle where key = 'pace_warnings');
