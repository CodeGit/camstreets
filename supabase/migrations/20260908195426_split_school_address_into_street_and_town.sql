-- Splits schools.address (a single freeform field, e.g. 'Fen Causeway,
-- Cambridge') into street + town, since the project may expand beyond
-- Cambridge into surrounding towns/villages - town needs to be its own
-- field to eventually filter/group schools by area, rather than buried
-- inside a free-text string.
alter table public.schools rename column address to street;
alter table public.schools add column town text;
