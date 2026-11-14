"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { GlassPanel } from "@/components/fx/Glass";
import { supabase } from "@/lib/supabase/client";
import { startProgressSync } from "@/lib/supabase/sync";

/** Starts cloud sync app-wide; rendered once in the root layout. */
export function ProgressSyncBoot() {
  useEffect(startProgressSync, []);
  return null;
}

/** undefined while loading, null when logged out. */
export function useUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return user;
}

/** Every page except the home page needs a Google login. No gate when Supabase is not configured. */
export function LoginGate({ children }: { children: ReactNode }) {
  const user = useUser();
  const pathname = usePathname();
  if (!supabase || pathname === "/" || user) return children;
  if (user === undefined) return null;
  return (
    <div className="mx-auto mt-16 max-w-md">
      <AccountPanel />
    </div>
  );
}

/** Google login. Hidden when Supabase is not configured. */
export function AccountPanel() {
  const user = useUser();
  const pathname = usePathname();
  const [error, setError] = useState(false);

  if (!supabase || user === undefined) return null;
  const db = supabase;

  async function signInWithGoogle() {
    setError(false);
    const { error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
    if (error) setError(true);
  }

  return (
    <GlassPanel className="p-4">
      {user ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>
            Đã lưu tiến trình cho <strong>{user.email}</strong>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {pathname !== "/ho-so" && (
              <Link
                href="/ho-so"
                className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 font-semibold underline-offset-2 hover:underline focus-visible:outline-2"
              >
                Hồ sơ
              </Link>
            )}
            <button
              type="button"
              onClick={() => db.auth.signOut()}
              className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 font-semibold underline-offset-2 hover:underline focus-visible:outline-2"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold">Đăng nhập bằng Google để bắt đầu chơi và lưu tiến trình</p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-ink px-6 py-3.5 text-base font-bold text-sand shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-0"
          >
            <span aria-hidden className="grid size-7 place-items-center rounded-full bg-white">
              <svg viewBox="0 0 48 48" className="size-5">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
            </span>
            Đăng nhập bằng Google
          </button>
          <p role="status" className="text-sm text-ink/70">
            {error && "Không đăng nhập được, thử lại sau."}
          </p>
        </div>
      )}
    </GlassPanel>
  );
}
