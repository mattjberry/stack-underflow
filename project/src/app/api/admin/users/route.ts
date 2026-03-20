import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/lib/auth";

// GET all users
export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(`
      SELECT
        users.id,
        users.display_name,
        users.role,
        COUNT(DISTINCT posts.id)::int AS post_count,
        COUNT(DISTINCT replies.id)::int AS reply_count
      FROM users
      LEFT JOIN posts ON posts.author_id = users.id
      LEFT JOIN replies ON replies.author_id = users.id
      GROUP BY users.id
      ORDER BY users.id ASC
    `);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}