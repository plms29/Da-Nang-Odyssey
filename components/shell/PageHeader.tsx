"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { TextReveal } from "@/components/fx/TextReveal";

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

  return (
    <header className="mb-6">
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
      <TextReveal mode="fade-up" as="h1" className="text-2xl font-bold tracking-tight text-ink">
        {title}
      </TextReveal>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: reduce ? 0 : 0.08 }}
          className="mt-1 text-sm leading-relaxed text-muted"
        >
          {subtitle}
        </motion.p>
      )}
    </header>
  );
}
