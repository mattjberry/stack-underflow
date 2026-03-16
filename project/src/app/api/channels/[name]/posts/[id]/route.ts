// app/api/channels/[name]/posts/[id]/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { Post, Reply } from "@/types/types";

// Type used only here for a Post, its votes, and a list of Replies
type PostDetail = Post & {
  vote_score: number;
  replies: Reply[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string; id: string }> }
) {
  try {
    const { id } = await params;

    // Get post details + net vote score in one query
    const postResult = await pool.query<Post>(
      `SELECT
        posts.*,
        users.display_name AS author_name,
        COALESCE(SUM(votes.value), 0)::int AS vote_score
       FROM posts
       LEFT JOIN users ON users.id = posts.author_id
       LEFT JOIN votes ON votes.target_id = posts.id
         AND votes.target_type = 'post'
       WHERE posts.id = $1
       GROUP BY posts.id, users.display_name`,
      [id]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Get all replies for this post + their vote scores
    const repliesResult = await pool.query<Reply>(
      `SELECT
        replies.*,
        users.display_name AS author_name,
        COALESCE(SUM(votes.value), 0)::int AS vote_score
       FROM replies
       LEFT JOIN users ON users.id = replies.author_id
       LEFT JOIN votes ON votes.target_id = replies.id
         AND votes.target_type = 'reply'
       WHERE replies.post_id = $1
       GROUP BY replies.id, users.display_name
       ORDER BY replies.created_at ASC`,
      [id]
    );

    const response: PostDetail = {
      ...postResult.rows[0],
      replies: repliesResult.rows,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// Create a new reply
export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string; id: string }> }
) {
  try {
    // post_id comes directly from the URL param [id]
    const { id: postId } = await params;
    const body = await request.json();

    // Replies have body not title/content
    // parent_reply_id comes from the request body — null if replying to the post
    const { body: replyBody, parent_reply_id } = body;

    if (!replyBody || typeof replyBody !== "string" || replyBody.trim() === "") {
      return NextResponse.json(
        { error: "Reply body is required" },
        { status: 400 }
      );
    }

    // Confirm post exists
    const post = await pool.query(
      `SELECT id FROM posts WHERE id = $1`,  // query posts not channels
      [postId]
    );

    if (post.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // If a parent_reply_id was provided, confirm that reply actually exists
    if (parent_reply_id !== null && parent_reply_id !== undefined) {
      const parentReply = await pool.query(
        `SELECT id FROM replies WHERE id = $1`,
        [parent_reply_id]
      );
      if (parentReply.rows.length === 0) {
        return NextResponse.json(
          { error: "Parent reply not found" },
          { status: 404 }
        );
      }
    }

    // TODO: replace with real user id from auth session
    const authorId = 1;

    const result = await pool.query<Reply>(
      `INSERT INTO replies (post_id, parent_reply_id, author_id, body)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        postId,
        parent_reply_id ?? null,  // null = top level reply to post
        authorId,
        replyBody.trim()
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}