"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { useReducedMotion } from "motion/react";
import { useInView } from "@/components/fx/useInView";

export type ParticlePreset = "dust" | "fireflies" | "fireworks" | "confetti" | "burst";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  w: number;
  h: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  phase: number;
  phaseSpeed: number;
  angle: number;
  spin: number;
  age: number;
  life: number;
  kind: "mote" | "firefly" | "rocket" | "spark" | "confetti";
}

const COLORS = {
  sand: "#F6EFE4",
  terracotta: "#A84825",
  river: "#1F4E6B",
  gold: "#C99A2E",
  fireflyWarm: "#E6EE9C",
  fireflyGold: "#D4E157",
} as const;

const MAX_PARTICLES = 60;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function ParticleCanvas(props: {
  preset: ParticlePreset;
  intensity?: "full" | "calm";
  play?: boolean;
  className?: string;
}): JSX.Element {
  const {
    preset,
    intensity = "full",
    play = true,
    className = "absolute inset-0",
  } = props;

  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [canvasRef, active] = useInView<HTMLCanvasElement>();
  const [runId, setRunId] = useState(0);
  const prevPlayRef = useRef<boolean>(play);
  const doneRunRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!prevPlayRef.current && play) {
      setRunId((id) => id + 1);
    }
    prevPlayRef.current = play;
  }, [play]);

  useEffect(() => {
    const isOneShot = preset === "confetti" || preset === "burst";
    if (isOneShot && doneRunRef.current === runId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mediaReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || mediaReduced || !play) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (!active) {
      return;
    }

    const isCalm = intensity === "calm";
    const countMul = isCalm ? 0.4 : 1;
    const speedMul = isCalm ? 0.6 : 1;
    const alphaMul = isCalm ? 0.5 : 1;

    let width = Math.max(1, canvas.clientWidth || 320);
    let height = Math.max(1, canvas.clientHeight || 240);

    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, canvas.clientWidth || 320);
      const h = Math.max(1, canvas.clientHeight || 240);
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        updateSize();
      });
      ro.observe(canvas);
    }

    const particles: Particle[] = [];
    const oneShotMaxDuration = preset === "confetti" ? 2.0 : 1.6;
    let elapsedTotal = 0;
    let fireworkTimer = 0.25;

    const pushCapped = (p: Particle) => {
      if (particles.length < MAX_PARTICLES) {
        particles.push(p);
      }
    };

    // Initial spawn
    if (preset === "dust") {
      const targetCount = Math.min(MAX_PARTICLES, Math.max(6, Math.round(36 * countMul)));
      const palette = [COLORS.gold, COLORS.sand, COLORS.gold];
      for (let i = 0; i < targetCount; i++) {
        pushCapped({
          x: rand(0, width),
          y: rand(0, height),
          vx: rand(-8, 12) * speedMul,
          vy: rand(-22, -8) * speedMul,
          size: rand(1.4, 3.4),
          w: 0,
          h: 0,
          color: pick(palette),
          alpha: 0.5,
          baseAlpha: rand(0.28, 0.78),
          phase: rand(0, Math.PI * 2),
          phaseSpeed: rand(1.4, 3.2) * speedMul,
          angle: 0,
          spin: 0,
          age: 0,
          life: 1,
          kind: "mote",
        });
      }
    } else if (preset === "fireflies") {
      const targetCount = Math.min(MAX_PARTICLES, Math.max(5, Math.round(26 * countMul)));
      const palette = [COLORS.fireflyGold, COLORS.fireflyWarm, COLORS.gold];
      for (let i = 0; i < targetCount; i++) {
        pushCapped({
          x: rand(0, width),
          y: rand(0, height),
          vx: rand(-16, 16) * speedMul,
          vy: rand(-14, 14) * speedMul,
          size: rand(2.2, 4.2),
          w: 0,
          h: 0,
          color: pick(palette),
          alpha: 0.4,
          baseAlpha: rand(0.45, 0.92),
          phase: rand(0, Math.PI * 2),
          phaseSpeed: rand(1.8, 3.8) * speedMul,
          angle: rand(0, Math.PI * 2),
          spin: rand(-1.2, 1.2) * speedMul,
          age: 0,
          life: 1,
          kind: "firefly",
        });
      }
    } else if (preset === "confetti") {
      const targetCount = Math.min(MAX_PARTICLES, Math.max(12, Math.round(52 * countMul)));
      const palette = [COLORS.terracotta, COLORS.gold, COLORS.river, COLORS.sand];
      const cx = width * 0.5;
      const cy = height * 0.92;
      for (let i = 0; i < targetCount; i++) {
        const launchAngle = rand(-Math.PI * 0.82, -Math.PI * 0.18);
        const speed = rand(180, 380) * speedMul;
        pushCapped({
          x: cx + rand(-24, 24),
          y: cy + rand(-8, 8),
          vx: Math.cos(launchAngle) * speed,
          vy: Math.sin(launchAngle) * speed,
          size: 0,
          w: rand(6, 11),
          h: rand(4, 7),
          color: pick(palette),
          alpha: 1,
          baseAlpha: 0.95,
          phase: rand(0, Math.PI * 2),
          phaseSpeed: rand(3, 7),
          angle: rand(0, Math.PI * 2),
          spin: rand(-7, 7) * speedMul,
          age: 0,
          life: rand(1.45, 2.0),
          kind: "confetti",
        });
      }
    } else if (preset === "burst") {
      const targetCount = Math.min(MAX_PARTICLES, Math.max(12, Math.round(48 * countMul)));
      const palette = [COLORS.gold, COLORS.sand, COLORS.gold];
      const cx = width * 0.5;
      const cy = height * 0.5;
      for (let i = 0; i < targetCount; i++) {
        const theta = (i / targetCount) * Math.PI * 2 + rand(-0.12, 0.12);
        const speed = rand(65, 220) * speedMul;
        pushCapped({
          x: cx,
          y: cy,
          vx: Math.cos(theta) * speed,
          vy: Math.sin(theta) * speed,
          size: rand(2.2, 4.8),
          w: 0,
          h: 0,
          color: pick(palette),
          alpha: 1,
          baseAlpha: 0.95,
          phase: 0,
          phaseSpeed: 0,
          angle: 0,
          spin: 0,
          age: 0,
          life: rand(1.0, 1.6),
          kind: "spark",
        });
      }
    }

    const spawnFireworkBurst = (bx: number, by: number) => {
      const palette = [COLORS.gold, COLORS.terracotta, COLORS.sand];
      const sparkCount = Math.min(
        MAX_PARTICLES - particles.length,
        Math.max(8, Math.round(20 * countMul))
      );
      for (let i = 0; i < sparkCount; i++) {
        const theta = (i / Math.max(1, sparkCount)) * Math.PI * 2 + rand(-0.15, 0.15);
        const speed = rand(45, 135) * speedMul;
        pushCapped({
          x: bx,
          y: by,
          vx: Math.cos(theta) * speed,
          vy: Math.sin(theta) * speed,
          size: rand(1.8, 3.4),
          w: 0,
          h: 0,
          color: pick(palette),
          alpha: 1,
          baseAlpha: 0.9,
          phase: 0,
          phaseSpeed: 0,
          angle: 0,
          spin: 0,
          age: 0,
          life: rand(0.9, 1.55),
          kind: "spark",
        });
      }
    };

    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      elapsedTotal += dt;

      ctx.clearRect(0, 0, width, height);

      if (preset === "fireworks") {
        fireworkTimer -= dt * speedMul;
        if (fireworkTimer <= 0 && particles.length < MAX_PARTICLES - 10) {
          fireworkTimer = rand(1.4, 2.8);
          const launchX = rand(width * 0.18, width * 0.82);
          pushCapped({
            x: launchX,
            y: height * 0.92,
            vx: rand(-14, 14) * speedMul,
            vy: -rand(165, 235) * speedMul,
            size: 2.6,
            w: 0,
            h: 0,
            color: COLORS.gold,
            alpha: 0.9,
            baseAlpha: 0.9,
            phase: 0,
            phaseSpeed: 0,
            angle: 0,
            spin: 0,
            age: 0,
            life: rand(0.55, 0.85),
            kind: "rocket",
          });
        }
      }

      if (preset === "burst" && elapsedTotal < 0.85) {
        const glowAlpha = Math.max(0, (1 - elapsedTotal / 0.85) * 0.35 * alphaMul);
        const radius = Math.min(width, height) * (0.14 + elapsedTotal * 0.32);
        const grad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          0,
          width * 0.5,
          height * 0.5,
          radius
        );
        grad.addColorStop(0, `rgba(201, 154, 46, ${glowAlpha})`);
        grad.addColorStop(1, "rgba(201, 154, 46, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.5, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (p.kind === "mote") {
          p.phase += p.phaseSpeed * dt;
          p.x += (p.vx + Math.sin(p.phase) * 6 * speedMul) * dt;
          p.y += p.vy * dt;
          if (p.y < -8) p.y = height + 8;
          if (p.x < -8) p.x = width + 8;
          if (p.x > width + 8) p.x = -8;

          const twinkle = 0.55 + 0.45 * Math.sin(p.phase);
          const a = p.baseAlpha * twinkle * alphaMul;
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "firefly") {
          p.phase += p.phaseSpeed * dt;
          p.angle += p.spin * dt;
          p.vx += Math.cos(p.angle) * 12 * speedMul * dt;
          p.vy += Math.sin(p.angle) * 12 * speedMul * dt;
          const speedSq = p.vx * p.vx + p.vy * p.vy;
          const maxSpd = 24 * speedMul;
          if (speedSq > maxSpd * maxSpd) {
            const s = maxSpd / Math.sqrt(speedSq);
            p.vx *= s;
            p.vy *= s;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < -12) p.x = width + 12;
          if (p.x > width + 12) p.x = -12;
          if (p.y < -12) p.y = height + 12;
          if (p.y > height + 12) p.y = -12;

          const blink = Math.max(0.08, 0.5 + 0.5 * Math.sin(p.phase));
          const a = p.baseAlpha * blink * alphaMul;

          ctx.globalAlpha = a * 0.35;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "rocket") {
          p.age += dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 90 * speedMul * dt;

          ctx.globalAlpha = p.baseAlpha * alphaMul;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.age >= p.life || p.vy >= -10) {
            const bx = p.x;
            const by = p.y;
            particles.splice(i, 1);
            spawnFireworkBurst(bx, by);
          }
        } else if (p.kind === "spark") {
          p.age += dt;
          if (p.age >= p.life) {
            particles.splice(i, 1);
            continue;
          }
          const t = p.age / p.life;
          const drag = preset === "burst" ? 0.96 : 0.98;
          p.vx *= Math.pow(drag, dt * 60);
          p.vy *= Math.pow(drag, dt * 60);
          if (preset === "fireworks") {
            p.vy += 110 * speedMul * dt;
          } else {
            p.vy += 28 * speedMul * dt;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          const fade = Math.max(0, 1 - t * t);
          const a = p.baseAlpha * fade * alphaMul;

          ctx.globalAlpha = a * 0.3;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "confetti") {
          p.age += dt;
          if (p.age >= p.life) {
            particles.splice(i, 1);
            continue;
          }
          const t = p.age / p.life;
          p.vy += 290 * speedMul * dt;
          p.vx *= Math.pow(0.985, dt * 60);
          p.phase += p.phaseSpeed * dt;
          p.x += (p.vx + Math.sin(p.phase) * 18) * dt;
          p.y += p.vy * dt;
          p.angle += p.spin * dt;

          const fade = t > 0.72 ? Math.max(0, (1 - t) / 0.28) : 1;
          ctx.save();
          ctx.globalAlpha = p.baseAlpha * fade * alphaMul;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.scale(1, Math.max(0.25, Math.abs(Math.cos(p.phase))));
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
          ctx.restore();
        }
      }

      ctx.globalAlpha = 1;

      if (isOneShot && (particles.length === 0 || elapsedTotal >= oneShotMaxDuration)) {
        doneRunRef.current = runId;
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
  }, [preset, intensity, play, active, prefersReduced, runId, canvasRef]);

  if (mounted && prefersReduced) {
    return <></>;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
    />
  );
}
