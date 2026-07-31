import type { Metadata } from "next";
import { User } from "@supabase/supabase-js";
import type { Tables } from "@/lib/supabase/database.types";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/navbar";
import "./globals.css";

type Volunteer = Tables<"volunteers">;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cambridge School Streets",
  description: "Cambridge school streets volunteer calendar",
};

async function getUser(): Promise<import("@supabase/supabase-js").User | null> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getVolunteer(userId: string): Promise<Volunteer | null> {
 const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: volunteer } = await supabase.from("volunteers").select("*").eq("id", userId).maybeSingle();
  return volunteer;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const volunteer = user ? await getVolunteer(user.id) : null;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar user={user} volunteer={volunteer} />
        {children}
      </body>
    </html>
  );
}
