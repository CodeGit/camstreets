"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateSchool(schoolId: number, formData: FormData) {
  const name = formData.get("name");
  const street = formData.get("street");
  const town = formData.get("city");

  if (typeof name !== "string" || !name) {
    redirect(`/schools/${schoolId}/edit?error=missing-name`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("schools")
    .update({
      name,
      street: typeof street === "string" && street ? street : null,
      town: typeof town === "string" && town ? town : null,
    })
    .eq("id", schoolId);

  if (error) {
    redirect(`/schools/${schoolId}/edit?error=update-failed`);
  }

  redirect(`/schools/${schoolId}`);
}
