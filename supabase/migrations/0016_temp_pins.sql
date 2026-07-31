-- 0016: Q114 — TEMPORARY PASSCODES.
-- Closes the Q68 open-onboarding hole: a name with no PIN could have its
-- PIN chosen by whoever tapped it first on the public site. The SERVER
-- generates the unique temp codes (it owns the scrypt hashing) — this
-- migration only adds the two columns the flow needs.
-- temp_pin: the plain temporary code, kept ONLY until the person picks
-- their own PIN (launch-day printed sheet + texts read from it, on the
-- owner-rep's command per Q106). must_change_pin: parks a temp-code
-- login at the change-PIN screen.
alter table employee add column if not exists temp_pin text;
alter table employee add column if not exists must_change_pin boolean not null default false;
