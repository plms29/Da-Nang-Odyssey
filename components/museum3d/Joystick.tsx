"use client";

import React, { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";

const JOYSTICK_SIZE = 110;
const MAX_OFFSET = 34;
const DEADZONE = 0.1;

export function Joystick({
  onChange,
}: {
  onChange: (v: { x: number; y: number }) => void;
}) {
  const [knob, setKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const activePointerIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    return () => {
      onChangeRef.current({ x: 0, y: 0 });
    };
  }, []);

  const updateFromClientPoint = (
    el: HTMLDivElement,
    clientX: number,
    clientY: number,
  ) => {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > MAX_OFFSET && dist > 0) {
      const scale = MAX_OFFSET / dist;
      dx *= scale;
      dy *= scale;
    }

    setKnob({ x: dx, y: dy });
    // Normalize into [-1, 1] where +x is right and +y is forward (up on screen).
    const normX = Math.max(-1, Math.min(1, dx / MAX_OFFSET));
    const normY = Math.max(-1, Math.min(1, -dy / MAX_OFFSET));
    if (Math.hypot(normX, normY) < DEADZONE) {
      onChangeRef.current({ x: 0, y: 0 });
    } else {
      onChangeRef.current({ x: normX, y: normY });
    }
  };

  const reset = (el?: HTMLDivElement, pointerId?: number) => {
    activePointerIdRef.current = null;
    setActive(false);
    setKnob({ x: 0, y: 0 });
    onChangeRef.current({ x: 0, y: 0 });

    if (el && pointerId !== undefined) {
      try {
        if (el.hasPointerCapture(pointerId)) {
          el.releasePointerCapture(pointerId);
        }
      } catch {
        // Ignore if pointer capture was already released.
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== null) return;
    e.preventDefault();
    e.stopPropagation();

    activePointerIdRef.current = e.pointerId;
    setActive(true);
    haptic("tap");

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore environments without pointer capture support.
    }

    updateFromClientPoint(e.currentTarget, e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    updateFromClientPoint(e.currentTarget, e.clientX, e.clientY);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    reset(e.currentTarget, e.pointerId);
  };

  return (
    <div
      role="application"
      aria-label="Cần điều khiển di chuyển"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
      style={{
        width: JOYSTICK_SIZE,
        height: JOYSTICK_SIZE,
        touchAction: "none",
      }}
      className="fixed bottom-[max(6rem,_calc(env(safe-area-inset-bottom)_+_6rem))] left-5 z-20 flex select-none items-center justify-center rounded-full border border-white/25 bg-black/35 shadow-lg backdrop-blur-md touch-none md:bottom-[max(1.5rem,_env(safe-area-inset-bottom))]"
    >
      {/* Inner guide ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-full border border-white/15"
      />
      {/* Movable thumb */}
      <div
        aria-hidden="true"
        style={{
          transform: `translate3d(${knob.x}px, ${knob.y}px, 0)`,
        }}
        className={`pointer-events-none h-11 w-11 rounded-full border border-white/80 bg-white/75 shadow-md ${
          active ? "" : "transition-transform duration-150 ease-out motion-reduce:transition-none"
        }`}
      />
    </div>
  );
}
