"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { haptic } from "@/lib/haptics";

export interface DrawingPadHandle {
  toBase64: () => { mime: "image/png"; data_base64: string };
}

export interface DrawingPadProps {
  disabled?: boolean;
  onChange?: (hasInk: boolean) => void;
}

interface Point {
  x: number;
  y: number;
}

type Stroke = Point[];

const CANVAS_BG_COLOR = "#F6EFE4";
const INK_COLOR = "#2D1E17";
const STROKE_WIDTH = 4;
const MAX_EXPORT_WIDTH = 800;
const FALLBACK_CSS_WIDTH = 400;

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function toNormalizedPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): Point {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0.5, y: 0.5 };
  }
  return {
    x: clamp01((clientX - rect.left) / rect.width),
    y: clamp01((clientY - rect.top) / rect.height),
  };
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  width: number,
  height: number,
) {
  if (stroke.length === 0) return;
  if (stroke.length === 1) {
    const p = stroke[0];
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, STROKE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(stroke[0].x * width, stroke[0].y * height);
  for (let i = 1; i < stroke.length; i += 1) {
    ctx.lineTo(stroke[i].x * width, stroke[i].y * height);
  }
  ctx.stroke();
}

export const DrawingPad = forwardRef<DrawingPadHandle, DrawingPadProps>(
  function DrawingPad({ disabled = false, onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const strokesRef = useRef<Stroke[]>([]);
    const activePointerIdRef = useRef<number | null>(null);
    const sizeRef = useRef({
      width: FALLBACK_CSS_WIDTH,
      height: Math.round((FALLBACK_CSS_WIDTH * 3) / 4),
      dpr: 1,
    });
    const hasInkRef = useRef(false);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const [strokeCount, setStrokeCount] = useState(0);
    const [announcement, setAnnouncement] = useState("");

    const notifyHasInk = useCallback((nextHasInk: boolean) => {
      if (hasInkRef.current !== nextHasInk) {
        hasInkRef.current = nextHasInk;
        onChangeRef.current?.(nextHasInk);
      }
    }, []);

    const redraw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height, dpr } = sizeRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = CANVAS_BG_COLOR;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = INK_COLOR;
      ctx.fillStyle = INK_COLOR;
      ctx.lineWidth = STROKE_WIDTH;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const stroke of strokesRef.current) {
        drawStroke(ctx, stroke, width, height);
      }
    }, []);

    const syncCanvasSize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cssWidth = rect.width > 0 ? rect.width : FALLBACK_CSS_WIDTH;
      const cssHeight =
        rect.height > 0 ? rect.height : Math.round((cssWidth * 3) / 4);
      const dpr =
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

      const nextWidth = Math.max(1, Math.round(cssWidth * dpr));
      const nextHeight = Math.max(1, Math.round(cssHeight * dpr));

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }

      sizeRef.current = { width: cssWidth, height: cssHeight, dpr };
      redraw();
    }, [redraw]);

    useEffect(() => {
      syncCanvasSize();

      const canvas = canvasRef.current;
      if (!canvas) return;

      let observer: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => {
          syncCanvasSize();
        });
        observer.observe(canvas);
      }

      window.addEventListener("resize", syncCanvasSize);
      return () => {
        observer?.disconnect();
        window.removeEventListener("resize", syncCanvasSize);
      };
    }, [syncCanvasSize]);

    useEffect(() => {
      if (disabled) {
        activePointerIdRef.current = null;
      }
    }, [disabled]);

    useImperativeHandle(
      ref,
      () => ({
        toBase64() {
          const canvas = canvasRef.current;
          if (!canvas) {
            return { mime: "image/png", data_base64: "" };
          }

          const sourceWidth = canvas.width || MAX_EXPORT_WIDTH;
          const sourceHeight =
            canvas.height || Math.round((MAX_EXPORT_WIDTH * 3) / 4);

          let dataUrl: string;
          if (sourceWidth <= MAX_EXPORT_WIDTH) {
            dataUrl = canvas.toDataURL("image/png");
          } else {
            const targetWidth = MAX_EXPORT_WIDTH;
            const targetHeight = Math.max(
              1,
              Math.round((sourceHeight * targetWidth) / sourceWidth),
            );
            const offscreen = document.createElement("canvas");
            offscreen.width = targetWidth;
            offscreen.height = targetHeight;
            const offCtx = offscreen.getContext("2d");
            if (offCtx) {
              offCtx.fillStyle = CANVAS_BG_COLOR;
              offCtx.fillRect(0, 0, targetWidth, targetHeight);
              offCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
              dataUrl = offscreen.toDataURL("image/png");
            } else {
              dataUrl = canvas.toDataURL("image/png");
            }
          }

          const prefix = "data:image/png;base64,";
          const commaIndex = dataUrl.indexOf(",");
          const dataBase64 = dataUrl.startsWith(prefix)
            ? dataUrl.slice(prefix.length)
            : commaIndex >= 0
              ? dataUrl.slice(commaIndex + 1)
              : dataUrl;

          return {
            mime: "image/png",
            data_base64: dataBase64,
          };
        },
      }),
      [],
    );

    function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
      if (disabled) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (activePointerIdRef.current !== null) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      activePointerIdRef.current = e.pointerId;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Ignore pointer capture errors on synthetic events.
      }

      const pt = toNormalizedPoint(canvas, e.clientX, e.clientY);
      strokesRef.current.push([pt]);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const { width, height, dpr } = sizeRef.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.strokeStyle = INK_COLOR;
        ctx.fillStyle = INK_COLOR;
        ctx.lineWidth = STROKE_WIDTH;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, STROKE_WIDTH / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      setStrokeCount(strokesRef.current.length);
      notifyHasInk(true);
    }

    function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
      if (disabled || activePointerIdRef.current !== e.pointerId) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const currentStroke = strokesRef.current[strokesRef.current.length - 1];
      if (!currentStroke) return;

      const native = e.nativeEvent;
      const coalesced =
        typeof native.getCoalescedEvents === "function"
          ? native.getCoalescedEvents()
          : [];
      const events = coalesced.length > 0 ? coalesced : [native];

      const ctx = canvas.getContext("2d");
      const { width, height, dpr } = sizeRef.current;
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.strokeStyle = INK_COLOR;
        ctx.lineWidth = STROKE_WIDTH;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }

      let prev = currentStroke[currentStroke.length - 1];
      for (const item of events) {
        const next = toNormalizedPoint(canvas, item.clientX, item.clientY);
        currentStroke.push(next);
        if (ctx && prev) {
          ctx.beginPath();
          ctx.moveTo(prev.x * width, prev.y * height);
          ctx.lineTo(next.x * width, next.y * height);
          ctx.stroke();
        }
        prev = next;
      }
    }

    function finishStroke(e: ReactPointerEvent<HTMLCanvasElement>) {
      if (activePointerIdRef.current !== e.pointerId) return;
      activePointerIdRef.current = null;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore release errors on synthetic events.
      }
      redraw();
    }

    function handleUndo() {
      if (disabled || strokesRef.current.length === 0) return;
      haptic("tap");
      strokesRef.current.pop();
      const nextCount = strokesRef.current.length;
      setStrokeCount(nextCount);
      redraw();
      notifyHasInk(nextCount > 0);
      setAnnouncement(
        nextCount > 0
          ? "Đã hoàn tác nét vẽ cuối."
          : "Đã hoàn tác nét vẽ cuối. Bảng vẽ hiện đang trống.",
      );
    }

    function handleClear() {
      if (disabled || strokesRef.current.length === 0) return;
      haptic("tap");
      strokesRef.current = [];
      setStrokeCount(0);
      redraw();
      notifyHasInk(false);
      setAnnouncement("Đã xóa toàn bộ hình vẽ.");
    }

    return (
      <div className="space-y-2.5">
        <div className="w-full overflow-hidden rounded-md border border-ink/20 bg-sand shadow-inner">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Bảng vẽ hoa văn. Chạm hoặc kéo chuột để vẽ."
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
            onLostPointerCapture={finishStroke}
            style={{ touchAction: "none" }}
            className={`block aspect-[4/3] w-full select-none touch-none ${
              disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={disabled || strokeCount === 0}
              aria-label="Hoàn tác nét vẽ cuối"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hoàn tác
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled || strokeCount === 0}
              aria-label="Xóa toàn bộ bảng vẽ"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50"
            >
              Xóa
            </button>
          </div>
          <span className="text-xs font-medium text-muted">
            {strokeCount > 0 ? `${strokeCount} nét vẽ` : "Chưa có nét vẽ"}
          </span>
        </div>

        <p className="text-xs text-muted">
          Dùng ngón tay, chuột hoặc bút để vẽ vào khung. Nếu không vẽ được, bạn
          vẫn có thể gửi kèm một dòng mô tả bằng chữ ở bên dưới.
        </p>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    );
  },
);
