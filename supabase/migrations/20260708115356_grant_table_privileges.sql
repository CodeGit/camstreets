grant usage on schema public to anon, authenticated, service_role;

grant select on
  public.schools,
  public.school_admins,
  public.locations,
  public.slots,
  public.terms,
  public.slot_instances,
  public.volunteers,
  public.signups
to anon;

grant select, insert, update, delete on
  public.schools,
  public.school_admins,
  public.locations,
  public.slots,
  public.terms,
  public.slot_instances,
  public.volunteers,
  public.signups
to authenticated, service_role;
