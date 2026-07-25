-- ============================================================
-- Shop Board — Migration 0002: SEED DATA
-- Sources: file 26 (roster, Q93/Q94/Q95-hold) · file 03 (16-part
-- allowlist, Q11/SMK rule) · files 27/29/30/31/33/34 (the six
-- standards — Mike's numbered steps ONLY, Q102; man-hours Q101;
-- DRAFT-BY-CLAUDE seeds pending Q96 live calibration) · Q77 pick
-- lists · Q37 line map · Q65 rollout-posture toggles.
-- RAN against shopboard-prod 2026-07-25 — verified: 4 lines, 6
-- templates, 16 products linked, 6 employees, 165 steps, 68
-- options, 23 pick items, 9 toggles; per-family man-hour sums
-- match the standards (80/48/48/56/96/112).
-- ============================================================

-- ---------- LINES (Q37: Line 1 shared by three products) ----------
insert into line (id, name) values
  (1, 'Line 1 — 47-53 · 64-66 · 67-72 Ford'),
  (2, 'Line 2 — 55-59'),
  (3, 'Line 3 — 67-72 Chevy'),
  (4, 'Line 4 — K5 Blazer');

-- ---------- BUILD TEMPLATES (6 families; crew notes Q101) ----------
insert into build_template (family, crew_note, total_man_hours, total_days) values
  ('47-53',      '1-man line (Andrew)',        48, 6),
  ('55-59',      '2-man line',                112, 7),
  ('64-66',      '1-man line (Andrew)',        48, 6),
  ('67-72 Chevy','2-man line (Chris + Tyler)', 96, 6),
  ('67-72 Ford', '1-man line (Andrew)',        56, 7),
  ('69-72 Blazer','2-man line',                80, 5);

