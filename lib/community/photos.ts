import { supabase } from "@/lib/supabase/client";
import type { Spot } from "@/lib/types";

export interface CommunityPhoto {
  id: string;
  spot_name: string;
  caption: string | null;
  path: string;
  created_at: string;
}

const BUCKET = "danang-photos";

export function photoUrl(path: string): string {
  return supabase?.storage.from(BUCKET).getPublicUrl(path).data.publicUrl ?? "";
}

/** Upload to the shared bucket + insert a row. Returns false if offline / not logged in / failed. */
export async function sharePhoto(blob: Blob, spot: Spot, caption?: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return false;
  const path = `${uid}/${Date.now()}.jpg`;
  const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (up.error) return false;
  const ins = await supabase.from("danang_photos").insert({
    user_id: uid,
    spot_id: spot.id,
    spot_name: spot.name,
    caption: caption?.slice(0, 100) || null,
    path,
  });
  return !ins.error;
}

export async function listPhotos(): Promise<CommunityPhoto[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("danang_photos")
    .select("id,spot_name,caption,path,created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  return (data as CommunityPhoto[]) ?? [];
}
