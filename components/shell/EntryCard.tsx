"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export type AccentColor = "terracotta" | "river" | "gold";

export interface EntryCardProps {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  accent?: AccentColor;
}

const accentStyles: Record<
  AccentColor,
  { border: string; iconBg: string; badge: string }
> = {
  terracotta: {
    border: "border-l-4 border-l-terracotta",
    iconBg: "bg-terracotta text-sand",
    badge: "text-terracotta",
  },
  river: {
    border: "border-l-4 border-l-river",
    iconBg: "bg-river text-sand",
    badge: "text-river",
  },
  gold: {
    border: "border-l-4 border-l-gold",
    iconBg: "bg-gold text-ink",
    badge: "text-ink",
  },
};

export function RevealItem({
  delay = 0,
  children,
}: {
  delay?: number;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0.2 : 0.4,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function EntryCard({
  href,
  title,
  description,
  icon,
  accent = "terracotta",
}: EntryCardProps) {
  const styles = accentStyles[accent];
  const reduced = useReducedMotion();

  return (
    <motion.div whileTap={reduced ? undefined : { scale: 0.97 }}>
      <Link
        href={href}
        className={`group flex items-start gap-4 rounded-lg border border-ink/15 bg-white/75 p-4 transition-all hover:border-ink/30 hover:bg-white md:hover:-translate-y-0.5 motion-reduce:md:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${styles.border}`}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${styles.iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-ink group-hover:text-terracotta">
              {title}
            </h2>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${styles.badge}`}
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
