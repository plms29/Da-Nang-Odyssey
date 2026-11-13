"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { CelebrateKind } from "@/lib/scene/types";
import { ParticleCanvas } from "@/components/fx/ParticleCanvas";
import { haptic } from "@/lib/haptics";

const CELEBRATE_DURATION_MS = 2200;
const MAX_COINS = 38;

interface CoinParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rx: number;
  ry: number;
  angle: number;
  spin: number;
  age: number;
  life: number;
  bounced: boolean;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function CoinBurst(props: { play: boolean; reducedMotion: boolean }) {
  const { play, reducedMotion } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!play || reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = Math.max(1, canvas.clientWidth || 320);
    let height = Math.max(1, canvas.clientHeight || 240);

    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, canvas.clientWidth || 320);
      height = Math.max(1, canvas.clientHeight || 240);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updateSize());
      ro.observe(canvas);
    }

    const coins: CoinParticle[] = [];
    for (let i = 0; i < MAX_COINS; i++) {
      const radius = rand(5.5, 9.5);
      coins.push({
        x: width * 0.5 + rand(-32, 32),
        y: height - rand(4, 18),
        vx: rand(-185, 185),
        vy: -rand(320, 560),
        rx: radius,
        ry: radius * 0.78,
        angle: rand(0, Math.PI * 2),
        spin: rand(6, 13) * (Math.random() < 0.5 ? -1 : 1),
        age: 0,
        life: rand(1.55, 2.15),
        bounced: false,
      });
    }

    let rafId = 0;
    let elapsed = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      elapsed += dt;

      ctx.clearRect(0, 0, width, height);

      for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.age += dt;
        if (coin.age >= coin.life) {
          coins.splice(i, 1);
          continue;
        }

        coin.vy += 690 * dt;
        coin.vx *= Math.pow(0.99, dt * 60);
        coin.x += coin.vx * dt;
        coin.y += coin.vy * dt;
        coin.angle += coin.spin * dt;

        const floorY = height - coin.ry - 2;
        if (!coin.bounced && coin.y >= floorY && coin.vy > 0) {
          coin.y = floorY;
          coin.vy = -coin.vy * 0.46;
          coin.vx *= 0.82;
          coin.bounced = true;
        }

        const t = coin.age / coin.life;
        const alpha = t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1;
        const scaleX = Math.max(0.2, Math.abs(Math.cos(coin.angle)));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(coin.x, coin.y);
        ctx.scale(scaleX, 1);
        ctx.beginPath();
        ctx.ellipse(0, 0, coin.rx, coin.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#C99A2E";
        ctx.fill();
        ctx.strokeStyle = "#F6EFE4";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      if (elapsed >= CELEBRATE_DURATION_MS / 1000 || coins.length === 0) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
    };
  }, [play, reducedMotion]);

  if (!play || reducedMotion) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

