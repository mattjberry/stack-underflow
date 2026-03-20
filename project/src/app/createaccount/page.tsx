// Create an account
// src/app/createaccount/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login/auth.module.css";  // shared CSS from login

export default function CreateAccountPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    if (/\s/.test(username)) {
      newErrors.username = "Username cannot contain spaces";
    }
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setErrors({});

    // Client-side validation first — no need to hit the server for obvious errors
    if (!validate()) return;

    setLoading(true);

    try {
      // Create the account
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Server-side errors e.g. username already taken
        setErrors({ form: data.error });
        setLoading(false);
        return;
      }

      // Auto sign in after successful signup
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Account created but login failed, shouldn't happen but handle it
        setErrors({ form: "Account created but sign in failed. Please try logging in." });
        setLoading(false);
        return;
      }

      router.push("/channels");
      router.refresh();

    } catch (err) {
      setErrors({ form: "Something went wrong. Please try again." });
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        <h1 className={styles.title}>Create an account</h1>
        <p className={styles.subtitle}>Join Stack Underflow</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
              required
            />
            {errors.username && (
              <p className={styles.fieldError} role="alert">
                {errors.username}
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />
            {errors.password && (
              <p className={styles.fieldError} role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />
            {errors.confirmPassword && (
              <p className={styles.fieldError} role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {errors.form && (
            <p className={styles.error} role="alert">
              {errors.form}
            </p>
          )}

          <button
            className={styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </p>

      </div>
    </div>
  );
}