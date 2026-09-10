-- default_terms now holds a full term's two date ranges (either side of
-- its half-term break), not just one start/end pair - matches how term
-- dates are actually published (e.g. Cambridgeshire County Council's page:
-- one "Autumn Term" with an embedded half-term break, not two separately
-- named half-terms). terms itself is untouched - still six half-term rows
-- per school, so applying a default_terms row to a school's own terms will
-- eventually mean inserting two terms rows, not changing terms' shape.
alter table public.default_terms
  add column half_term_start date,
  add column half_term_end date;

update public.default_terms
set half_term_start = start_date, half_term_end = end_date
where half_term_start is null;

alter table public.default_terms
  alter column half_term_start set not null,
  alter column half_term_end set not null;

alter table public.default_terms
  add constraint default_terms_date_order check (
    half_term_start > start_date
    and half_term_end > half_term_start
    and end_date > half_term_end
  );
