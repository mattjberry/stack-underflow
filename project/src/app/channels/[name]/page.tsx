"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Post } from "@/types/types";
import styles from "../channels.module.css";
import { useSession } from "next-auth/react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Spinner from "@/components/Spinner";


export default function ChannelPage() {
  const { name } = useParams<{ name: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const { data: session, status } = useSession();
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null);


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

    setPosts((prev) => [
      {
        ...data,
        vote_score: 0,
        user_vote: 0,
        reply_count: 0,
        author_name: session?.user.name ?? "You",
      },
      ...prev
    ]);
    setFormTitle("");
    setFormContent("");
    setFormFile(null);
    setShowForm(false);

  } catch (err) {
    setError("Failed to create post. Please try again.");
  }
}

// delete post handler 
async function handleDeletePost() {
  if (!pendingDelete) return;
  try {
    const res = await fetch(`/api/admin/posts/${pendingDelete.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== pendingDelete.id));
  } catch (err) {
    setError("Failed to delete post. Please try again.");
  } finally {
    setPendingDelete(null);
  }
}

  if (loading) return <Spinner message="Loading posts..." />;

  return (
    <div className={styles.container}>
    <div className={styles.eyebrow}>Stack Underflow · Programming Q&amp;A</div>

      <div className={styles.header}>
        <h1 className={styles.title}>{name}</h1>
        {status === "authenticated" ? (
           <button
            className={styles.button}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ New Post"}
          </button>
        ) : (
          <p className={styles.authPrompt}>Please sign in to create a post</p>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* Inline create form */}
      {status === "authenticated" && showForm && (
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

      <br></br>

      {/* Empty state */}
      {posts.length === 0 ? (
        <p className={styles.empty}>
          No posts yet. Be the first to ask something!
        </p>
      ) : (

        <ul className={styles.list}>
          {posts.map((post, index) => (
            <li key={post.id} className={styles.card}>
            <div className={styles.cardIndex}>{index + 1}</div>
            <div className={styles.cardBody}>
              <Link href={`/channels/${name}/posts/${post.id}`}>
                <h2 className={styles.cardTitle}>{post.title}</h2>
              </Link>
              <p className={styles.cardDescription}>{post.body}</p>
            </div>
            <div className={styles.postMeta}>
              <p className={styles.cardMeta}>
                By {post.author_name} ·{" "}
                {new Date(post.created_at).toLocaleDateString()} ·{" "}
                {post.reply_count} replies ·{" "}
                {post.vote_score > 0 ? `+${post.vote_score}` : post.vote_score}
              </p>
              {session?.user.role === "admin" && (
                <button
                  className={styles.deleteButton}
                  onClick={() => setPendingDelete(post)}
                >
                  Delete Post
                </button>
              )}
            </div>
          </li>

          ))}
        </ul>
      )}
      {pendingDelete && (
        <ConfirmDialog
          message={`Delete post "${pendingDelete.title}"?`}
          subMessage="This will permanently delete all replies to this post."
          onConfirm={handleDeletePost}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}