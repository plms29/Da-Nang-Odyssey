"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { type JSX, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  getShaderPresetForKit,
  isSunlitKit,
  SceneBackdrop,
  SceneGodRays,
  SceneLayerImg,
  ShaderTiltBridge,
} from "@/components/fx/SceneBackdrop";
import { Ambient } from "@/components/fx/Ambient";
import { useInView } from "@/components/fx/useInView";
import { useTilt } from "@/components/fx/useTilt";
import type { SceneKit, SceneLayer } from "@/lib/scene";

const WORLD = 1.3;

export interface ParallaxSceneProps {
  kit: SceneKit;
  panels: ReactNode[];
  cta: ReactNode;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function ParallaxLayer({
  layer,
  progress,
  x,
  y,
}: {
  layer: SceneLayer;
  progress: MotionValue<number>;
  x: MotionValue<number>;
  y: MotionValue<number>;
}): JSX.Element {
  const scrollPct = useTransform(progress, [0, 1], [(1 - layer.depth) * 15, 0]);
  const tx = useTransform(x, (v) => v * layer.depth * 18);
  const ty = useTransform(y, (v) => v * layer.depth * 10);
  const combinedY = useTransform<number, string>(
    [scrollPct, ty],
    ([s, dy]) => `calc(${s}% + ${dy}px)`
  );

  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-[100dvh] pointer-events-none"
      style={{ x: tx, y: combinedY }}
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
  const s = 1 / (total + 1);
  const a = index * s;
  const b = (index + 1) * s;
  const opacity = useTransform(
    progress,
    [a, a + 0.15 * s, b - 0.15 * s, b],
    index === 0 ? [1, 1, 1, 0] : [0, 1, 1, 0]
  );
  const y = useTransform(
    progress,
    [a, a + 0.15 * s],
    index === 0 ? [0, 0] : [16, 0]
  );
  const ref = useRef<HTMLDivElement>(null);
  const apply = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const o = opacity.get();
    el.style.opacity = String(o);
    el.style.transform = `translateY(${y.get()}px)`;
    el.style.visibility = o > 0.02 ? "visible" : "hidden";
  }, [opacity, y]);
  useMotionValueEvent(opacity, "change", apply);
  useMotionValueEvent(y, "change", apply);
  useEffect(apply, [apply]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ opacity: index === 0 ? 1 : 0 }}
      className="absolute inset-x-4 top-[40%] rounded-xl border border-border bg-surface/90 backdrop-blur-md p-5 shadow-xs text-ink pointer-events-none lg:inset-x-auto lg:left-[8%] lg:top-[34%] lg:w-[min(520px,40vw)]"
    >
      {children}
    </div>
  );
}

function StaticScene({ kit, panels, cta }: ParallaxSceneProps): JSX.Element {
  return (
    <div className="-mx-4 -mt-5 lg:-mx-8 lg:-mt-24">
      <div className="relative h-[55dvh] overflow-hidden">
        <SceneBackdrop kit={kit} intensity="calm" />
      </div>
      <div className="mt-4 space-y-3 px-4 lg:px-8">
        {panels.map((panel, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-surface/90 backdrop-blur-md p-5 shadow-xs text-ink lg:max-w-[520px]"
          >
            {panel}
          </div>
        ))}
      </div>
      <div className="mt-4 px-4 lg:px-8">{cta}</div>
    </div>
  );
}

function ScrollScene({ kit, panels, cta }: ParallaxSceneProps): JSX.Element {
  const n = panels.length;
  const s = 1 / (n + 1);
  const [trackRef, active] = useInView<HTMLDivElement>();
  const { scrollYProgress: progress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isReduced = mounted && Boolean(reduced);
  const { x: rawX, y: rawY } = useTilt();
  const factorMv = useMotionValue(1);

  useEffect(() => {
    factorMv.set(isReduced ? 0 : 1);
  }, [factorMv, isReduced]);

  const tiltX = useTransform<number, number>([rawX, factorMv], ([vx, f]) =>
    clamp(vx * f, -1, 1)
  );
  const tiltY = useTransform<number, number>([rawY, factorMv], ([vy, f]) =>
    clamp(vy * f, -1, 1)
  );

  const rotateX = useTransform(tiltY, (v) => clamp(-v * 2, -2, 2));
  const rotateY = useTransform(tiltX, (v) => clamp(v * 2, -2, 2));

  const worldY = useTransform(
    progress,
    [0, 1],
    ["0%", `${-((WORLD - 1) / WORLD) * 100}%`]
  );

  const hintOpacity = useTransform(progress, [0, 0.2 * s], [1, 0]);
  const hintVisibility = useTransform(hintOpacity, (v) =>
    v > 0.05 ? "visible" : "hidden"
  );

  const ctaStart = n / (n + 1);
  const ctaOpacity = useTransform(
    progress,
    [ctaStart, ctaStart + 0.25 * s, 1],
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
    <div className="-mx-4 -mt-5 lg:-mx-8 lg:-mt-24">
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
        <div
          className="sticky top-0 h-dvh overflow-hidden"
          style={{ perspective: "1000px" }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[130%] pointer-events-none"
            style={{ y: worldY, rotateX, rotateY, background: kit.sky }}
          >
            <ShaderTiltBridge
              preset={getShaderPresetForKit(kit.id)}
              x={tiltX}
              y={tiltY}
              className="absolute inset-0"
            />
            {isSunlitKit(kit.id) && <SceneGodRays />}
            {kit.layers.map((layer, index) => (
              <ParallaxLayer
                key={`${layer.src}-${index}`}
                layer={layer}
                progress={progress}
                x={tiltX}
                y={tiltY}
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
            className="absolute inset-x-4 top-[62%] flex justify-center lg:inset-x-auto lg:left-[8%] lg:w-[min(520px,40vw)] lg:justify-start"
            style={{
              opacity: ctaOpacity,
              pointerEvents: ctaPointer,
              visibility: ctaVisibility,
            }}
          >
            <div className="w-full max-w-[400px] rounded-xl border border-border bg-surface/90 backdrop-blur-md p-5 shadow-xs text-ink text-center lg:max-w-none">
              {cta}
            </div>
          </motion.div>

          <motion.div
            aria-hidden="true"
            style={{ opacity: hintOpacity, visibility: hintVisibility }}
            className="absolute inset-x-0 top-16 flex justify-center pointer-events-none lg:top-auto lg:bottom-8"
          >
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface/90 px-3.5 py-1.5 text-sm text-ink backdrop-blur-md">
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
            className="absolute right-3 top-3 min-h-11 min-w-11 rounded-full border border-border bg-surface/90 px-4 text-sm font-medium text-ink backdrop-blur-md lg:left-auto lg:right-8 lg:top-24"
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
