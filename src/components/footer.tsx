import Link from "next/link";
import { CircleHelp } from "lucide-react";

// Site-wide footer - just a help icon, linking to the how-to-volunteer
// guide (app/help/page.tsx), which itself ends with a mailto:help@camstreets.org
// link. Not gated to logged-in users - a deliberate choice, since help is
// most useful to exactly the people who aren't logged in yet (stuck
// signing up, no magic link, etc).
export default function Footer() {
  return (
    <footer className="mt-auto flex justify-center border-t border-border bg-gray-100 px-4 py-3">
      <Link
        href="/help"
        aria-label="How to volunteer / get help"
        title="How to volunteer / get help"
        className="text-muted-foreground hover:text-foreground"
      >
        <CircleHelp className="h-5 w-5" />
      </Link>
    </footer>
  );
}
