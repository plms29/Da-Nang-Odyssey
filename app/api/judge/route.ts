import { NextResponse } from "next/server";
import { getLevel } from "@/lib/content";
import { gradeFallback } from "@/lib/judge/fallback";
import { gradeWithGemini } from "@/lib/judge/gemini";
import type { ExpressStation, JudgeRequest } from "@/lib/types";

export const runtime = "nodejs";

function isExpressStation(station: { type: string }): station is ExpressStation {
  return station.type === "open_text_or_voice" || station.type === "open_drawing";
}

const MAX_CONTENT_LENGTH_BYTES = 65536;

export async function POST(request: Request) {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > MAX_CONTENT_LENGTH_BYTES) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { level_id, station_id, text } = body as Partial<Record<keyof JudgeRequest, unknown>>;
  if (
    typeof level_id !== "string" ||
    typeof station_id !== "string" ||
    typeof text !== "string"
  ) {
    return NextResponse.json(
      { error: "level_id, station_id, and text must be strings" },
      { status: 400 },
    );
  }

  const level = getLevel(level_id);
  if (!level) {
    return NextResponse.json({ error: "Level not found" }, { status: 400 });
  }

  const station = level.stations.find((s) => s.id === station_id);
  if (!station || !isExpressStation(station)) {
    return NextResponse.json({ error: "Express station not found in level" }, { status: 400 });
  }

  if (text.length > station.max_chars) {
    return NextResponse.json(
      { error: `Answer exceeds maximum length of ${station.max_chars} characters` },
      { status: 400 },
    );
  }

  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY?.trim() && process.env.GEMINI_MODEL?.trim(),
  );

  if (hasGemini) {
    try {
      const result = await gradeWithGemini(level, station, text);
      return NextResponse.json(result);
    } catch {
      // Fall back to deterministic grader on any Gemini error; never log answer text.
    }
  }

  return NextResponse.json(gradeFallback(level, station, text));
}
