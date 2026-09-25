// The sign-in page: an email form that triggers signInWithMagicLink, plus
// a status message read from the ?sent / ?error query params it redirects to.
import { Alert, AlertDescription } from "@/components/ui/alert";
import SubmitButton from "@/components/ui/submitButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeReference } from "@/lib/authErrors";
import { signInWithMagicLink } from "./actions";

// One specific message per cause (see lib/authErrors.ts for how a Supabase
// error maps to a key). Keys not listed here fall back to a generic message.
const ERROR_MESSAGES: Record<string, string> = {
  "missing-email": "Enter your email address.",
  "invalid-email": "That doesn't look like a valid email address. Check it for typos and try again.",
  "rate-limited":
    "Too many sign-in emails have been requested. Wait a few minutes and try again. If you already asked for one, check your inbox and spam folder - it stays valid for 24 hours.",
  "service-unreachable": "We couldn't reach the sign-in service. Check your connection and try again.",
  "email-send-failed":
    "We couldn't send the sign-in email. The problem is on our side, not yours - try again in a few minutes.",
  "send-failed": "We couldn't send the sign-in link. Try again in a minute.",
  "link-expired":
    "That sign-in link has expired or has already been used. Each link works once and lasts 24 hours - request a new one below.",
  "wrong-browser":
    "That sign-in link was opened in a different browser or device from the one you asked for it on. Request a new link and open it in the same browser. If your email app opens links in its own built-in browser, copy the link and paste it into your usual browser instead.",
  "callback-failed":
    "That sign-in link didn't work - it may have been cut short when copied, or something went wrong on our side. Request a new link below.",
  "session-expired": "Your session expired - sign in again to continue.",
};

// Errors that are the user's own to fix don't need a "contact us" line.
const SELF_EXPLANATORY = new Set(["missing-email", "invalid-email", "session-expired"]);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; ref?: string }>;
}) {
  const { sent, error, ref } = await searchParams;
  const reference = safeReference(ref);

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            We&apos;ll email you a link to sign in - no password needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent && (
            <Alert>
              <AlertDescription>
                Check your email for a sign-in link.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="space-y-2">
                <p>{ERROR_MESSAGES[error] ?? "Something went wrong signing you in. Try again."}</p>
                {!SELF_EXPLANATORY.has(error) && (
                  <p className="text-xs">
                    Still stuck? Email{" "}
                    <a href="mailto:help@camstreets.org" className="underline underline-offset-2">
                      help@camstreets.org
                    </a>
                    {reference && (
                      <>
                        {" "}
                        and quote <span className="font-mono">{reference}</span>
                      </>
                    )}
                    .
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form action={signInWithMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <SubmitButton className="w-full" pendingText="Sending...">
              Send magic link
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
