"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SEASONS = ["autumn", "spring", "summer"] as const;

// Creates all 3 terms of an academic year in one submission - dropped the
// old one-season-at-a-time form in favour of this, since a year is really
// one unit of work, and on_default_term_created (see
// 20260909123828_propagate_default_terms_to_schools.sql) fans each of
// these 3 inserts out to every school anyway. Field names are
// "<season>_start_date" etc. - see TermYearForm.
export async function createDefaultYear(formData: FormData) {
  const rows: { name: string; start_date: string; half_term_start: string; half_term_end: string; end_date: string }[] = [];

  for (const season of SEASONS) {
    const startDate = formData.get(`${season}_start_date`);
    const halfTermStart = formData.get(`${season}_half_term_start`);
    const halfTermEnd = formData.get(`${season}_half_term_end`);
    const endDate = formData.get(`${season}_end_date`);

    if (
      typeof startDate !== "string" || !startDate ||
      typeof halfTermStart !== "string" || !halfTermStart ||
      typeof halfTermEnd !== "string" || !halfTermEnd ||
      typeof endDate !== "string" || !endDate
    ) {
      return;
    }

    // The display year is always start_date's own calendar year for every
    // season - Autumn starts in the first calendar year of the academic
    // year, Spring/Summer both start in its second, and in both cases
    // that's exactly the year the label should show, no offset needed.
    const label = season[0].toUpperCase() + season.slice(1);
    const year = new Date(startDate).getUTCFullYear();
    rows.push({
      name: `${label} ${year}`,
      start_date: startDate,
      half_term_start: halfTermStart,
      half_term_end: halfTermEnd,
      end_date: endDate,
    });
  }

  const supabase = await createClient();
  // RLS (superusers manage default terms) is the real gate here - this
  // just no-ops quietly on failure (bad dates, duplicate names, not a
  // superuser) rather than crashing, same as updateDisplayName.
  await supabase.from("default_terms").insert(rows);

  revalidatePath("/dashboard");
}

// Takes ids: number[] (always a single-element array here) rather than a
// plain number, so it can be passed directly as TermDate's onDeleteTerm -
// a <form action> must be an actual Server Action reference (or a .bind()
// of one), not an inline wrapper closure calling one, which Next.js can't
// serialize.
export async function deleteDefaultTerm(ids: number[]) {
  const supabase = await createClient();

  await supabase.from("default_terms").delete().in("id", ids);

  revalidatePath("/dashboard");
}

export async function addBankHoliday(formData: FormData) {
  const date = formData.get("date");
  const label = formData.get("label");

  if (typeof date !== "string" || !date || typeof label !== "string" || !label) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("off_days").insert({ type: "bank_holiday", date, label });

  revalidatePath("/dashboard");
}

export async function deleteOffDay(id: number) {
  const supabase = await createClient();

  await supabase.from("off_days").delete().eq("id", id);

  revalidatePath("/dashboard");
}

// Manual entry (addBankHoliday) stays the primary way to add one that
// hasn't been announced on gov.uk yet (e.g. an ad-hoc holiday for a
// monarch's death/coronation is usually confirmed before the API reflects
// it) - this just pulls in whatever gov.uk currently has that we don't
// already have stored, filtered to today onward so refreshing doesn't
// import years of past dates.
export async function refreshBankHolidays() {
  const supabase = await createClient();

  const res = await fetch("https://www.gov.uk/bank-holidays.json", {
    cache: "no-store",
  });
  if (!res.ok) return;

  const data: { "england-and-wales"?: { events?: { title: string; date: string }[] } } =
    await res.json();
  const events = data["england-and-wales"]?.events ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= today);

  const { data: existing } = await supabase
    .from("off_days")
    .select("date")
    .eq("type", "bank_holiday");
  const existingDates = new Set((existing ?? []).map((row) => row.date));

  const newRows = upcoming
    .filter((e) => !existingDates.has(e.date))
    .map((e) => ({ type: "bank_holiday" as const, date: e.date, label: e.title }));

  if (newRows.length > 0) {
    await supabase.from("off_days").insert(newRows);
  }

  revalidatePath("/dashboard");
}
