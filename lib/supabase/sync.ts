"use client";
import { supabase } from "./client";
import { getLevels } from "@/lib/content";
import { usePassport } from "@/lib/passport/store";
import { mergePassports, sanitizePassport, type PassportState } from "@/lib/passport/logic";
import { mergePrefs, sanitizePrefs, type Prefs } from "@/lib/prefs/logic";
import { usePrefs } from "@/lib/prefs/store";
import { availableThemes } from "@/lib/theme";

let started = false;

function passportSnapshot(): PassportState {
  const { stamps, levels, total_code_score } = usePassport.getState();
  return { stamps, levels, total_code_score };
}

function prefsSnapshot(): Prefs {
  const { theme, theme_at } = usePrefs.getState();
  return { theme, theme_at };
}

/**
 * On login: merge cloud + local progress and prefs, then push every local change to the cloud.
 * Row `data` = passport fields + `prefs` (older rows without `prefs` still load).
 */
export function startProgressSync() {
  if (!supabase || started) return;
  started = true;
  const db = supabase;
  let userId: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const push = () => {
    if (!userId) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const { error } = await db.from("danang_progress").upsert({
        user_id: userId,
        data: { ...passportSnapshot(), prefs: prefsSnapshot() },
        updated_at: new Date().toISOString(),
      });
      if (error) console.error("progress sync failed", error);
    }, 800);
  };

  db.auth.onAuthStateChange(async (_event, session) => {
    const nextId = session?.user.id ?? null;
    if (nextId === userId) return;
    userId = nextId;
    if (!userId) return;
    const { data, error } = await db.from("danang_progress").select("data").eq("user_id", userId).maybeSingle();
    if (error) {
      // Never push local-only data over a cloud row we could not read; retry on the next auth event.
      userId = null;
      return console.error("progress load failed", error);
    }
    const cloud = (data?.data ?? null) as Record<string, unknown> | null;
    if (cloud) usePassport.setState(mergePassports(passportSnapshot(), sanitizePassport(cloud)));
    // The cloud row is untrusted input: only a theme the merged progress actually unlocks is kept.
    const allowed = availableThemes(getLevels(), passportSnapshot());
    usePrefs.setState(cloud ? mergePrefs(prefsSnapshot(), cloud.prefs, allowed) : sanitizePrefs(prefsSnapshot(), allowed));
    push();
  });

  usePassport.subscribe(push);
  usePrefs.subscribe(push);
}
