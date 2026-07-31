import { LogIn, LogOut } from "lucide-react";
import type { User } from '@supabase/supabase-js';
import type { Tables } from "@/lib/supabase/database.types";
import { Button, buttonVariants } from "@/components/ui/button";
import SchoolSwitcher from "@/components/schoolSwitcher";
import { signOut } from "@/app/actions";
import { JSX } from "react/jsx-runtime";

type Volunteer = Tables<"volunteers">;

function Navbar({ user, volunteer }: { user: User | null; volunteer: Volunteer | null }) {

    const logStatusButton: JSX.Element = volunteer ? 
        (
            <Button>
                Log out {volunteer.display_name}
                <LogOut data-icon="inline-end" />
            </Button>
        )
        : 
        (<Button>
            Please log in
            <LogIn data-icon="inline-end" />
        </Button>);

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
            <span>Cambridge school streets</span>
            <SchoolSwitcher volunteer={volunteer} />
            {adminBadge}
            {superUserBadge}
            {logStatusButton}
        </nav>
    );
}

export default Navbar;