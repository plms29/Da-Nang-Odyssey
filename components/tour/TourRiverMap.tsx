"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { GlassPanel } from "@/components/fx/Glass";
import type { Spot } from "@/lib/types";

export interface TourRiverMapProps {
  stops: Spot[];
  activeSpotId: string;
}

interface ProjectedStop {
  stop: Spot;
  index: number;
  x: number;
  y: number;
}

interface RouteSegment {
  x0: number;
  y0: number;
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  x1: number;
  y1: number;
  d: string;
}

const VIEW_W = 400;
const VIEW_H = 300;
const X_MIN = 78;
const X_MAX = 322;
const Y_MIN = 42;
const Y_MAX = 258;
const EPSILON = 1e-6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function truncateLabel(name: string, maxChars = 22): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars - 1).trimEnd()}…`;
}

function projectStops(stops: Spot[]): ProjectedStop[] {
  if (stops.length === 0) return [];
  if (stops.length === 1) {
    return [{ stop: stops[0], index: 0, x: VIEW_W / 2, y: VIEW_H / 2 }];
  }

  const lats = stops.map((s) => s.checkin.lat);
  const lngs = stops.map((s) => s.checkin.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;

  // Draft content may share placeholder coordinates (e.g. 0, 0); keep stops readable along the river.
  if (latSpan < EPSILON && lngSpan < EPSILON) {
    return stops.map((stop, index) => {
      const t = index / (stops.length - 1);
      return {
        stop,
        index,
        x: VIEW_W / 2 + Math.sin(t * Math.PI * 1.6) * 24,
        y: Y_MIN + t * (Y_MAX - Y_MIN),
      };
    });
  }

  return stops.map((stop, index) => {
    const y =
      latSpan < EPSILON
        ? (Y_MIN + Y_MAX) / 2
        : Y_MIN + ((maxLat - stop.checkin.lat) / latSpan) * (Y_MAX - Y_MIN);
    const x =
      lngSpan < EPSILON
        ? (X_MIN + X_MAX) / 2
        : X_MIN + ((stop.checkin.lng - minLng) / lngSpan) * (X_MAX - X_MIN);
    return { stop, index, x, y };
  });
}

function buildSegments(points: ProjectedStop[]): RouteSegment[] {
  const segments: RouteSegment[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy);

    if (len < 1) {
      segments.push({
        x0: p0.x,
        y0: p0.y,
        cx1: p0.x,
        cy1: p0.y,
        cx2: p1.x,
        cy2: p1.y,
        x1: p1.x,
        y1: p1.y,
        d: `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
      });
      continue;
    }

    const nx = -dy / len;
    const ny = dx / len;
    const bend = (i % 2 === 0 ? 1 : -1) * Math.min(18, len * 0.16);

    const cx1 = p0.x + dx * 0.33 + nx * bend;
    const cy1 = p0.y + dy * 0.33 + ny * bend;
    const cx2 = p0.x + dx * 0.67 - nx * bend;
    const cy2 = p0.y + dy * 0.67 - ny * bend;

    segments.push({
      x0: p0.x,
      y0: p0.y,
      cx1,
      cy1,
      cx2,
      cy2,
      x1: p1.x,
      y1: p1.y,
      d: `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
    });
  }
  return segments;
}

function sampleBoatPose(
  points: ProjectedStop[],
  segments: RouteSegment[],
  progress: number,
): { x: number; y: number; tilt: number } {
  if (points.length === 0) {
    return { x: VIEW_W / 2, y: VIEW_H / 2, tilt: 0 };
  }
  if (points.length === 1 || segments.length === 0) {
    return { x: points[0].x, y: points[0].y, tilt: 0 };
  }

  const clamped = clamp(progress, 0, points.length - 1);
  const segIdx = Math.min(Math.floor(clamped), segments.length - 1);
  const u = clamped - segIdx;
  const seg = segments[segIdx];
  const om = 1 - u;

  const x =
    om * om * om * seg.x0 +
    3 * om * om * u * seg.cx1 +
    3 * om * u * u * seg.cx2 +
    u * u * u * seg.x1;
  const y =
    om * om * om * seg.y0 +
    3 * om * om * u * seg.cy1 +
    3 * om * u * u * seg.cy2 +
    u * u * u * seg.y1;

  const tx =
    3 * om * om * (seg.cx1 - seg.x0) +
    6 * om * u * (seg.cx2 - seg.cx1) +
    3 * u * u * (seg.x1 - seg.cx2);

  // Tilt smoothly along horizontal motion while sailing, then level out on arrival.
  const travelWeight = Math.sin(u * Math.PI);
  const tilt = clamp(tx * 0.08, -12, 12) * travelWeight;

  return { x, y, tilt };
}

function poseToString(pose: { x: number; y: number; tilt: number }): string {
  return `translate(${pose.x.toFixed(2)}, ${pose.y.toFixed(2)}) rotate(${pose.tilt.toFixed(2)})`;
}

export function TourRiverMap({ stops, activeSpotId }: TourRiverMapProps) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = {
    paperGrad: `${uid}-paper`,
    paperGrain: `${uid}-grain`,
    riverGrad: `${uid}-river`,
    goldGlow: `${uid}-gold-glow`,
  };

  const prefersReducedMotion = Boolean(useReducedMotion());
  const activeIndex = stops.findIndex((stop) => stop.id === activeSpotId);
  const activeStop = activeIndex >= 0 ? stops[activeIndex] : undefined;
  const targetIndex = activeIndex >= 0 ? activeIndex : 0;

  const points = useMemo(() => projectStops(stops), [stops]);
  const segments = useMemo(() => buildSegments(points), [points]);

  const progress = useMotionValue(targetIndex);
  const boatRef = useRef<SVGGElement | null>(null);
  const pointsRef = useRef(points);
  const segmentsRef = useRef(segments);

  const applyBoatTransform = useCallback((value: number) => {
    const el = boatRef.current;
    if (!el) return;
    const pose = sampleBoatPose(
      pointsRef.current,
      segmentsRef.current,
      value,
    );
    el.setAttribute("transform", poseToString(pose));
  }, []);

  useMotionValueEvent(progress, "change", (latest) => {
    applyBoatTransform(latest);
  });

  useEffect(() => {
    pointsRef.current = points;
    segmentsRef.current = segments;

    const maxIndex = Math.max(0, points.length - 1);
    const boundedTarget = clamp(targetIndex, 0, maxIndex);

    if (prefersReducedMotion) {
      progress.set(boundedTarget);
      applyBoatTransform(boundedTarget);
      return;
    }

    const current = clamp(progress.get(), 0, maxIndex);
    if (current !== progress.get()) {
      progress.set(current);
    }

    if (Math.abs(boundedTarget - current) < 0.001) {
      applyBoatTransform(boundedTarget);
      return;
    }

    const duration = clamp(Math.abs(boundedTarget - current) * 0.8, 0.65, 1.45);
    const controls = animate(progress, boundedTarget, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => {
      controls.stop();
    };
  }, [
    targetIndex,
    points,
    segments,
    prefersReducedMotion,
    progress,
    applyBoatTransform,
  ]);

  const [initialTransform] = useState(() =>
    poseToString(sampleBoatPose(points, segments, targetIndex)),
  );

  const progressLabel =
    stops.length === 0
      ? "Bản đồ sông Hàn: chưa có điểm dừng"
      : activeStop
        ? `Bản đồ sông Hàn: điểm ${activeIndex + 1} trên ${stops.length}, đang nghe ${activeStop.name}`
        : `Bản đồ sông Hàn: ${stops.length} điểm dừng`;

  const nonActivePoints = points.filter((p) => p.index !== activeIndex);
  const activePoint = activeIndex >= 0 ? points[activeIndex] : undefined;

  return (
    <GlassPanel
      as="section"
      tone="light"
      aria-label="Bản đồ lộ trình tour"
      className="rounded-xl border border-ink/15 p-3 lg:p-5"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-river">
            Bản đồ sông Hàn
          </span>
          {stops.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-ink">
              <span>
                {activeIndex >= 0
                  ? `Điểm ${activeIndex + 1}/${stops.length}`
                  : `${stops.length} điểm`}
              </span>
              {activeStop && (
                <span className="hidden sm:inline">
                  · {activeStop.name}
                </span>
              )}
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-ink/15 bg-sand/70">
          <svg
            role="img"
            aria-label={progressLabel}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="block h-auto max-h-64 w-full lg:max-h-none"
          >
            <title>{progressLabel}</title>
            <defs>
              <linearGradient
                id={ids.paperGrad}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#FAF5EC" />
                <stop offset="100%" stopColor="#EFE3CF" />
              </linearGradient>

              <pattern
                id={ids.paperGrain}
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 0 16 L 16 0 M -4 4 L 4 -4 M 12 20 L 20 12"
                  stroke="#5E5148"
                  strokeWidth="0.6"
                  strokeOpacity="0.06"
                />
              </pattern>

              <linearGradient
                id={ids.riverGrad}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#2A668A" stopOpacity="0.32" />
                <stop offset="50%" stopColor="#1F4E6B" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#16394F" stopOpacity="0.42" />
              </linearGradient>

              <filter
                id={ids.goldGlow}
                x="-60%"
                y="-60%"
                width="220%"
                height="220%"
              >
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Parchment background */}
            <rect
              x="0"
              y="0"
              width={VIEW_W}
              height={VIEW_H}
              fill={`url(#${ids.paperGrad})`}
            />
            <rect
              x="0"
              y="0"
              width={VIEW_W}
              height={VIEW_H}
              fill={`url(#${ids.paperGrain})`}
            />

            {/* Hand-drawn map frame border */}
            <rect
              x="8"
              y="8"
              width={VIEW_W - 16}
              height={VIEW_H - 16}
              rx="12"
              fill="none"
              stroke="#1F1A17"
              strokeOpacity="0.16"
              strokeWidth="1.2"
              strokeDasharray="6 3 2 3"
            />

            {/* Hand-drawn Han River flowing vertically (North -> South) */}
            {/* shortcut: sông vẽ cố định, vị trí điểm chỉ tương đối; dùng toạ độ thật của sông nếu cần chính xác */}
            <g aria-hidden="true">
              {/* Soft bank wash */}
              <path
                d="M 183 0 C 174 55, 210 105, 196 155 C 182 205, 168 252, 188 300 L 222 300 C 204 252, 216 205, 230 155 C 244 105, 210 55, 219 0 Z"
                fill="#1F4E6B"
                fillOpacity="0.1"
                stroke="#1F4E6B"
                strokeOpacity="0.12"
                strokeWidth="7"
              />
              {/* Main river channel */}
              <path
                d="M 186 0 C 177 55, 212 105, 198 155 C 184 205, 171 252, 191 300 L 219 300 C 201 252, 213 205, 227 155 C 241 105, 208 55, 216 0 Z"
                fill={`url(#${ids.riverGrad})`}
              />
              {/* Hand-inked west and east banks */}
              <path
                d="M 186 0 C 177 55, 212 105, 198 155 C 184 205, 171 252, 191 300"
                fill="none"
                stroke="#1F4E6B"
                strokeOpacity="0.45"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M 216 0 C 208 55, 241 105, 227 155 C 213 205, 201 252, 219 300"
                fill="none"
                stroke="#1F4E6B"
                strokeOpacity="0.45"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              {/* Subtle water current ripples */}
              <path
                d="M 199 28 C 197 46, 206 62, 207 80 M 212 122 C 210 140, 204 156, 200 174 M 194 214 C 192 234, 196 254, 204 274"
                fill="none"
                stroke="#FAF5EC"
                strokeOpacity="0.55"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeDasharray="10 8"
              />
              {/* Stylized river label */}
              <text
                x="208"
                y="282"
                textAnchor="middle"
                fontSize="9.5"
                fontStyle="italic"
                fontWeight="600"
                fill="#1F4E6B"
                fillOpacity="0.55"
                paintOrder="stroke"
                stroke="#FAF5EC"
                strokeWidth="2.5"
              >
                Sông Hàn
              </text>
            </g>

            {/* North-South compass rose */}
            <g aria-hidden="true" transform="translate(30, 32)" opacity="0.6">
              <circle
                cx="0"
                cy="0"
                r="11"
                fill="#FAF5EC"
                fillOpacity="0.7"
                stroke="#5E5148"
                strokeWidth="1"
              />
              <path d="M 0 -8 L 3 1 L 0 -1 L -3 1 Z" fill="#A84825" />
              <path d="M 0 8 L 2.5 1 L 0 2.5 L -2.5 1 Z" fill="#5E5148" />
              <text
                x="0"
                y="-13"
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="700"
                fill="#1F1A17"
              >
                B
              </text>
              <text
                x="0"
                y="19"
                textAnchor="middle"
                fontSize="7"
                fontWeight="600"
                fill="#5E5148"
              >
                N
              </text>
            </g>

            {/* Route paths connecting stops */}
            <g aria-hidden="true">
              {segments.map((seg, i) => {
                const isTraveled = activeIndex > 0 && i < activeIndex;
                return (
                  <path
                    key={`seg-${i}`}
                    d={seg.d}
                    fill="none"
                    stroke={isTraveled ? "#1F4E6B" : "#5E5148"}
                    strokeWidth={isTraveled ? 2.5 : 1.6}
                    strokeOpacity={isTraveled ? 0.85 : 0.34}
                    strokeDasharray={isTraveled ? undefined : "4 4"}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>

            {/* Non-active stop markers (done = bold, upcoming = faded) */}
            {nonActivePoints.map((point) => {
              const isDone = activeIndex !== -1 && point.index < activeIndex;
              const alignRight = point.x < VIEW_W / 2;
              const labelX = alignRight ? point.x + 13 : point.x - 13;
              const textAnchor = alignRight ? "start" : "end";
              const labelText = truncateLabel(point.stop.name, 20);

              return (
                <g
                  key={point.stop.id}
                  opacity={isDone ? 1 : 0.45}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isDone ? 7.5 : 6.5}
                    fill={isDone ? "#1F4E6B" : "#F6EFE4"}
                    stroke={isDone ? "#1F1A17" : "#5E5148"}
                    strokeWidth={isDone ? 1.5 : 1.2}
                    strokeDasharray={isDone ? undefined : "2 1.5"}
                  />
                  <text
                    x={point.x}
                    y={point.y + 3.2}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="700"
                    fill={isDone ? "#F6EFE4" : "#5E5148"}
                  >
                    {point.index + 1}
                  </text>
                  <text
                    x={labelX}
                    y={point.y + 3.2}
                    textAnchor={textAnchor}
                    fontSize="9.5"
                    fontWeight={isDone ? "600" : "400"}
                    fill={isDone ? "#1F1A17" : "#5E5148"}
                    paintOrder="stroke"
                    stroke="#FAF5EC"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  >
                    {labelText}
                  </text>
                </g>
              );
            })}

            {/* Active stop marker: glowing gold + prominent name label */}
            {activePoint && (
              <g>
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="15"
                  fill="#C99A2E"
                  fillOpacity="0.28"
                  filter={`url(#${ids.goldGlow})`}
                />
                <g transform={`translate(${activePoint.x}, ${activePoint.y})`}>
                  <motion.circle
                    cx={0}
                    cy={0}
                    r="11.5"
                    fill="none"
                    stroke="#C99A2E"
                    strokeWidth="1.8"
                    initial={{ scale: 1, opacity: 0.85 }}
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : {
                            scale: [1, 1.32, 1],
                            opacity: [0.85, 0.2, 0.85],
                          }
                    }
                    transition={
                      prefersReducedMotion
                        ? undefined
                        : {
                            duration: 2.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                    }
                  />
                </g>
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="8.5"
                  fill="#C99A2E"
                  stroke="#1F1A17"
                  strokeWidth="1.6"
                />
                <text
                  x={activePoint.x}
                  y={activePoint.y + 3.3}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#1F1A17"
                >
                  {activePoint.index + 1}
                </text>

                {(() => {
                  const displayName = truncateLabel(activePoint.stop.name, 22);
                  const pillW = Math.min(
                    168,
                    Math.max(66, displayName.length * 6.2 + 18),
                  );
                  const pillH = 20;
                  const alignRight = activePoint.x < VIEW_W / 2;
                  const rectX = alignRight
                    ? Math.min(activePoint.x + 14, VIEW_W - pillW - 12)
                    : Math.max(activePoint.x - 14 - pillW, 12);
                  const rectY = clamp(
                    activePoint.y - pillH / 2,
                    14,
                    VIEW_H - pillH - 14,
                  );

                  return (
                    <g>
                      <rect
                        x={rectX}
                        y={rectY}
                        width={pillW}
                        height={pillH}
                        rx="10"
                        fill="#FAF5EC"
                        stroke="#C99A2E"
                        strokeWidth="1.6"
                      />
                      <text
                        x={rectX + pillW / 2}
                        y={rectY + 13.5}
                        textAnchor="middle"
                        fontSize="10.5"
                        fontWeight="700"
                        fill="#1F1A17"
                      >
                        {displayName}
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Small hand-drawn wooden boat moving smoothly along the connecting route */}
            {points.length > 0 && (
              <g
                ref={boatRef}
                aria-hidden="true"
                transform={initialTransform}
              >
                <g transform="translate(0, -12)">
                  {/* Gentle ripple under keel */}
                  <path
                    d="M -11 5 Q -4 7.5 0 5.5 Q 4 7.5 11 5"
                    fill="none"
                    stroke="#1F4E6B"
                    strokeOpacity="0.55"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />
                  {/* Wooden boat hull */}
                  <path
                    d="M -13 -1 C -9 4.5, 9 4.5, 13 -1 L 9 3.5 C 4 5, -4 5, -9 3.5 Z"
                    fill="#A84825"
                    stroke="#1F1A17"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  {/* Cabin / canopy */}
                  <path
                    d="M -5 -1 L -3 -6 L 4 -6 L 6 -1 Z"
                    fill="#F6EFE4"
                    stroke="#1F1A17"
                    strokeWidth="1.1"
                    strokeLinejoin="round"
                  />
                  {/* Tiny gold lantern at bow */}
                  <circle
                    cx="10.5"
                    cy="-2.5"
                    r="2"
                    fill="#C99A2E"
                    stroke="#1F1A17"
                    strokeWidth="0.8"
                  />
                </g>
              </g>
            )}
          </svg>
        </div>

        {stops.length > 0 && (
          <ol className="hidden space-y-1.5 lg:block">
            {stops.map((stop, index) => {
              const isCurrent = index === activeIndex;
              const isDone = activeIndex !== -1 && index < activeIndex;
              return (
                <li
                  key={stop.id}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
                    isCurrent
                      ? "border-gold bg-gold/20 font-bold text-ink"
                      : isDone
                        ? "border-river/30 bg-river/10 font-semibold text-ink"
                        : "border-ink/10 bg-sand/40 text-muted opacity-55"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isCurrent
                        ? "bg-gold text-ink"
                        : isDone
                          ? "bg-river text-sand"
                          : "border border-ink/30 bg-sand text-muted"
                    }`}
                  >
                    {isDone ? "✓" : index + 1}
                  </span>
                  <span className="min-w-0 truncate">{stop.name}</span>
                </li>
              );
            })}
          </ol>
        )}

        {/* Compact legend */}
        <div
          aria-hidden="true"
          className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted"
        >
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-river" />
            Đã qua
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-ink">
            <span className="h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-gold/40" />
            Đang nghe
          </span>
          <span className="inline-flex items-center gap-1 opacity-65">
            <span className="h-2.5 w-2.5 rounded-full border border-dashed border-ink/50 bg-sand" />
            Sắp tới
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
