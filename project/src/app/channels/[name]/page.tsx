"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Post } from "@/types/types";
import styles from "../channels.module.css";
import { useSession } from "next-auth/react";

export default function ChannelPage() {
  const { name } = useParams<{ name: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`/api/channels/${name}`);
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        setError("Could not load posts. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [name]);


  const [formFile, setFormFile] = useState<File | null>(null);

async function handleCreateSubmit(e: React.SubmitEvent) {
  e.preventDefault();
  try {
    // use FormData to support file uploads
    const formData = new FormData();
    formData.append("title", formTitle);
    formData.append("content", formContent);
    if (formFile) formData.append("attachment", formFile);

    const res = await fetch(`/api/channels/${name}`, {
      method: "POST",
      // No Content-Type header, browser sets it automatically
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setPosts((prev) => [data, ...prev]);
    setFormTitle("");
    setFormContent("");
    setFormFile(null);
    setShowForm(false);

  } catch (err) {
    setError("Failed to create post. Please try again.");
  }
}

  if (loading) return <p>Loading posts...</p>;

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <h1 className={styles.title}>{name}</h1>
        {session ? (
           <button
            className={styles.button}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ New Post"}
          </button>
        ) : (
          <p className={styles.authPrompt}>Please sign in to create a post</p>
        )}
        <button
          className={styles.button}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ New Post"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* Inline create form */}
      {session && showForm && (
        <form className={styles.form} onSubmit={handleCreateSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Why does my useEffect run twice?"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              rows={5}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Describe your question in detail..."
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="attachment">Screenshot (optional)</label>
            <input
              id="attachment"
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
            />
            {formFile && (
              <p className={styles.cardMeta}>
                Selected: {formFile.name} ({(formFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          <button className={styles.button} type="submit">
            Create Post
          </button>
        </form>
      )}

      {/* Search bar - wired up later */}
      <div className={styles.search}>
        <input type="text" placeholder="Search posts..." disabled />
        <button className={styles.button} disabled>Search</button>
      </div>

      {/* Empty state */}
      {posts.length === 0 ? (
        <p className={styles.empty}>
          No posts yet. Be the first to ask something!
        </p>
      ) : (
        <ul className={styles.list}>
          {posts.map((post) => (
            <li key={post.id} className={styles.card}>
              <Link href={`/channels/${name}/posts/${post.id}`}>
                <h2 className={styles.cardTitle}>{post.title}</h2>
              </Link>
              <p className={styles.cardDescription}>{post.body}</p>
              <p className={styles.cardMeta}>
                Posted by {post.author_name} on{" "}
                {new Date(post.created_at).toLocaleDateString()} on{" "}
                {post.reply_count} replies on{" "}
                {post.vote_score > 0 ? `+${post.vote_score}` : post.vote_score}
                {/* above statement display post count, adding an explicit + for positive result. Negative have a - by default */}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}