import { CircleHelp } from "lucide-react";

// Site-wide footer - just a help contact, an icon rather than visible
// text/address (the mailto: href is still there in the markup either way,
// this is purely a cleaner look, not a spam mitigation). Plain mailto
// (not a form, not gated to logged-in users) was a deliberate choice: help
// is most useful to exactly the people who aren't logged in yet (stuck
// signing up, no magic link, etc), and any spam this draws is Gmail's
// problem to filter rather than ours to build a contact form around.
export default function Footer() {
  return (
    <footer className="mt-auto flex justify-center border-t border-border bg-gray-100 px-4 py-3">
      <a
        href="mailto:help@camstreets.org"
        aria-label="Contact us for help"
        title="Need help? help@camstreets.org"
        className="text-muted-foreground hover:text-foreground"
      >
        <CircleHelp className="h-5 w-5" />
      </a>
    </footer>
  );
}
