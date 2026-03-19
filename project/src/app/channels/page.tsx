// Browse channels page
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Channel } from "@/types/types";
import styles from "./channels.module.css";
import { useSession } from "next-auth/react";


export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const { data: session } = useSession();

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

  if (loading) return <p>Loading channels...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Channels</h1>

        <hr></hr>
        <br></br>

        {session ? (
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

      {/* Create new button */}
      <button className={styles.button} onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "+ Create New Channel"}
      </button>

      <br></br>

      {/* Inline create form */}
      {session && showForm && (
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

      <br></br>

      {/* Search bar, wired up later */}
      <div className={styles.search}>
        <input type="text" placeholder="Search channels..." disabled />
        <button disabled className={styles.button}>Search</button>
      </div>

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
              <p className={styles.cardMeta}>
                Created on {new Date(channel.created_at).toLocaleDateString()}
              </p>
              <p>{channel.post_count} posts</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}