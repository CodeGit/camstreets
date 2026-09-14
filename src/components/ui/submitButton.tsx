"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

// A form's submit Button with an automatic pending state, via
// useFormStatus - drop this in wherever a plain `<Button type="submit">`
// sits inside a `<form action={...}>` (a Server Action) and it disables
// itself with a spinner for the duration of that submission, with no
// other wiring needed. Its own "use client" is why this has to be a
// separate component from Button itself: useFormStatus only works in a
// component that's a *descendant* of the form, not the form's own
// Server Component tree, and only Button here needs to cross that
// boundary - the form and its action stay exactly as they were.
//
// Skipped deliberately for the sign-up/cancel dialogs in instanceCard.tsx
// - those submit buttons are wrapped in DialogClose, which closes the
// dialog immediately on click as its own instant feedback, so a spinner
// there would appear on a popup that's already closing.
export default function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants> & { pendingText?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
      {pending && pendingText !== undefined ? pendingText : children}
    </Button>
  );
}
