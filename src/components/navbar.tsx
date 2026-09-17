"use client";
import { JSX } from "react/jsx-runtime";
import { LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Tables } from "@/lib/supabase/database.types";
import { buttonVariants } from "@/components/ui/button";
import SubmitButton from "@/components/ui/submitButton";
import NavbarSchoolSwitcher from "@/components/navbarSchoolSwitcher";
import { signOut } from "@/app/actions";

// Just what this component and NavbarSchoolSwitcher (which it forwards the
// same object to) actually read - not the full volunteers row. No `user` prop
// either: it used to take one (the Supabase auth User) but never actually
// read it anywhere in the body - `volunteer` alone already determines
// every branch below.
type NavbarVolunteer = Pick<Tables<"volunteers">, "id" | "display_name" | "preferred_school_id">;

function Navbar({ volunteer }: { volunteer: NavbarVolunteer | null }) {
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
      <SubmitButton pendingText="Logging out...">
        Log out <span className="hidden sm:inline">{volunteer.display_name}</span>
        <LogOut data-icon="inline-end" />
      </SubmitButton>
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
    // A single flex-wrap row, not two fixed rows - on a wide enough screen
    // everything fits on one line (order below puts the buttons last so it
    // reads Logo / View timetable / Buttons), and only the timetable group
    // drops to its own full-width second line below `sm`, where the
    // school name would otherwise truncate hard squeezed next to the logo.
    <nav className="flex flex-wrap items-center justify-between gap-2 bg-gray-100 px-4 py-2 text-black">
      <Link href="/" className="shrink-0 whitespace-nowrap font-logo text-xl font-semibold tracking-wide">
        Cambridge School Streets
      </Link>
      <div className="flex items-center gap-2 sm:order-last">
        {dashboardLink}
        {logStatusButton}
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <span className="shrink-0 text-sm font-medium text-muted-foreground">View timetable:</span>
        <NavbarSchoolSwitcher volunteer={volunteer} onSchoolSelectionAction={switchSchool}/>
      </div>
    </nav>
  );
}

export default Navbar;