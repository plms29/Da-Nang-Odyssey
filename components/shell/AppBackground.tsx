"use client";

import { usePathname } from "next/navigation";

interface BackgroundConfig {
  src: string;
  label: string;
}

function getBackgroundForPath(pathname: string | null): BackgroundConfig {
  if (pathname?.startsWith("/kham-pha/man-1-dau-an-cham")) {
    return {
      src: "/background/cham.jpeg",
      label: "Di sản Chăm",
    };
  }
  if (pathname?.startsWith("/kham-pha/man-2-giu-thanh")) {
    return {
      src: "/background/thanhdienhai.jpeg",
      label: "Thành Điện Hải",
    };
  }
  if (pathname?.startsWith("/kham-pha/man-3-ho-bai-choi")) {
    return {
      src: "/background/hobaichoi.jpeg",
      label: "Hội Bài chòi",
    };
  }
  return {
    src: "/background/caurong.jpeg",
    label: "Cầu Rồng, Đà Nẵng",
  };
}

export function AppBackground() {
  const pathname = usePathname();
  const { src, label } = getBackgroundForPath(pathname);

  return (
    <div
      aria-hidden="true"
      data-scene-label={label}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        decoding="async"
        className="h-full w-full object-cover object-center transition-opacity duration-500"
      />
      <div
        className="absolute inset-0 transition-colors duration-200"
        style={{ backgroundColor: "var(--active-scrim)" }}
      />
    </div>
  );
}
