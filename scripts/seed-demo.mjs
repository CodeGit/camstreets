#!/usr/bin/env node
// Seeds (or, with --reset, wipes and re-seeds) the public demo dataset for
// dev.camstreets.org: 3 schools, 20-30 name-diverse volunteers each (one
// promoted to admin), a mix of regular and ad-hoc signups, and one real
// superuser account (DEMO_SUPERUSER_EMAIL). Unlike supabase/seed.sql
// (local-only, applied via `supabase db reset`), this talks to whichever
// hosted project its env vars point at over the network, using the GoTrue
// Admin API for auth users - hosted projects have no direct Postgres
// access for `insert into auth.users` the way the local stack does.
//
// Usage: node scripts/seed-demo.mjs [--reset]
//   (no flag)  create the 3 demo schools if they don't already exist;
//              no-op for any that do (safe to re-run).
//   --reset    delete the 3 demo schools (and their volunteers/admins/
//              signups) first, then recreate everything fresh. This is
//              what the nightly reset job runs.
//
// Requires DEMO_SUPERUSER_EMAIL (.env.local locally, a GitHub Actions
// secret in CI - see .github/workflows/reset-demo.yml) - a real email
// address is personal, so it's deliberately never hardcoded here where it
// would end up committed to a public repo.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Node has no built-in .env.local loading - this mirrors just enough of
// Next.js's own behaviour (KEY="value" per line, quotes stripped) so
// `node scripts/seed-demo.mjs` works the same way `pnpm dev` already does
// without requiring the caller to export anything by hand first.
function loadEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
    }
  }
}
loadEnvLocal();

// Allowlist, not a denylist - refuses anything it doesn't explicitly
// recognise (including prod) rather than trying to detect "not prod".
const KNOWN_DEV_PROJECT_REF = "snquofgpzpjguluglbif";

