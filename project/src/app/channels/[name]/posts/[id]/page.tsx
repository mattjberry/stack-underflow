// app/channels/[name]/posts/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Post, Reply, Attachment } from "@/types/types";
import styles from "@/channels/channels.module.css";
import { useSession } from "next-auth/react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useRouter } from "next/navigation";


type PostDetail = Post & {
  replies: Reply[];
  attachments: Attachment[];
}

function AttachmentImage({ attachments, targetType, targetId }: {
  attachments: Attachment[];
  targetType: string;
  targetId: number;
}) {
  const matches = attachments.filter(
    (a) => a.target_type === targetType && a.target_id === targetId
  );
  if (matches.length === 0) return null;

  return (
    <div className={styles.attachments}>
      {matches.map((a) => (
        <img
          key={a.id}
          src={`/api/attachments/${a.id}`}
          alt="Attachment"
          className={styles.attachmentImage}
        />
      ))}
    </div>
  );
}

export default function PostPage() {
  const { name, id } = useParams<{ name: string; id: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const { data: session } = useSession();
  const [pendingDeletePost, setPendingDeletePost] = useState(false);
  const [pendingDeleteReply, setPendingDeleteReply] = useState<Reply | null>(null);
  const router = useRouter();


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

  // Delete post handler — navigates back to channel on success
async function handleDeletePost() {
  try {
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push(`/channels/${name}`);
  } catch (err) {
    setError("Failed to delete post. Please try again.");
  } finally {
    setPendingDeletePost(false);
  }
}

// Delete reply handler
async function handleDeleteReply() {
  if (!pendingDeleteReply) return;
  try {
    const res = await fetch(`/api/admin/replies/${pendingDeleteReply.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    // Remove reply and any nested replies from local state
    setPost((prev) => {
      if (!prev) return prev;
      const removeIds = new Set<number>();
      function collectIds(replyId: number) {
        removeIds.add(replyId);
        prev!.replies
          .filter((r) => r.parent_reply_id === replyId)
          .forEach((r) => collectIds(r.id));
      }
      collectIds(pendingDeleteReply.id);
      return {
        ...prev,
        replies: prev.replies.filter((r) => !removeIds.has(r.id)),
      };
    });
  } catch (err) {
    setError("Failed to delete reply. Please try again.");
  } finally {
    setPendingDeleteReply(null);
  }
}

async function handleReplySubmit(e: React.SubmitEvent, parentReplyId: number | null) {
  e.preventDefault();
  if (!replyBody.trim()) return;

  try {
    const formData = new FormData();
    formData.append("body", replyBody);
    formData.append("parent_reply_id", parentReplyId?.toString() ?? "");
    if (replyFile) formData.append("attachment", replyFile);

    const res = await fetch(`/api/channels/${name}/posts/${id}`, {
      method: "POST",
      // No Content-Type header — let browser set it for FormData
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setPost((prev) =>
      prev ? { ...prev, replies: [...prev.replies, data] } : prev
    );
    setReplyBody("");
    setReplyFile(null);
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
      <div className={styles.formGroup}>
        <label htmlFor={`attachment-${parentReplyId}`}>
          Screenshot (optional)
        </label>
        <input
          id={`attachment-${parentReplyId}`}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)}
        />
        {replyFile && (
          <p className={styles.cardMeta}>
            Selected: {replyFile.name} ({(replyFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.button}>
          Submit Reply
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setReplyingTo(undefined);
            setReplyBody("");
            setReplyFile(null);
          }}
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
            <AttachmentImage
              attachments={post!.attachments}
              targetType="reply"
              targetId={reply.id}
            />
            <div className={styles.cardMeta}>
              {reply.author_name} · {new Date(reply.created_at).toLocaleDateString()}
            </div>
            <div className={styles.cardFooter}>
              <div className={`${styles.votes} ${!session ? styles.votesLocked : ""}`}
                   data-tooltip="Please sign in to vote">
                <button className={styles.voteButton} disabled={!session}>
                  👍
                {/*TODO : Replace these icons lol */}
                </button>
                <span>{formatScore(reply.vote_score)}</span>
                <button className={styles.voteButton} disabled={!session}>
                  👎
                </button>
              </div>
              {session ? (
                <button
                  className={styles.button}
                  onClick={() => setReplyingTo(reply.id)}>
                  Reply
                </button>
              ) : (
                <p className={styles.authPrompt}>Please sign in to reply</p>
              )}
              {session?.user.role === "admin" && (
                <button
                  className={styles.deleteButton}
                  onClick={() => setPendingDeleteReply(reply)}
                >
                  Delete Reply
                </button>
              )}
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
        <AttachmentImage
          attachments={post.attachments}
          targetType="post"
          targetId={post.id}
        />
        <p className={styles.cardMeta}>
          Posted by {post.author_name} ·{" "}
          {new Date(post.created_at).toLocaleDateString()}
        </p>
        <div className={styles.cardFooter}>
          <div className={`${styles.votes} ${!session ? styles.votesLocked : ""}`}
               data-tooltip="Please sign in to vote">
            <button className={styles.voteButton} disabled={!session}>
                👍
            </button>
            { /* TODO change these icons lol */}
            <span>{formatScore(post.vote_score)}</span>
            <button className={styles.voteButton} disabled={!session}>
                👎
            </button>
          </div>
          {session ? (
            <button
              className={styles.button}
              onClick={() => setReplyingTo(null)}
            >
              Reply
            </button>
          ) : (
            <p className={styles.authPrompt}>Please sign in to reply</p>
          )}
          {session?.user.role === "admin" && (
            <button
              className={styles.deleteButton}
              onClick={() => setPendingDeletePost(true)}>
              Delete Post
            </button>
          )}
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

      {pendingDeletePost && (
        <ConfirmDialog
          message="Delete this post?"
          subMessage="This will permanently delete all replies and attachments."
          onConfirm={handleDeletePost}
          onCancel={() => setPendingDeletePost(false)}
        />
      )}

      {pendingDeleteReply && (
        <ConfirmDialog
          message="Delete this reply?"
          subMessage="This will permanently delete any nested replies."
          onConfirm={handleDeleteReply}
          onCancel={() => setPendingDeleteReply(null)}
        />
      )}
    </div>
  );
}