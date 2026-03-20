import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { Post, Reply, Attachment } from "@/types/types";
import { validateFile, ALLOWED_MIME_TYPES, UPLOAD_DIR } from "@/lib/uploads";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { auth } from "@/lib/auth";

// Type used only here for a Post, its votes, and a list of Replies
type PostDetail = Post & {
  replies: Reply[];
  attachments: Attachment[];
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

    // get all the attachments
    const attachmentsResult = await pool.query(
      `SELECT * FROM attachments 
      WHERE (target_type = 'post' AND target_id = $1)
      OR (target_type = 'reply' AND target_id = ANY(
        SELECT id FROM replies WHERE post_id = $1
      ))`,
      [id]
    );

    const response: PostDetail = {
      ...postResult.rows[0],
      replies: repliesResult.rows,
      attachments: attachmentsResult.rows,
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
    const { id: postId } = await params;

    // Switch from request.json() to formData to support file uploads
    const formData = await request.formData();
    const replyBody = formData.get("body") as string;
    const parentReplyId = formData.get("parent_reply_id");
    const file = formData.get("attachment") as File | null;

    if (!replyBody || replyBody.trim() === "") {
      return NextResponse.json(
        { error: "Reply body is required" },
        { status: 400 }
      );
    }
    if (replyBody.trim().length > 10000) {
      return NextResponse.json({ error: "Reply must be under 10,000 characters" }, { status: 400 });
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

    // Confirm post exists
    const post = await pool.query(
      `SELECT id FROM posts WHERE id = $1`,
      [postId]
    );

    if (post.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Parse parent_reply_id — null if replying to post, number if replying to reply
    const parsedParentId = parentReplyId ? parseInt(parentReplyId as string) : null;

    // If a parent_reply_id was provided, confirm that reply exists
    if (parsedParentId !== null) {
      const parentReply = await pool.query(
        `SELECT id FROM replies WHERE id = $1`,
        [parsedParentId]
      );
      if (parentReply.rows.length === 0) {
        return NextResponse.json(
          { error: "Parent reply not found" },
          { status: 404 }
        );
      }
    }

    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to do this" },
        { status: 401 }
      );
    }
    const authorId = parseInt(session.user.id);

    const result = await pool.query<Reply>(
      `INSERT INTO replies (post_id, parent_reply_id, author_id, body)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [postId, parsedParentId, authorId, replyBody.trim()]
    );

    const reply = result.rows[0];

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
        ["reply", reply.id, file.type, file.size, fileName]
      );
    }

    return NextResponse.json(reply, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}