-- Block 269 (Daniel, 9/23 — Andrew & Christopher hanging doors on Line 1):
-- HELPING HANDS. A second tech on a running step had no safe move — tapping
-- the step would COMPLETE it — so helpers went unrecorded. Every task now
-- carries a helpers list: a tech taps "I'm helping this step" to join and
-- "Done helping" to leave on their own (Daniel: "maybe he is just putting
-- in a few hours of help... they need to be able to get themselves out").
-- Helping also ends automatically when the step completes or its start is
-- undone. Display + record only — the pace math and the line-labor split
-- behind step averages are deliberately untouched.
alter table task add column if not exists helpers uuid[] not null default '{}';
