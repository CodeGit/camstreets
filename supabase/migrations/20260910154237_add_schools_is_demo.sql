-- Marks schools created by scripts/seed-demo.mjs for dev.camstreets.org's
-- public demo. Read by becomeDemoAdmin() (src/app/dashboard/actions.ts) as
-- a second, independent layer of defence alongside the ALLOW_SELF_ELEVATE
-- env var: that action only ever grants admin on a school where
-- is_demo = true, so even a misconfigured env var can't do anything in
-- production, where this set is always empty. Defaults false - real
-- schools created through the normal "Add a school" flow are never demo
-- schools.
alter table public.schools add column is_demo boolean not null default false;
