import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetType, targetId, value } = body;

    // Validate inputs
    if (targetType !== "post" && targetType !== "reply") {
      return NextResponse.json(
        { error: "targetType must be 'post' or 'reply'" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json(
        { error: "targetId must be a positive integer" },
        { status: 400 }
      );
    }
    if (value !== 1 && value !== -1 && value !== 0) {
      return NextResponse.json(
        { error: "value must be 1, -1, or 0" },
        { status: 400 }
      );
    }

    // Auth check
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to vote" },
        { status: 401 }
      );
    }
    const userId = parseInt(session.user.id);

    // Rate limit: 30 votes per minute per user
    if (!checkRateLimit(`vote:${session.user.id}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "You are voting too quickly, please slow down" },
        { status: 429 }
      );
    }

    // Verify the target exists and get the author
    const table = targetType === "post" ? "posts" : "replies";
    const targetResult = await pool.query(
      `SELECT author_id FROM ${table} WHERE id = $1`,
      [targetId]
    );
    if (targetResult.rows.length === 0) {
      return NextResponse.json(
        { error: `${targetType} not found` },
        { status: 404 }
      );
    }

    // Authors cannot vote on their own content
    if (targetResult.rows[0].author_id === userId) {
      return NextResponse.json(
        { error: "You cannot vote on your own content" },
        { status: 403 }
      );
    }

    // Upsert or delete the vote
    if (value === 0) {
      await pool.query(
        `DELETE FROM votes WHERE user_id = $1 AND target_type = $2 AND target_id = $3`,
        [userId, targetType, targetId]
      );
    } else {
      await pool.query(
        `INSERT INTO votes (user_id, target_type, target_id, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, target_type, target_id)
         DO UPDATE SET value = EXCLUDED.value`,
        [userId, targetType, targetId, value]
      );
    }

    // Return updated score
    const scoreResult = await pool.query(
      `SELECT COALESCE(SUM(value), 0)::int AS vote_score
       FROM votes
       WHERE target_type = $1 AND target_id = $2`,
      [targetType, targetId]
    );

    return NextResponse.json({
      vote_score: scoreResult.rows[0].vote_score,
      user_vote: value,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}