function GoldStar() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      initial={{ scale: 0, opacity: 0, rotate: -16 }}
      animate={{
        scale: [0, 1.25, 1, 1.04, 0.88],
        opacity: [0, 1, 1, 0.95, 0],
        rotate: [-16, 6, 0, 0, 8],
      }}
      transition={{
        duration: 2.1,
        times: [0, 0.22, 0.38, 0.78, 1],
        ease: "easeOut",
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 120 120"
        className="h-28 w-28 overflow-visible"
        style={{ filter: "drop-shadow(0 0 18px rgba(201, 154, 46, 0.85))" }}
      >
        <polygon
          points="60,12 71.8,43.8 105.6,45.2 79,66.2 88.2,98.8 60,80 31.8,98.8 41,66.2 14.4,45.2 48.2,43.8"
          fill="#C99A2E"
          stroke="#F6EFE4"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

export function Celebrate(props: { kind: CelebrateKind; play: boolean }) {
  const { kind, play } = props;
  const reducedMotion = Boolean(useReducedMotion());
  const [done, setDone] = useState(false);
  const [prevPlay, setPrevPlay] = useState(play);
  if (play !== prevPlay) {
    setPrevPlay(play);
    if (play) setDone(false);
  }
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    if (play && !wasPlayingRef.current && !reducedMotion) {
      haptic("success");
    }
    wasPlayingRef.current = play;
  }, [play, reducedMotion]);

  useEffect(() => {
    if (!play || reducedMotion) {
      return;
    }

    const endTimer = window.setTimeout(() => {
      setDone(true);
    }, CELEBRATE_DURATION_MS);

    return () => {
      window.clearTimeout(endTimer);
    };
  }, [play, reducedMotion]);

  if (reducedMotion || !play || done) {
    return null;
  }

  // Parent container must be relative.
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {/* Layer a: rotating light-ray burst */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-conic-gradient(from 0deg at 50% 50%, rgba(201, 154, 46, 0.45) 0deg 12deg, transparent 12deg 24deg)",
        }}
        initial={{ scale: 0.6, rotate: 0, opacity: 0 }}
        animate={{ scale: 1.2, rotate: 25, opacity: [0, 0.9, 0.6, 0] }}
        transition={{ duration: 2.2, ease: "easeOut" }}
      />

      {/* Layer b: soft radial bloom */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(201, 154, 46, 0.62) 0%, rgba(201, 154, 46, 0.26) 36%, rgba(246, 239, 228, 0) 70%)",
        }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: [0, 0.95, 0.7, 0], scale: [0.85, 1.05, 1.15, 1.22] }}
        transition={{ duration: 2.2, ease: "easeOut" }}
      />

      {/* Layer c: warm screen flash */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #F6EFE4 0%, #C99A2E 100%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.35, 0] }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />

      {/* Layer d: dedicated canvas coin burst */}
      <CoinBurst play={play} reducedMotion={reducedMotion} />

      {/* Layer e: kind-specific hero element */}
      {kind === "gold-burst" && <GoldStar />}

      {kind === "flag-raise" && (
        <div className="pointer-events-none absolute bottom-6 right-5 h-60 w-36 fx-celebrate-flag-pole">
          <svg
            aria-hidden="true"
            viewBox="0 0 140 240"
            className="h-full w-full overflow-visible"
          >
            {/* Base and pole */}
            <rect x="114" y="18" width="5" height="210" rx="2.5" fill="#1F1A17" />
            <circle cx="116.5" cy="14" r="6" fill="#C99A2E" />
            <path d="M 102 228 L 131 228 L 126 220 L 107 220 Z" fill="#1F1A17" />

            {/* Rising flag group */}
            <g className="fx-celebrate-flag-raise">
              <g className="fx-celebrate-flag-wave">
                <path
                  d="M 18 24 Q 44 18 68 26 T 114 24 L 114 76 Q 88 82 64 74 T 18 76 Z"
                  fill="#A84825"
                  stroke="#C99A2E"
                  strokeWidth="3"
                />
                {/* Festive tails */}
                <path d="M 18 24 L 4 36 L 18 50 L 4 64 L 18 76 Z" fill="#C99A2E" />
                {/* Inner gold diamond */}
                <polygon
                  points="68,36 82,50 68,64 54,50"
                  fill="#C99A2E"
                  stroke="#F6EFE4"
                  strokeWidth="1.5"
                />
              </g>
            </g>
          </svg>
        </div>
      )}

      {kind === "drum-confetti" && (
        <>
          <ParticleCanvas
            preset="confetti"
            play={play}
            className="pointer-events-none absolute inset-0"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
            <svg
              aria-hidden="true"
              viewBox="0 0 120 110"
              className="h-28 w-28 fx-celebrate-drum"
            >
              {/* Shadow */}
              <ellipse cx="60" cy="98" rx="38" ry="7" fill="rgba(31, 26, 23, 0.22)" />
              {/* Terracotta drum body */}
              <path
                d="M 24 34 C 14 54, 14 72, 26 88 L 94 88 C 106 72, 106 54, 96 34 Z"
                fill="#A84825"
                stroke="#1F1A17"
                strokeWidth="2"
              />
              {/* Gold decorative bands */}
              <path
                d="M 20 55 Q 60 63 100 55"
                fill="none"
                stroke="#C99A2E"
                strokeWidth="3.5"
              />
              <path
                d="M 22 72 Q 60 80 98 72"
                fill="none"
                stroke="#C99A2E"
                strokeWidth="2.5"
              />
              {/* Bottom rim */}
              <ellipse
                cx="60"
                cy="88"
                rx="34"
                ry="8"
                fill="#A84825"
                stroke="#C99A2E"
                strokeWidth="3"
              />
              {/* Gold top rim + Sand drum head */}
              <ellipse
                cx="60"
                cy="34"
                rx="38"
                ry="12"
                fill="#F6EFE4"
                stroke="#C99A2E"
                strokeWidth="4"
              />
              {/* Traditional center sun/circle motif on drumhead */}
              <ellipse
                cx="60"
                cy="34"
                rx="16"
                ry="5"
                fill="none"
                stroke="#A84825"
                strokeWidth="2"
              />
              <circle cx="60" cy="34" r="3.5" fill="#C99A2E" />
              {/* Gold rim rivets */}
              <circle cx="30" cy="40" r="2" fill="#C99A2E" />
              <circle cx="44" cy="44" r="2" fill="#C99A2E" />
              <circle cx="60" cy="45.5" r="2" fill="#C99A2E" />
              <circle cx="76" cy="44" r="2" fill="#C99A2E" />
              <circle cx="90" cy="40" r="2" fill="#C99A2E" />
            </svg>
          </div>
        </>
      )}

      {kind === "fireworks" && (
        <>
          <div
            className="pointer-events-none absolute inset-0 fx-celebrate-sky-flash"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, rgba(246, 239, 228, 0.72) 0%, rgba(201, 154, 46, 0.45) 35%, rgba(168, 72, 37, 0.18) 62%, transparent 82%)",
            }}
          />
          <ParticleCanvas
            preset="fireworks"
            play={play}
            className="pointer-events-none absolute inset-0"
          />
        </>
      )}
    </div>
  );
}
