"use client";
import { JSX } from "react/jsx-runtime";
import { LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from '@supabase/supabase-js';
import type { Tables } from "@/lib/supabase/database.types";
import { Button, buttonVariants } from "@/components/ui/button";
import SchoolSwitcher from "@/components/schoolSwitcher";
import { signOut } from "@/app/actions";

type Volunteer = Tables<"volunteers">;

function Navbar({ user, volunteer }: { user: User | null; volunteer: Volunteer | null }) {
  const router = useRouter();
  const switchSchool = (schoolId: number | null) => {  
    if (schoolId === null) {
      router.push("/");
    } else {
      router.push(`/schools/${schoolId}`);
    }
  }

  const logStatusButton: JSX.Element = volunteer ? (
    <form action={signOut}>
      <Button type="submit">
        Log out <span className="hidden sm:inline">{volunteer.display_name}</span>
        <LogOut data-icon="inline-end" />
      </Button>
    </form>
  ) : (
    <Link href="/login" className={buttonVariants({ className: "gap-1.5" })}>
      Please log in
      <LogIn data-icon="inline-end" />
    </Link>
);

  const dashboardLink: JSX.Element = volunteer ? (
    <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
      Dashboard
    </Link>
  ) : <></>;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-gray-100 text-black">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 whitespace-nowrap font-medium">Cambridge School Streets</span>
        <SchoolSwitcher volunteer={volunteer} onSchoolSelectionAction={switchSchool}/>
      </div>
      <div className="flex items-center gap-2">
        {dashboardLink}
        {logStatusButton}
      </div>
    </nav>
  );
}

export default Navbar;