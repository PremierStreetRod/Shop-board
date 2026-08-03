-- 0021: Q92 time-off follow-up (owner-rep 2026-08-03).
-- (1) An OPTIONAL note the requester can leave with a time-off request
--     (shown to the admin in the "Time off — needs you" cockpit lane).
-- (2) The "Time-off requests" feature now ships OFF by default: flip the row
--     0020 seeded ON. An admin turns it on in Admin -> Features when ready;
--     while off, the home-screen request panel is hidden and
--     /api/timeoff/request refuses.
-- (Approval also moved to ADMIN-ONLY this same day, but that is a server.js
--  role-gate change (v35) with no schema.)

alter table time_off_request add column if not exists request_note text;

update feature_toggle set enabled = false where key = 'time_off_requests';
