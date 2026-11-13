"use client";

import { useEffect, useState, type CSSProperties, type JSX } from "react";
import { useReducedMotion } from "motion/react";
import type { AmbientKind } from "@/lib/scene/types";
import { useInView } from "@/components/fx/useInView";
import { ParticleCanvas } from "@/components/fx/ParticleCanvas";

type CssVarStyle = CSSProperties & Record<`--fx-${string}`, string>;

export function layerAnimClass(kind?: AmbientKind): string {
  switch (kind) {
    case "sway":
      return "fx-layer-sway";
    case "flag":
      return "fx-layer-flag";
    case "drift":
      return "fx-layer-drift";
    case "waves":
      return "fx-layer-waves";
    case "smoke":
      return "fx-layer-smoke";
    default:
      return "";
  }
}

interface PuffConfig {
  left: string;
  bottom: string;
  size: string;
  bg: string;
  style: CssVarStyle;
}

const SMOKE_PUFFS_CALM: ReadonlyArray<PuffConfig> = [
  {
    left: "36%",
    bottom: "6%",
    size: "w-32 h-32",
    bg: "rgba(246, 239, 228, 0.24)",
    style: { "--fx-dur": "7.5s", "--fx-delay": "0s", "--fx-dx": "-18px", "--fx-alpha": "0.24" },
  },
  {
    left: "45%",
    bottom: "4%",
    size: "w-40 h-40",
    bg: "rgba(31, 26, 23, 0.16)",
    style: { "--fx-dur": "9s", "--fx-delay": "-2.2s", "--fx-dx": "22px", "--fx-alpha": "0.18" },
  },
  {
    left: "52%",
    bottom: "8%",
    size: "w-36 h-36",
    bg: "rgba(246, 239, 228, 0.2)",
    style: { "--fx-dur": "8.2s", "--fx-delay": "-4.5s", "--fx-dx": "14px", "--fx-alpha": "0.22" },
  },
  {
    left: "40%",
    bottom: "10%",
    size: "w-28 h-28",
    bg: "rgba(94, 81, 72, 0.18)",
    style: { "--fx-dur": "6.8s", "--fx-delay": "-5.8s", "--fx-dx": "-12px", "--fx-alpha": "0.2" },
  },
];

const SMOKE_PUFFS_FULL: ReadonlyArray<PuffConfig> = [
  {
    left: "35%",
    bottom: "6%",
    size: "w-36 h-36",
    bg: "rgba(246, 239, 228, 0.42)",
    style: { "--fx-dur": "7s", "--fx-delay": "0s", "--fx-dx": "-20px", "--fx-alpha": "0.48" },
  },
  {
    left: "45%",
    bottom: "4%",
    size: "w-44 h-44",
    bg: "rgba(31, 26, 23, 0.28)",
    style: { "--fx-dur": "8.5s", "--fx-delay": "-2.2s", "--fx-dx": "24px", "--fx-alpha": "0.36" },
  },
  {
    left: "52%",
    bottom: "8%",
    size: "w-40 h-40",
    bg: "rgba(246, 239, 228, 0.38)",
    style: { "--fx-dur": "7.8s", "--fx-delay": "-4.5s", "--fx-dx": "16px", "--fx-alpha": "0.44" },
  },
  {
    left: "39%",
    bottom: "10%",
    size: "w-32 h-32",
    bg: "rgba(94, 81, 72, 0.34)",
    style: { "--fx-dur": "6.4s", "--fx-delay": "-5.8s", "--fx-dx": "-14px", "--fx-alpha": "0.4" },
  },
];

interface CloudConfig {
  top: string;
  left: string;
  size: string;
  bg: string;
  style: CssVarStyle;
}

const DRIFT_CLOUDS_CALM: ReadonlyArray<CloudConfig> = [
  {
    top: "8%",
    left: "6%",
    size: "w-64 h-20",
    bg: "rgba(246, 239, 228, 0.24)",
    style: { "--fx-dur": "38s", "--fx-delay": "0s" },
  },
  {
    top: "20%",
    left: "38%",
    size: "w-72 h-24",
    bg: "rgba(31, 26, 23, 0.1)",
    style: { "--fx-dur": "52s", "--fx-delay": "-14s" },
  },
  {
    top: "14%",
    left: "18%",
    size: "w-56 h-16",
    bg: "rgba(246, 239, 228, 0.18)",
    style: { "--fx-dur": "45s", "--fx-delay": "-26s" },
  },
];

