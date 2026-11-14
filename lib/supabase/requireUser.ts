import { NextResponse } from "next/server";
import { supabase } from "./client";

/**
 * Returns a 401 response unless the request carries a valid Supabase access token.
 * No check when Supabase is not configured (offline dev), matching the UI LoginGate.
 */
export async function requireUser(request: Request): Promise<NextResponse | null> {
  if (!supabase) return null;
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) return null;
  }
  return NextResponse.json({ error: "Login required" }, { status: 401 });
}
