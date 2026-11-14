"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { GlassFilterDefs, GlassPanel } from "@/components/fx/Glass";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const MotionLink = motion.create(Link);

const navItems: NavItem[] = [
  {
    href: "/kham-pha",
    label: "Khám phá",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    href: "/tour",
    label: "5 phút",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
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
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
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
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
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
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);

  // Desktop: hide the top nav while scrolling down, show it again on scroll up.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 80);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <GlassFilterDefs />
      <div className={`fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-50 w-[min(456px,calc(100%-24px))] -translate-x-1/2 lg:top-4 lg:bottom-auto lg:w-max lg:max-w-[720px] lg:transition-transform lg:duration-300 ${hidden ? "lg:-translate-y-24" : ""}`}>
        <GlassPanel
          as="nav"
          tone="light"
          refract
          aria-label="Điều hướng chính"
          className="w-full rounded-[1.75rem] lg:w-auto"
          style={{
            borderRadius: "1.75rem",
            boxShadow: "0 12px 32px -10px rgba(31, 26, 23, 0.25)",
          }}
        >
          <div className="lg:flex lg:items-center lg:gap-6 lg:px-4 lg:whitespace-nowrap">
            <span className="hidden text-xs font-bold whitespace-nowrap text-ink lg:block">
              Hành trình văn hóa Đà Nẵng
            </span>
            <ul className="grid grid-cols-4 gap-1 px-2 py-1.5 lg:flex lg:items-center lg:gap-2 lg:px-0 lg:whitespace-nowrap">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <li key={item.href}>
                    <MotionLink
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      whileTap={reduce ? undefined : { scale: 0.94 }}
                      className={`relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 rounded-[1.25rem] px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta lg:min-h-[44px] lg:flex-row lg:px-4 ${
                        isActive
                          ? "text-terracotta"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId={reduce ? undefined : "nav-indicator"}
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          className="absolute inset-0 rounded-[1.25rem] bg-terracotta/15 shadow-[0_0_16px_rgba(168,72,37,0.35),inset_0_1px_0_rgba(255,255,255,0.45)]"
                          aria-hidden="true"
                        />
                      )}
                      <span className="relative flex flex-col items-center gap-1 lg:flex-row lg:gap-1.5 lg:whitespace-nowrap">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                    </MotionLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </GlassPanel>
      </div>
    </>
  );
}
