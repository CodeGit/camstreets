import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";
import { createSchool } from "./actions";
import SchoolForm from "@/components/schools/schoolForm";

export default async function NewSchoolPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: volunteer } = await supabase
    .from("volunteers")
    .select("is_superuser")
    .eq("id", user.id)
    .maybeSingle();

  if (!volunteer?.is_superuser) {
    redirect("/");
  }
  return (
    <SchoolForm action={createSchool} submitLabel="Create school" error={error} defaultValues={{ city: 'Cambridge' }}/>
  );
}
