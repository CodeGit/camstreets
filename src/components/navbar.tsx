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
        Log out {volunteer.display_name}
        <LogOut data-icon="inline-end" />
      </Button>
    </form>
  ) : (
    <Link href="/login" className={buttonVariants({ className: "gap-1.5" })}>
      Please log in
      <LogIn data-icon="inline-end" />
    </Link>
);

  const superUserBadge: JSX.Element = volunteer?.is_superuser ? (
    <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
      Superuser
    </span>
  ) : <></>;

  const adminBadge: JSX.Element = volunteer?.is_admin ? (
    <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded">
      Admin
    </span>
  ) : <></>;

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-gray-100 text-black">
      <div className="flex items-center gap-2">
        <span>Cambridge School Streets</span>
        <SchoolSwitcher volunteer={volunteer} onSchoolSelectionAction={switchSchool}/>
      </div>
      <div className="flex items-center gap-2">
        {adminBadge}
        {superUserBadge}
        {logStatusButton}
      </div>
    </nav>
  );
}

export default Navbar;