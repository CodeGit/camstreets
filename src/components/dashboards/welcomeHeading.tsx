"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/database.types";
import { updateDisplayName } from "@/app/dashboard/actions";

type Volunteer = Tables<"volunteers">;

export default function WelcomeHeading({ volunteer }: { volunteer: Volunteer | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!volunteer) {
    return <h1 className="text-2xl font-semibold text-foreground">Welcome</h1>;
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-medium text-muted-foreground">
          Welcome, <span className="font-semibold text-foreground">{volunteer.display_name}</span>
        </h1>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex items-center gap-2"
      action={(formData) => {
        startTransition(async () => {
          await updateDisplayName(formData);
          setEditing(false);
          router.refresh();
        });
      }}
    >
      <span className="text-2xl font-semibold text-foreground">Welcome,</span>
      <Input
        name="displayName"
        autoFocus
        defaultValue={volunteer.display_name}
        disabled={isPending}
        className="h-9 max-w-48"
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <Button type="submit" size="sm" disabled={isPending}>
        Save
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => setEditing(false)}
      >
        Cancel
      </Button>
    </form>
  );
}
