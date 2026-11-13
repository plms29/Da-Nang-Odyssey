"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { GlassPanel } from "@/components/fx/Glass";
import { TiltCard } from "@/components/fx/TiltCard";

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
  { bar: string; iconBg: string; badge: string }
> = {
  terracotta: {
    bar: "bg-terracotta",
    iconBg: "bg-terracotta text-sand",
    badge: "text-terracotta",
  },
  river: {
    bar: "bg-river",
    iconBg: "bg-river text-sand",
    badge: "text-river",
  },
  gold: {
    bar: "bg-gold",
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
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{
        duration: reduced ? 0.2 : 0.4,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="lg:h-full"
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

  return (
    <TiltCard className="rounded-lg lg:h-full">
      <GlassPanel tone="light" className="relative overflow-hidden rounded-lg lg:h-full">
        <Link
          href={href}
          className="group relative flex items-start gap-4 rounded-lg p-4 pl-5 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-terracotta lg:h-full lg:min-h-[200px] lg:flex-col lg:justify-between lg:gap-5 lg:p-6"
        >
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 w-1 rounded-l-lg ${styles.bar}`}
          />
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md lg:h-14 lg:w-14 ${styles.iconBg}`}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1 lg:w-full lg:flex-none">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-ink group-hover:text-terracotta lg:text-2xl">
                {title}
              </h2>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 lg:h-5 lg:w-5 ${styles.badge}`}
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted lg:mt-2 lg:text-base">
              {description}
            </p>
          </div>
        </Link>
      </GlassPanel>
    </TiltCard>
  );
}
