import type { SceneId } from "@/lib/scene";

/** Per-account settings, synced with the passport (giai đoạn F). */
export interface Prefs {
  /** App look: "home" or the world of an unlocked level. */
  theme: SceneId;
  /** ms epoch of the last theme change; the newer side wins when local and cloud differ. */
  theme_at: number;
}

export const defaultPrefs = (): Prefs => ({ theme: "home", theme_at: 0 });

/** Accept untrusted data (cloud row, old localStorage) and keep only a theme the player may use. */
export function sanitizePrefs(raw: unknown, allowed: readonly SceneId[], now = Date.now()): Prefs {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const theme = typeof r.theme === "string" && (allowed as readonly string[]).includes(r.theme)
    ? (r.theme as SceneId)
    : "home";
  // A future timestamp (clock skew > 1 day or tampering) would win every merge forever, so it counts as 0.
  const at =
    typeof r.theme_at === "number" && Number.isFinite(r.theme_at) && r.theme_at > 0 && r.theme_at <= now + 86_400_000
      ? r.theme_at
      : 0;
  return { theme, theme_at: theme === "home" && r.theme !== "home" ? 0 : at };
}

/** Newer theme choice wins; ties keep local. Both sides are sanitized against `allowed`. */
export function mergePrefs(local: unknown, cloud: unknown, allowed: readonly SceneId[], now = Date.now()): Prefs {
  const l = sanitizePrefs(local, allowed, now);
  const c = sanitizePrefs(cloud, allowed, now);
  return c.theme_at > l.theme_at ? c : l;
}
