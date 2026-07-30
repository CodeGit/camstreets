import { LogIn, LogOut } from "lucide-react";
import type { User } from '@supabase/supabase-js';
import { Button, buttonVariants } from "@/components/ui/button";

function Navbar({ user }: { user: User | null   }) {

    return (
        <nav className="flex items-center justify-between px-4 py-2 bg-gray-100 text-black">
            
            <span>Cambridge school streets</span>
            {
                user ? 
                (<Button>
                    Log out {user.email}
                    <LogOut data-icon="inline-end" />
                </Button>)
                : 
                (<Button>
                    Please log in
                    <LogIn data-icon="inline-end" />
                </Button>)
            }
        </nav>
    );
}

export default Navbar;