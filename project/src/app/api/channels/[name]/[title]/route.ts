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