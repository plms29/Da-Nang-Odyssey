import { requireUser } from "@/lib/supabase/requireUser";
import { NextResponse } from "next/server";
import { getLevel } from "@/lib/content";
import { MAX_AUDIO_REQUEST_BYTES, validateAudio, validateImage } from "@/lib/judge/audio";
import { gradeDrawingFallback, gradeFallback } from "@/lib/judge/fallback";
import { gradeWithGemini } from "@/lib/judge/gemini";
import type { ExpressStation, JudgeRequest } from "@/lib/types";

export const runtime = "nodejs";

function isExpressStation(station: { type: string }): station is ExpressStation {
  return station.type === "open_text_or_voice" || station.type === "open_drawing";
}

const MAX_CONTENT_LENGTH_BYTES = 65536;
const VOICE_GRADE_ERROR_MESSAGE = "Chưa chấm được giọng nói, bạn gõ chữ nhé.";

export async function POST(request: Request) {
  const denied = await requireUser(request);
  if (denied) return denied;

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > MAX_AUDIO_REQUEST_BYTES) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
  }

  if (!request.body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const chunks: Uint8Array[] = [];
  let rawBytes = 0;

  try {
    const reader = request.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      rawBytes += value.byteLength;
      if (rawBytes > MAX_AUDIO_REQUEST_BYTES) {
        await reader.cancel().catch(() => undefined);
        return NextResponse.json({ error: "Request body too large" }, { status: 413 });
      }
      chunks.push(value);
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const combined = new Uint8Array(rawBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const rawBody = new TextDecoder().decode(combined);

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { level_id, station_id, text, audio, image } = body as Partial<
    Record<keyof JudgeRequest, unknown>
  >;

  // `audio: null` is treated as present and is rejected by validateAudio.
  const hasAudioField = audio !== undefined;
  const hasImageField = image !== undefined;
  const hasMedia = hasAudioField || hasImageField;
  if (!hasMedia && rawBytes > MAX_CONTENT_LENGTH_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  if (
    typeof level_id !== "string" ||
    typeof station_id !== "string" ||
    (hasMedia ? text !== undefined && typeof text !== "string" : typeof text !== "string")
  ) {
    return NextResponse.json(
      { error: "level_id, station_id, and text must be strings" },
      { status: 400 },
    );
  }

  const safeText = typeof text === "string" ? text : "";

  const level = getLevel(level_id);
  if (!level) {
    return NextResponse.json({ error: "Level not found" }, { status: 400 });
  }

  const station = level.stations.find((s) => s.id === station_id);
  if (!station || !isExpressStation(station)) {
    return NextResponse.json({ error: "Express station not found in level" }, { status: 400 });
  }

  if (safeText.length > station.max_chars) {
    return NextResponse.json(
      { error: `Answer exceeds maximum length of ${station.max_chars} characters` },
      { status: 400 },
    );
  }

  if (hasAudioField) {
    const audioError = validateAudio(audio, station);
    if (audioError !== null) {
      return NextResponse.json({ error: audioError }, { status: 400 });
    }
  }

  if (hasAudioField && hasImageField) {
    return NextResponse.json({ error: "Send audio or image, not both" }, { status: 400 });
  }

  if (hasImageField) {
    const imageError = validateImage(image, station);
    if (imageError !== null) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }
  }

  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY?.trim() && process.env.GEMINI_MODEL?.trim(),
  );

  if (hasAudioField) {
    if (!hasGemini) {
      return NextResponse.json({ error: VOICE_GRADE_ERROR_MESSAGE }, { status: 422 });
    }
    try {
      const result = await gradeWithGemini(
        level,
        station,
        safeText,
        audio as NonNullable<JudgeRequest["audio"]>,
      );
      return NextResponse.json(result);
    } catch {
      // Never fall back to keyword grading for audio; never log audio.
      return NextResponse.json({ error: VOICE_GRADE_ERROR_MESSAGE }, { status: 422 });
    }
  }

  if (hasImageField) {
    if (hasGemini) {
      try {
        const result = await gradeWithGemini(
          level,
          station,
          safeText,
          undefined,
          image as NonNullable<JudgeRequest["image"]>,
        );
        return NextResponse.json(result);
      } catch {
        // Fall through to the drawing fallback; never log the image.
      }
    }
    return NextResponse.json(gradeDrawingFallback(level, station));
  }

  if (hasGemini) {
    try {
      const result = await gradeWithGemini(level, station, safeText);
      return NextResponse.json(result);
    } catch {
      // Fall back to deterministic grader on any Gemini error; never log answer text.
    }
  }

  return NextResponse.json(gradeFallback(level, station, safeText));
}
