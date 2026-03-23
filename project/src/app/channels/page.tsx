// Browse channels page
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Channel } from "@/types/types";
import styles from "./channels.module.css";
import { useSession } from "next-auth/react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Spinner from "@/components/Spinner"


export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const { data: session, status } = useSession();
  const [pendingDelete, setPendingDelete] = useState<Channel | null>(null);


  useEffect(() => {
    async function fetchChannels() {
      try {
        const res = await fetch("/api/channels");
        if (!res.ok) throw new Error("Failed to fetch channels");
        const data = await res.json();
        setChannels(data);
      } catch (err) {
        setError("Could not load channels. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchChannels();
  }, []);


  // Handler for new channel creation form submit
  async function handleCreateSubmit(e: React.SubmitEvent) {
  e.preventDefault();
  try {
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName, description: formDescription }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    // Add new channel to list and reset form
    setChannels((prev) => [data, ...prev]);
    setFormName("");
    setFormDescription("");
    setShowForm(false);

  } catch (err) {
    setError("Failed to create channel. Please try again.");
  }
}

// delete channel handler
async function handleDeleteChannel() {
  if (!pendingDelete) return;
  try {
    const res = await fetch(`/api/admin/channels/${pendingDelete.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setChannels((prev) => prev.filter((c) => c.id !== pendingDelete.id));
  } catch (err) {
    setError("Failed to delete channel. Please try again.");
  } finally {
    setPendingDelete(null);
  }
}


  if (loading) return <Spinner message="Loading channels..." />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Channels</h1>

        <hr></hr>
        <br></br>

        {status === "authenticated" ? (
          <button
            className={styles.button}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Create New Channel"}
          </button>

          ) : (
            <p className={styles.authPrompt}>Please sign in to create a channel</p>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <br></br>

      {/* Inline create form if logged in */}
      {status === "authenticated" && showForm && (
        <form onSubmit={handleCreateSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Channel Name</label>
            <input
              id="name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. javascript"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="What is this channel about?"
            />
          </div>
          <button type="submit" className={styles.button}>Create Channel</button>
        </form>
      )}

      <hr></hr>

      {/* Empty state */}
      {channels.length === 0 ? (
        <p className={styles.empty}>No channels found. Be the first to create one!</p>
      ) : (
        <ul className={styles.list}>
          {channels.map((channel) => (
            <li key={channel.id} className={styles.card}>
              <Link href={`/channels/${channel.name}`}>
                <h2 className={styles.cardTitle}>{channel.name}</h2>
              </Link>
              <p className={styles.cardDescription}>{channel.description}</p>
              
              <div className={styles.cardFooter}>
                <p className={styles.cardMeta}>
                  Created on {new Date(channel.created_at).toLocaleDateString()}
                  -{" "}
                  {channel.post_count} posts
                </p>
                {status === "authenticated" && session?.user.role === "admin" && (
                  <button
                    className={styles.deleteButton}
                    onClick={() => setPendingDelete(channel)}>
                    Delete Channel
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {pendingDelete && (
        <ConfirmDialog
          message={`Delete channel "${pendingDelete.name}"?`}
          subMessage="This will permanently delete all posts and replies in this channel."
          onConfirm={handleDeleteChannel}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}