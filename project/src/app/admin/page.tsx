"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AdminUser } from "@/types/types"
import ConfirmDialog from "@/components/ConfirmDialog";
import styles from "./admin.module.css";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);

  // Redirect non-admins immediately
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.replace("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError("Could not load users. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (session?.user.role === "admin") {
      fetchUsers();
    }
  }, [session]);

  async function handleDeleteUser() {
    if (!pendingDelete) return;

    try {
      const res = await fetch(`/api/admin/users/${pendingDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // Remove from list
      setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id));

    } catch (err) {
      setError("Failed to delete user. Please try again.");
    } finally {
      setPendingDelete(null);
    }
  }

  // Don't render anything while checking auth
  if (status === "loading") return <p>Loading...</p>;
  if (!session || session.user.role !== "admin") return null;
  if (loading) return <p>Loading users...</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Panel</h1>

      {error && <p className={styles.error}>{error}</p>}

      <section>
        <h2 className={styles.sectionTitle}>Users</h2>
        {users.length === 0 ? (
          <p className={styles.empty}>No users found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Posts</th>
                <th>Replies</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={user.role === "admin" ? styles.adminRow : ""}
                >
                  <td>{user.id}</td>
                  <td>{user.display_name}</td>
                  <td>
                    <span className={user.role === "admin"
                      ? styles.badgeAdmin
                      : styles.badgeUser}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>{user.post_count}</td>
                  <td>{user.reply_count}</td>
                  <td>
                    {/* Prevent admin from deleting themselves */}
                    {user.id.toString() === session.user.id ? (
                      <span className={styles.selfNote}>You</span>
                    ) : (
                      <button
                        className={styles.deleteButton}
                        onClick={() => setPendingDelete(user)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {pendingDelete && (
        <ConfirmDialog
          message={`Delete user "${pendingDelete.display_name}"?`}
          subMessage="This will remove all their votes. Their posts and replies will remain but show no author."
          onConfirm={handleDeleteUser}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}