-- ============================================================
-- 0010: MIKE'S READ-BACK APPLIED (signed sheets 7/29/26) + the
-- owner-rep step combines, decided 2026-07-29.
--
-- What this does, in plain English:
--   1. COMBINES (fewer phone taps, same hours — owner-rep call):
--      · Receive + Organize + Prep panel kit -> ONE step, all six cabs
--      · Fit latches + Hang LH + Hang RH -> ONE "Hang doors" step,
--        every cab with doors (hours summed; doors-prep stays its own)
--      · Blazer: rocker boxes + plates -> one step; tailgate hang +
--        latch -> one step
--      · 64-66: inner + outer cowl -> one step
--   2. MIKE'S RENUMBERING & REORDERING, per his signed sheets:
--      days all HOLD as printed (his instruction via owner-rep);
--      steps inside each day run in his marked order; numbering is
--      clean 1..N per cab with no gaps and no starred provisionals.
--      The 64-66 "28*" mystery step = Set & square A-pillars, Day 1.
--   3. RENAMES: "on jig" -> "on base" for the floor-pan step (his
--      cross-outs on five sheets); Blazer "Fit toe board &
--      transmission tunnel" -> "Fit transmission tunnel" (toe board
--      absorbed, his cross-out).
--
-- Template edits shape FUTURE cabs only (Q97) — frozen task lists
-- on cabs already started are untouched. Combined-away rows are
-- RETIRED, never deleted (Q97 history rule). Total standard hours
-- per cab are unchanged; only step boundaries moved.
-- Q107 note: 47-53 "Check window openings" stays 1.75 h for now —
-- Mike wants more; the first live weeks (Q96 calibration) will set it.
-- ============================================================

-- ---------- 47-53 (25 -> 21 steps) ----------
update step_template st set retired = true
from build_template bt
where bt.family = '47-53' and st.template_id = bt.id and st.retired = false
  and st.display_no in ('2','3','16','18');

update step_template st
set display_no = v.new_no, sort_order = v.srt,
    name = coalesce(v.nm, st.name),
    man_hours = coalesce(v.hrs, st.man_hours)
from build_template bt,
(values
  ('1'::text,'1'::text,1,'Receive, organize & prep panel kit'::text,3.5::numeric),
  ('5','2',2,null,null),
  ('4','3',3,'Set cab floor pan on base',null),
  ('6','4',4,null,null),
  ('7','5',5,null,null),
  ('8','6',6,null,null),
  ('9','7',7,null,null),
  ('10','8',8,null,null),
  ('13','9',9,null,null),
  ('11','10',10,null,null),
  ('12','11',11,null,null),
  ('14','12',12,null,null),
  ('15','13',13,null,null),
  ('17','14',14,'Hang doors — latches, strikers, gap & align',4.25),
  ('19','15',15,null,null),
  ('20','16',16,null,null),
  ('21','17',17,null,null),
  ('25','18',18,null,null),
  ('22','19',19,null,null),
  ('23','20',20,null,null),
  ('24','21',21,null,null)
) as v(old_no,new_no,srt,nm,hrs)
where bt.family = '47-53' and st.template_id = bt.id and st.retired = false
  and st.display_no = v.old_no;

-- ---------- 55-59 (29 -> 25 steps) ----------
update step_template st set retired = true
from build_template bt
where bt.family = '55-59' and st.template_id = bt.id and st.retired = false
  and st.display_no in ('2','3','22','24');

update step_template st
set display_no = v.new_no, sort_order = v.srt,
    name = coalesce(v.nm, st.name),
    man_hours = coalesce(v.hrs, st.man_hours)
