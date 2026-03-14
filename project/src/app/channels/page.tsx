// Browse channels page
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Channel } from "@/types/types";

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

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

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    // POST wired up in a later step
    console.log("Submit:", formName, formDescription);
  }

  if (loading) return <p>Loading channels...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Channels</h1>

      {/* Create new button */}
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "+ Create New Channel"}
      </button>

      {/* Inline create form */}
      {showForm && (
        <form onSubmit={handleCreateSubmit}>
          <div>
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
          <div>
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="What is this channel about?"
            />
          </div>
          <button type="submit">Create Channel</button>
        </form>
      )}

      {/* Search bar, wired up later */}
      <div>
        <input type="text" placeholder="Search channels..." disabled />
        <button disabled>Search</button>
      </div>

      {/* Empty state */}
      {channels.length === 0 ? (
        <p>No channels found. Be the first to create one!</p>
      ) : (
        <ul>
          {channels.map((channel) => (
            <li key={channel.id}>
              <Link href={`/channels/${channel.name}`}>
                <h2>{channel.name}</h2>
              </Link>
              <p>{channel.description}</p>
              <p>
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