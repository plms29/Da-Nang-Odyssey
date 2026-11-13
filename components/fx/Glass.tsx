"use client";

import React, { useEffect, useRef, type JSX } from "react";

// Approach (a): Place <GlassFilterDefs /> once in the root layout to enable refraction.
export function GlassFilterDefs(): JSX.Element {
  return (
    <svg
      width={0}
      height={0}
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        <filter id="fx-glass-refract">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01"
            numOctaves={2}
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale={25}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

export function GlassPanel(
  props: {
    as?: "div" | "section" | "nav" | "header";
    tone?: "light" | "dark";
    refract?: boolean;
    className?: string;
    children?: React.ReactNode;
  } & React.HTMLAttributes<HTMLElement>,
): JSX.Element {
  const {
    as: Tag = "div",
    tone = "light",
    refract = false,
    className,
    children,
    ...rest
  } = props;

  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    let clientX = 0;
    let clientY = 0;

    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const mx = Math.round(((clientX - rect.left) / rect.width) * 100);
        const my = Math.round(((clientY - rect.top) / rect.height) * 100);
        el.style.setProperty("--mx", `${mx}%`);
        el.style.setProperty("--my", `${my}%`);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      clientX = e.clientX;
      clientY = e.clientY;
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    el.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  const classes = [
    "fx-glass",
    tone === "dark" ? "fx-glass--dark" : "fx-glass--light",
    refract ? "fx-glass--refract" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      className={classes}
      {...rest}
    >
      {children}
    </Tag>
  );
}
