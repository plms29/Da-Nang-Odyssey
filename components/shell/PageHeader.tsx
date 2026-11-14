"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      className={`-mx-4 mb-6 px-4 py-2.5 transition-[background-color,border-color] duration-200 lg:-mx-8 lg:px-8 ${
        scrolled
          ? "sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-md lg:static lg:border-transparent lg:bg-transparent lg:backdrop-blur-none"
          : "border-b border-transparent"
      }`}
    >
      {backHref && (
        <Link
          href={backHref}
          className="mb-1.5 inline-flex min-h-[44px] items-center gap-1.5 rounded-sm py-1 pr-2 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
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
      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-sm leading-relaxed text-muted lg:max-w-2xl lg:text-base">
          {subtitle}
        </p>
      )}
    </header>
  );
}