from build_template bt,
(values
  ('1'::text,'1'::text,1,'Receive, organize & prep panel kit'::text,6.0::numeric),
  ('4','2',2,'Set cab floor pan on base',null),
  ('5','3',3,null,null),
  ('6','4',4,null,null),
  ('7','5',5,null,null),
  ('8','6',6,null,null),
  ('9','7',7,null,null),
  ('10','8',8,null,null),
  ('11','9',9,null,null),
  ('12','10',10,null,null),
  ('13','11',11,null,null),
  ('14','12',12,null,null),
  ('15','13',13,null,null),
  ('16','14',14,null,null),
  ('17','15',15,null,null),
  ('18','16',16,null,null),
  ('29*','17',17,null,null),
  ('19','18',18,null,null),
  ('20','19',19,null,null),
  ('21','20',20,null,null),
  ('23','21',21,'Hang doors — latches, strikers, gap & align',8.5),
  ('25','22',22,null,null),
  ('26','23',23,null,null),
  ('27','24',24,null,null),
  ('28','25',25,null,null)
) as v(old_no,new_no,srt,nm,hrs)
where bt.family = '55-59' and st.template_id = bt.id and st.retired = false
  and st.display_no = v.old_no;

-- ---------- 64-66 (29 -> 24 steps) ----------
update step_template st set retired = true
from build_template bt
where bt.family = '64-66' and st.template_id = bt.id and st.retired = false
  and st.display_no in ('2','3','10','21','23');

update step_template st
set display_no = v.new_no, sort_order = v.srt,
    name = coalesce(v.nm, st.name),
    man_hours = coalesce(v.hrs, st.man_hours)
from build_template bt,
(values
  ('1'::text,'1'::text,1,'Receive, organize & prep panel kit'::text,3.5::numeric),
  ('4','2',2,'Set cab floor pan on base',null),
  ('5','3',3,null,null),
  ('28*','4',4,null,null),
  ('6','5',5,null,null),
  ('7','6',6,null,null),
  ('8','7',7,null,null),
  ('9','8',8,'Fit cowl — inner & outer',3.0),
  ('11','9',9,null,null),
  ('12','10',10,null,null),
  ('13','11',11,null,null),
  ('14','12',12,null,null),
  ('15','13',13,null,null),
  ('18','14',14,null,null),
  ('16','15',15,null,null),
  ('17','16',16,null,null),
  ('19','17',17,null,null),
  ('29*','18',18,null,null),
  ('20','19',19,null,null),
  ('22','20',20,'Hang doors — latches, strikers, gap & align',4.5),
  ('24','21',21,null,null),
  ('25','22',22,null,null),
  ('26','23',23,null,null),
  ('27','24',24,null,null)
) as v(old_no,new_no,srt,nm,hrs)
where bt.family = '64-66' and st.template_id = bt.id and st.retired = false
  and st.display_no = v.old_no;

-- ---------- 67-72 Chevy (28 -> 24 steps) ----------
update step_template st set retired = true
from build_template bt
where bt.family = '67-72 Chevy' and st.template_id = bt.id and st.retired = false
  and st.display_no in ('2','3','29*','23');

update step_template st
set display_no = v.new_no, sort_order = v.srt,
    name = coalesce(v.nm, st.name),
    man_hours = coalesce(v.hrs, st.man_hours)
from build_template bt,
(values
  ('1'::text,'1'::text,1,'Receive, organize & prep panel kit'::text,5.5::numeric),
  ('4','2',2,'Set cab floor pan on base',null),
  ('5','3',3,null,null),
  ('6','4',4,null,null),
  ('8','5',5,null,null),
  ('7','6',6,null,null),
  ('9','7',7,null,null),
  ('11','8',8,null,null),
  ('12','9',9,null,null),
  ('10','10',10,null,null),
  ('13','11',11,null,null),
  ('14','12',12,null,null),
  ('15','13',13,null,null),
  ('16','14',14,null,null),
  ('19','15',15,null,null),
  ('20','16',16,null,null),
  ('17','17',17,null,null),
  ('18','18',18,null,null),
  ('21','19',19,null,null),
  ('22','20',20,null,null),
  ('24','21',21,'Hang doors — latches, strikers, gap & align',10.0),
  ('25','22',22,null,null),
  ('26','23',23,null,null),
  ('27','24',24,null,null)
) as v(old_no,new_no,srt,nm,hrs)
where bt.family = '67-72 Chevy' and st.template_id = bt.id and st.retired = false
  and st.display_no = v.old_no;