function assertSafeTarget(url) {
  const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(url ?? "");
  const projectRef = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (isLocal || projectRef === KNOWN_DEV_PROJECT_REF) return;
  console.error(
    `Refusing to run against ${url} - this only runs against the local stack or the known dev project (${KNOWN_DEV_PROJECT_REF}). If this really is a new, intentional target, update KNOWN_DEV_PROJECT_REF in this script first.`
  );
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPERUSER_EMAIL = process.env.DEMO_SUPERUSER_EMAIL;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !SUPERUSER_EMAIL) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_SUPERUSER_EMAIL must all be set (.env.local or the environment)."
  );
  process.exit(1);
}
assertSafeTarget(SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const RESET = process.argv.includes("--reset");

// --- Deterministic PRNG (mulberry32) -----------------------------------
// So a bare re-run (no --reset) that hits "school already exists, skip"
// branches is reviewable/debuggable with a stable roster, without pulling
// in a dependency for something this small.
function mulberry32(seed) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260910);
function pick(array) {
  return array[Math.floor(rng() * array.length)];
}
function randomInt(min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// --- Name pools ----------------------------------------------------------
// Real, commonly-used names per category - first/last name pools crossed
// give far more unique combinations than either pool's raw size, so ~90
// volunteers across 3 schools rarely repeats within one school.
const NAME_POOLS = {
  english: {
    first: [
      "Oliver", "Jack", "Harry", "George", "Noah", "Charlie", "Jacob", "Thomas", "Oscar", "William",
      "James", "Henry", "Leo", "Alfie", "Freddie", "Archie", "Joshua", "Ethan", "Daniel", "Samuel",
      "Olivia", "Amelia", "Isla", "Ava", "Emily", "Sophia", "Grace", "Lily", "Freya", "Poppy",
      "Charlotte", "Evie", "Isabella", "Sophie", "Mia", "Ruby", "Daisy", "Phoebe", "Alice", "Chloe",
    ],
    last: [
      "Smith", "Jones", "Taylor", "Williams", "Brown", "Davies", "Evans", "Wilson", "Thomas", "Roberts",
      "Johnson", "Lewis", "Walker", "Robinson", "Wood", "Thompson", "White", "Watson", "Jackson", "Wright",
      "Green", "Harris", "Cooper", "King", "Baker", "Adams", "Clarke", "Hughes", "Turner", "Parker",
    ],
  },
  indianPakistani: {
    first: [
      "Aarav", "Vihaan", "Aditya", "Arjun", "Rohan", "Ishaan", "Bilal", "Hamza", "Usman", "Imran",
      "Priya", "Ananya", "Diya", "Kavya", "Riya", "Sana", "Zara", "Ayesha", "Fatima", "Amara",
    ],
    last: [
      "Sharma", "Patel", "Kumar", "Singh", "Khan", "Ahmed", "Hussain", "Malik", "Chaudhry", "Iqbal",
      "Raza", "Shah", "Gupta", "Rahman", "Ali", "Mehta", "Reddy", "Nair", "Joshi", "Verma",
    ],
  },
  chinese: {
    first: ["Wei", "Mei", "Jing", "Xin", "Hao", "Ling", "Yong", "Fang"],
    last: ["Li", "Chen", "Zhang", "Wang", "Liu", "Yang", "Huang", "Zhao"],
  },
  jamaican: {
    first: ["Marcus", "Shanice", "Kadeem", "Alicia", "Dwayne", "Latoya", "Romario", "Kerry-Ann"],
    last: ["Campbell", "Brown", "Williams", "Grant", "Reid", "Henry", "Facey", "Blake"],
  },
  african: {
    first: ["Chidi", "Amara", "Kwame", "Folake", "Tunde", "Ngozi", "Kofi", "Abena"],
    last: ["Okafor", "Nwosu", "Mensah", "Adeyemi", "Owusu", "Eze", "Boateng", "Diallo"],
  },
};

// 70% English, 20% Indian/Pakistani, then Chinese/Jamaican/African split
// the remaining 10% roughly evenly.
const WEIGHTED_CATEGORIES = [
  ...Array(70).fill("english"),
  ...Array(20).fill("indianPakistani"),
  ...Array(4).fill("chinese"),
  ...Array(3).fill("jamaican"),
  ...Array(3).fill("african"),
];

function randomName() {
  const category = pick(WEIGHTED_CATEGORIES);
  const pool = NAME_POOLS[category];
  return { first: pick(pool.first), last: pick(pool.last) };
}

// --- Term dates ------------------------------------------------------------
// Computed from whenever this actually runs, not hardcoded - so the demo
// stays populated with terms covering "now" regardless of when it's run
// for real. Approximate typical UK state-school dates - fine for a demo,
// doesn't need to be calendar-perfect for any specific year.
function currentAcademicYear() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  return month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

function ukTermDatesFor(year) {
  const y = String(year);
  const y1 = String(year + 1);
  return [
    { name: `Autumn ${y}`, start_date: `${y}-09-01`, half_term_start: `${y}-10-24`, half_term_end: `${y}-11-01`, end_date: `${y}-12-19` },
    { name: `Spring ${y1}`, start_date: `${y1}-01-06`, half_term_start: `${y1}-02-13`, half_term_end: `${y1}-02-21`, end_date: `${y1}-03-27` },
    { name: `Summer ${y1}`, start_date: `${y1}-04-13`, half_term_start: `${y1}-05-22`, half_term_end: `${y1}-05-30`, end_date: `${y1}-07-18` },
  ];
}

// default_terms is global (not per-school) and never deleted by --reset -
// only ensured to cover the current and next academic year, so
// on_default_term_created (an existing trigger) has something to backfill
// every school's own `terms` from.
async function ensureDefaultTerms() {
  for (const year of [currentAcademicYear(), currentAcademicYear() + 1]) {
    const dates = ukTermDatesFor(year);
    const { data: existing } = await supabase
      .from("default_terms")
      .select("name")
      .in(
        "name",
        dates.map((d) => d.name)
      );
    const existingNames = new Set((existing ?? []).map((r) => r.name));
    const missing = dates.filter((d) => !existingNames.has(d.name));
    if (missing.length > 0) {
      const { error } = await supabase.from("default_terms").insert(missing);
      if (error) throw new Error(`Failed to insert default_terms for ${year}: ${error.message}`);
      console.log(`Inserted default_terms for ${year}/${year + 1}: ${missing.map((m) => m.name).join(", ")}`);
    }
  }
}

// --- Auth users --------------------------------------------------------
// The GoTrue Admin API createUser call is silent (no email sent) -
// only a real signInWithOtp later sends one. Falls back to looking the
// user up if they already exist, so re-running (without --reset) is safe.
async function findOrCreateAuthUser(email) {
  const { data: created, error } = await supabase.auth.admin.createUser({ email, email_confirm: true });
  if (!error) return created.user;

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw new Error(`Could not create or find auth user for ${email}: ${error.message}`);
  const existing = listData.users.find((u) => u.email === email);
  if (!existing) throw new Error(`Could not create or find auth user for ${email}: ${error.message}`);
  return existing;
}

async function setDisplayName(volunteerId, displayName) {
  await supabase.from("volunteers").update({ display_name: displayName }).eq("id", volunteerId);
}

// --- School definitions --------------------------------------------------
const SCHOOL_DEFS = [
  {
    name: "Meadowfields Primary",
    street: "Meadow Lane",
    town: "Leeds",
    locations: [
      { name: "Meadow Lane crossing", address: "Meadow Lane, Leeds" },
      { name: "Foxglove Road crossing", address: "Foxglove Road, Leeds" },
    ],
  },
  {
    name: "The Manor School",
    street: "Manor Road",
    town: "Bristol",
    locations: [
      { name: "Manor Road crossing", address: "Manor Road, Bristol" },
      { name: "Old Barn Lane crossing", address: "Old Barn Lane, Bristol" },
    ],
  },
  {
    name: "Woodsford Primary",
    street: "Woodsford Close",
    town: "Nottingham",
    locations: [
      { name: "Woodsford Close crossing", address: "Woodsford Close, Nottingham" },
      { name: "Elm Grove crossing", address: "Elm Grove, Nottingham" },
    ],
  },
];

// --- Reset ---------------------------------------------------------------
// No FK in this schema cascades from schools/locations/slots/terms, so
// everything below is deleted in explicit dependency order (children
// first) - see supabase/migrations/20260707144814_create_core_schema.sql.
async function resetDemoData(schoolNames) {
  const { data: schools } = await supabase.from("schools").select("id").in("name", schoolNames);
  const schoolIds = (schools ?? []).map((s) => s.id);
  if (schoolIds.length === 0) return;

  const { data: memberships } = await supabase.from("volunteer_schools").select("volunteer_id").in("school_id", schoolIds);
  const volunteerIds = [...new Set((memberships ?? []).map((m) => m.volunteer_id))];

  const { data: locations } = await supabase.from("locations").select("id").in("school_id", schoolIds);
  const locationIds = (locations ?? []).map((l) => l.id);

  const { data: slots } = locationIds.length
    ? await supabase.from("slots").select("id").in("location_id", locationIds)
    : { data: [] };
  const slotIds = (slots ?? []).map((s) => s.id);

  const { data: instances } = slotIds.length
    ? await supabase.from("slot_instances").select("id").in("slot_id", slotIds)
    : { data: [] };
  const instanceIds = (instances ?? []).map((i) => i.id);

  const { data: terms } = await supabase.from("terms").select("id").in("school_id", schoolIds);
  const termIds = (terms ?? []).map((t) => t.id);

  if (instanceIds.length) await supabase.from("signups").delete().in("slot_instance_id", instanceIds);
  if (instanceIds.length) await supabase.from("slot_instances").delete().in("id", instanceIds);
  if (slotIds.length) await supabase.from("slots").delete().in("id", slotIds);
  if (locationIds.length) await supabase.from("locations").delete().in("id", locationIds);
  await supabase.from("off_days").delete().in("school_id", schoolIds);
  if (termIds.length) await supabase.from("terms").delete().in("id", termIds);
  await supabase.from("school_admins").delete().in("school_id", schoolIds);
  await supabase.from("volunteer_schools").delete().in("school_id", schoolIds);
  await supabase.from("schools").delete().in("id", schoolIds);

  // Deleting the auth user cascades to volunteers (on delete cascade) and,
  // from there, volunteer_calendar_feeds - school_admins/volunteer_schools
  // rows for these people are already gone above.
  for (const volunteerId of volunteerIds) {
    await supabase.auth.admin.deleteUser(volunteerId);
  }
  console.log(`Reset: removed ${schoolNames.join(", ")} and ${volunteerIds.length} demo volunteers.`);
}

// --- School creation -------------------------------------------------------
async function createSchool(def) {
  const { data: school, error } = await supabase
    .from("schools")
    .insert({ name: def.name, street: def.street, town: def.town, is_demo: true })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create school ${def.name}: ${error.message}`);

  const { data: locations, error: locError } = await supabase
    .from("locations")
    .insert(def.locations.map((l) => ({ school_id: school.id, name: l.name, address: l.address })))
    .select("id, name");
  if (locError) throw new Error(`Failed to create locations for ${def.name}: ${locError.message}`);

  const slotRows = [];
  for (const location of locations) {
    for (let weekday = 1; weekday <= 5; weekday++) {
      slotRows.push({
        location_id: location.id,
        day_of_week: weekday,
        start_time: "08:15",
        end_time: "08:45",
        label: "Morning drop-off",
        capacity: 2,
      });
      slotRows.push({
        location_id: location.id,
        day_of_week: weekday,
        start_time: "15:00",
        end_time: "15:30",
        label: "Afternoon pickup",
        capacity: 2,
      });
    }
  }
  const { error: slotError } = await supabase.from("slots").insert(slotRows);
  if (slotError) throw new Error(`Failed to create slots for ${def.name}: ${slotError.message}`);

  console.log(`Created school ${def.name} (id ${school.id}) with ${locations.length} locations, ${slotRows.length} slots.`);
  return school.id;
}

// admin volunteer joins first - on_volunteer_school_joined (existing
// trigger) auto-grants school_admins for it, same as a real admin
// creating a school and signing up as its first volunteer.
async function seedAdmin(schoolId) {
  const { first, last } = randomName();
  const email = `${first.toLowerCase()}.${last.toLowerCase()}.admin@example.com`;
  const authUser = await findOrCreateAuthUser(email);
  await setDisplayName(authUser.id, `${first} ${last}`);
  await supabase.from("volunteer_schools").insert({ volunteer_id: authUser.id, school_id: schoolId });
  console.log(`  Admin: ${first} ${last} <${email}>`);
  return authUser.id;
}

async function seedVolunteers(schoolId, schoolName, count) {
  const volunteerIds = [];
  for (let i = 0; i < count; i++) {
    const { first, last } = randomName();
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`;
    const authUser = await findOrCreateAuthUser(email);
    await setDisplayName(authUser.id, `${first} ${last}`);
    await supabase.from("volunteer_schools").insert({ volunteer_id: authUser.id, school_id: schoolId });
    volunteerIds.push(authUser.id);
  }
  console.log(`  ${count} volunteers joined ${schoolName}.`);
  return volunteerIds;
}