-- ---------- PRODUCTS (16 part #s -> 6 templates; SMK = base template, file 03) ----------
insert into product (part_number, family, is_smk, lines) values
  ('PSR-4751',      '47-53', false, '{1}'),
  ('PSR-5253',      '47-53', false, '{1}'),
  ('PSR-4753-SMK',  '47-53', true,  '{1}'),
  ('PSR-5557-BW',   '55-59', false, '{2}'),
  ('PSR-5557-SW',   '55-59', false, '{2}'),
  ('PSR-5859-BW',   '55-59', false, '{2}'),
  ('PSR-5859-SW',   '55-59', false, '{2}'),
  ('PSR-5559-SMK',  '55-59', true,  '{2}'),
  ('PSR-6466',      '64-66', false, '{1}'),
  ('PSR-6566-SMK',  '64-66', true,  '{1}'),
  ('PSR-6772',      '67-72 Chevy', false, '{3}'),
  ('PSR-6772-SMK',  '67-72 Chevy', true,  '{3}'),
  ('PSR-F6772',     '67-72 Ford', false, '{1}'),
  ('PSR-F6772-SMK', '67-72 Ford', true,  '{1}'),
  ('PSR-6972-BLZR', '69-72 Blazer', false, '{4}'),
  ('PSR-6972B-SMK', '69-72 Blazer', true,  '{4}');
update product p set template_id = t.id from build_template t where t.family = p.family;

-- ---------- EMPLOYEES (file 26 launch accounts; Q95 DECIDED 2026-07-25: hold all three Logsdon rows) ----------
-- PINs chosen at onboarding (Q68) -> pin_hash null. Lines seed the Q90 one-tap default.
insert into employee (first_name, last_name, role, mobile, email, lines) values
  ('Aaron','Espinoza','production','928-230-4972','ajespinoza83@gmail.com','{4,2}'),
  ('Tyler','Huff','production','949-426-0853','huff2huffty06@gmail.com','{3}'),
  ('Andrew','Sauers','production','307-205-9246','andrewsauers09@gmail.com','{1}'),
  ('Christopher','Barrett','production','714-900-1759','christopher.barrett36@yahoo.com','{3}'),
  ('Michael','Hull','manager','916-548-8645','dayopro1@aol.com','{4,2}'),
  ('Daniel','Park','admin','928-208-5586','marketing@premierstreetrod.com','{}');

-- ---------- STEP TEMPLATES ----------
-- display_no = Mike's number verbatim ('28*' = provisional, Q97 read-back).
-- 69-72 BLAZER (file 27: 80 mh / 5 two-man days; step 9 jig = background, Q96)
insert into step_template (template_id, display_no, name, day_no, man_hours, is_background, sort_order)
select (select id from build_template where family='69-72 Blazer'), v.* from (values
  ('1','Receive & inventory panel kit',1,1.5,false,1),
  ('2','Organize panels & stage workspace',1,1.5,false,2),
  ('3','Prep panels (clean/deburr/strip)',1,2.5,false,3),
  ('4','Set floor pan on jig — level & square',1,2.0,false,4),
  ('5','Fit toe board & transmission tunnel',1,2.0,false,5),
  ('6','Assemble front & rear floor panels',1,3.0,false,6),
  ('7','Set & square A-pillars',1,1.5,false,7),
  ('8','Fit windshield header',1,1.0,false,8),
  ('10','Fit outer windshield header',1,1.0,false,9),
  ('9','Assemble & square jig (progressive on the pan)',1,0,true,10),
  ('11','Fit inner cowl',2,5.0,false,11),
  ('12','Fit outer cowl',2,5.0,false,12),
  ('13','Fit & weld firewall',2,6.0,false,13),
  ('21','Fit & weld dash panel / structure',3,3.0,false,14),
  ('14','Fit inner wheelhouses LH & RH',3,3.0,false,15),
  ('15','Fit outer tub side panels / quarters',3,3.5,false,16),
  ('16','Install rocker boxes',3,1.5,false,17),
  ('17','Install rocker box plates',3,1.25,false,18),
  ('22','Fit outer rocker panels',3,1.5,false,19),
  ('18','Install rear splash guards',3,0.5,false,20),
  ('19','Remove jig',3,0.75,false,21),
  ('20','Seam seal floor & firewall',3,1.0,false,22),
  ('23','Prep / assemble doors',4,6.0,false,23),
  ('24','Fit door latches & strikers',4,2.0,false,24),
  ('25','Hang LH door — hinges, gap & align',4,4.0,false,25),
  ('26','Hang RH door — hinges, gap & align',4,4.0,false,26),
  ('27','Hang tailgate — hinges, gap & align',5,3.0,false,27),
  ('28','Fit tailgate latch & adjust',5,1.5,false,28),
  ('29','Finish-weld all seams & plug welds',5,6.0,false,29),
  ('30','Grind & metal-finish welds',5,5.5,false,30)
) as v(display_no,name,day_no,man_hours,is_background,sort_order);

-- 64-66 C10 (file 29: 48 mh / 6 one-man days)
insert into step_template (template_id, display_no, name, day_no, man_hours, is_background, sort_order)
select (select id from build_template where family='64-66'), v.* from (values
  ('1','Receive & inventory panel kit',1,1.0,false,1),
  ('2','Organize panels & stage workspace',1,1.0,false,2),
  ('3','Prep panels',1,1.5,false,3),
  ('5','Assemble & square the jig',1,1.0,false,4),
  ('4','Set cab floor pan on jig',1,1.0,false,5),
  ('28*','Set & square A-pillars',1,0.75,false,6),
  ('6','Set B-pillars / door posts',1,0.75,false,7),
  ('7','A & B pillar connectors',1,0.5,false,8),
  ('8','Fit inner cab back panel / inner window panel',1,0.5,false,9),
  ('9','Fit inner cowl',2,1.5,false,10),
  ('10','Fit outer cowl',2,1.5,false,11),
  ('11','Fit & weld firewall',2,2.5,false,12),
  ('12','Fit firewall braces LH & RH',2,1.0,false,13),
  ('13','Upper windshield header',2,1.5,false,14),
  ('14','Fit outer cab back panel (per window config)',3,3.0,false,15),
  ('15','Fit roof skin — clamp, align & weld',3,5.0,false,16),
  ('18','Fit brake brace',4,1.0,false,17),
  ('16','Fit outer rocker panels',4,2.5,false,18),
  ('17','Remove jig',4,1.0,false,19),
  ('19','Fit & weld dash panel / structure',4,2.5,false,20),
  ('29*','Fit & weld drip rails / gutters',4,1.0,false,21),
  ('20','Prep / assemble doors',5,2.5,false,22),
  ('21','Fit latches & strikers',5,1.0,false,23),
  ('22','Hang LH door',5,1.75,false,24),
  ('23','Hang RH door',5,1.75,false,25),
  ('24','Check window openings & glass channel fit',5,1.0,false,26),
  ('25','Finish-weld all seams & plug welds',6,3.5,false,27),
  ('26','Grind & metal-finish welds',6,3.0,false,28),
  ('27','Seam seal / apply sealer',6,1.5,false,29)
) as v(display_no,name,day_no,man_hours,is_background,sort_order);

-- 47-53 (file 30: 48 mh / 6 one-man days; Q102 unnumbered rows removed)
insert into step_template (template_id, display_no, name, day_no, man_hours, is_background, sort_order)
select (select id from build_template where family='47-53'), v.* from (values
  ('1','Receive & inventory panel kit',1,1.0,false,1),
  ('2','Organize panels & stage workspace',1,1.0,false,2),
  ('3','Prep panels',1,1.5,false,3),
  ('6','Assemble & square the jig',1,1.0,false,4),
  ('4','Set cab floor pan on jig',1,1.25,false,5),
  ('5','Fit floor outer rear sections & extensions',1,1.5,false,6),
  ('7','Set & square A-pillars & B-pillars',1,0.75,false,7),
  ('8','Fit front pillar sections LH & RH',2,3.0,false,8),
  ('9','Fit upper cowl',2,3.0,false,9),
  ('10','Fit upper windshield filler panel',2,2.0,false,10),
  ('13','Fit & weld firewall',3,1.5,false,11),
  ('11','Fit outer cab back panel',3,2.5,false,12),
  ('12','Fit roof skin — clamp, align & weld',3,4.0,false,13),
  ('14','Remove jig',4,1.0,false,14),
  ('15','Prep / assemble doors',4,2.75,false,15),
  ('16','Fit latches & strikers',4,1.0,false,16),
  ('17','Hang LH door',4,1.75,false,17),
  ('18','Hang RH door',4,1.5,false,18),
  ('19','Fit & weld dash panel / structure',5,2.25,false,19),
  ('20','Fit inner cab back panel / inner window panel',5,2.5,false,20),
  ('21','Check window openings & glass channel fit',5,1.75,false,21),
  ('25','Fit stock drip rails',5,1.5,false,22),
  ('22','Finish-weld all seams & plug welds',6,3.5,false,23),
  ('23','Grind & metal-finish welds',6,3.0,false,24),
  ('24','Seam seal / apply sealer',6,1.5,false,25)
) as v(display_no,name,day_no,man_hours,is_background,sort_order);

-- 67-72 FORD F100 (file 31: 56 mh / 7 one-man days; steps 19-21 span days 5-6 -> seeded day 5)
insert into step_template (template_id, display_no, name, day_no, man_hours, is_background, sort_order)
select (select id from build_template where family='67-72 Ford'), v.* from (values
  ('1','Receive & inventory panel kit',1,1.0,false,1),
  ('2','Organize panels & stage workspace',1,1.0,false,2),
  ('3','Prep panels',1,1.5,false,3),
  ('5','Assemble & square the jig',1,1.0,false,4),
  ('4','Set cab floor pan on jig',1,1.25,false,5),
  ('6','Set & square A-pillars',1,0.9,false,6),
  ('7','Set B-pillars / door posts',1,0.9,false,7),
  ('8','Fit A & B pillar connectors',1,0.45,false,8),
  ('9','Fit inner cab back panel / inner window panel',2,2.0,false,9),
  ('10','Fit rear outer braces & cross brace',2,2.0,false,10),
  ('11','Fit inner cowl',2,2.0,false,11),
  ('12','Fit & weld firewall',2,2.0,false,12),
  ('13','Fit outer cowl',3,4.0,false,13),
  ('14','Fit & weld drip rails / gutters',3,4.0,false,14),
  ('15','Fit outer cab back panel / roof assembly',4,6.5,false,15),
  ('16','Remove jig',4,1.5,false,16),
  ('18','Prep / assemble doors (skin to frame)',5,4.0,false,17),
  ('19','Fit latches & strikers',5,1.5,false,18),
  ('20','Hang LH door',5,3.0,false,19),
  ('21','Hang RH door',5,3.0,false,20),
  ('22','Check window openings & glass channel fit',6,4.5,false,21),
  ('23','Finish-weld all seams & plug welds',7,3.5,false,22),
  ('24','Grind & metal-finish welds',7,3.0,false,23),
  ('25','Seam seal / apply sealer',7,1.5,false,24)
) as v(display_no,name,day_no,man_hours,is_background,sort_order);

-- 67-72 CHEVY C10 (file 33: 96 mh / 6 two-man days; step 28 deleted per Mike)
insert into step_template (template_id, display_no, name, day_no, man_hours, is_background, sort_order)
select (select id from build_template where family='67-72 Chevy'), v.* from (values
  ('1','Receive & inventory panel kit',1,1.5,false,1),
  ('2','Organize panels & stage workspace',1,1.5,false,2),
  ('3','Prep panels',1,2.5,false,3),
  ('5','Assemble & square the jig',1,1.5,false,4),
  ('4','Set cab floor pan on jig',1,2.0,false,5),
  ('6','Fit A & B pillars',1,2.5,false,6),
  ('8','Fit A & B pillar connectors',1,1.5,false,7),
  ('7','Fit transmission hump / tunnel',1,1.5,false,8),
  ('9','Fit inner cab back panel / inner window panel',1,1.5,false,9),
  ('11','Fit cowl assembly',2,6.0,false,10),
  ('12','Fit & weld firewall',2,6.0,false,11),
  ('10','Fit windshield header',2,4.0,false,12),
  ('13','Fit firewall braces LH & RH',3,2.5,false,13),
  ('15','Fit outer cab back panel (per window config)',3,3.5,false,14),
  ('14','Assemble outer roof & back panel',3,6.0,false,15),
  ('16','Weld roof to pillars & header',3,4.0,false,16),
  ('19','Fit & weld dash panel / structure',4,4.0,false,17),
  ('20','Seam seal',4,2.5,false,18),
  ('21','Fit outer rocker panels LH & RH',4,3.5,false,19),
  ('17','Fit & weld drip rails / gutters',4,4.5,false,20),
  ('18','Remove jig',4,1.5,false,21),
  ('22','Prep / assemble doors',5,6.0,false,22),
  ('24','Hang LH door — hinges, gap & align',5,3.5,false,23),
  ('23','Hang RH door — hinges, gap & align',5,3.5,false,24),
  ('29*','Fit latches & strikers',5,3.0,false,25),
  ('25','Check window openings & glass channel fit',6,3.5,false,26),
  ('26','Finish-weld all seams & plug welds',6,6.5,false,27),
  ('27','Grind & metal-finish welds',6,6.0,false,28)
) as v(display_no,name,day_no,man_hours,is_background,sort_order);

-- 55-59 (file 34: 112 mh / 7 two-man days — longest build in the shop)
insert into step_template (template_id, display_no, name, day_no, man_hours, is_background, sort_order)
select (select id from build_template where family='55-59'), v.* from (values
  ('1','Receive & inventory panel kit',1,1.5,false,1),
  ('2','Organize panels & stage workspace',1,1.5,false,2),
  ('3','Prep panels',1,2.5,false,3),
  ('5','Assemble & square the jig',1,1.5,false,4),
  ('4','Set cab floor pan on jig',1,2.0,false,5),
  ('6','Fit front cab floor sections LH & RH',1,2.5,false,6),
  ('7','Fit footwells LH & RH',1,2.0,false,7),
  ('8','Fit transmission hump / tunnel',1,2.0,false,8),
  ('9','Fit cab supports — front',2,3.0,false,9),
  ('10','Fit front pillar sections LH & RH',2,4.0,false,10),
  ('11','Set B-pillars / door posts',2,3.0,false,11),
  ('12','Fit inner roof & inner back panel',2,6.0,false,12),
  ('13','Fit & weld firewall',3,6.5,false,13),
  ('14','Fit firewall braces LH & RH',3,3.0,false,14),
  ('15','Fit outer cab back panel (per window config)',3,6.5,false,15),
  ('16','Fit roof skin — clamp & align',4,5.5,false,16),
  ('17','Weld roof to pillars & header',4,4.0,false,17),
  ('18','Fit & weld drip rails / gutters',4,5.0,false,18),
  ('29*','Remove jig',4,1.5,false,19),
  ('19','Fit & weld dash panel / structure',5,6.5,false,20),
  ('20','Side step front & rear panels',5,9.5,false,21),
  ('21','Prep / assemble doors',6,5.5,false,22),
  ('22','Fit latches & strikers',6,2.5,false,23),
  ('23','Hang LH door',6,3.0,false,24),
  ('24','Hang RH door',6,3.0,false,25),
  ('25','Check window openings & glass channel fit',6,2.0,false,26),
  ('26','Finish-weld all seams & plug welds',7,6.5,false,27),
  ('27','Grind & metal-finish welds',7,6.0,false,28),
  ('28','Seam seal / apply sealer',7,3.5,false,29)
) as v(display_no,name,day_no,man_hours,is_background,sort_order);

-- ---------- OPTION CATALOGS (one-man hours everywhere — Mike answer #1; maps_to_day per Q10 drafts) ----------
-- null hours = N/A (Mike marked not offered). 0 hours = offered, zero/TBD time (flagged in name).
insert into option_catalog (template_id, group_name, option_name, added_man_hours, maps_to_day)
select (select id from build_template where family='69-72 Blazer'), v.* from (values
  ('Firewall','Shave all factory holes',6::numeric,2),
  ('Firewall','Smooth firewall panels',8,2),
  ('Firewall','Hart-Fab single bead roll',7,2),
  ('Firewall','Hart-Fab double bead roll',7,2),
  ('Firewall wire gutter','Filled smooth',4,2),
  ('Door latch','Trique latch upgrade',2,4),
  ('Billet striker plate','Add Trique billet striker plate',2,4),
  ('Doors','Kindig-It Bar handles',12,4),
  ('Doors','Kindig-It Spoon handles',12,4),
  ('Dash','Smooth center dash (minus ign. hole)',4,2),
  ('Fuel filler','Shaved',3,3),
  ('Fuel filler','Hidden taillight fuel filler',8,3),
  ('Tailgate','"Chevrolet" script',0,null),
  ('Tailgate','"GMC" script',0,null)
) as v(group_name,option_name,added_man_hours,maps_to_day);

insert into option_catalog (template_id, group_name, option_name, added_man_hours, maps_to_day)
select (select id from build_template where family='64-66'), v.* from (values
  ('Door latch','Trique latch upgrade',4::numeric,5),
  ('Fuel filler','Shaved',2,3),
  ('Firewall','Shave all factory holes',5,2),
  ('Firewall','Hart-Fab standard bead roll',6,2),
  ('Firewall','Hart-Fab single bead roll',6,2),
  ('Firewall wire gutter','Filled smooth',4,2)
) as v(group_name,option_name,added_man_hours,maps_to_day);

insert into option_catalog (template_id, group_name, option_name, added_man_hours, maps_to_day)
select (select id from build_template where family='47-53'), v.* from (values
  ('Firewall','Fill all factory holes',4::numeric,3),
  ('Firewall','Smooth filler panels',10,3),
  ('Firewall','Recessed 4" set-back — flat top',10,3),
  ('Firewall','Recessed 4" set-back — curved top',10,3),
  ('Door latch','Altman Easy Latch — exterior handles',3,4),
  ('Door latch','Altman Easy Latch — shaved handles (+2 to shave)',5,4),
  ('Drip rails','Shaved',4,3),
  ('Doors','Shaved handle holes',2,4),
  ('Cowl','Shaved upper + factory side vent',2,2),
  ('Cowl','Stock upper + shaved side vent',null,null),
  ('Cowl','Shaved upper & side vent',null,null),
  ('Back window','3-Window (filled corner windows)',16,3)
) as v(group_name,option_name,added_man_hours,maps_to_day);

insert into option_catalog (template_id, group_name, option_name, added_man_hours, maps_to_day)
select (select id from build_template where family='67-72 Ford'), v.* from (values
  ('Firewall','Shave all factory holes',6::numeric,2),
  ('Fuel filler','Shaved',2,4),
  ('Door latch','Trique door latch upgrade',4,5)
) as v(group_name,option_name,added_man_hours,maps_to_day);

insert into option_catalog (template_id, group_name, option_name, added_man_hours, maps_to_day)
select (select id from build_template where family='67-72 Chevy'), v.* from (values
  ('Door latch','Trique latch upgrade',2::numeric,5),
  ('Billet striker plate','Add Trique billet striker plate',2,5),
  ('Fuel filler','Shaved',3,3),
  ('Firewall','Shave all factory holes',6,2),
  ('Firewall','Smooth firewall panels',8,2),
  ('Firewall','Hart-Fab single bead roll',7,2),
  ('Firewall','Hart-Fab double bead roll',7,2),
  ('Firewall wire gutter','Filled smooth',4,2),
  ('Dash','Smooth center dash (minus ign. hole)',4,4),
  ('Doors','Kindig-It Bar handles',12,5),
  ('Doors','Kindig-It Spoon handles',12,5)
) as v(group_name,option_name,added_man_hours,maps_to_day);

insert into option_catalog (template_id, group_name, option_name, added_man_hours, maps_to_day)
select (select id from build_template where family='55-59'), v.* from (values
  ('Firewall','Fill all holes',null::numeric,null::int),
  ('Firewall','Smooth filler plates',null,null),
  ('Firewall','Hart-Fab single bead roll',12,3),
  ('Firewall','Hart-Fab standard bead roll',12,3),
  ('Firewall','Hart-Fab stock bead roll',12,3),
  ('Firewall','Recessed 1-1/2" set-back — flat top',12,3),
  ('Firewall','Recessed 1-1/2" set-back — curved top',12,3),
  ('Firewall','Recessed 4" set-back — flat top',12,3),
  ('Firewall','Recessed 4" set-back — curved top',12,3),
  ('Door latch','Altman Easy Latch — exterior handles',4,6),
  ('Door latch','Altman Easy Latch — exterior handles + insert panel',4,6),
  ('Door latch','Altman Easy Latch — shaved handles',4,6),
  ('Door latch','Altman Easy Latch — shaved handles + insert panel',4,6),
  ('Door latch','Kindig-It Bar "Straight" handles',12,6),
  ('Door latch','Kindig-It Classic "Spoon" handles',12,6),
  ('Billet striker plate','Add Trique billet striker plate',5,6),
  ('Drip rail','Custom shaved radius rolled edge',20,4),
  ('Doors','Shaved handle holes (hrs TBD at read-back)',0,6),
  ('Doors','Stock holes + radius front edge',4,6),
  ('Doors','Shaved holes + radius front edge (hrs TBD at read-back)',0,6),
  ('Upper cowl','Shaved w/o vent slots',5,3),
  ('Dash','Smooth dash (minus gauge cluster)',8,5)
) as v(group_name,option_name,added_man_hours,maps_to_day);

-- ---------- PICK LISTS (Q77 seed reason libraries; admin-editable, retire-not-delete) ----------
insert into pick_list_item (list_key, label, sort_order) values
  ('clock_out_reason','Lunch',1),
  ('clock_out_reason','End of shift',2),
  ('clock_out_reason','Doctor / appointment',3),
  ('clock_out_reason','Left early — personal',4),
  ('clock_out_reason','Other (add note)',5),
  ('blocker','Waiting on parts',1),
  ('blocker','Waiting on manager / inspection',2),
  ('blocker','Tool / machine issue',3),
  ('blocker','Damaged panel — needs decision',4),
  ('blocker','Other (add note)',5),
  ('hold','Parts hold',1),
  ('hold','Customer change order',2),
  ('hold','Quality hold',3),
  ('hold','Manager hold',4),
  ('hold','Down for today (Q83)',5),
  ('absence','Vacation',1),
  ('absence','Sick',2),
  ('absence','Doctor / appointment',3),
  ('absence','Late arrival',4),
  ('absence','No-show',5),
  ('rework_reason','Body Shop kickback',1),
  ('rework_reason','Customer return',2),
  ('rework_reason','Failed inspection',3);

-- ---------- FEATURE TOGGLES (Q65 rollout posture: SMS/email OFF, smart touches OFF, early-red guard ON) ----------
insert into feature_toggle (key, enabled) values
  ('tv_board', true),
  ('sms_alerts', false),
  ('email_notifications', false),
  ('morning_prebrief', false),
  ('line_frees_soon_alert', false),
  ('inspect_before_close_nudge', false),
  ('early_red_standards_guard', true),
  ('customer_names_on_tv', true),
  ('time_off_requests', true);
