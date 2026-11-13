"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { type JSX, type ReactNode, useEffect, useState } from "react";
import { SceneBackdrop, SceneLayerImg } from "@/components/fx/SceneBackdrop";
import { Ambient } from "@/components/fx/Ambient";
import { useInView } from "@/components/fx/useInView";
import type { SceneKit, SceneLayer } from "@/lib/scene";

const WORLD = 1.7;

export interface ParallaxSceneProps {
  kit: SceneKit;
  panels: ReactNode[];
  cta: ReactNode;
}

function ParallaxLayer({
  layer,
  progress,
}: {
  layer: SceneLayer;
  progress: MotionValue<number>;
}): JSX.Element {
  const y = useTransform(progress, [0, 1], [`${(1 - layer.depth) * 15}%`, "0%"]);
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 h-[100dvh] pointer-events-none"
      style={{ y }}
    >
      <SceneLayerImg layer={layer} intensity="full" />
    </motion.div>
  );
}

function PanelCard({
  index,
  total,
  progress,
  children,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  children: ReactNode;
}): JSX.Element {
  const a = index / (total + 1);
  const b = (index + 1) / (total + 1);
  const f = 0.25 / (total + 1);
  const opacity = useTransform(progress, [a, a + f, b - f, b], [0, 1, 1, 0]);
  const y = useTransform(progress, [a, a + f], [16, 0]);

  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity, y }}
      className="absolute inset-x-4 bottom-24 rounded-lg bg-sand/85 backdrop-blur-sm p-4 shadow-sm text-ink pointer-events-none"
    >
      {children}
    </motion.div>
  );
}

function StaticScene({ kit, panels, cta }: ParallaxSceneProps): JSX.Element {
  return (
    <div className="-mx-4 -mt-5">
      <div className="relative h-[55dvh] overflow-hidden">
        <SceneBackdrop kit={kit} intensity="calm" />
      </div>
      <div className="mt-4 space-y-3 px-4">
        {panels.map((panel, index) => (
          <div
            key={index}
            className="rounded-lg bg-sand/85 backdrop-blur-sm p-4 shadow-sm text-ink"
          >
            {panel}
          </div>
        ))}
      </div>
      <div className="mt-4 px-4">{cta}</div>
    </div>
  );
}

function ScrollScene({ kit, panels, cta }: ParallaxSceneProps): JSX.Element {
  const n = panels.length;
  const [trackRef, active] = useInView<HTMLDivElement>();
  const { scrollYProgress: progress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const worldY = useTransform(
    progress,
    [0, 1],
    ["0%", `${-((WORLD - 1) / WORLD) * 100}%`]
  );

  const hintOpacity = useTransform(progress, [0, 0.2 / (n + 1)], [1, 0]);

  const ctaStart = n / (n + 1);
  const ctaFade = 0.25 / (n + 1);
  const ctaOpacity = useTransform(
    progress,
    [ctaStart, ctaStart + ctaFade, 1],
    [0, 1, 1]
  );
  const ctaPointer = useTransform(ctaOpacity, (v) => (v > 0.5 ? "auto" : "none"));
  const ctaVisibility = useTransform(ctaOpacity, (v) =>
    v > 0.05 ? "visible" : "hidden"
  );

  const skipOpacity = useTransform(
    progress,
    [(n - 0.2) / (n + 1), n / (n + 1)],
    [1, 0]
  );
  const skipPointer = useTransform(skipOpacity, (v) =>
    v > 0.5 ? "auto" : "none"
  );
  const skipVisibility = useTransform(skipOpacity, (v) =>
    v > 0.05 ? "visible" : "hidden"
  );

  const handleSkip = (): void => {
    const track = trackRef.current;
    if (!track) return;
    const top =
      track.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <div className="-mx-4 -mt-5">
      <div className="sr-only">
        {panels.map((panel, index) => (
          <div key={index}>{panel}</div>
        ))}
      </div>

      <div
        ref={trackRef}
        data-paused={!active}
        className="relative"
        style={{ height: `${(n + 1) * 100}dvh` }}
      >
        <div className="sticky top-0 h-dvh overflow-hidden">
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[170%] pointer-events-none"
            style={{ y: worldY, background: kit.sky }}
          >
            {kit.layers.map((layer, index) => (
              <ParallaxLayer
                key={`${layer.src}-${index}`}
                layer={layer}
                progress={progress}
              />
            ))}
          </motion.div>

          {kit.ambient.map((kind) => (
            <Ambient key={kind} kind={kind} intensity="full" />
          ))}

          {panels.map((panel, index) => (
            <PanelCard
              key={index}
              index={index}
              total={n}
              progress={progress}
            >
              {panel}
            </PanelCard>
          ))}

          <motion.div
            className="absolute inset-x-4 bottom-24"
            style={{
              opacity: ctaOpacity,
              pointerEvents: ctaPointer,
              visibility: ctaVisibility,
            }}
          >
            {cta}
          </motion.div>

          <motion.div
            aria-hidden="true"
            style={{ opacity: hintOpacity }}
            className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none"
          >
            <div className="flex items-center gap-1.5 bg-sand/85 rounded-full px-3 py-1 text-sm text-ink backdrop-blur-sm">
              <span>Cuộn để khám phá</span>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 animate-bounce"
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
          </motion.div>

          <motion.button
            type="button"
            onClick={handleSkip}
            style={{
              opacity: skipOpacity,
              pointerEvents: skipPointer,
              visibility: skipVisibility,
            }}
            className="absolute right-3 top-3 min-h-11 min-w-11 rounded-full bg-sand/85 px-4 text-sm text-ink backdrop-blur-sm"
          >
            Bỏ qua
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export function ParallaxScene({
  kit,
  panels,
  cta,
}: ParallaxSceneProps): JSX.Element {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (mounted && reduced) {
    return <StaticScene kit={kit} panels={panels} cta={cta} />;
  }

  return <ScrollScene kit={kit} panels={panels} cta={cta} />;
}
