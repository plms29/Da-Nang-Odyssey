import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** null when env is not set: the app keeps working offline with localStorage only. */
export const supabase = url && key ? createClient(url, key) : null;

/** fetch() that sends the logged-in user's access token so API routes can check it. */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
