"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowButton } from "@/components/fx/GlowButton";
import { TiltCard } from "@/components/fx/TiltCard";
import { haptic } from "@/lib/haptics";
import { sharePhoto } from "@/lib/community/photos";
import type { Spot } from "@/lib/types";
import {
  type BgMode,
  captureRawFrame,
  composeFromCanvas,
  OUTPUT_HEIGHT,
  OUTPUT_WIDTH,
} from "./compose";
import { drawFrame } from "./frames";
import { segmentPerson } from "./segment";
import { useCamera } from "./useCamera";

const BG_MODES: { id: BgMode; label: string }[] = [
  { id: "frame", label: "Khung" },
  { id: "world", label: "Phông thế giới" },
  { id: "bg-only", label: "Chỉ giữ phông" },
];

export interface PhotoBoothProps {
  spot: Spot;
  mode: "onsite" | "remote";
  caption?: string;
  onCaptured?: (blob: Blob) => void;
}

type BoothPhase = "idle" | "live" | "countdown" | "review" | "error";

const GLASS_BUTTON_CLASS =
  "fx-glass fx-glass--light inline-flex min-h-11 items-center justify-center rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta";

function formatDateIso(date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildShareMetadata(
  blob: Blob,
  fileName: string,
): { file: File | null; shareSupported: boolean } {
  if (typeof File === "undefined") {
    return { file: null, shareSupported: false };
  }
  const file = new File([blob], fileName, { type: "image/jpeg" });
  let shareSupported = false;
  if (typeof navigator !== "undefined") {
    try {
      shareSupported = Boolean(navigator.canShare?.({ files: [file] }));
    } catch {
      shareSupported = false;
    }
  }
  return { file, shareSupported };
}

export function PhotoBooth({
  spot,
  mode,
  caption,
  onCaptured,
}: PhotoBoothProps) {
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
  const [showFlash, setShowFlash] = useState(false);
  const [bgMode, setBgMode] = useState<BgMode>("frame");
  const [segmenting, setSegmenting] = useState(false);
  const [bgNote, setBgNote] = useState<string | null>(null);
  const [shareToCommunity, setShareToCommunity] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const reducedMotion = Boolean(useReducedMotion());
  const [countdownScope, animateCountdown] = useAnimate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const usedPhotoRef = useRef(false);
  const mountedRef = useRef(true);
  const rawFrameRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  // Bumped on every mode click / retake so only the latest request may update state.
  const bgRunRef = useRef(0);
  const captureDateRef = useRef<Date | null>(null);
  const composedCaptionRef = useRef<string | undefined>(undefined);
  const captionRef = useRef<string | undefined>(caption);
  const prevPhaseRef = useRef<BoothPhase>(phase);
  const reducedMotionRef = useRef(reducedMotion);

  const isMirrored = facingMode === "user";

  useEffect(() => {
    captionRef.current = caption;
  }, [caption]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  // Brief white capture flash when transitioning into review (skipped when reduced motion)
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === "review" && prevPhase !== "review") {
      haptic("tap");
      if (reducedMotionRef.current) {
        return;
      }
      setShowFlash(true);
      const timer = window.setTimeout(() => {
        setShowFlash(false);
      }, 160);
      return () => {
        window.clearTimeout(timer);
      };
    }

    setShowFlash(false);
  }, [phase]);

  // Pop animation per countdown tick without changing React key
  useLayoutEffect(() => {
    if (phase !== "countdown" || countdown === null) {
      return;
    }
    if (reducedMotion || !countdownScope.current) {
      return;
    }
    void animateCountdown(
      countdownScope.current,
      { scale: [0.55, 1.12, 1], opacity: [0, 1, 1] },
      { duration: 0.35, ease: "easeOut" },
    );
  }, [phase, countdown, reducedMotion, animateCountdown, countdownScope]);

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
        caption,
      });
    };

    renderPreviewFrame();

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(renderPreviewFrame).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [phase, spot, mode, caption]);

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
      const activeCaption = captionRef.current;
      const rawCanvas = captureRawFrame(video, facingMode === "user");
      const blob = await composeFromCanvas(rawCanvas, {
        spot,
        mode,
        date: now,
        caption: activeCaption,
      });

      if (!mountedRef.current) {
        return;
      }

      // Stop all MediaStream tracks upon leaving live state for review
      stopCamera();

      rawFrameRef.current = rawCanvas;
      captureDateRef.current = now;
      composedCaptionRef.current = activeCaption;

      const nextUrl = URL.createObjectURL(blob);
      const fileName = `checkin-${spot.id}-${formatDateIso(now)}.jpg`;
      const { file, shareSupported } = buildShareMetadata(blob, fileName);

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

  // Recompose the captured raw frame (debounced 300ms) when caption changes during review
  useEffect(() => {
    if (phase !== "review" || caption === composedCaptionRef.current) {
      return;
    }
    const rawCanvas = rawFrameRef.current;
    const captureDate = captureDateRef.current;
    if (!rawCanvas || !captureDate) {
      return;
    }

    let cancelled = false;
    const run = bgRunRef.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const blob = await composeFromCanvas(rawCanvas, {
            spot,
            mode,
            date: captureDate,
            caption,
            bg: bgMode,
            mask: maskRef.current,
          });
          if (cancelled || run !== bgRunRef.current || !mountedRef.current) {
            return;
          }

          composedCaptionRef.current = caption;
          const nextUrl = URL.createObjectURL(blob);
          const fileName = `checkin-${spot.id}-${formatDateIso(captureDate)}.jpg`;
          const { file, shareSupported } = buildShareMetadata(blob, fileName);

          setCapturedBlob(blob);
          setDownloadName(fileName);
          setShareFile(file);
          setCanShareFile(shareSupported);
          setReviewUrl(nextUrl);
        } catch {
          // Keep the previous composed review photo if recomposition fails
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phase, caption, spot, mode, bgMode]);

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

  async function handleBgMode(next: BgMode) {
    const rawCanvas = rawFrameRef.current;
    const captureDate = captureDateRef.current;
    if (next === bgMode || !rawCanvas || !captureDate) {
      return;
    }
    const run = ++bgRunRef.current;
    setBgNote(null);

    let mask = maskRef.current;
    if (next !== "frame" && !mask) {
      setSegmenting(true);
      mask = await segmentPerson(rawCanvas);
      if (run !== bgRunRef.current || !mountedRef.current) {
        return;
      }
      setSegmenting(false);
      if (!mask) {
        setBgNote("Không tách được phông, giữ ảnh gốc.");
        return;
      }
      maskRef.current = mask;
    }

    try {
      const blob = await composeFromCanvas(rawCanvas, {
        spot,
        mode,
        date: captureDate,
        caption: captionRef.current,
        bg: next,
        mask,
      });
      if (run !== bgRunRef.current || !mountedRef.current) {
        return;
      }
      const fileName = `checkin-${spot.id}-${formatDateIso(captureDate)}.jpg`;
      const { file, shareSupported } = buildShareMetadata(blob, fileName);
      composedCaptionRef.current = captionRef.current;
      setBgMode(next);
      setCapturedBlob(blob);
      setShareFile(file);
      setCanShareFile(shareSupported);
      setReviewUrl(URL.createObjectURL(blob));
    } catch {
      if (run === bgRunRef.current && mountedRef.current) {
        setBgNote("Không ghép được ảnh, giữ ảnh hiện tại.");
      }
    }
  }

  async function handleRetake() {
    bgRunRef.current++;
    maskRef.current = null;
    setBgMode("frame");
    setSegmenting(false);
    setBgNote(null);
    rawFrameRef.current = null;
    captureDateRef.current = null;
    composedCaptionRef.current = undefined;
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
    if (shareToCommunity) {
      void sharePhoto(capturedBlob, spot, caption).then(
        (ok) => setShareNote(ok ? "Đã đăng lên Cộng đồng." : "Không đăng được (cần đăng nhập)."),
      );
    }
  }

  const modeBadgeLabel =
    mode === "onsite" ? "Check-in tại điểm" : "Ghé thăm trực tuyến";
  const modeBadgeClass =
    mode === "onsite"
      ? "border-gold/60 bg-gold/20 text-ink"
      : "border-river/40 bg-river/15 text-river";

  if (phase === "idle") {
    return (
      <GlassPanel
        as="section"
        tone="light"
        className="space-y-4 rounded-2xl p-5"
      >
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
          toàn trên thiết bị của bạn; chỉ khi bạn tick chia sẻ, ảnh mới được đăng lên Cộng đồng.
        </p>

        <div className="pt-1">
          <GlowButton
            type="button"
            onClick={handleOpenCamera}
            disabled={isStarting}
            className="min-h-11 px-6 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mở camera
          </GlowButton>
        </div>
      </GlassPanel>
    );
  }

  if (phase === "error") {
    const errorMessage =
      cameraError ??
      captureError ??
      "Không thể truy cập camera trên thiết bị này. Vui lòng thử lại.";

    return (
      <GlassPanel
        as="section"
        tone="light"
        role="alert"
        className="space-y-4 rounded-2xl border border-terracotta/50 p-5 ring-1 ring-terracotta/25 shadow-[0_10px_30px_-12px_rgba(168,72,37,0.3)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">{spot.name}</h2>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${modeBadgeClass}`}
          >
            {modeBadgeLabel}
          </span>
        </div>

        <p className="rounded-xl border border-terracotta/35 bg-terracotta/10 px-4 py-3 text-sm font-medium leading-relaxed text-terracotta">
          {errorMessage}
        </p>

        <div className="pt-1">
          <GlowButton
            type="button"
            onClick={handleOpenCamera}
            disabled={isStarting}
            className="min-h-11 px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mở camera
          </GlowButton>
        </div>
      </GlassPanel>
    );
  }

  if (phase === "review" && reviewUrl) {
    return (
      <GlassPanel
        as="section"
        tone="light"
        className="space-y-4 rounded-2xl p-4 lg:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-ink">{spot.name}</h2>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${modeBadgeClass}`}
          >
            {modeBadgeLabel}
          </span>
        </div>

        <TiltCard
          max={4}
          className="rounded-2xl border border-white/60 bg-sand/70 p-1.5 shadow-[0_14px_34px_-14px_rgba(31,26,23,0.38)]"
        >
          <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl border border-ink/15 bg-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reviewUrl}
              alt={`Ảnh check-in tại ${spot.name}`}
              className="h-full w-full object-cover"
            />

            {showFlash && !reducedMotion && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 bg-white"
                initial={{ opacity: 0.95 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              />
            )}
          </div>
        </TiltCard>

        <div role="group" aria-label="Kiểu ảnh" className="flex flex-wrap gap-2">
          {BG_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={bgMode === m.id}
              disabled={segmenting || usedPhoto}
              onClick={() => void handleBgMode(m.id)}
              className={`${GLASS_BUTTON_CLASS} ${bgMode === m.id ? "border-ink/60 bg-gold/30 ring-1 ring-ink/40" : ""} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {bgMode === m.id && <span aria-hidden="true">✓&nbsp;</span>}
              {m.label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="min-h-4 text-xs font-medium text-ink/80">
          {segmenting ? "Đang tách phông…" : bgNote}
        </p>

        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={shareToCommunity}
            disabled={usedPhoto}
            onChange={(e) => setShareToCommunity(e.target.checked)}
            className="h-5 w-5"
          />
          Chia sẻ ảnh này lên Cộng đồng (mọi người cùng thấy)
        </label>
        {shareNote && <p role="status" className="text-xs font-medium text-ink/80">{shareNote}</p>}

        <div className="flex flex-wrap items-center gap-2.5">
          <GlowButton
            type="button"
            onClick={handleUsePhoto}
            disabled={usedPhoto}
            className="min-h-11 flex-1 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            Dùng ảnh này
          </GlowButton>

          <a
            href={reviewUrl}
            download={downloadName}
            className={GLASS_BUTTON_CLASS}
          >
            Tải ảnh
          </a>

          {canShareFile && (
            <button
              type="button"
              onClick={handleShare}
              className="fx-glass fx-glass--light inline-flex min-h-11 items-center justify-center rounded-xl border border-river/35 px-4 py-2 text-sm font-semibold text-river transition-colors motion-reduce:transition-none hover:bg-river/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Chia sẻ
            </button>
          )}

          <button
            type="button"
            onClick={handleRetake}
            className={GLASS_BUTTON_CLASS}
          >
            Chụp lại
          </button>
        </div>

        {usedPhoto && (
          <p
            role="status"
            className="rounded-xl border border-river/25 bg-river/10 px-3 py-2 text-xs font-semibold text-river"
          >
            Đã chọn ảnh check-in này.
          </p>
        )}
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      as="section"
      tone="light"
      className="space-y-4 rounded-2xl p-4 lg:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ink">{spot.name}</h2>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${modeBadgeClass}`}
        >
          {modeBadgeLabel}
        </span>
      </div>

      <div className="fx-glass fx-glass--light rounded-2xl p-1.5 shadow-[0_14px_34px_-14px_rgba(31,26,23,0.4)] ring-1 ring-white/40">
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl border border-ink/15 bg-ink">
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
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/80 p-4 text-center text-sm font-semibold text-sand backdrop-blur-sm"
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
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/40 backdrop-blur-[2px]"
            >
              <span
                ref={countdownScope}
                className="inline-block text-8xl font-extrabold tracking-tight text-sand drop-shadow-[0_6px_20px_rgba(31,26,23,0.65)]"
              >
                {countdown}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSwitchCamera}
          disabled={phase === "countdown" || isStarting}
          className={`${GLASS_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Đổi camera
        </button>

        <GlowButton
          type="button"
          onClick={handleStartCountdown}
          disabled={!videoReady || phase === "countdown" || isStarting}
          aria-describedby={
            !videoReady || isStarting ? "camera-loading-status" : undefined
          }
          className="min-h-11 flex-1 px-6 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Chụp
        </GlowButton>
      </div>
    </GlassPanel>
  );
}
