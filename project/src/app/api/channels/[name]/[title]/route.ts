import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { Post } from "@/types/types";

// GET details of an individual post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ title: string }> }
) {
  try {
    const { title } = await params;

    // First confirm channel exists
    const post = await pool.query(
      `SELECT id FROM posts WHERE title = $1`,
      [title]
    );

    if (post.rows.length === 0) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    const postId = post.rows[0].id;

    const result = await pool.query<Post>(
      `SELECT
        posts.*,
        users.display_name AS author_name,
        COUNT(replies.id)::int AS reply_count
       FROM posts
       LEFT JOIN users ON users.id = posts.author_id
       LEFT JOIN replies ON replies.post_id = posts.id
       WHERE posts.channel_id = $1
       GROUP BY posts.id, users.display_name
       ORDER BY posts.created_at DESC`,
      [postId]
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}