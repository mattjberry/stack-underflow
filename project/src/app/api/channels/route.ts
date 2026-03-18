// List all channels and create new
import { Channel } from "@/types/types"
import pool from "@/lib/db"
import { NextResponse } from "next/server";

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

    // TODO: replace with real user id from auth session
    const createdBy = 1;

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