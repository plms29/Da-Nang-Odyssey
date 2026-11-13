import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/judge/route";
import { getLevels } from "@/lib/content";
import type { ExpressStation } from "@/lib/types";

function isVoiceStation(station: { type: string }): station is ExpressStation {
  return (
    station.type === "open_text_or_voice" &&
    "max_seconds" in station &&
    typeof (station as ExpressStation).max_seconds === "number" &&
    ((station as ExpressStation).max_seconds ?? 0) > 0
  );
}

const voiceLevel = getLevels().find((level) => level.stations.some(isVoiceStation));
if (!voiceLevel) {
  throw new Error("Expected a level with an open_text_or_voice station with max_seconds");
}

const voiceStation = voiceLevel.stations.find(isVoiceStation);
if (!voiceStation) {
  throw new Error("Expected a voice station in the selected level");
}

describe("POST /api/judge", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns 413 when content-length header exceeds 2_000_000", async () => {
    const req = new Request("http://x/api/judge", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": "3000000",
      },
      body: JSON.stringify({
        level_id: voiceLevel.id,
        station_id: voiceStation.id,
        text: "Xin chào",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("returns 413 for a text-only body of 70_000 bytes without a content-length header", async () => {
    const body = JSON.stringify({
      level_id: voiceLevel.id,
      station_id: voiceStation.id,
      text: "a".repeat(70_000),
    });
    const req = new Request("http://x/api/judge", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body,
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("returns 400 when audio has an invalid mime type", async () => {
    const req = new Request("http://x/api/judge", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        level_id: voiceLevel.id,
        station_id: voiceStation.id,
        text: "",
        audio: {
          mime: "video/mp4",
          data_base64: "SGVsbG8=",
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 422 without leaking base64 data when Gemini env is unset", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_MODEL", "");

    const sampleBase64 = "U2FtcGxlQXVkaW9EYXRh";
    const req = new Request("http://x/api/judge", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        level_id: voiceLevel.id,
        station_id: voiceStation.id,
        text: "",
        audio: {
          mime: "audio/webm;codecs=opus",
          data_base64: sampleBase64,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const rawText = await res.text();
    expect(rawText).not.toContain(sampleBase64);
    const data = JSON.parse(rawText) as { error?: string };
    expect(data.error).toBe("Chưa chấm được giọng nói, bạn gõ chữ nhé.");
  });

  it("returns 422 without keyword fallback when Gemini env is set and fetch rejects", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network failure");
      }),
    );

    const req = new Request("http://x/api/judge", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        level_id: voiceLevel.id,
        station_id: voiceStation.id,
        text: "",
        audio: {
          mime: "audio/webm",
          data_base64: "SGVsbG8=",
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const data = (await res.json()) as { error?: string; graded_by?: string };
    expect(data.error).toBe("Chưa chấm được giọng nói, bạn gõ chữ nhé.");
    expect(data.graded_by).toBeUndefined();
  });
});
