"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  type JSX,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { useTilt } from "@/components/fx/useTilt";

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
  as?: "div" | "article" | "section";
}

const SPRING_CONFIG = { stiffness: 120, damping: 20 };

/**
 * Interactive 3D tilting card driven by shared tilt state or local pointer hover.
 */
export function TiltCard({
  children,
  className,
  max = 6,
  glare = false,
  as = "div",
}: TiltCardProps): JSX.Element {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { x: globalX, y: globalY } = useTilt();
  const hover = useMotionValue(0);
  const rawLocalX = useMotionValue(0);
  const rawLocalY = useMotionValue(0);
  const localX = useSpring(rawLocalX, SPRING_CONFIG);
  const localY = useSpring(rawLocalY, SPRING_CONFIG);

  const tiltX = useTransform<number, number>(
    [hover, localX, globalX],
    ([isHovering, local, global]) => (isHovering > 0.5 ? local : global)
  );
  const tiltY = useTransform<number, number>(
    [hover, localY, globalY],
    ([isHovering, local, global]) => (isHovering > 0.5 ? local : global)
  );

  const rotateY = useTransform(tiltX, (v) => v * max);
  const rotateX = useTransform(tiltY, (v) => -v * max);

  const glareX = useTransform(tiltX, (v) => 50 + v * 50);
  const glareY = useTransform(tiltY, (v) => 50 + v * 50);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22), transparent 60%)`;

  const classes = className ? `relative ${className}` : "relative";

  if (mounted && reduced) {
    const PlainTag = as;
    return <PlainTag className={classes}>{children}</PlainTag>;
  }

  const updateLocalTilt = (e: ReactPointerEvent<HTMLElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    rawLocalX.set(Math.min(1, Math.max(-1, nx)));
    rawLocalY.set(Math.min(1, Math.max(-1, ny)));
  };

  const handlePointerEnter = (e: ReactPointerEvent<HTMLElement>): void => {
    if (e.pointerType === "touch") return;
    hover.set(1);
    updateLocalTilt(e);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLElement>): void => {
    if (e.pointerType === "touch") return;
    updateLocalTilt(e);
  };

  const handlePointerLeave = (): void => {
    hover.set(0);
    rawLocalX.set(0);
    rawLocalY.set(0);
  };

  const motionProps = {
    className: classes,
    style: { rotateX, rotateY, transformPerspective: 800 },
    onPointerEnter: handlePointerEnter,
    onPointerMove: handlePointerMove,
    onPointerLeave: handlePointerLeave,
  };

  const content = (
    <>
      {children}
      {glare && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] mix-blend-soft-light"
          style={{ background: glareBackground }}
        />
      )}
    </>
  );

  if (as === "article") {
    return <motion.article {...motionProps}>{content}</motion.article>;
  }
  if (as === "section") {
    return <motion.section {...motionProps}>{content}</motion.section>;
  }
  return <motion.div {...motionProps}>{content}</motion.div>;
}
