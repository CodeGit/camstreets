-- volunteer_schools previously only let a volunteer see/remove their own
-- row (see 20260801122733_add_volunteer_schools.sql). For a school admin
-- to view and manage their school's volunteer list, they need to see and
-- remove *other* volunteers' rows too — additive policies (multiple
-- policies on the same command OR together, per supabase/README.md), so
-- self-view/self-removal still works unchanged.
create policy "school admins can view their school's volunteers"
on public.volunteer_schools
for select
to authenticated
using (is_school_admin(school_id) or is_superuser());

create policy "school admins can remove a volunteer from their school"
on public.volunteer_schools
for delete
to authenticated
using (is_school_admin(school_id) or is_superuser());