// 80% get 1-2 regular commitments (2+ confirmed dates sharing a slot_id -
// the same inference src/lib/volunteerContext.ts already uses to detect
// "regular"), 20% get 1-3 scattered one-off signups on distinct slot_ids
// (never 2+ on the same slot_id, or they'd read as regular too). A shared
// per-instance counter keeps every slot_instance at or under its capacity
// regardless of which phase books it - nothing in the DB enforces this at
// insert time.
async function seedSignups(schoolId, volunteerIds) {
  const { data: locations } = await supabase.from("locations").select("id").eq("school_id", schoolId);
  const locationIds = (locations ?? []).map((l) => l.id);

  const { data: slots } = await supabase.from("slots").select("id").in("location_id", locationIds);
  const slotIds = (slots ?? []).map((s) => s.id);

  const { data: instances } = await supabase
    .from("slot_instances")
    .select("id, slot_id, date")
    .in("slot_id", slotIds)
    .order("date");

  const instancesBySlot = new Map();
  for (const instance of instances ?? []) {
    const list = instancesBySlot.get(instance.slot_id) ?? [];
    list.push(instance);
    instancesBySlot.set(instance.slot_id, list);
  }

  const bookedCount = new Map(); // instance id -> confirmed count
  function capacityRemaining(instanceId) {
    return 2 - (bookedCount.get(instanceId) ?? 0);
  }
  function book(instanceId) {
    bookedCount.set(instanceId, (bookedCount.get(instanceId) ?? 0) + 1);
  }

  const signupRows = [];
  const shuffledSlotIds = [...slotIds].sort(() => rng() - 0.5);

  for (const volunteerId of volunteerIds) {
    const isRegular = rng() < 0.8;

    if (isRegular) {
      const commitmentCount = randomInt(1, 2);
      let taken = 0;
      for (const slotId of shuffledSlotIds) {
        if (taken >= commitmentCount) break;
        const slotInstances = (instancesBySlot.get(slotId) ?? []).filter((i) => capacityRemaining(i.id) > 0);
        // "Regular" needs 2+ confirmed dates on this slot to be inferred
        // as such - take the first several so it reads that way.
        if (slotInstances.length < 2) continue;
        const toBook = slotInstances.slice(0, Math.min(6, slotInstances.length));
        for (const instance of toBook) {
          signupRows.push({ slot_instance_id: instance.id, volunteer_id: volunteerId, status: "confirmed" });
          book(instance.id);
        }
        taken++;
      }
    } else {
      const oneOffCount = randomInt(1, 3);
      const usedSlotIds = new Set();
      let taken = 0;
      for (const slotId of shuffledSlotIds) {
        if (taken >= oneOffCount) break;
        if (usedSlotIds.has(slotId)) continue;
        const available = (instancesBySlot.get(slotId) ?? []).filter((i) => capacityRemaining(i.id) > 0);
        if (available.length === 0) continue;
        const instance = pick(available);
        signupRows.push({ slot_instance_id: instance.id, volunteer_id: volunteerId, status: "confirmed" });
        book(instance.id);
        usedSlotIds.add(slotId);
        taken++;
      }
    }
  }

  // Insert in batches - PostgREST/Supabase have no issue with a few
  // hundred rows in one call, but batching keeps error messages readable.
  const BATCH_SIZE = 200;
  for (let i = 0; i < signupRows.length; i += BATCH_SIZE) {
    const batch = signupRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("signups").insert(batch);
    if (error) throw new Error(`Failed to insert signups: ${error.message}`);
  }
  console.log(`  ${signupRows.length} signups across ${volunteerIds.length} volunteers.`);
}

async function main() {
  console.log(`Target: ${SUPABASE_URL}${RESET ? " (--reset)" : ""}`);

  await ensureDefaultTerms();

  const schoolNames = SCHOOL_DEFS.map((d) => d.name);
  if (RESET) {
    await resetDemoData(schoolNames);
  }

  const superuser = await findOrCreateAuthUser(SUPERUSER_EMAIL);
  await supabase.from("volunteers").update({ is_superuser: true }).eq("id", superuser.id);
  console.log(`Superuser: ${SUPERUSER_EMAIL}`);

  for (const def of SCHOOL_DEFS) {
    const { data: existing } = await supabase.from("schools").select("id").eq("name", def.name).maybeSingle();
    if (existing) {
      console.log(`${def.name} already exists (id ${existing.id}) - skipping (use --reset to recreate).`);
      continue;
    }

    const schoolId = await createSchool(def);
    await seedAdmin(schoolId);
    const volunteerCount = randomInt(20, 30);
    const volunteerIds = await seedVolunteers(schoolId, def.name, volunteerCount);
    await seedSignups(schoolId, volunteerIds);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
