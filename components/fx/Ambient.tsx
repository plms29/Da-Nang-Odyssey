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

const SMOKE_PUFFS: ReadonlyArray<{
  left: string;
  bottom: string;
  size: string;
  bg: string;
  style: CssVarStyle;
}> = [
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

const DRIFT_CLOUDS: ReadonlyArray<{
  top: string;
  left: string;
  size: string;
  bg: string;
  style: CssVarStyle;
}> = [
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

  const isCanvasKind = kind === "dust" || kind === "fireflies" || kind === "fireworks";
  const calmClass = intensity === "calm" && !isCanvasKind ? "fx-calm" : "";

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-paused={!active}
      className={`pointer-events-none ${className} ${calmClass}`.trim()}
    >
      {(kind === "dust" || kind === "fireflies" || kind === "fireworks") && (
        <ParticleCanvas preset={kind} intensity={intensity} className="absolute inset-0 w-full h-full" />
      )}

      {kind === "smoke" &&
        SMOKE_PUFFS.map((puff, idx) => (
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
        <div className="absolute inset-x-0 bottom-0 h-1/4 overflow-hidden">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="fx-wave-band absolute bottom-0 left-0 h-full"
            style={{ "--fx-dur": "15s" } as CssVarStyle}
          >
            <path
              d="M 0 58 Q 150 22 300 58 T 600 58 T 900 58 T 1200 58 L 1200 120 L 0 120 Z"
              fill="rgba(31, 78, 107, 0.28)"
            />
            <path
              d="M 0 58 Q 150 22 300 58 T 600 58 T 900 58 T 1200 58"
              fill="none"
              stroke="rgba(246, 239, 228, 0.35)"
              strokeWidth="2"
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
              fill="rgba(31, 78, 107, 0.42)"
            />
            <path
              d="M 0 64 Q 150 32 300 64 T 600 64 T 900 64 T 1200 64"
              fill="none"
              stroke="rgba(246, 239, 228, 0.45)"
              strokeWidth="2"
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
              fill="rgba(31, 78, 107, 0.58)"
            />
            <path
              d="M 0 68 Q 150 40 300 68 T 600 68 T 900 68 T 1200 68"
              fill="none"
              stroke="rgba(246, 239, 228, 0.6)"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      )}

      {kind === "drift" &&
        DRIFT_CLOUDS.map((cloud, idx) => (
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
                background: "radial-gradient(circle, rgba(201, 154, 46, 0.42) 0%, rgba(246, 239, 228, 0) 72%)",
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
                background: "radial-gradient(circle, rgba(201, 154, 46, 0.38) 0%, rgba(168, 72, 37, 0) 72%)",
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