// Full intensity: ~1.4x drift speed and slightly richer opacity
const DRIFT_CLOUDS_FULL: ReadonlyArray<CloudConfig> = [
  {
    top: "8%",
    left: "6%",
    size: "w-64 h-20",
    bg: "rgba(246, 239, 228, 0.32)",
    style: { "--fx-dur": "27s", "--fx-delay": "0s" },
  },
  {
    top: "20%",
    left: "38%",
    size: "w-72 h-24",
    bg: "rgba(31, 26, 23, 0.16)",
    style: { "--fx-dur": "37s", "--fx-delay": "-10s" },
  },
  {
    top: "14%",
    left: "18%",
    size: "w-56 h-16",
    bg: "rgba(246, 239, 228, 0.25)",
    style: { "--fx-dur": "32s", "--fx-delay": "-18s" },
  },
];

// 18 CSS dust motes supplementing ParticleCanvas's 36 (total 54 <= 60 hard cap = 1.5x)
const EXTRA_DUST_MOTES: ReadonlyArray<{
  left: string;
  top: string;
  size: string;
  bg: string;
  style: CssVarStyle;
}> = Array.from({ length: 18 }, (_, i) => ({
  left: `${((i * 19 + 7) % 92) + 4}%`,
  top: `${((i * 23 + 11) % 72) + 18}%`,
  size: i % 3 === 0 ? "w-1.5 h-1.5" : "w-1 h-1",
  bg: i % 2 === 0 ? "#C99A2E" : "#F6EFE4",
  style: {
    "--fx-dur": `${(4.2 + (i % 5) * 0.7).toFixed(1)}s`,
    "--fx-delay": `-${((i * 1.1) % 6.5).toFixed(1)}s`,
    "--fx-dx": `${i % 2 === 0 ? 14 : -12}px`,
    "--fx-alpha": `${(0.68 + (i % 4) * 0.08).toFixed(2)}`,
  },
}));

// 13 CSS fireflies supplementing ParticleCanvas's 26 (total 39 <= 60 hard cap = 1.5x)
const EXTRA_FIREFLIES: ReadonlyArray<{
  left: string;
  top: string;
  size: string;
  bg: string;
  style: CssVarStyle;
}> = Array.from({ length: 13 }, (_, i) => ({
  left: `${((i * 21 + 9) % 88) + 6}%`,
  top: `${((i * 17 + 13) % 74) + 12}%`,
  size: i % 2 === 0 ? "w-1.5 h-1.5" : "w-2 h-2",
  bg: i % 3 === 0 ? "#C99A2E" : "#E6EE9C",
  style: {
    "--fx-dur": `${(3.6 + (i % 4) * 0.65).toFixed(1)}s`,
    "--fx-delay": `-${((i * 0.9) % 4.8).toFixed(1)}s`,
    "--fx-dx": `${i % 2 === 0 ? 18 : -16}px`,
    "--fx-dy": `${i % 3 === 0 ? -16 : 12}px`,
    "--fx-alpha": `${(0.84 + (i % 3) * 0.05).toFixed(2)}`,
  },
}));

