"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeSettings } from "@/components/shell/ThemeSettings";

interface NavItem {
  href: string;
  label: string;
  icon: (compact: boolean) => ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/kham-pha",
    label: "Khám phá",
    icon: (compact) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={compact ? "h-5 w-5" : "h-4 w-4"}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    href: "/tour",
    label: "Tour 5p",
    icon: (compact) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={compact ? "h-5 w-5" : "h-4 w-4"}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/photobooth",
    label: "Check-in",
    icon: (compact) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={compact ? "h-5 w-5" : "h-4 w-4"}
        aria-hidden="true"
      >
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    href: "/ho-chieu",
    label: "Hộ chiếu",
    icon: (compact) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={compact ? "h-5 w-5" : "h-4 w-4"}
        aria-hidden="true"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-50 w-[min(456px,calc(100%-24px))] -translate-x-1/2 lg:top-4 lg:bottom-auto lg:w-max lg:max-w-[calc(100%-2rem)]">
      <nav
        aria-label="Điều hướng chính"
        className="w-full rounded-2xl border border-border bg-surface/88 backdrop-blur-md lg:rounded-full"
      >
        {/* Mobile: lưới 5 cột đều (4 tab + Cài đặt giao diện) */}
        <div className="grid grid-cols-5 items-center gap-0.5 px-1.5 py-1 lg:hidden">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                  isActive
                    ? "bg-terracotta/10 font-semibold text-terracotta"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.icon(true)}
                <span>{item.label}</span>
              </Link>
            );
          })}
          <ThemeSettings compact />
        </div>

        {/* Desktop: thanh nổi phía trên */}
        <div className="hidden lg:flex lg:items-center lg:gap-3 lg:px-4 lg:py-1.5 lg:whitespace-nowrap">
          <Link
            href="/"
            className="rounded-full px-2 py-1 text-sm font-semibold tracking-tight text-ink transition-colors hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Di sản Đà Nẵng
          </Link>

          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                      isActive
                        ? "bg-terracotta/10 font-semibold text-terracotta"
                        : "font-medium text-muted hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    {item.icon(false)}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <span aria-hidden="true" className="h-5 w-px bg-border" />

          <ThemeSettings />
        </div>
      </nav>
    </div>
  );
}
