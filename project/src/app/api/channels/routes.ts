// List all channels and create new
import { Channel } from "@/types/types"
import pool from "@/../../lib/db"
import { NextResponse } from "next/server.js";

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
        const result = await pool.query("")
    } catch (error) {
        console.error(error);
        // add status code
    }
}