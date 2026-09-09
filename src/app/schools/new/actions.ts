"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createSchool(formData: FormData) {
  const name = formData.get("name");
  const street = formData.get("street");
  const town = formData.get("city");

  if (typeof name !== "string" || !name) {
    redirect("/schools/new?error=missing-name");
  }

  const supabase = await createClient();
  const { data: school, error } = await supabase
    .from("schools")
    .insert({
      name,
      street: typeof street === "string" && street ? street : null,
      town: typeof town === "string" && town ? town : null,
    })
    .select()
    .single();

  if (error || !school) {
    redirect("/schools/new?error=create-failed");
  }

  redirect(`/schools/${school.id}`);
}
