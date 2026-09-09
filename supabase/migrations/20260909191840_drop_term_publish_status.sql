-- Terms no longer have a manually-toggled "publish" step. on_default_term_created
-- (20260909123828_propagate_default_terms_to_schools.sql) already gives every
-- school real, correct dates the moment a term exists, so there's no more
-- "draft, not ready yet" state to hide from the public — a term's start/end
-- dates alone already say whether it's past, current or upcoming. Terms and
-- their slot instances are now always publicly readable, same as
-- volunteers/signups elsewhere in this schema, so an upcoming term (e.g. next
-- term during the summer holidays) is visible and signable straight away
-- rather than waiting on an admin action.
drop policy "published terms are publicly readable" on public.terms;
drop policy "slot instances in published terms are publicly readable" on public.slot_instances;

create policy "terms are publicly readable"
on public.terms
for select
to anon, authenticated
using (true);

create policy "slot instances are publicly readable"
on public.slot_instances
for select
to anon, authenticated
using (true);

alter table public.terms drop constraint terms_status_check;
alter table public.terms drop column status;
