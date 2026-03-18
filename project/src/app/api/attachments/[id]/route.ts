import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "@/lib/uploads";

/* Controlled route to serve endpoint for attachments
 * Handles sanitizing filenames and in-line display */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Look up attachment in DB
    // Does not use client path
    const result = await pool.query(
      `SELECT * FROM attachments WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    const attachment = result.rows[0];

    // Sanitise filename, strip any path traversal attempts (e.g. ../../etc/passwd)
    const safeFileName = path.basename(attachment.file_path);
    const filePath = path.join(UPLOAD_DIR, safeFileName);

    const fileBuffer = await readFile(filePath);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": attachment.mime_type,
        "Content-Length": attachment.size_bytes.toString(),
        // Tells browser to display inline rather than download
        "Content-Disposition": "inline",
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to serve attachment" },
      { status: 500 }
    );
  }
}