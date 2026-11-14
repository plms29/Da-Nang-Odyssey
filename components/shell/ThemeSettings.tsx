"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type BgDimMode = "normal" | "soft";

interface ThemeState {
  theme: ThemeMode;
  bgDim: BgDimMode;
  systemDark: boolean;
}

const THEME_STORAGE_KEY = "danang-theme";
const BG_DIM_STORAGE_KEY = "danang-bg-dim";

const SERVER_STATE: ThemeState = {
  theme: "light",
  bgDim: "normal",
  systemDark: false,
};

let cachedState: ThemeState | null = null;
const listeners = new Set<() => void>();

function readClientState(): ThemeState {
  if (typeof window === "undefined") {
    return SERVER_STATE;
  }

  let theme: ThemeMode = "light";
  let bgDim: BgDimMode = "normal";

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      theme = storedTheme;
    }

    const storedDim = window.localStorage.getItem(BG_DIM_STORAGE_KEY);
    if (storedDim === "normal" || storedDim === "soft") {
      bgDim = storedDim;
    }
  } catch {
    // Bỏ qua lỗi bộ nhớ khi trình duyệt hạn chế localStorage
  }

  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (
    cachedState &&
    cachedState.theme === theme &&
    cachedState.bgDim === bgDim &&
    cachedState.systemDark === systemDark
  ) {
    return cachedState;
  }

  cachedState = { theme, bgDim, systemDark };
  return cachedState;
}

function resolveTheme(state: ThemeState): "light" | "dark" {
  if (state.theme === "system") {
    return state.systemDark ? "dark" : "light";
  }
  return state.theme;
}

function applyDocumentTheme(state: ThemeState): void {
  if (typeof document === "undefined") return;

  const resolved = resolveTheme(state);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.bgDim = state.bgDim;

  const themeColor = resolved === "dark" ? "#111214" : "#F7F5F0";
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (metas.length > 0) {
    metas.forEach((meta) => meta.setAttribute("content", themeColor));
  } else {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = themeColor;
    document.head.appendChild(meta);
  }
}

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  let cleanupMedia: (() => void) | undefined;
  let cleanupStorage: (() => void) | undefined;

  if (typeof window !== "undefined") {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = () => {
      const current = readClientState();
      cachedState = { ...current, systemDark: media.matches };
      applyDocumentTheme(cachedState);
      emitChange();
    };
    media.addEventListener("change", onMediaChange);
    cleanupMedia = () => media.removeEventListener("change", onMediaChange);

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === THEME_STORAGE_KEY ||
        event.key === BG_DIM_STORAGE_KEY
      ) {
        const next = readClientState();
        applyDocumentTheme(next);
        emitChange();
      }
    };
    window.addEventListener("storage", onStorage);
    cleanupStorage = () => window.removeEventListener("storage", onStorage);
  }

  return () => {
    listeners.delete(listener);
    cleanupMedia?.();
    cleanupStorage?.();
  };
}

function getSnapshot(): ThemeState {
  return readClientState();
}

function getServerSnapshot(): ThemeState {
  return SERVER_STATE;
}

function updateThemeMode(nextTheme: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // Bỏ qua lỗi ghi localStorage
  }
  const current = readClientState();
  cachedState = { ...current, theme: nextTheme };
  applyDocumentTheme(cachedState);
  emitChange();
}

function updateBgDimMode(nextDim: BgDimMode): void {
  try {
    window.localStorage.setItem(BG_DIM_STORAGE_KEY, nextDim);
  } catch {
    // Bỏ qua lỗi ghi localStorage
  }
  const current = readClientState();
  cachedState = { ...current, bgDim: nextDim };
  applyDocumentTheme(cachedState);
  emitChange();
}

const THEME_OPTIONS: ReadonlyArray<{ value: ThemeMode; label: string }> = [
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
  { value: "system", label: "Tự động" },
];

const BG_DIM_OPTIONS: ReadonlyArray<{ value: BgDimMode; label: string }> = [
  { value: "normal", label: "Rõ nét" },
  { value: "soft", label: "Dịu nhẹ" },
];

export interface ThemeSettingsProps {
  compact?: boolean;
}

export function ThemeSettings({ compact = false }: ThemeSettingsProps) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const resolvedTheme = resolveTheme(state);

  useEffect(() => {
    applyDocumentTheme(state);
  }, [state]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const icon =
    resolvedTheme === "dark" ? (
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
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ) : (
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
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    );

  return (
    <div ref={containerRef} className="relative flex items-center justify-center">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Cài đặt giao diện"
        onClick={() => setOpen((prev) => !prev)}
        className={
          compact
            ? `flex min-h-[44px] min-w-[44px] w-full flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                open
                  ? "bg-ink/8 font-semibold text-ink"
                  : "text-muted hover:text-ink"
              }`
            : `inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                open
                  ? "border-ink/25 bg-ink/8 text-ink"
                  : "border-border bg-sand/60 text-muted hover:border-ink/20 hover:text-ink"
              }`
        }
      >
        {icon}
        <span>Giao diện</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Tùy chỉnh giao diện"
          className="absolute right-0 bottom-full z-50 mb-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface/95 p-3.5 text-ink shadow-lg backdrop-blur-md lg:top-full lg:right-0 lg:bottom-auto lg:mt-2 lg:mb-0"
        >
          <div>
            <p className="text-xs font-medium text-muted">
              Chế độ màu
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {THEME_OPTIONS.map((option) => {
                const active = state.theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateThemeMode(option.value)}
                    className={`min-h-[36px] rounded-lg px-2 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                      active
                        ? "bg-ink font-semibold text-sand"
                        : "border border-border bg-sand/50 font-medium text-muted hover:border-ink/25 hover:text-ink"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3.5">
            <p className="text-xs font-medium text-muted">
              Độ dịu ảnh nền
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {BG_DIM_OPTIONS.map((option) => {
                const active = state.bgDim === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateBgDimMode(option.value)}
                    className={`min-h-[36px] rounded-lg px-2 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                      active
                        ? "bg-ink font-semibold text-sand"
                        : "border border-border bg-sand/50 font-medium text-muted hover:border-ink/25 hover:text-ink"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
