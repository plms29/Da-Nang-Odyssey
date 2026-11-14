"use client";

import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { GlassPanel } from "@/components/fx/Glass";
import { haptic } from "@/lib/haptics";
import { clampToBounds, type Bounds } from "@/lib/museum3d/collide";
import { Joystick } from "./Joystick";

const EYE_HEIGHT = 1.6;
const MAX_PITCH = 1.2;
const MOUSE_SENSITIVITY = 0.0022;
const TOUCH_SENSITIVITY = 0.005;

function clampPitch(pitch: number): number {
  return Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
}

export function FirstPersonControls({
  bounds,
  start = [0, 1.6, 9],
  speed = 3,
  joystick,
}: {
  bounds: Bounds;
  start?: [number, number, number];
  speed?: number;
  joystick?: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const { camera, gl } = useThree();

  const fallbackJoystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const boundsRef = useRef<Bounds>(bounds);
  const joystickRef = useRef<React.MutableRefObject<{ x: number; y: number }>>(
    joystick ?? fallbackJoystickRef,
  );
  const speedRef = useRef<number>(speed);

  const yawRef = useRef<number>(0);
  const pitchRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const lookPointerIdRef = useRef<number | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointerTypeRef = useRef<string | null>(null);

  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);

  useEffect(() => {
    joystickRef.current = joystick ?? fallbackJoystickRef;
  }, [joystick]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const [startX, , startZ] = start;

  useEffect(() => {
    const initial = clampToBounds(startX, startZ, boundsRef.current);
    camera.position.set(initial.x, EYE_HEIGHT, initial.z);
    camera.rotation.order = "YXZ";
    camera.rotation.set(pitchRef.current, yawRef.current, 0, "YXZ");
  }, [camera, startX, startZ]);

  useEffect(() => {
    const dom = gl.domElement;
    const prevTouchAction = dom.style.touchAction;
    dom.style.touchAction = "none";

    const isEditableTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        tag === "BUTTON" ||
        target.isContentEditable
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      if (
        e.code === "ArrowUp" ||
        e.code === "ArrowDown" ||
        e.code === "ArrowLeft" ||
        e.code === "ArrowRight"
      ) {
        e.preventDefault();
      }
      keysRef.current.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const onWindowBlur = () => {
      keysRef.current.clear();
      lookPointerIdRef.current = null;
    };

    const onCanvasClick = () => {
      if (lastPointerTypeRef.current !== "mouse") return;
      if (document.pointerLockElement === dom) return;
      if (typeof dom.requestPointerLock !== "function") return;
      try {
        const result = dom.requestPointerLock() as unknown;
        if (result && typeof (result as Promise<void>).catch === "function") {
          (result as Promise<void>).catch(() => {
            // Ignore pointer lock rejections (e.g. user pressed Esc right away).
          });
        }
      } catch {
        // Ignore environments where pointer lock is unavailable.
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== dom) return;
      yawRef.current -= e.movementX * MOUSE_SENSITIVITY;
      pitchRef.current = clampPitch(
        pitchRef.current - e.movementY * MOUSE_SENSITIVITY,
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      lastPointerTypeRef.current = e.pointerType;
      if (e.pointerType !== "touch") return;
      const rect = dom.getBoundingClientRect();
      // Right half of canvas controls camera look; left side is reserved for joystick.
      if (e.clientX < rect.left + rect.width / 2) return;
      if (lookPointerIdRef.current !== null) return;

      lookPointerIdRef.current = e.pointerId;
      lastTouchRef.current = { x: e.clientX, y: e.clientY };

      try {
        dom.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture fails.
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      if (e.pointerId !== lookPointerIdRef.current) return;

      const dx = e.clientX - lastTouchRef.current.x;
      const dy = e.clientY - lastTouchRef.current.y;
      lastTouchRef.current = { x: e.clientX, y: e.clientY };

      yawRef.current -= dx * TOUCH_SENSITIVITY;
      pitchRef.current = clampPitch(pitchRef.current - dy * TOUCH_SENSITIVITY);
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerId !== lookPointerIdRef.current) return;
      lookPointerIdRef.current = null;

      try {
        if (dom.hasPointerCapture(e.pointerId)) {
          dom.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore release failures.
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);
    dom.addEventListener("click", onCanvasClick);
    document.addEventListener("mousemove", onMouseMove);
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerEnd);
    dom.addEventListener("pointercancel", onPointerEnd);

    const activeKeys = keysRef.current;

    return () => {
      dom.style.touchAction = prevTouchAction;
      activeKeys.clear();
      lookPointerIdRef.current = null;
      lastPointerTypeRef.current = null;

      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      dom.removeEventListener("click", onCanvasClick);
      document.removeEventListener("mousemove", onMouseMove);
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerEnd);
      dom.removeEventListener("pointercancel", onPointerEnd);

      if (document.pointerLockElement === dom) {
        document.exitPointerLock?.();
      }
    };
  }, [gl]);

  useFrame((_, delta) => {
    camera.rotation.order = "YXZ";
    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current;
    camera.rotation.z = 0;

    const dt = Math.min(delta, 0.1);
    const keys = keysRef.current;
    const joy = joystickRef.current.current;

    let forward =
      (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
      (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) +
      joy.y;
    let strafe =
      (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) +
      joy.x;

    const mag = Math.hypot(forward, strafe);
    if (mag > 1) {
      forward /= mag;
      strafe /= mag;
    }

    if (mag > 0.001) {
      const yaw = yawRef.current;
      const dirX = -Math.sin(yaw) * forward + Math.cos(yaw) * strafe;
      const dirZ = -Math.cos(yaw) * forward - Math.sin(yaw) * strafe;

      const nextX = camera.position.x + dirX * speedRef.current * dt;
      const nextZ = camera.position.z + dirZ * speedRef.current * dt;
      const clamped = clampToBounds(nextX, nextZ, boundsRef.current);

      camera.position.x = clamped.x;
      camera.position.z = clamped.z;
    } else {
      const clamped = clampToBounds(
        camera.position.x,
        camera.position.z,
        boundsRef.current,
      );
      camera.position.x = clamped.x;
      camera.position.z = clamped.z;
    }

    camera.position.y = EYE_HEIGHT;
  });

  return null;
}

export function MobileJoystickOverlay({
  joystick,
}: {
  joystick: React.MutableRefObject<{ x: number; y: number }>;
}) {
  return (
    <div className="hidden [@media(pointer:coarse)]:block">
      <Joystick
        onChange={(v) => {
          joystick.current = v;
        }}
      />
    </div>
  );
}

export function ControlsHint({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hướng dẫn điều khiển"
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 p-4"
    >
      <GlassPanel
        tone="dark"
        className="w-full max-w-sm rounded-2xl border border-white/25 bg-neutral-900/75 p-6 text-center text-white shadow-2xl"
      >
        <p className="text-sm leading-relaxed text-white/95">
          Kéo cần bên trái để đi, vuốt bên phải để nhìn / WASD + chuột
        </p>
        <button
          type="button"
          autoFocus
          onClick={() => {
            haptic("tap");
            onClose();
          }}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-amber-300/60 bg-amber-500/90 px-6 py-2.5 text-sm font-semibold text-neutral-950 shadow-md transition hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          Bắt đầu
        </button>
      </GlassPanel>
    </div>
  );
}
