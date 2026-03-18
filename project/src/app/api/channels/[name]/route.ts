import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { Post } from "@/types/types";
import { validateFile, ALLOWED_MIME_TYPES, UPLOAD_DIR } from "@/lib/uploads";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

// GET all posts for a channel
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

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
        COUNT(replies.id)::int AS reply_count,
        COALESCE(SUM(votes.value), 0)::int AS vote_score
       FROM posts
       LEFT JOIN users ON users.id = posts.author_id
       LEFT JOIN replies ON replies.post_id = posts.id
       LEFT JOIN votes ON votes.target_id = posts.id
         AND votes.target_type = 'post'
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

    // FormData to support file uploads
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const file = formData.get("attachment") as File | null;

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Post title is required" },
        { status: 400 }
      );
    }

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Post content is required" },
        { status: 400 }
      );
    }

    // Validate file if provided
    if (file && file.size > 0) {
      const validationError = validateFile(file);
      if (validationError) {
        return NextResponse.json(
          { error: validationError },
          { status: 400 }
        );
      }
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

    const post = result.rows[0];

    // Handle file upload if present
    if (file && file.size > 0) {
      const ext = ALLOWED_MIME_TYPES[file.type];
      const fileName = `${randomUUID()}${ext}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      await mkdir(UPLOAD_DIR, { recursive: true });

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      await pool.query(
        `INSERT INTO attachments (target_type, target_id, mime_type, size_bytes, file_path)
         VALUES ($1, $2, $3, $4, $5)`,
        ["post", post.id, file.type, file.size, fileName]
      );
    }

    return NextResponse.json(post, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}