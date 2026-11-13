import type { ExpressStation } from "@/lib/types";

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/mpeg",
  "audio/wav",
] as const;

export const MAX_AUDIO_DECODED_BYTES = 1_500_000;
export const MAX_AUDIO_REQUEST_BYTES = 2_000_000;

/** Extract the base MIME type (lowercased, without codec or other parameters). */
export function extractBaseMime(mime: string): string {
  return mime.split(";")[0]?.trim().toLowerCase() ?? "";
}

/** Validate a voice recording payload against station eligibility, MIME allowlist, and size cap. */
export function validateAudio(audio: unknown, station: ExpressStation): string | null {
  if (
    station.type !== "open_text_or_voice" ||
    typeof station.max_seconds !== "number" ||
    !Number.isFinite(station.max_seconds) ||
    station.max_seconds <= 0
  ) {
    return "Station does not support voice answers";
  }

  if (typeof audio !== "object" || audio === null || Array.isArray(audio)) {
    return "audio must be an object";
  }

  const { mime, data_base64 } = audio as { mime?: unknown; data_base64?: unknown };
  if (typeof mime !== "string" || typeof data_base64 !== "string") {
    return "audio.mime and audio.data_base64 must be strings";
  }

  if (data_base64.trim().length === 0) {
    return "audio.data_base64 must not be empty";
  }

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data_base64)) {
    return "audio.data_base64 is not valid base64";
  }

  const baseMime = extractBaseMime(mime);
  if (!(ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(baseMime)) {
    return "Unsupported audio mime type";
  }

  const decodedBytes = Math.floor((data_base64.length * 3) / 4);
  if (decodedBytes > MAX_AUDIO_DECODED_BYTES) {
    return "Audio payload exceeds size limit";
  }

  return null;
}
