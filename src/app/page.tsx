// Home page: shows signed-in status (with a sign-out button) or a sign-in
// link, depending on whether a valid session exists.
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>camstreets</CardTitle>
          <CardDescription>
            {user
              ? `Signed in as ${user.email}`
              : "Cambridge school streets volunteer calendar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <form action={signOut}>
              <Button type="submit" variant="outline" className="w-full">
                Sign out
              </Button>
            </form>
          ) : (
            <Link href="/login" className={buttonVariants({ className: "w-full" })}>
              Sign in
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