-- ---------- 67-72 Ford (24 -> 20 steps) ----------
update step_template st set retired = true
from build_template bt
where bt.family = '67-72 Ford' and st.template_id = bt.id and st.retired = false
  and st.display_no in ('2','3','19','21');

update step_template st
set display_no = v.new_no, sort_order = v.srt,
    name = coalesce(v.nm, st.name),
    man_hours = coalesce(v.hrs, st.man_hours)
from build_template bt,
(values
  ('1'::text,'1'::text,1,'Receive, organize & prep panel kit'::text,3.5::numeric),
  ('4','2',2,'Set cab floor pan on base',null),
  ('5','3',3,null,null),
  ('6','4',4,null,null),
  ('7','5',5,null,null),
  ('8','6',6,null,null),
  ('9','7',7,null,null),
  ('10','8',8,null,null),
  ('11','9',9,null,null),
  ('12','10',10,null,null),
  ('13','11',11,null,null),
  ('14','12',12,null,null),
  ('15','13',13,null,null),
  ('16','14',14,null,null),
  ('18','15',15,null,null),
  ('20','16',16,'Hang doors — latches, strikers, gap & align',7.5),
  ('22','17',17,null,null),
  ('23','18',18,null,null),
  ('24','19',19,null,null),
  ('25','20',20,null,null)
) as v(old_no,new_no,srt,nm,hrs)
where bt.family = '67-72 Ford' and st.template_id = bt.id and st.retired = false
  and st.display_no = v.old_no;

-- ---------- 69-72 Blazer (30 -> 24 steps) ----------
update step_template st set retired = true
from build_template bt
where bt.family = '69-72 Blazer' and st.template_id = bt.id and st.retired = false
  and st.display_no in ('2','3','17','24','26','28');

update step_template st
set display_no = v.new_no, sort_order = v.srt,
    name = coalesce(v.nm, st.name),
    man_hours = coalesce(v.hrs, st.man_hours)
from build_template bt,
(values
  ('1'::text,'1'::text,1,'Receive, organize & prep panel kit'::text,5.5::numeric),
  ('4','2',2,'Set floor pan on base — level & square',null),
  ('5','3',3,'Fit transmission tunnel',null),
  ('6','4',4,null,null),
  ('7','5',5,null,null),
  ('8','6',6,null,null),
  ('9','7',7,null,null),
  ('10','8',8,null,null),
  ('11','9',9,null,null),
  ('12','10',10,null,null),
  ('13','11',11,null,null),
  ('14','12',12,null,null),
  ('15','13',13,null,null),
  ('16','14',14,'Install rocker boxes & plates',2.75),
  ('18','15',15,null,null),
  ('19','16',16,null,null),
  ('20','17',17,null,null),
  ('21','18',18,null,null),
  ('22','19',19,null,null),
  ('23','20',20,null,null),
  ('25','21',21,'Hang doors — latches, strikers, gap & align',10.0),
  ('27','22',22,'Hang tailgate — hinges, latch & adjust',4.5),
  ('29','23',23,null,null),
  ('30','24',24,null,null)
) as v(old_no,new_no,srt,nm,hrs)
where bt.family = '69-72 Blazer' and st.template_id = bt.id and st.retired = false
  and st.display_no = v.old_no;

-- ---------- Verification ----------
select bt.family,
       count(*) filter (where not st.retired) as live_steps,
       sum(st.man_hours) filter (where not st.retired) as total_hours
from step_template st join build_template bt on bt.id = st.template_id
group by bt.family order by bt.family;
