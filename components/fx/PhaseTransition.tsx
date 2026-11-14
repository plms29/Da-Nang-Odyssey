"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { TransitionKind } from "@/lib/scene/types";

const FADE_MS = 160;
const REDUCED_FADE_MS = 80;

export function PhaseTransition(props: {
  kind: TransitionKind;
  play: boolean;
  onCovered: () => void;
  onDone: () => void;
}) {
  const { kind, play, onCovered, onDone } = props;
  void kind;

  const reducedMotion = Boolean(useReducedMotion());
  const [phase, setPhase] = useState<"cover" | "reveal">("cover");
  const [done, setDone] = useState(false);
  const [prevPlay, setPrevPlay] = useState(play);

  if (play !== prevPlay) {
    setPrevPlay(play);
    setPhase("cover");
    setDone(false);
  }

  const onCoveredRef = useRef(onCovered);
  const onDoneRef = useRef(onDone);
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => {
    onCoveredRef.current = onCovered;
    onDoneRef.current = onDone;
    reducedMotionRef.current = reducedMotion;
  });

  const coveredFiredRef = useRef(false);
  const doneFiredRef = useRef(false);

  useEffect(() => {
    if (!play) {
      coveredFiredRef.current = false;
      doneFiredRef.current = false;
      return;
    }

    if (doneFiredRef.current) {
      return;
    }

    const durationMs = reducedMotionRef.current ? REDUCED_FADE_MS : FADE_MS;

    const coveredTimer = window.setTimeout(() => {
      if (!coveredFiredRef.current) {
        coveredFiredRef.current = true;
        onCoveredRef.current();
      }
      setPhase("reveal");
    }, durationMs);

    const doneTimer = window.setTimeout(() => {
      if (!doneFiredRef.current) {
        doneFiredRef.current = true;
        setDone(true);
        onDoneRef.current();
      }
    }, durationMs * 2);

    return () => {
      window.clearTimeout(coveredTimer);
      window.clearTimeout(doneTimer);
    };
  }, [play]);

  if (!play) {
    return null;
  }

  const durationSec = (reducedMotion ? REDUCED_FADE_MS : FADE_MS) / 1000;

  return (
    <motion.div
      aria-hidden="true"
      className={`fixed inset-0 z-[60] bg-sand/85 backdrop-blur-xs${
        done ? " pointer-events-none" : ""
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "reveal" ? 0 : 1 }}
      transition={{ duration: durationSec, ease: "easeInOut" }}
    />
  );
}
