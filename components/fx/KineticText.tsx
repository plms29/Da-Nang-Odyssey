"use client";

import type { JSX } from "react";

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
  const { children, as = "span", className, delay, stagger, shimmer } = props;
  void delay;
  void stagger;
  void shimmer;

  const Tag = as;

  return <Tag className={className}>{children.normalize("NFC")}</Tag>;
}
