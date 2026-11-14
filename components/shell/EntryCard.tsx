import Link from "next/link";
import type { ReactNode } from "react";

export type AccentColor = "terracotta" | "river" | "gold";

export interface EntryCardProps {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  accent?: AccentColor;
}

const accentStyles: Record<AccentColor, string> = {
  terracotta: "bg-terracotta/12 text-terracotta",
  river: "bg-river/12 text-river",
  gold: "bg-gold/15 text-gold",
};

export function EntryCard({
  href,
  title,
  description,
  icon,
  accent = "terracotta",
}: EntryCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-border bg-surface/90 p-4 backdrop-blur-md transition-colors hover:border-ink/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta lg:h-full lg:flex-col lg:justify-between lg:gap-6 lg:p-6"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accentStyles[accent]}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1 lg:w-full lg:flex-none">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink transition-colors group-hover:text-terracotta lg:text-lg">
            {title}
          </h2>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </Link>
  );
}
