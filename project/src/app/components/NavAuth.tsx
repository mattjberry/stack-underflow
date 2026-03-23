"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NavAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status !== "authenticated") return null;

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <span>Signed in as {session!.user.name}</span>
      {session!.user.role === "admin" && (
        <Link href="/admin">Admin Panel</Link>
      )}
      <button onClick={handleSignOut}>Sign Out</button>
    </>
  );
}
