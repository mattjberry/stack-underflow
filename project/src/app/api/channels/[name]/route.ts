import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { Post } from "@/types/types";

// GET all posts for a channel
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    // First confirm channel exists
    const channel = await pool.query(
      `SELECT id FROM channels WHERE name = $1`,
      [name]
    );

    if (channel.rows.length === 0) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    const channelId = channel.rows[0].id;

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
      [channelId]
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST new post in a channel
export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const body = await request.json();
    const { title, content } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Post title is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Post content is required" },
        { status: 400 }
      );
    }

    // Get channel id from name
    const channel = await pool.query(
      `SELECT id FROM channels WHERE name = $1`,
      [name]
    );

    if (channel.rows.length === 0) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    const channelId = channel.rows[0].id;

    // TODO: replace with real user id from auth session
    const authorId = 1;

    const result = await pool.query<Post>(
      `INSERT INTO posts (channel_id, author_id, title, body)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [channelId, authorId, title.trim(), content.trim()]
    );

    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}