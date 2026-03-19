import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

// POST handling for new user signup
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validation
    if (!username || typeof username !== "string" || username.trim() === "") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (username.trim().length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if username already taken
    const existing = await pool.query(
      `SELECT id FROM users WHERE display_name = $1`,
      [username.trim()]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    // Hash password, 12 rounds is a good balance of security and speed
    // we going round for round
    // we going band for band
    // I just emptied the clip
    // Drop top the new whip
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (display_name, password_hash, role)
       VALUES ($1, $2, 'user')
       RETURNING id, display_name, role`,
      [username.trim(), passwordHash]
    );

    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}