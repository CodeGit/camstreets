import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Tables } from "@/lib/supabase/database.types";
import { removeVolunteerFromSchool, setSchoolAdmin } from "@/app/dashboard/actions";

type Volunteer = Tables<"volunteers">;

const ERROR_MESSAGES: Record<string, string> = {
  "last-admin":
    "A school must always have at least one admin — remove or demote someone else first, or make another volunteer admin before removing this one.",
};

export default async function VolunteerList({
  schoolId,
  error,
}: {
  schoolId: number;
  error?: string;
}) {
  const supabase = await createClient();

  const { data: school } = await supabase
    .from("schools")
    .select("name")
    .eq("id", schoolId)
    .single();
  const schoolName = school?.name ?? "";

  const { data: volunteerSchools } = await supabase
    .from("volunteer_schools")
    .select("volunteer:volunteers(*)")
    .eq("school_id", schoolId);

  const { data: admins } = await supabase
    .from("school_admins")
    .select("volunteer_id")
    .eq("school_id", schoolId);

  const adminIds = new Set((admins ?? []).map((a) => a.volunteer_id));
  const volunteers = (volunteerSchools ?? [])
    .map((vs) => vs.volunteer)
    .filter((v): v is Volunteer => v !== null);

  return (
    <div className="space-y-2">
      <h3 className="text-md font-medium">{schoolName} Volunteers</h3>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{ERROR_MESSAGES[error] ?? "Something went wrong."}</AlertDescription>
        </Alert>
      )}
      {volunteers.length === 0 && (
        <p className="text-muted-foreground">No volunteers have joined this school yet.</p>
      )}
      <ul className="space-y-2">
        {volunteers.map((volunteer) => {
          const isAdminHere = adminIds.has(volunteer.id);
          return (
            <li
              key={volunteer.id}
              className="flex items-center justify-between border-b border-border py-2"
            >
              <span>
                {volunteer.display_name}
                {isAdminHere && (
                  <span className="ml-2 text-xs text-muted-foreground">(admin)</span>
                )}
              </span>
              <div className="flex gap-2">
                <form action={setSchoolAdmin.bind(null, schoolId, volunteer.id, !isAdminHere)}>
                  <Button type="submit" variant="outline" size="sm">
                    {isAdminHere ? "Remove admin" : "Make admin"}
                  </Button>
                </form>
                <form action={removeVolunteerFromSchool.bind(null, schoolId, volunteer.id)}>
                  <Button type="submit" variant="destructive" size="sm">
                    Remove
                  </Button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
