"use client";

import { useReducer, useState } from "react";
import { GlassPanel } from "@/components/fx/Glass";
import { initialTour, tourReducer } from "@/lib/tour/player";
import type { Spot } from "@/lib/types";
import { TourEnd } from "./TourEnd";
import { TourPlayer } from "./TourPlayer";
import { TourSetup } from "./TourSetup";

export interface TourAppProps {
  spots: Spot[];
}

export function TourApp({ spots }: TourAppProps) {
  const [state, dispatch] = useReducer(tourReducer, undefined, initialTour);
  const [emptyNotice, setEmptyNotice] = useState<string | null>(null);

  if (state.phase === "setup") {
    return (
      <TourSetup
        spots={spots}
        dispatch={dispatch}
        notice={emptyNotice}
        onClearNotice={() => setEmptyNotice(null)}
        onEmptyPlan={(message) => setEmptyNotice(message)}
      />
    );
  }

  if (state.phase === "loading") {
    return (
      <GlassPanel
        as="section"
        tone="light"
        role="status"
        className="flex flex-col items-center gap-3 rounded-2xl p-6 text-center lg:mx-auto lg:max-w-xl lg:p-10"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="h-8 w-8 animate-spin text-terracotta motion-reduce:animate-none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" className="opacity-25" />
          <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
        </svg>
        <p className="text-base font-semibold text-ink">Đang chuẩn bị tour…</p>
      </GlassPanel>
    );
  }

  if (state.phase === "end") {
    return <TourEnd state={state} spots={spots} dispatch={dispatch} />;
  }

  return <TourPlayer state={state} dispatch={dispatch} spots={spots} />;
}
