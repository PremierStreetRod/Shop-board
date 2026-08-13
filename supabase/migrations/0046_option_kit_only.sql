-- 0046 (block 137, 2026-08-13): B2 — kit_only mark on option_item.
-- Sheet-metal-kit option lines stay RECOGNIZED by the freeze matcher
-- (zero-hour, silent — retiring them would false-flag every -SMK order)
-- but disappear from the admin Upgrade-options panel. Classification
-- source of truth: the 10 Complete Cab product pages ONLY (owner-rep
-- directive) — no -SMK product page. 39 rows marked, all zero-hour.
alter table option_item add column if not exists kit_only boolean not null default false;
update option_item set kit_only = true where (family, btrim(match_text)) in (
 ('47-53','Tailgate: "Chevrolet" Script'),
 ('55-59','Bed Hardware: Cadmium Plated'),
 ('55-59','Bed Hardware: Polished Stainless Steel'),
 ('55-59','Bed Trunnions: Stainless Steel w/ Derlin Bushing'),
 ('55-59','Bed: Stepside Bed - Shortbed'),
 ('55-59','Tailgate: Stepside w/ "Chevrolet" Script'),
 ('64-66','Bed: Shortbed - Fleetside'),
 ('64-66','Hood Hinge: EMS Billet Hood Hinges - Matte Black Fusioncoat'),
 ('64-66','Tailgate Chain Covers: Black'),
 ('64-66','Tailgate Chains: Cadmium Plated'),
 ('64-66','Tailgate Trunnions: Stainless Steel w/ Derlin'),
 ('64-66','Tailgate: Chevrolet - Fleetside'),
 ('67-72 Chevy','Bed Hardware: Cadmium Plated'),
 ('67-72 Chevy','Bed Hardware: Polished Stainless Steel'),
 ('67-72 Chevy','Bed Trunnions: Stainless Steel w/ Derlin Bushings'),
 ('67-72 Chevy','Bed: Custom Fleetside Steel Floor 2" Wider Tubs/Floor - Shortbed'),
 ('67-72 Chevy','Hood Hinges: EMS Billet Hood Hinges - Black Anodized'),
 ('67-72 Chevy','Hood Hinges: EMS Billet Hood Hinges - Matte Black Fusioncoat'),
 ('67-72 Chevy','Hood Latch: Upgrade Altman Easy Latch Hood Latch'),
 ('67-72 Chevy','Hood Style: 2" Cowl'),
 ('67-72 Chevy','Hood Style: Standard / OEM'),
 ('67-72 Chevy','Inner Fender  Upgrade: Hart-Fab Double Bead Rolled Inner Fenders - For 20" Wheels'),
 ('67-72 Chevy','Outer Cowl Panel: Smooth w/o Louves'),
 ('67-72 Chevy','Outer Cowl Panel: Standard / OEM w/ Louvers'),
 ('67-72 Chevy','Rear Pan: Stepside Roll Pan w/ License Box'),
 ('67-72 Ford','Bed: Styleside - Shortbed'),
 ('67-72 Ford','Hood Hinges: EMS Billet Hood Hinges - Matte Black Fusioncoat Finish'),
 ('67-72 Ford','Inner Fender: RH Inner Fender - For Big Block'),
 ('67-72 Ford','Tailgate Hardware: Tailgate Hinges, Linkage/Support Set - Black'),
 ('67-72 Ford','Tailgate Hardware: Tailgate Hinges, Linkage/Support Set - Stainless'),
 ('67-72 Ford','Tailgate Hardware: Tailgate Striker Plates, Shims, Latch Assembly, Rubber Bumpers, Hinges, Linkage/Support Set - Stainless'),
 ('67-72 Ford','Tailgate Latch Upgrade: Trique Mfg Tailgate Latch Upgrade'),
 ('67-72 Ford','Tailgate: "FORD" Script'),
 ('67-72 Ford','Tailgate: No Logo'),
 ('69-72 Blazer','Hood Hinges: EMS Billet Hood Hinges - Matte Black Fusioncoat'),
 ('69-72 Blazer','Hood Hinges: EMS Billet Hood Hinges - Polished'),
 ('69-72 Blazer','Hood Latch: Upgraded Altman Easy Latch Hood Latch'),
 ('69-72 Blazer','Inner Fender Upgrade: Hart-Fab Double Bead Rolled Inner Fenders - For 20" Wheels'),
 ('69-72 Blazer','Inner Fender Upgrade: Hart-Fab Single Bead Rolled Inner Fenders - For 22" Wheels')
);
-- Verified at run time: 39 rows marked, 0 with labor hours, 203 total.
