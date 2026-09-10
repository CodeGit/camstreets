// Builds a minimal RFC 5545 VCALENDAR feed for one volunteer's confirmed
// signups - used by src/app/calendar/[token]/feed.ics/route.ts. Hand-
// rolled rather than a dependency: the shape needed here (a handful of
// flat VEVENTs, no recurrence rules, no attendees) is small enough that a
// library would add more surface area than it saves.

export type FeedSignup = {
  slot_instance: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    slot: {
      location: {
        name: string;
        school: { name: string } | null;
      };
    };
  };
};

// RFC 5545 TEXT escaping - backslash, semicolon, comma and newline are all
// structurally significant in free-text property values (SUMMARY,
// LOCATION) and need escaping wherever a school/location name might
// contain them.
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// "2026-09-07" + "08:15:00" -> "20260907T081500"
function icsLocalDateTime(date: string, time: string): string {
  return `${date.replace(/-/g, "")}T${time.replace(/:/g, "").slice(0, 6)}`;
}

function icsUtcTimestamp(d: Date): string {
  return `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

// Standard, static Europe/London DST rules (clocks forward the last
// Sunday in March, back the last Sunday in October) - embedding this once
// means every VEVENT below just references TZID=Europe/London directly,
// with no runtime timezone math and so no BST/GMT transition-date bug to
// get wrong. This is the same fixed block most ICS generators emit for
// this zone.
const VTIMEZONE_EUROPE_LONDON = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/London",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0000",
  "TZOFFSETTO:+0100",
  "TZNAME:BST",
  "DTSTART:19700329T010000",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0000",
  "TZNAME:GMT",
  "DTSTART:19701025T020000",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

export function buildVolunteerCalendarFeed(signups: FeedSignup[]): string {
  const dtstamp = icsUtcTimestamp(new Date());

  const events = signups.map(({ slot_instance }) => {
    const { location } = slot_instance.slot;
    const summary = escapeText(
      location.school ? `${location.school.name}: ${location.name}` : location.name
    );

    return [
      "BEGIN:VEVENT",
      // Stable across refreshes (tied to the dated slot_instance row, not
      // regenerated per request), so a calendar app updates the existing
      // event in place rather than duplicating it on every sync.
      `UID:slot-instance-${slot_instance.id}@camstreets.local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Europe/London:${icsLocalDateTime(slot_instance.date, slot_instance.start_time)}`,
      `DTEND;TZID=Europe/London:${icsLocalDateTime(slot_instance.date, slot_instance.end_time)}`,
      `SUMMARY:${summary}`,
      `LOCATION:${escapeText(location.name)}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Cambridge School Streets//Volunteer Calendar//EN",
      "CALSCALE:GREGORIAN",
      "X-WR-CALNAME:School Streets volunteering",
      VTIMEZONE_EUROPE_LONDON,
      ...events,
      "END:VCALENDAR",
    ].join("\r\n") + "\r\n"
  );
}
