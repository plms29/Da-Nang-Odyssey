"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Spot } from "@/lib/types";
import { composePhoto, OUTPUT_HEIGHT, OUTPUT_WIDTH } from "./compose";
import { drawFrame } from "./frames";
import { useCamera } from "./useCamera";

export interface PhotoBoothProps {
  spot: Spot;
  mode: "onsite" | "remote";
  onCaptured?: (blob: Blob) => void;
}

type BoothPhase = "idle" | "live" | "countdown" | "review" | "error";

function formatDateIso(date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function PhotoBooth({ spot, mode, onCaptured }: PhotoBoothProps) {
  const {
    stream,
    facingMode,
    error: cameraError,
    isStarting,
    startCamera,
    switchCamera,
    stopCamera,
  } = useCamera("user");

  const [phase, setPhase] = useState<BoothPhase>("idle");
  const [videoReady, setVideoReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>(
    `checkin-${spot.id}-photo.jpg`,
  );
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [canShareFile, setCanShareFile] = useState(false);
  const [usedPhoto, setUsedPhoto] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const usedPhotoRef = useRef(false);
  const mountedRef = useRef(true);

  const isMirrored = facingMode === "user";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Revoke object URL on change and on unmount
  useEffect(() => {
    return () => {
      if (reviewUrl) {
        URL.revokeObjectURL(reviewUrl);
      }
    };
  }, [reviewUrl]);

  // Transition to error state if camera track ends while live/countdown
  useEffect(() => {
    if (cameraError && (phase === "live" || phase === "countdown")) {
      setCountdown(null);
      setVideoReady(false);
      setPhase("error");
    }
  }, [cameraError, phase]);

  // Stop all MediaStream tracks whenever leaving the live/countdown camera view
  useEffect(() => {
    if (phase !== "live" && phase !== "countdown") {
      stopCamera();
    }
  }, [phase, stopCamera]);

  // Attach MediaStream to the <video> element in live/countdown state
  useEffect(() => {
    if (phase !== "live" && phase !== "countdown") {
      return;
    }
    const video = videoRef.current;
    if (!video || !stream) {
      return;
    }
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    const checkReady = () => {
      if (video.videoWidth > 0) {
        setVideoReady(true);
      }
    };
    if (video.videoWidth > 0) {
      setVideoReady(true);
    }
    video.addEventListener("loadedmetadata", checkReady);
    video.addEventListener("playing", checkReady);
    video.addEventListener("resize", checkReady);

    const playPromise = video.play?.();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Handled via user gesture + playsInline + muted
      });
    }

    return () => {
      video.removeEventListener("loadedmetadata", checkReady);
      video.removeEventListener("playing", checkReady);
      video.removeEventListener("resize", checkReady);
    };
  }, [stream, phase]);

  // Draw the cultural frame preview on the transparent canvas overlay
  useEffect(() => {
    if (phase !== "live" && phase !== "countdown") {
      return;
    }
    const canvas = overlayCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let cancelled = false;
    const renderPreviewFrame = () => {
      if (cancelled) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawFrame(ctx, canvas.width, canvas.height, {
        spot,
        mode,
        date: new Date(),
      });
    };

    renderPreviewFrame();

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(renderPreviewFrame).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [phase, spot, mode]);

  const performCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      stopCamera();
      if (!mountedRef.current) {
        return;
      }
      setCountdown(null);
      setCaptureError("Không tìm thấy khung hình camera. Vui lòng thử lại.");
      setPhase("error");
      return;
    }

    try {
      const now = new Date();
      const blob = await composePhoto(video, {
        spot,
        mode,
        mirrored: facingMode === "user",
        date: now,
      });

      if (!mountedRef.current) {
        return;
      }

      // Stop all MediaStream tracks upon leaving live state for review
      stopCamera();

      const nextUrl = URL.createObjectURL(blob);
      const fileName = `checkin-${spot.id}-${formatDateIso(now)}.jpg`;

      let file: File | null = null;
      let shareSupported = false;
      if (typeof File !== "undefined") {
        file = new File([blob], fileName, { type: "image/jpeg" });
        if (typeof navigator !== "undefined") {
          try {
            shareSupported = Boolean(navigator.canShare?.({ files: [file] }));
          } catch {
            shareSupported = false;
          }
        }
      }

      usedPhotoRef.current = false;
      setUsedPhoto(false);
      setCapturedBlob(blob);
      setDownloadName(fileName);
      setShareFile(file);
      setCanShareFile(shareSupported);
      setReviewUrl(nextUrl);
      setCountdown(null);
      setPhase("review");
    } catch {
      if (!mountedRef.current) {
        return;
      }
      stopCamera();
      setCountdown(null);
      setCaptureError("Không thể ghép ảnh check-in. Vui lòng thử lại.");
      setPhase("error");
    }
  }, [facingMode, mode, spot, stopCamera]);

  // 3-2-1 countdown timer
  useEffect(() => {
    if (phase !== "countdown" || countdown === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        void performCapture();
      }
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [phase, countdown, performCapture]);

  async function handleOpenCamera() {
    setCaptureError(null);
    setCountdown(null);
    setVideoReady(false);
    setPhase("live");
    const ok = await startCamera(facingMode);
    if (!mountedRef.current) {
      return;
    }
    if (!ok) {
      setPhase("error");
    }
  }

  async function handleSwitchCamera() {
    if (phase !== "live" || isStarting) {
      return;
    }
    setVideoReady(false);
    const ok = await switchCamera();
    if (!mountedRef.current) {
      return;
    }
    if (!ok) {
      setPhase("error");
    }
  }

  function handleStartCountdown() {
    if (phase !== "live" || !videoReady || isStarting) {
      return;
    }
    setCountdown(3);
    setPhase("countdown");
  }

  async function handleRetake() {
    setReviewUrl(null);
    setCapturedBlob(null);
    setShareFile(null);
    setCanShareFile(false);
    usedPhotoRef.current = false;
    setUsedPhoto(false);
    setCaptureError(null);
    setVideoReady(false);
    setPhase("live");

    const ok = await startCamera(facingMode);
    if (!mountedRef.current) {
      return;
    }
    if (!ok) {
      setPhase("error");
    }
  }

  async function handleShare() {
    if (!shareFile || typeof navigator === "undefined") {
      return;
    }
    try {
      await navigator.share?.({
        files: [shareFile],
        title: spot.name,
      });
    } catch {
      // User dismissed share sheet or share failed
    }
  }

  function handleUsePhoto() {
    if (!capturedBlob || usedPhotoRef.current) {
      return;
    }
    usedPhotoRef.current = true;
    setUsedPhoto(true);
    onCaptured?.(capturedBlob);
  }

  const modeBadgeLabel =
    mode === "onsite" ? "Check-in tại điểm" : "Ghé thăm trực tuyến";
  const modeBadgeClass =
    mode === "onsite"
      ? "border-gold/60 bg-gold/20 text-ink"
      : "border-river/40 bg-river/15 text-river";

  if (phase === "idle") {
    return (
      <section className="space-y-4 rounded-lg border border-ink/15 bg-white/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">{spot.name}</h2>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${modeBadgeClass}`}
          >
            {modeBadgeLabel}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-ink">
          Ứng dụng cần quyền truy cập camera để chụp ảnh lưu niệm cùng khung
          hình văn hóa của <strong>{spot.name}</strong>. Ảnh được xử lý hoàn
          toàn trên thiết bị của bạn và không tải lên máy chủ.
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleOpenCamera}
            disabled={isStarting}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-6 py-2.5 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:opacity-50"
          >
            Mở camera
          </button>
        </div>
      </section>
    );
  }

  if (phase === "error") {
    const errorMessage =
      cameraError ??
      captureError ??
      "Không thể truy cập camera trên thiết bị này. Vui lòng thử lại.";

    return (
      <section
        role="alert"
        className="space-y-4 rounded-lg border border-terracotta/50 bg-white/85 p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">{spot.name}</h2>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${modeBadgeClass}`}
          >
            {modeBadgeLabel}
          </span>
        </div>

        <p className="text-sm font-medium leading-relaxed text-terracotta">
          {errorMessage}
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleOpenCamera}
            disabled={isStarting}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2.5 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:opacity-50"
          >
            Mở camera
          </button>
        </div>
      </section>
    );
  }

  if (phase === "review" && reviewUrl) {
    return (
      <section className="space-y-4 rounded-lg border border-ink/15 bg-white/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-ink">{spot.name}</h2>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${modeBadgeClass}`}
          >
            {modeBadgeLabel}
          </span>
        </div>

        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-lg border border-ink/15 bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={reviewUrl}
            alt={`Ảnh check-in tại ${spot.name}`}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleUsePhoto}
            disabled={usedPhoto}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-terracotta px-4 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:opacity-60"
          >
            Dùng ảnh này
          </button>

          <a
            href={reviewUrl}
            download={downloadName}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Tải ảnh
          </a>

          {canShareFile && (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-river/30 bg-river/10 px-4 py-2 text-sm font-semibold text-river transition-colors hover:bg-river/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Chia sẻ
            </button>
          )}

          <button
            type="button"
            onClick={handleRetake}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Chụp lại
          </button>
        </div>

        {usedPhoto && (
          <p role="status" className="text-xs font-semibold text-river">
            Đã chọn ảnh check-in này.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-ink/15 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ink">{spot.name}</h2>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${modeBadgeClass}`}
        >
          {modeBadgeLabel}
        </span>
      </div>

      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-lg border border-ink/15 bg-ink">
        <video
          ref={videoRef}
          aria-label="Xem trước camera"
          playsInline
          muted
          autoPlay
          onLoadedMetadata={(e) => {
            if (e.currentTarget.videoWidth > 0) {
              setVideoReady(true);
            }
          }}
          onPlaying={(e) => {
            if (e.currentTarget.videoWidth > 0) {
              setVideoReady(true);
            }
          }}
          onResize={(e) => {
            if (e.currentTarget.videoWidth > 0) {
              setVideoReady(true);
            }
          }}
          className={`h-full w-full object-cover ${
            isMirrored ? "-scale-x-100" : ""
          }`}
        />

        <canvas
          ref={overlayCanvasRef}
          width={OUTPUT_WIDTH}
          height={OUTPUT_HEIGHT}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        {(isStarting || !videoReady) && (
          <div
            id="camera-loading-status"
            role="status"
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/80 p-4 text-center text-sm font-semibold text-sand"
          >
            Đang mở camera…
          </div>
        )}

        <div aria-live="assertive" aria-atomic="true" className="sr-only">
          {phase === "countdown" && countdown !== null ? String(countdown) : ""}
        </div>

        {phase === "countdown" && countdown !== null && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/40"
          >
            <span className="text-8xl font-bold text-sand drop-shadow-md">
              {countdown}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSwitchCamera}
          disabled={phase === "countdown" || isStarting}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:opacity-50"
        >
          Đổi camera
        </button>

        <button
          type="button"
          onClick={handleStartCountdown}
          disabled={!videoReady || phase === "countdown" || isStarting}
          aria-describedby={
            !videoReady || isStarting ? "camera-loading-status" : undefined
          }
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-terracotta px-6 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:opacity-50"
        >
          Chụp
        </button>
      </div>
    </section>
  );
}
