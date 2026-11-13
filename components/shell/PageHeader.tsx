"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { KineticText } from "@/components/fx/KineticText";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Trang chủ",
}: PageHeaderProps) {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const next = window.scrollY > 8;
      setScrolled((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <header
      className={`-mx-4 mb-6 px-4 py-2 transition-[background-color,box-shadow,border-color] duration-200 lg:-mx-8 lg:px-8 ${
        scrolled
          ? "sticky top-0 z-30 rounded-b-2xl border-b border-white/50 bg-sand/65 shadow-sm backdrop-blur-[18px] backdrop-saturate-[1.6] lg:top-20"
          : "border-b border-transparent"
      }`}
    >
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-sm py-1 pr-2 text-sm font-semibold text-terracotta hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>{backLabel}</span>
        </Link>
      )}
      <KineticText as="h1" className="text-2xl font-bold tracking-tight text-ink lg:text-4xl">
        {title}
      </KineticText>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: reduce ? 0 : 0.08 }}
          className="mt-1 text-sm leading-relaxed text-muted lg:max-w-2xl"
        >
          {subtitle}
        </motion.p>
      )}
    </header>
  );
}
