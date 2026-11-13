"use client";

import { Fragment, useEffect, useState, type JSX } from "react";
import { motion, useReducedMotion } from "motion/react";

export function splitGraphemes(text: string): string[][] {
  const words = text.normalize("NFC").split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("vi", { granularity: "grapheme" });
    return words.map((word) => Array.from(segmenter.segment(word), (s) => s.segment));
  }

  return words.map((word) => Array.from(word));
}

export function KineticText(props: {
  children: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  stagger?: number;
  shimmer?: boolean;
}): JSX.Element {
  const { children, as = "span", className, delay = 0, stagger = 0.03, shimmer = false } = props;
  const reduced = useReducedMotion();
  // Lần render đầu giống server (chưa biết reduced-motion), tránh lệch hydrate.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const text = children.normalize("NFC");
  const Tag = as;

  // Hiện chữ thường trước; đổi sang từng chữ khi mount (chấp nhận được: lệch 1 khung hình).
  if (!mounted || reduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  const words = splitGraphemes(text);
  const totalGraphemes = words.reduce((sum, word) => sum + word.length, 0);
  const entranceEnd = delay + totalGraphemes * stagger + 1;
  const sheenOK =
    typeof CSS !== "undefined" &&
    (CSS.supports("background-clip", "text") || CSS.supports("-webkit-background-clip", "text"));

  let globalIndex = 0;

  return (
    <Tag className={className} style={{ position: "relative" }}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, wordIndex) => (
          <Fragment key={wordIndex}>
            {wordIndex > 0 ? " " : null}
            <span
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                perspective: "600px",
              }}
            >
              {word.map((grapheme, graphemeIndex) => {
                const index = globalIndex++;
                return (
                  <motion.span
                    key={`${wordIndex}-${graphemeIndex}`}
                    className="inline-block"
                    style={{ transformOrigin: "50% 100%" }}
                    initial={{ y: "0.6em", rotateX: 40, opacity: 0 }}
                    animate={{ y: 0, rotateX: 0, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 22,
                      delay: delay + index * stagger,
                    }}
                  >
                    {grapheme}
                  </motion.span>
                );
              })}
            </span>
          </Fragment>
        ))}
      </span>
      {shimmer && sheenOK ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            color: "transparent",
            WebkitTextFillColor: "transparent",
            backgroundImage:
              "linear-gradient(100deg, transparent 40%, #d4a72c 50%, transparent 60%)",
            backgroundSize: "250% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            backgroundRepeat: "no-repeat",
          }}
          initial={{ opacity: 0, backgroundPosition: "150% 50%" }}
          animate={{ opacity: 1, backgroundPosition: ["150% 50%", "-50% 50%", "-50% 50%"] }}
          transition={{
            opacity: { duration: 0.01, delay: entranceEnd },
            backgroundPosition: {
              times: [0, 0.5, 1],
              duration: 6,
              repeat: Infinity,
              ease: "linear",
              delay: entranceEnd,
            },
          }}
        >
          {text}
        </motion.span>
      ) : null}
    </Tag>
  );
}
