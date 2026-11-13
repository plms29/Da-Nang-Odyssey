import { NextResponse } from "next/server";
import { captionFor } from "@/lib/caption/caption";
import { getSpots } from "@/lib/content";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 1024;

export async function POST(request: Request) {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    rawBody.length > MAX_BODY_BYTES ||
    new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES
  ) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { spot_id } = body as { spot_id?: unknown };
  if (typeof spot_id !== "string") {
    return NextResponse.json({ error: "spot_id must be a string" }, { status: 400 });
  }

  // Compare against own spot ids directly so prototype keys like `__proto__` never match.
  const spot = getSpots().find((s) => Object.is(s.id, spot_id));
  if (!spot) {
    return NextResponse.json({ error: "Spot not found" }, { status: 400 });
  }

  const result = await captionFor(spot);
  return NextResponse.json(result, { status: 200 });
}
