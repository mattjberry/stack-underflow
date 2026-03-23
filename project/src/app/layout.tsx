import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Breadcrumbs from "./components/Breadcrumbs";
import NavAuth from "./components/NavAuth";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import Nav from "@/components/Nav";

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
        <SessionProvider session={session}>
          <Nav />
          <Breadcrumbs />
          <NavAuth />
          <main>
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
