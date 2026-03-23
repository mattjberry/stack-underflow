"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import styles from "./Nav.module.css";

export default function Nav() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.SubmitEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.navLeft}>
        <Link href="/" className={styles.navBrand}>Stack Underflow</Link>
        <Link href="/channels" className={styles.navLink}>Channels</Link>
      </div>

      <form className={styles.navSearch} onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts and replies..."
          className={styles.navSearchInput}
        />
        <button type="submit" className={styles.navSearchButton}>
          Search
        </button>
      </form>

      <div className={styles.navRight}>
        {session ? (
          <>
            <span className={styles.navUser}>
              Signed in as {session.user.name}
            </span>
            {session.user.role === "admin" && (
              <Link href="/admin" className={styles.navLink}>Admin Panel</Link>
            )}
            <form onSubmit={async (e) => {
              e.preventDefault();
              await signOut({ callbackUrl: "/" });
            }}>
              <button type="submit" className={styles.navButton}>
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.navLink}>Sign In</Link>
            <Link href="/createaccount" className={styles.navLink}>
              Create Account
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}