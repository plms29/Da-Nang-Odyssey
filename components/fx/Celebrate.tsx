"use client";

import { useEffect, useRef } from "react";
import type { CelebrateKind } from "@/lib/scene/types";
import { haptic } from "@/lib/haptics";

export function Celebrate(props: { kind: CelebrateKind; play: boolean }): null {
  const { kind, play } = props;
  void kind;

  const wasPlayingRef = useRef(false);

  useEffect(() => {
    if (play && !wasPlayingRef.current) {
      haptic("success");
    }
    wasPlayingRef.current = play;
  }, [play]);

  return null;
}
