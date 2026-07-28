# Event Taxonomy — the append-only log's vocabulary (Stage-1 artifact, spec §3/audit C21)

Every action writes exactly one of these. Reports derive ONLY from this log. Format: event_type — payload keys — cites.

**RECONCILED 2026-07-28 (Sonnet, Q99 resume-protocol verify pass, block 14).** This doc had drifted since Stage 1 — it still listed the aspirational GO-day names (task.completed, coyote.received, toggle.changed, step.combined...) instead of what server.js v14 actually writes. Below, "LIVE" is grep-confirmed against every `logEvent(...)` call site in server.js AND cross-checked against distinct event_type rows in the live event_log table (20 of 23 have fired at least once as of this pass; task.undo is wired but nobody has tapped undo live yet). "PLANNED" is everything from the original Stage-1 list that isn't built yet — kept here so the roadmap isn't lost, not because it's real today. **Keep this file honest going forward (Q98): update it in the same commit whenever a new logEvent() call is added,** or it drifts again.

## LIVE in server.js v14 (confirmed 2026-07-28)

### Clock & presence
- employee.login — {} or {first_login:true} — name-grid sign-in (Q90)
- employee.logout — {} — clock-out / session end
- pin.set — {} — first-login choose-your-PIN (Q68)
- pin.fail — {} — wrong PIN attempt (feeds C17 lockout)
- pin.reset — {employee_id} — manager/admin reset (C18)
- clock.in — {line_id} — Q103-1
- clock.out — {reason, kind} — Q42/Q88 reason-coded

### Tasks
- task.start — {task_id, build_id, display_no, from, to} — 1st tap (Q45)
- task.complete — {task_id, build_id, display_no, from, to} — 2nd tap
- task.undo — {task_id, build_id, display_no, from, to} — 5-second undo toast (wired, unfired live as of 2026-07-28)
- task.note_added — {task_id, build_id, display_no, note_id, at} — file 11

### Build lifecycle
- build.start — {build_id, order_number} — cab pulled from queue (Q97 freeze)
- build.finish — {build_id, order_number} — tech's final note → awaiting_inspection (file 11)
- build.production_complete — {build_id, order_number} — manager/admin sign-off; from_state logged
- build.rework_assigned — {build_id, order_number} — cockpit "send back" (Q77 reason + time frame)

### Photos
- photo.added — {build_id, task_id, photo_id, bytes} — finish-gate or per-task photo (kind: finish/task)

### Coyote intake
- coyote.order_received — {intake_id, order_number, parse_ok, bytes} — raw landing-zone insert (file 28 opt 1)

### Admin console
- employee.updated — {employee_id, changes} — roster edit (dept/role/lines/deactivate, Q70)
- template.step_added — {step_id, template_id, name} — Q97 step editor
- template.step_moved — {step_id, dir} — Q97 reorder
- template.step_retired — {step_id} — Q97 retire-not-delete
- template.step_updated — {step_id, changes} — Q97 rename/renumber/hours edit
- toggle.flipped — {key, enabled} — Q65 feature switch

## PLANNED — not yet built (Stage-1 spec names; will get real event_type strings when their features ship — do NOT assume these exist in the log today)
- build.created / build.split — Q100 Queued trigger, auto-split (Q13) — ships with the Coyote mapping job
- build.state_changed / build.day_advanced / build.color_changed — full state-machine + time-engine events (Q57, C14/15)
- build.inspection_requested / build.fix_job_opened / build.cancelled / build.converted_stock — file 18 states not yet wired beyond finish/rework/complete
- coyote.change_applied / coyote.needs_setup / coyote.needs_split / coyote.sync_failing — Coyote mapping job (waits on the developer's real posts + the stronger model per file 36)
- coverage.lost / coverage.restored — No-coverage pause (Q41) — ships with the full time engine
- pin.lockout — {employee_id} — per-person 5-try lockout (C17); currently pin.fail accumulates but no lockout event fires yet
- standard.edited — Q6/Q97 standard-time change-impact preview
- timeoff.requested / timeoff.decided — Q92
- override.summary_item — weekly manager-override digest (Q84)
- notify.sent / notify.acked — ships WITH the Q106-sandboxed notification layer (reserved-lane build)
- day.started / day.ended — Q7 Start/End-the-day switch (Q83 day switch — reserved-lane build)
- watchdog.app_down / watchdog.heartbeat_lost — Q74 external uptime watchdog
