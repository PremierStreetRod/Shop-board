-- ============================================================
-- Shop Board — Migration 0003: full roster on the grid + TEST data
-- Owner-rep directive 2026-07-25 (Q95 AMENDED): ALL employees and
-- owners appear on the login screen. Rob + Ross specifically can
-- log in and watch the build. Warehouse / Body / Build / Accounting
-- names are VISIBLE but their departments aren't functional yet —
-- they get a "watcher" home, not clock-in (server enforces this).
-- Also: fake TEST- builds so the board and task screens have data
-- to run against during the build phase (purged at cutover, Q87).
-- RAN against shopboard-prod 2026-07-25. Post-run fix also applied:
-- 55-59 'Prep panels' 2.5 -> 3.0 (file 34 Day-1 sum slip; template
-- + TEST task copy corrected; all six families verify exact).
-- ============================================================

alter table employee add column if not exists department text;
update employee set department = 'Production' where role in ('production','manager');
update employee set department = 'Admin' where email = 'marketing@premierstreetrod.com';

insert into employee (first_name, last_name, role, mobile, email, lines, department) values
  ('Ross','Logsdon','admin','360-608-7360','ross@premierstreetrod.com','{}','Owner'),
  ('Rob','Logsdon','admin','928-846-9655','rob@premierstreetrod.com','{}','Owner'),
  ('Kerry','Logsdon','admin','360-607-9617','kerry@premierstreetrod.com','{}','Owner'),
  ('Eric','Figueroa','production','442-214-7178','figueroa.eric.01998@gmail.com','{}','Warehouse'),
  ('Jonathan','Albert','production','714-884-9914','purchasing@premierstreetrod.com','{}','Warehouse'),
  ('Scott','Locatis','production','928-230-1054','butch@premierstreetrod.com','{}','Warehouse'),
  ('Evan','Tribbey','production','661-433-3695','rd.tribbey@gmail.com','{}','Build'),
  ('Jonathan','Thomas','production','928-486-5004','moparjon65@yahoo.com','{}','Build'),
  ('Isaac','Wiles','production','206-276-5025',null,'{}','Body Shop'),
  ('Jason','Deering','production','802-349-0320',null,'{}','Body Shop'),
  ('Kailey','Conway','production','714-812-5175','ap@premierstreetrod.com','{}','Accounting');

-- FAKE TEST BUILDS (order # prefix TEST- = purge key at cutover)
insert into build (order_number, coyote_root, line_id, part_number, cab_number, state,
                   customer_name, destination, invoice_note, note_flagged, promised_finish, started_at) values
  ('TEST-23701','TEST-23701',1,'PSR-6466','64-1','active','TEST — Sample Customer A','CA',null,false, current_date + 4, now() - interval '2 days'),
  ('TEST-23702','TEST-23702',2,'PSR-5557-BW','55-1','active','TEST — Sample Customer B','TX',null,false, current_date + 5, now() - interval '3 days'),
  ('TEST-23703','TEST-23703',3,'PSR-6772','67-1','active','TEST — Sample Customer C','PICKUP','Customer wants shaved firewall — CONFIRM before day 2',true, current_date + 4, now() - interval '1 day'),
  ('TEST-23704','TEST-23704',4,'PSR-6972-BLZR','BZ-1','active','TEST — Sample Customer D','FL',null,false, current_date + 5, now() - interval '1 day'),
  ('TEST-23705','TEST-23705',3,'PSR-6772','67-2','upcoming','TEST — Sample Customer E','AZ',null,false, null, null);

-- Frozen task lists for the ACTIVE test builds (Q97).
insert into task (build_id, display_no, name, day_no, man_hours, is_background, source, state, sort_order)
select b.id, st.display_no, st.name, st.day_no, st.man_hours, st.is_background, 'template', 'not_started', st.sort_order
from build b
join product p on p.part_number = b.part_number
join step_template st on st.template_id = p.template_id
where b.order_number like 'TEST-%' and b.state = 'active' and st.retired = false;

-- Believable progress on the older cabs.
update task t set state='complete', completed_at = now() - interval '1 day'
from build b where t.build_id = b.id and b.order_number = 'TEST-23701' and t.day_no <= 2 and not t.is_background;
update task t set state='in_progress', started_at = now() - interval '2 hours'
from build b where t.build_id = b.id and b.order_number = 'TEST-23701' and t.day_no = 3
  and t.sort_order = (select min(t2.sort_order) from task t2 where t2.build_id = b.id and t2.day_no = 3);
update task t set state='complete', completed_at = now() - interval '1 day'
from build b where t.build_id = b.id and b.order_number = 'TEST-23702' and t.day_no <= 3 and not t.is_background;
update task t set state='complete', completed_at = now() - interval '3 hours'
from build b where t.build_id = b.id and b.order_number = 'TEST-23703' and t.day_no <= 1 and not t.is_background;

-- Post-run correction (2026-07-25): file-34 Day-1 drafting slip.
update step_template st set man_hours = 3.0 from build_template bt
  where st.template_id = bt.id and bt.family='55-59' and st.display_no='3';
update task t set man_hours = 3.0 from build b
  where t.build_id = b.id and b.order_number='TEST-23702' and t.display_no='3';
