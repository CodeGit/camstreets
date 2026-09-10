// The sign-in page: an email form that triggers signInWithMagicLink, plus
// a status message read from the ?sent / ?error query params it redirects to.
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithMagicLink } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-email": "Enter your email address.",
  "send-failed": "Something went wrong sending the link. Try again.",
  "callback-failed":
    "That sign-in link didn't work - it may have expired, already been used, or been opened in a different browser than the one you requested it from. Try signing in again.",
  "session-expired": "Your session expired - sign in again to continue.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

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
              <AlertDescription>
                {ERROR_MESSAGES[error] ?? "Something went wrong. Try again."}
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
            <Button type="submit" className="w-full">
              Send magic link
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
