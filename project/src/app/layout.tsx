import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Breadcrumbs from "./components/Breadcrumbs";
import { SessionProvider } from "next-auth/react";
import { redirect } from "next/dist/server/api-utils";
import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stack Underflow",
  description: "Stack Overflow clone created for CMPT353 - Full Stack Development",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await auth();

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SessionProvider>
          <nav>
            <Breadcrumbs />
            {session ? (
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}>
                <span>Signed in as {session.user.name}</span>
                <button type="submit">Sign Out</button>
              </form>
            ) : null}
          </nav>
          
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
