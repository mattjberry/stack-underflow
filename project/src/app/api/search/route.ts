import { NextResponse } from "next/server";
import pool from "@/lib/db";

const PAGE_SIZE = 10;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const type = searchParams.get("type") ?? "content";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const offset = (page - 1) * PAGE_SIZE;

    let rows: any[] = [];
    let total = 0;

    switch (type) {

      // Query 1: Substring search across posts and replies
      case "content": {
        if (!q) break;
        const result = await pool.query(`
          SELECT
            'post' AS result_type,
            posts.id,
            posts.title,
            posts.body AS snippet,
            users.display_name AS author_name,
            channels.name AS channel_name,
            posts.created_at
          FROM posts
          LEFT JOIN users ON users.id = posts.author_id
          LEFT JOIN channels ON channels.id = posts.channel_id
          WHERE to_tsvector('english', posts.title || ' ' || posts.body)
            @@ plainto_tsquery('english', $1)
            OR posts.title ILIKE $2
            OR posts.body ILIKE $2

          UNION ALL

          SELECT
            'reply' AS result_type,
            replies.id,
            posts.title,
            replies.body AS snippet,
            users.display_name AS author_name,
            channels.name AS channel_name,
            replies.created_at
          FROM replies
          LEFT JOIN posts ON posts.id = replies.post_id
          LEFT JOIN users ON users.id = replies.author_id
          LEFT JOIN channels ON channels.id = posts.channel_id
          WHERE to_tsvector('english', replies.body)
            @@ plainto_tsquery('english', $1)
            OR replies.body ILIKE $2

          ORDER BY created_at DESC
          LIMIT $3 OFFSET $4
        `, [q, `%${q}%`, PAGE_SIZE, offset]);

        const countResult = await pool.query(`
          SELECT COUNT(*) FROM (
            SELECT posts.id FROM posts
            WHERE to_tsvector('english', posts.title || ' ' || posts.body)
              @@ plainto_tsquery('english', $1)
              OR posts.title ILIKE $2
              OR posts.body ILIKE $2
            UNION ALL
            SELECT replies.id FROM replies
            WHERE to_tsvector('english', replies.body)
              @@ plainto_tsquery('english', $1)
              OR replies.body ILIKE $2
          ) AS combined
        `, [q, `%${q}%`]);

        rows = result.rows;
        total = parseInt(countResult.rows[0].count);
        break;
      }

      // Query 2: Content by a specific author
      case "author": {
        if (!q) break;
        const result = await pool.query(`
          SELECT
            'post' AS result_type,
            posts.id,
            posts.title,
            posts.body AS snippet,
            users.display_name AS author_name,
            channels.name AS channel_name,
            posts.created_at
          FROM posts
          LEFT JOIN users ON users.id = posts.author_id
          LEFT JOIN channels ON channels.id = posts.channel_id
          WHERE users.display_name ILIKE $1

          UNION ALL

          SELECT
            'reply' AS result_type,
            replies.id,
            posts.title,
            replies.body AS snippet,
            users.display_name AS author_name,
            channels.name AS channel_name,
            replies.created_at
          FROM replies
          LEFT JOIN posts ON posts.id = replies.post_id
          LEFT JOIN users ON users.id = replies.author_id
          LEFT JOIN channels ON channels.id = posts.channel_id
          WHERE users.display_name ILIKE $1

          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `, [q, PAGE_SIZE, offset]);

        const countResult = await pool.query(`
          SELECT COUNT(*) FROM (
            SELECT posts.id FROM posts
            LEFT JOIN users ON users.id = posts.author_id
            WHERE users.display_name ILIKE $1
            UNION ALL
            SELECT replies.id FROM replies
            LEFT JOIN users ON users.id = replies.author_id
            WHERE users.display_name ILIKE $1
          ) AS combined
        `, [q]);

        rows = result.rows;
        total = parseInt(countResult.rows[0].count);
        break;
      }

      // Query 3: User with most posts
      case "most_posts": {
        const result = await pool.query(`
          SELECT
            users.id,
            users.display_name AS author_name,
            COUNT(posts.id)::int AS post_count
          FROM users
          LEFT JOIN posts ON posts.author_id = users.id
          WHERE users.id != 1
          GROUP BY users.id
          ORDER BY post_count DESC
          LIMIT $1 OFFSET $2
        `, [PAGE_SIZE, offset]);

        const countResult = await pool.query(
          `SELECT COUNT(*) FROM users WHERE id != 1`
        );

        rows = result.rows;
        total = parseInt(countResult.rows[0].count);
        break;
      }

      // Query 4: User with least posts
      case "least_posts": {
        const result = await pool.query(`
          SELECT
            users.id,
            users.display_name AS author_name,
            COUNT(posts.id)::int AS post_count
          FROM users
          LEFT JOIN posts ON posts.author_id = users.id
          WHERE users.id != 1
          GROUP BY users.id
          ORDER BY post_count ASC
          LIMIT $1 OFFSET $2
        `, [PAGE_SIZE, offset]);

        const countResult = await pool.query(
          `SELECT COUNT(*) FROM users WHERE id != 1`
        );

        rows = result.rows;
        total = parseInt(countResult.rows[0].count);
        break;
      }

      // Query 5: Highest ranked content
      case "top_rated": {
        const result = await pool.query(`
          SELECT
            'post' AS result_type,
            posts.id,
            posts.title,
            posts.body AS snippet,
            users.display_name AS author_name,
            channels.name AS channel_name,
            posts.created_at,
            COALESCE(SUM(votes.value), 0)::int AS vote_score
          FROM posts
          LEFT JOIN users ON users.id = posts.author_id
          LEFT JOIN channels ON channels.id = posts.channel_id
          LEFT JOIN votes ON votes.target_id = posts.id
            AND votes.target_type = 'post'
          GROUP BY posts.id, users.display_name, channels.name
          ORDER BY vote_score DESC
          LIMIT $1 OFFSET $2
        `, [PAGE_SIZE, offset]);

        const countResult = await pool.query(
          `SELECT COUNT(*) FROM posts`
        );

        rows = result.rows;
        total = parseInt(countResult.rows[0].count);
        break;
      }

      // Query 6: Lowest ranked content
      case "lowest_rated": {
        const result = await pool.query(`
          SELECT
            'post' AS result_type,
            posts.id,
            posts.title,
            posts.body AS snippet,
            users.display_name AS author_name,
            channels.name AS channel_name,
            posts.created_at,
            COALESCE(SUM(votes.value), 0)::int AS vote_score
          FROM posts
          LEFT JOIN users ON users.id = posts.author_id
          LEFT JOIN channels ON channels.id = posts.channel_id
          LEFT JOIN votes ON votes.target_id = posts.id
            AND votes.target_type = 'post'
          GROUP BY posts.id, users.display_name, channels.name
          ORDER BY vote_score ASC
          LIMIT $1 OFFSET $2
        `, [PAGE_SIZE, offset]);

        const countResult = await pool.query(
          `SELECT COUNT(*) FROM posts`
        );

        rows = result.rows;
        total = parseInt(countResult.rows[0].count);
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid search type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      results: rows,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}