"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
} from "react";
import type { SceneId, SceneKit, SceneLayer } from "@/lib/scene";
import { useInView } from "@/components/fx/useInView";
import { Ambient, layerAnimClass } from "@/components/fx/Ambient";
import { ShaderBackdrop, type ShaderPreset } from "@/components/fx/ShaderBackdrop";
import { useTilt } from "@/components/fx/useTilt";

type CssVarStyle = CSSProperties & Record<`--fx-${string}`, string>;

const KIT_SHADER_PRESETS: Record<string, ShaderPreset> = {
  home: "river",
  "di-san-cham": "sunset",
  "nghe-thuat-dan-gian": "night",
  "lich-su-giu-thanh": "aurora",
};

const GOD_RAYS: ReadonlyArray<{
  left: string;
  width: string;
  style: CssVarStyle;
}> = [
  {
    left: "8%",
    width: "22%",
    style: { "--fx-ray-rot": "13deg", "--fx-dur": "10.5s", "--fx-delay": "0s" },
  },
  {
    left: "31%",
    width: "26%",
    style: { "--fx-ray-rot": "17deg", "--fx-dur": "13.5s", "--fx-delay": "-4.2s" },
  },
  {
    left: "56%",
    width: "20%",
    style: { "--fx-ray-rot": "20deg", "--fx-dur": "9.5s", "--fx-delay": "-7.1s" },
  },
  {
    left: "76%",
    width: "24%",
    style: { "--fx-ray-rot": "15deg", "--fx-dur": "15.5s", "--fx-delay": "-10.8s" },
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getShaderPresetForKit(id: SceneId | string): ShaderPreset {
  return KIT_SHADER_PRESETS[id] ?? "aurora";
}

export function isSunlitKit(id: SceneId | string): boolean {
  return id === "home" || id === "di-san-cham";
}

export function SceneGodRays(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {GOD_RAYS.map((ray, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="fx-ray"
          style={{
            left: ray.left,
            width: ray.width,
            ...ray.style,
          }}
        />
      ))}
    </div>
  );
}

export function ShaderTiltBridge({
  preset,
  x,
  y,
  className = "absolute inset-0",
}: {
  preset: ShaderPreset;
  x: MotionValue<number>;
  y: MotionValue<number>;
  className?: string;
}): JSX.Element {
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const sync = useCallback(() => {
    const nx = x.get();
    const ny = y.get();
    const prev = lastRef.current;
    const isNearZero =
      Math.abs(nx) < 0.002 &&
      Math.abs(ny) < 0.002 &&
      (prev.x !== 0 || prev.y !== 0);
    if (
      !isNearZero &&
      Math.abs(nx - prev.x) < 0.015 &&
      Math.abs(ny - prev.y) < 0.015
    ) {
      return;
    }
    const next = isNearZero ? { x: 0, y: 0 } : { x: nx, y: ny };
    lastRef.current = next;
    setTilt(next);
  }, [x, y]);

  useMotionValueEvent(x, "change", sync);
  useMotionValueEvent(y, "change", sync);

  return <ShaderBackdrop preset={preset} className={className} tilt={tilt} />;
}

export function SceneLayerImg({
  layer,
  intensity,
}: {
  layer: SceneLayer;
  intensity: "full" | "calm";
}): JSX.Element {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={layer.src}
      alt=""
      decoding="async"
      draggable={false}
      className={`absolute ${layer.className} ${layerAnimClass(layer.animate)}`.trim()}
      style={intensity === "calm" ? { filter: "saturate(0.8)" } : undefined}
    />
  );
}

function SceneTiltLayer({
  layer,
  intensity,
  x,
  y,
}: {
  layer: SceneLayer;
  intensity: "full" | "calm";
  x: MotionValue<number>;
  y: MotionValue<number>;
}): JSX.Element {
  const tx = useTransform(x, (v) => v * layer.depth * 18);
  const ty = useTransform(y, (v) => v * layer.depth * 10);

  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ x: tx, y: ty }}
    >
      <SceneLayerImg layer={layer} intensity={intensity} />
    </motion.div>
  );
}

export function SceneBackdrop({
  kit,
  intensity = "full",
  className,
  godRays,
}: {
  kit: SceneKit;
  intensity?: "full" | "calm";
  className?: string;
  godRays?: boolean;
}): JSX.Element {
  const [ref, active] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isReduced = mounted && Boolean(reduced);
  const { x: rawX, y: rawY } = useTilt();
  const factorMv = useMotionValue(intensity === "calm" ? 0.4 : 1);

  useEffect(() => {
    factorMv.set(isReduced ? 0 : intensity === "calm" ? 0.4 : 1);
  }, [factorMv, isReduced, intensity]);

  const tiltX = useTransform<number, number>([rawX, factorMv], ([vx, f]) =>
    clamp(vx * f, -1, 1)
  );
  const tiltY = useTransform<number, number>([rawY, factorMv], ([vy, f]) =>
    clamp(vy * f, -1, 1)
  );

  const rotateX = useTransform(tiltY, (v) => clamp(-v * 2, -2, 2));
  const rotateY = useTransform(tiltX, (v) => clamp(v * 2, -2, 2));

  const showShader = intensity === "full";
  const showGodRays = godRays ?? (intensity === "full" && isSunlitKit(kit.id));

  const style = {
    background: kit.sky,
    perspective: "1000px",
    ...(intensity === "calm"
      ? {
          ["--fx-speed" as string]: "1.6",
          ["--fx-sway-deg" as string]: "3deg",
        }
      : {}),
  } as CSSProperties;

  return (
    <div
      ref={ref}
      data-paused={!active}
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ""}`}
      style={style}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ rotateX, rotateY }}
      >
        {showShader && (
          <ShaderTiltBridge
            preset={getShaderPresetForKit(kit.id)}
            x={tiltX}
            y={tiltY}
            className="absolute inset-0"
          />
        )}
        {showGodRays && <SceneGodRays />}
        {kit.layers.map((layer, index) => (
          <SceneTiltLayer
            key={`${layer.src}-${index}`}
            layer={layer}
            intensity={intensity}
            x={tiltX}
            y={tiltY}
          />
        ))}
      </motion.div>
      {kit.ambient.map((kind) => (
        <Ambient key={kind} kind={kind} intensity={intensity} />
      ))}
    </div>
  );
}