export function Ambient(props: {
  kind: AmbientKind;
  intensity?: "full" | "calm";
  className?: string;
}): JSX.Element | null {
  const { kind, intensity = "full", className = "absolute inset-0 overflow-hidden" } = props;
  const [ref, active] = useInView<HTMLDivElement>();
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (kind === "flag") {
    return null;
  }

  if (mounted && prefersReduced) {
    return null;
  }

  const isCalm = intensity === "calm";
  const isCanvasKind = kind === "dust" || kind === "fireflies" || kind === "fireworks";
  const calmClass = isCalm && !isCanvasKind ? "fx-calm" : "";
  const smokePuffs = isCalm ? SMOKE_PUFFS_CALM : SMOKE_PUFFS_FULL;
  const driftClouds = isCalm ? DRIFT_CLOUDS_CALM : DRIFT_CLOUDS_FULL;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-paused={!active}
      className={`pointer-events-none ${className} ${calmClass}`.trim()}
    >
      {isCanvasKind && (
        <ParticleCanvas
          preset={kind}
          intensity={intensity}
          className="absolute inset-0 w-full h-full"
        />
      )}

      {!isCalm &&
        kind === "dust" &&
        EXTRA_DUST_MOTES.map((mote, idx) => (
          <span
            key={idx}
            className={`fx-mote ${mote.size}`}
            style={{
              left: mote.left,
              top: mote.top,
              backgroundColor: mote.bg,
              ...mote.style,
            }}
          />
        ))}

      {!isCalm &&
        kind === "fireflies" &&
        EXTRA_FIREFLIES.map((fly, idx) => (
          <span
            key={idx}
            className={`fx-firefly-mote ${fly.size}`}
            style={{
              left: fly.left,
              top: fly.top,
              backgroundColor: fly.bg,
              ...fly.style,
            }}
          />
        ))}

      {kind === "smoke" &&
        smokePuffs.map((puff, idx) => (
          <span
            key={idx}
            className={`fx-smoke-puff ${puff.size}`}
            style={{
              left: puff.left,
              bottom: puff.bottom,
              backgroundColor: puff.bg,
              ...puff.style,
            }}
          />
        ))}

      {kind === "flow" && <div className="fx-flow-streaks absolute inset-0 w-full h-full" />}

      {kind === "waves" && (
        <div
          className={`absolute inset-x-0 bottom-0 overflow-hidden ${
            isCalm ? "h-1/4" : "h-[34%]"
          }`}
        >
          {!isCalm && <div className="fx-wave-crest absolute inset-x-0 top-0 h-1/2 pointer-events-none" />}
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="fx-wave-band absolute bottom-0 left-0 h-full"
            style={{ "--fx-dur": "15s" } as CssVarStyle}
          >
            <path
              d="M 0 58 Q 150 22 300 58 T 600 58 T 900 58 T 1200 58 L 1200 120 L 0 120 Z"
              fill={isCalm ? "rgba(31, 78, 107, 0.28)" : "rgba(31, 78, 107, 0.34)"}
            />
            <path
              d="M 0 58 Q 150 22 300 58 T 600 58 T 900 58 T 1200 58"
              fill="none"
              stroke={isCalm ? "rgba(246, 239, 228, 0.35)" : "rgba(255, 250, 238, 0.65)"}
              strokeWidth={isCalm ? "2" : "2.5"}
            />
          </svg>
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="fx-wave-band-rev absolute bottom-0 left-0 h-4/5"
            style={{ "--fx-dur": "11s" } as CssVarStyle}
          >
            <path
              d="M 0 64 Q 150 32 300 64 T 600 64 T 900 64 T 1200 64 L 1200 120 L 0 120 Z"
              fill={isCalm ? "rgba(31, 78, 107, 0.42)" : "rgba(31, 78, 107, 0.48)"}
            />
            <path
              d="M 0 64 Q 150 32 300 64 T 600 64 T 900 64 T 1200 64"
              fill="none"
              stroke={isCalm ? "rgba(246, 239, 228, 0.45)" : "rgba(255, 250, 238, 0.78)"}
              strokeWidth={isCalm ? "2" : "3"}
            />
          </svg>
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="fx-wave-band absolute bottom-0 left-0 h-3/5"
            style={{ "--fx-dur": "8.5s" } as CssVarStyle}
          >
            <path
              d="M 0 68 Q 150 40 300 68 T 600 68 T 900 68 T 1200 68 L 1200 120 L 0 120 Z"
              fill={isCalm ? "rgba(31, 78, 107, 0.58)" : "rgba(31, 78, 107, 0.64)"}
            />
            <path
              d="M 0 68 Q 150 40 300 68 T 600 68 T 900 68 T 1200 68"
              fill="none"
              stroke={isCalm ? "rgba(246, 239, 228, 0.6)" : "rgba(255, 250, 238, 0.92)"}
              strokeWidth={isCalm ? "2.5" : "3.5"}
            />
          </svg>
        </div>
      )}

      {kind === "drift" &&
        driftClouds.map((cloud, idx) => (
          <span
            key={idx}
            className={`fx-drift-cloud ${cloud.size}`}
            style={{
              top: cloud.top,
              left: cloud.left,
              backgroundColor: cloud.bg,
              ...cloud.style,
            }}
          />
        ))}

      {kind === "sway" && (
        <>
          <span
            className="fx-sway-pool w-44 h-44"
            style={
              {
                top: "12%",
                left: "18%",
                background: isCalm
                  ? "radial-gradient(circle, rgba(201, 154, 46, 0.42) 0%, rgba(246, 239, 228, 0) 72%)"
                  : "radial-gradient(circle, rgba(201, 154, 46, 0.56) 0%, rgba(246, 239, 228, 0) 72%)",
                "--fx-dur": "3.8s",
                "--fx-delay": "0s",
              } as CssVarStyle
            }
          />
          <span
            className="fx-sway-pool w-48 h-48"
            style={
              {
                top: "16%",
                right: "16%",
                background: isCalm
                  ? "radial-gradient(circle, rgba(201, 154, 46, 0.38) 0%, rgba(168, 72, 37, 0) 72%)"
                  : "radial-gradient(circle, rgba(201, 154, 46, 0.5) 0%, rgba(168, 72, 37, 0) 72%)",
                "--fx-dur": "4.5s",
                "--fx-delay": "-1.9s",
              } as CssVarStyle
            }
          />
        </>
      )}
    </div>
  );
}
