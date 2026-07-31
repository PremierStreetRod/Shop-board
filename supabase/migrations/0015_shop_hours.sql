-- 0015: Q113 — SHOP HOURS & LINE CONTROL.
-- The 7-to-4 day stops being a hardcoded number and becomes two settings;
-- lines gain a manual OPEN/CLOSED switch; managers get line control only
-- when an admin flips the Q65-style toggle.
create table if not exists shop_setting (
  key text primary key,
  value text not null
);
insert into shop_setting (key, value)
select 'shop_open_hour', '7' where not exists (select 1 from shop_setting where key = 'shop_open_hour');
insert into shop_setting (key, value)
select 'shop_close_hour', '16' where not exists (select 1 from shop_setting where key = 'shop_close_hour');

alter table line add column if not exists manually_closed boolean not null default false;

insert into feature_toggle (key, enabled)
select 'manager_line_control', false
 where not exists (select 1 from feature_toggle where key = 'manager_line_control');
