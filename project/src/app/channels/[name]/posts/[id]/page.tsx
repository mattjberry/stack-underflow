// app/channels/[name]/posts/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Post, Reply } from "@/types/types";
import styles from "@/channels/channels.module.css";

type PostDetail = Post & { replies: Reply[] };

export default function PostPage() {
  const { name, id } = useParams<{ name: string; id: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track which reply form is open by id, null = post reply form
  const [replyingTo, setReplyingTo] = useState<number | null | undefined>(undefined);
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/channels/${name}/posts/${id}`);
        if (!res.ok) throw new Error("Failed to fetch post");
        const data = await res.json();
        setPost(data);
      } catch (err) {
        setError("Could not load post. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [name, id]);

  async function handleReplySubmit(e: React.FormEvent, parentReplyId: number | null) {
    e.preventDefault();
    if (!replyBody.trim()) return;

    try {
      const res = await fetch(`/api/channels/${name}/posts/${id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody, parent_reply_id: parentReplyId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      // Append new reply and reset form
      setPost((prev) =>
        prev ? { ...prev, replies: [...prev.replies, data] } : prev
      );
      setReplyBody("");
      setReplyingTo(undefined);

    } catch (err) {
      setError("Failed to post reply. Please try again.");
    }
  }

  function formatScore(score: number) {
    if (score > 0) return `+${score}`;
    return `${score}`;
  }

  function renderReplyForm(parentReplyId: number | null) {
    return (
      <form
        className={styles.form}
        onSubmit={(e) => handleReplySubmit(e, parentReplyId)}
      >
        <div className={styles.formGroup}>
          <label htmlFor={`reply-${parentReplyId}`}>Your Reply</label>
          <textarea
            id={`reply-${parentReplyId}`}
            rows={3}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write your reply..."
            required
          />
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.button}>
            Submit Reply
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => { setReplyingTo(undefined); setReplyBody(""); }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  function renderReplies(replies: Reply[], parentId: number | null = null, depth = 0) {
    const filtered = replies.filter((r) => r.parent_reply_id === parentId);
    if (filtered.length === 0) return null;

    return (
      <ul className={styles.list} style={{ paddingLeft: depth > 0 ? "1.5rem" : "0" }}>
        {filtered.map((reply) => (
          <li key={reply.id} className={styles.card}>
            <p>{reply.body}</p>
            <div className={styles.cardMeta}>
              {reply.author_name} · {new Date(reply.created_at).toLocaleDateString()}
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.votes}>
                <button className={styles.voteButton}>👍</button>
                <span>{formatScore(reply.vote_score)}</span>
                <button className={styles.voteButton}>👎</button>
              </div>
              <button
                className={styles.button}
                onClick={() => setReplyingTo(reply.id)}
              >
                Reply
              </button>
            </div>

            {/* Reply form for this reply */}
            {replyingTo === reply.id && renderReplyForm(reply.id)}

            {/* Nested replies */}
            {renderReplies(replies, reply.id, depth + 1)}
          </li>
        ))}
      </ul>
    );
  }

  if (loading) return <p>Loading post...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!post) return <p className={styles.empty}>Post not found.</p>;

  return (
    <div className={styles.container}>

      {/* Main post card */}
      <div className={styles.card}>
        <h1 className={styles.cardTitle}>{post.title}</h1>
        <p>{post.body}</p>
        <p className={styles.cardMeta}>
          Posted by {post.author_name} ·{" "}
          {new Date(post.created_at).toLocaleDateString()}
        </p>
        <div className={styles.cardFooter}>
          <div className={styles.votes}>
            <button className={styles.voteButton}>👍</button>
            <span>{formatScore(post.vote_score)}</span>
            <button className={styles.voteButton}>👎</button>
          </div>
          <button
            className={styles.button}
            onClick={() => setReplyingTo(null)}
          >
            Reply
          </button>
        </div>

        {/* Reply form for main post */}
        {replyingTo === null && renderReplyForm(null)}
      </div>

      {/* Replies section */}
      <h2 className={styles.title}>
        Replies ({post.replies.length})
      </h2>

      {post.replies.length === 0 ? (
        <p className={styles.empty}>
          No replies yet. Be the first to respond!
        </p>
      ) : (
        renderReplies(post.replies)
      )}
    </div>
  );
}