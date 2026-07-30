-- 0013: Q111 part 1 — the SHOP TIME work area + "Sick" clock-out reason.
-- Shop time (line 10) is the clockable NON-PRODUCTION area: Monday
-- meetings, cleanup, and in-house fabrication (rolling bases, show
-- fixtures) happen ON the clock — paid from the first tap, invisible to
-- the TV board (enabled=false), and never charged to any cab's numbers
-- because no cab ever lives on this line. Same pattern as Warehouse (9).
insert into line (id, name, enabled)
select 10, 'Shop time', false
 where not exists (select 1 from line where id = 10);

-- "Sick" joins the clock-out reasons, right after Doctor / appointment.
insert into pick_list_item (list_key, label, sort_order)
select 'clock_out_reason', 'Sick',
       coalesce((select sort_order + 1 from pick_list_item
                  where list_key = 'clock_out_reason' and label = 'Doctor / appointment'), 99)
 where not exists (select 1 from pick_list_item
                    where list_key = 'clock_out_reason' and label = 'Sick');
