"use client";
import { supabase } from "./client";
import { usePassport } from "@/lib/passport/store";
import { mergePassports, type PassportState } from "@/lib/passport/logic";

let started = false;

function snapshot(): PassportState {
  const { stamps, levels, total_code_score } = usePassport.getState();
  return { stamps, levels, total_code_score };
}

/** On login: merge cloud + local progress, then push every local change to the cloud. */
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
      const { error } = await db
        .from("danang_progress")
        .upsert({ user_id: userId, data: snapshot(), updated_at: new Date().toISOString() });
      if (error) console.error("progress sync failed", error);
    }, 800);
  };

  db.auth.onAuthStateChange(async (_event, session) => {
    const nextId = session?.user.id ?? null;
    if (nextId === userId) return;
    userId = nextId;
    if (!userId) return;
    const { data, error } = await db.from("danang_progress").select("data").eq("user_id", userId).maybeSingle();
    if (error) return console.error("progress load failed", error);
    if (data?.data) usePassport.setState(mergePassports(snapshot(), data.data as PassportState));
    push();
  });

  usePassport.subscribe(push);
}
