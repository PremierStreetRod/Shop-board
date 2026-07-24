# Event Taxonomy - the append-only log's vocabulary (Stage-1 artifact, spec s3/audit C21)
  Every action writes exactly one of these. Reports derive ONLY from this log.
  Format: event_type - payload keys - cites.

    ## Clock & presence
    - clock.in - {line_id, build_id, via} - Q103-1 claimed_at rules
    - clock.out.lunch / clock.out.shift / clock.out.early - {reason} - Q42/Q88
    - clock.auto_out - {at_time} - 4:00 auto-stop (Q82); note-missing flag if day-end note absent
    - coverage.lost / coverage.restored - {build_id} - No-coverage pause (Q41; C12 lunch exemption)

    ## Tasks
    - task.started - {task_id} - two-step check-off (Q45)
    - task.completed - {task_id, by} - any clocked-on tech (Q104); instant+undo (Q90)
    - task.undo - {task_id, prior_state} - 5-second undo toast
    - task.note / task.photo - {task_id, note|photo_ref} - file 11; photos phone-only
    - task.adhoc_added - {source} - yellow-note manager pass (Q11)

    ## Build lifecycle (Q53 states; file 18 transitions)
    - build.created - {from, order_number} - Q100 Queued trigger
    - build.split - {parent, children[]} - auto-split (Q13)
    - build.started - {} - server-stamped start; Terms s5 fact; promise fixed (Q103-6)
    - build.state_changed - {from, to, reason}
- build.day_advanced - {day_no} - clock-driven ceil(hrs/8) (Q57)
  - build.color_changed - {from, to, behind_hours} - hysteresis before notify (C14/15)
  - build.inspection_requested / build.signed_off - {by, self_signed, admin_signed} - Q86 tags
  - build.rework_assigned / build.rework_completed - {tasks[], timeframe} - file 11
  - build.fix_job_opened - {source} - Q85
  - build.cancelled / build.converted_stock - {} - Terms s5 flow

  ## Coyote intake
  - coyote.received - {order_number, status, raw_ref} - full snapshot (Q100)
  - coyote.change_applied - {fields[], pre_start} - quiet update vs manager flag (Q13)
  - coyote.needs_setup - {unknown_option} - Q15 queue
  - coyote.needs_split - {order_number} - unsplit multi-cab guard
  - coyote.sync_failing - {since} - 1-hr admin SMS (Q74)

  ## People & admin
  - employee.updated / employee.deactivated - {} - Q70
  - pin.reset - {by, temp_issued} - C18
  - pin.lockout - {employee_id} - per-person 5-try (C17)
  - standard.edited - {step_id, old, new, affects_n} - Q6/Q97 preview; promise untouched (Q103-6)
  - step.combined / step.retired / step.added - {} - Q97 (histories sum)
  - toggle.changed - {key, enabled, by} - Q65
  - timeoff.requested / timeoff.decided - {dates, decision} - Q92
  - override.summary_item - {kind} - weekly manager-override digest to admins (Q84)

  ## Notifications & system
  - notify.sent - {event_key, channel, to} - file 16
  - notify.acked - {via} - C13 definition
  - day.started / day.ended - {by} - Q7; calendar-aware nudge if absent (Q91)
  - watchdog.app_down / watchdog.heartbeat_lost - {} - external pinger (Q74)
