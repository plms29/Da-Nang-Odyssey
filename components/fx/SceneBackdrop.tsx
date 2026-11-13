"use client";

import type { CSSProperties, JSX } from "react";
import type { SceneKit, SceneLayer } from "@/lib/scene";
import { useInView } from "@/components/fx/useInView";
import { Ambient, layerAnimClass } from "@/components/fx/Ambient";

export function SceneLayerImg({
  layer,
  intensity,
}: {
  layer: SceneLayer;
  intensity: "full" | "calm";
}): JSX.Element {
  // Decorative layers have unknown intrinsic SVG dimensions, so next/image is not used.
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

export function SceneBackdrop({
  kit,
  intensity = "full",
  className,
}: {
  kit: SceneKit;
  intensity?: "full" | "calm";
  className?: string;
}): JSX.Element {
  const [ref, active] = useInView<HTMLDivElement>();
  const style = {
    background: kit.sky,
    ...(intensity === "calm" ? { ["--fx-speed" as string]: "1.6" } : {}),
  } as CSSProperties;

  return (
    <div
      ref={ref}
      data-paused={!active}
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ""}`}
      style={style}
    >
      {kit.layers.map((layer, index) => (
        <SceneLayerImg key={`${layer.src}-${index}`} layer={layer} intensity={intensity} />
      ))}
      {kit.ambient.map((kind) => (
        <Ambient key={kind} kind={kind} intensity={intensity} />
      ))}
    </div>
  );
}
