"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceRecorderProps {
  maxSeconds: number;
  disabled?: boolean;
  onRecorded: (rec: { blob: Blob; mime: string } | null) => void;
}

type RecorderState = "idle" | "recording" | "recorded";

const PREFERRED_MIMES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
] as const;

function pickSupportedMime(): string | undefined {
  if (
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function"
  ) {
    return undefined;
  }
  for (const candidate of PREFERRED_MIMES) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function toVietnameseRecorderError(err: unknown): string {
  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name?: unknown }).name;
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "Bạn đã từ chối quyền micro. Bạn có thể gõ chữ thay.";
    }
  }
  return "Không thể ghi âm. Bạn có thể gõ chữ thay.";
}

function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export function VoiceRecorder({
  maxSeconds,
  disabled = false,
  onRecorded,
}: VoiceRecorderProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [isStarting, setIsStarting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const onRecordedRef = useRef(onRecorded);
  onRecordedRef.current = onRecorded;

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const autoStopTimerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopTimerRef.current !== null) {
      window.clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }, []);

  // Revoke object URL when recording changes or on unmount.
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Stop all tracks and active recorder on unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      clearTimer();
      const recorder = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        if (recorder.state !== "inactive") {
          try {
            recorder.stop();
          } catch {
            // Ignore stop errors during teardown.
          }
        }
      }
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, [clearTimer]);

  function stopRecording() {
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }
    stopMediaStream(streamRef.current);
    streamRef.current = null;
  }

  async function startRecording() {
    if (disabled || isStarting || recorderState === "recording") {
      return;
    }

    setError(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function" ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Trình duyệt chưa hỗ trợ ghi âm. Bạn có thể gõ chữ thay.");
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsStarting(true);

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        stopMediaStream(stream);
        return;
      }

      const chosenMime = pickSupportedMime();
      const options: MediaRecorderOptions = chosenMime
        ? { mimeType: chosenMime, audioBitsPerSecond: 32000 }
        : { audioBitsPerSecond: 32000 };

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = () => {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        if (recorder.state !== "inactive") {
          try {
            recorder.stop();
          } catch {
            // Ignore stop errors when already failing.
          }
        }
        clearTimer();
        stopMediaStream(streamRef.current);
        streamRef.current = null;
        mediaRecorderRef.current = null;
        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return;
        }
        setIsStarting(false);
        setRecorderState("idle");
        setError("Không thể ghi âm. Bạn có thể gõ chữ thay.");
        setAnnouncement("Đã dừng ghi âm.");
        onRecordedRef.current(null);
      };

      recorder.onstop = () => {
        clearTimer();
        stopMediaStream(streamRef.current);
        streamRef.current = null;
        mediaRecorderRef.current = null;

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        const resolvedMime = recorder.mimeType || chosenMime || "";
        if (!resolvedMime) {
          setRecorderState("idle");
          setError(
            "Không thể ghi âm trên trình duyệt này. Bạn có thể gõ chữ thay.",
          );
          setAnnouncement("Đã dừng ghi âm.");
          return;
        }

        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
        if (totalSize === 0) {
          setRecorderState("idle");
          setError("Không thu được âm thanh, thử lại nhé.");
          setAnnouncement("Đã dừng ghi âm.");
          onRecordedRef.current(null);
          return;
        }

        const blob = new Blob(chunks, { type: resolvedMime });
        const nextUrl = URL.createObjectURL(blob);

        setAudioUrl(nextUrl);
        setRecorderState("recorded");
        setAnnouncement("Đã dừng ghi âm.");
        onRecordedRef.current({ blob, mime: resolvedMime });
      };

      recorder.start();

      let seconds = 0;
      setElapsedSeconds(0);
      setIsStarting(false);
      setRecorderState("recording");
      setAnnouncement(`Bắt đầu ghi âm, tối đa ${maxSeconds} giây.`);

      clearTimer();
      timerRef.current = window.setInterval(() => {
        seconds += 1;
        setElapsedSeconds(Math.min(seconds, maxSeconds));
        const remaining = maxSeconds - seconds;
        if (remaining === 5) {
          setAnnouncement("Còn 5 giây.");
        }
      }, 1000);

      autoStopTimerRef.current = window.setTimeout(
        stopRecording,
        maxSeconds * 1000,
      );
    } catch (err) {
      stopMediaStream(stream);
      streamRef.current = null;
      mediaRecorderRef.current = null;
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setIsStarting(false);
      setRecorderState("idle");
      setError(toVietnameseRecorderError(err));
    }
  }

  function handleReRecord() {
    if (disabled || isStarting) {
      return;
    }
    onRecordedRef.current(null);
    setAudioUrl(null);
    setElapsedSeconds(0);
    setRecorderState("idle");
    void startRecording();
  }

  const remainingSeconds = Math.max(0, maxSeconds - elapsedSeconds);

  return (
    <div className="space-y-3 rounded-md border border-ink/15 bg-sand/60 p-3">
      {recorderState === "idle" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={disabled || isStarting}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStarting ? "Đang mở micro…" : "Ghi âm"}
          </button>
          <span className="text-xs font-medium text-muted">
            0/{maxSeconds} giây (tối đa {maxSeconds} giây)
          </span>
        </div>
      )}

      {recorderState === "recording" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={stopRecording}
            disabled={disabled}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-river px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50"
          >
            Dừng
          </button>
          <div className="text-right text-xs font-medium text-ink">
            <p className="font-semibold text-terracotta">
              Đang ghi: {elapsedSeconds}s / {maxSeconds}s
            </p>
            <p className="text-muted">Còn lại: {remainingSeconds}s</p>
          </div>
        </div>
      )}

      {recorderState === "recorded" && audioUrl && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span className="font-semibold text-ink">Bản ghi âm</span>
            <span>
              {elapsedSeconds}s / {maxSeconds}s
            </span>
          </div>
          <audio
            controls
            src={audioUrl}
            aria-label="Nghe lại bản ghi âm"
            className="w-full"
          />
          <div>
            <button
              type="button"
              onClick={handleReRecord}
              disabled={disabled || isStarting}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ghi lại
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-terracotta">
          {error}
        </p>
      )}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
