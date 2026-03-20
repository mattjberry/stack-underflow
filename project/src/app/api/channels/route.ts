// List all channels and create new
import { Channel } from "@/types/types"
import pool from "@/lib/db"
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";


// GET all
// Returns all channels as a Channel type
export async function GET(request: Request) {
  try {
    const result = await pool.query<Channel>(`
      SELECT 
        channels.*,
        COUNT(posts.id)::int AS post_count
      FROM channels
      LEFT JOIN posts ON posts.channel_id = channels.id
      GROUP BY channels.id
      ORDER BY channels.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

// POST new channel
export async function POST(request: Request) {
    try {
    const body = await request.json();
    const { name, description } = body;

    // Basic validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }
    if (name.trim().length > 50) {
      return NextResponse.json({ error: "Channel name must be under 50 characters" }, { status: 400 });
    }
    if (description && description.trim().length > 500) {
      return NextResponse.json({ error: "Description must be under 500 characters" }, { status: 400 });
    }

    // Validate that channel name is valid characters for the slug
    if (!/^[a-z0-9-_]+$/.test(name.trim())) {
      return NextResponse.json(
        { error: "Channel name can only contain lowercase letters, numbers, hyphens and underscores" },
        { status: 400 }
      );
    }

    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to do this" },
        { status: 401 }
      );
    }
    const createdBy = parseInt(session.user.id);

    const result = await pool.query<Channel>(
      `INSERT INTO channels (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), description?.trim() || null, createdBy]
    );

    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (error: any) {
    // Postgres unique violation code
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A channel with that name already exists" },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}