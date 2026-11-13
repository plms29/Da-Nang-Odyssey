"use client";

import { useEffect, useRef, useState } from "react";

/**
 * true khi phần tử đang trong khung nhìn VÀ tab đang hiện.
 * Dùng để dừng animation: <div ref={ref} data-paused={!active}> (fx.css dừng mọi animation con).
 */
export function useInView<T extends Element>(rootMargin = "100px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return [ref, inView && tabVisible] as const;
}
