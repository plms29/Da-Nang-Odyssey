"use client";

import { useEffect, useMemo, useState, type CSSProperties, type JSX } from "react";
import { motion, useReducedMotion } from "motion/react";

// Chữ hiện theo 4 kiểu, mỗi kiểu chạy một lần khi vào khung nhìn (plan-ui-dong.md mục 2).

type Tag = "h1" | "h2" | "h3" | "p" | "span";
type Inner = { text: string; tag: Tag; delay: number; className?: string };

const SCRAMBLE_CHARS =
  "aăâbcdđeêghiklmnoôơpqrstuưvxyáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ";
const SCRAMBLE_POOL = Array.from(SCRAMBLE_CHARS + SCRAMBLE_CHARS.toUpperCase());
const SCRAMBLE_MS = 800;
const GLITCH_MAX_CHARS = 30;
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const MOTION_TAG = { h1: motion.h1, h2: motion.h2, h3: motion.h3, p: motion.p, span: motion.span };

/** True khi phần tử vào khung nhìn lần đầu (ngưỡng 40%, giống motion amount 0.4). Ref là callback để chạy được với mọi tag. */
function useOnceInView() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  return [setEl, seen] as const;
}

/** Ký tự có chữ hoa/thường hoặc chữ số mới xáo trộn; khoảng trắng và dấu câu giữ nguyên. */
function isScrambled(u: string) {
  return /[0-9]/.test(u) || u.toLowerCase() !== u.toUpperCase();
}

/** Ký tự thứ i khoá lại lúc (i+1)/n của thời lượng: đi từ trái sang phải. */
function scrambleFrame(units: string[], elapsed: number): string {
  const n = units.length;
  return units
    .map((u, i) => {
      if (!isScrambled(u) || elapsed >= (SCRAMBLE_MS * (i + 1)) / n) return u;
      return SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
    })
    .join("");
}

function Scramble({ text, tag: Tag, delay, className }: Inner) {
  const [ref, seen] = useOnceInView();
  const units = useMemo(() => Array.from(text), [text]);
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!seen) return;
    let raf = 0;
    let start = -1;
    const tick = (now: number) => {
      if (start < 0) start = now;
      const elapsed = now - start;
      if (elapsed >= SCRAMBLE_MS) {
        setDisplay(null);
        return;
      }
      setDisplay(scrambleFrame(units, elapsed));
      raf = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay * 1000);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [seen, units, delay]);

  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display ?? text}</span>
    </Tag>
  );
}

function Glitch({ text, tag: Tag, delay, className }: Inner) {
  const [ref, seen] = useOnceInView();
  const cls = ["fx-glitch", seen && "fx-glitch--run", className].filter(Boolean).join(" ");
  return (
    <Tag
      ref={ref}
      className={cls}
      data-text={text}
      style={{ "--fx-delay": `${delay}s` } as CSSProperties}
    >
      {text}
    </Tag>
  );
}

function Fade({ text, tag, delay, className, blur }: Inner & { blur: boolean }) {
  const M = MOTION_TAG[tag];
  return (
    <M
      className={className}
      initial={blur ? { opacity: 0, filter: "blur(12px)" } : { opacity: 0, y: 16 }}
      whileInView={blur ? { opacity: 1, filter: "blur(0px)" } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: blur ? 0.7 : 0.5, ease: EASE_OUT, delay }}
    >
      {text}
    </M>
  );
}

export function TextReveal(props: {
  mode: "fade-up" | "blur" | "scramble" | "glitch";
  delay?: number; // giây, mặc định 0
  as?: "h1" | "h2" | "h3" | "p" | "span"; // mặc định "span"
  className?: string;
  children: string;
}): JSX.Element {
  const { mode, delay = 0, as = "span", className, children } = props;
  const reduced = useReducedMotion();
  // Lần render đầu giống server (chưa biết reduced-motion), tránh lệch hydrate.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const text = children.normalize("NFC");
  const Tag = as;

  // Giảm chuyển động: chữ thẳng, không animation nào.
  if (mounted && reduced) return <Tag className={className}>{text}</Tag>;

  const inner: Inner = { text, tag: as, delay, className };
  if (mode === "scramble") return <Scramble {...inner} />;
  if (mode === "glitch" && Array.from(text).length <= GLITCH_MAX_CHARS) {
    return <Glitch {...inner} />;
  }
  return <Fade {...inner} blur={mode === "blur"} />;
}
