"use client";

import { useState, type FormEvent } from "react";
import { checkMapPin } from "@/lib/activities/scoring";
import type { MapPinStation as MapPinStationType, StationResult } from "@/lib/types";
import { useAttempt } from "../useAttempt";
import { HintBox } from "../HintBox";

export interface MapPinStationProps {
  station: MapPinStationType;
  onDone: (result: StationResult) => void;
}

export function MapPinStation({ station, onDone }: MapPinStationProps) {
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

  function submitCoordinates(lat: number, lng: number) {
    const check = checkMapPin(station, { lat, lng });
    if (check.correct) {
      setFeedback(null);
      onDone(result(true));
      return;
    }
    addWrong();
    setFeedback(
      `Chưa đúng, còn cách khoảng ${Math.round(check.distance_m)} m`,
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const lat = Number.parseFloat(latInput);
    const lng = Number.parseFloat(lngInput);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setFeedback("Vui lòng nhập vĩ độ và kinh độ hợp lệ.");
      return;
    }
    submitCoordinates(lat, lng);
  }

  function handleDemoPin() {
    submitCoordinates(station.target.lat, station.target.lng);
  }

  function handleHint() {
    const hint = nextHint();
    if (hint !== null) {
      setRevealedHints((prev) => [...prev, hint]);
    }
  }

  const latId = `${station.id}-lat`;
  const lngId = `${station.id}-lng`;

  return (
    <section className="rounded-lg border border-ink/15 bg-white/80 p-4">
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.clue}
      </p>
      <p className="mt-1 text-xs text-muted">Bản đồ sẽ có ở giai đoạn sau</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor={latId}
              className="block text-sm font-semibold text-ink"
            >
              Vĩ độ
            </label>
            <input
              id={latId}
              type="number"
              step="any"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              placeholder="Ví dụ: 16.06"
              className="mt-1 min-h-11 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
          </div>

          <div>
            <label
              htmlFor={lngId}
              className="block text-sm font-semibold text-ink"
            >
              Kinh độ
            </label>
            <input
              id={lngId}
              type="number"
              step="any"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              placeholder="Ví dụ: 108.22"
              className="mt-1 min-h-11 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
          </div>
        </div>

        {feedback && (
          <p role="status" className="text-sm font-medium text-terracotta">
            {feedback}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Ghim
          </button>

          <button
            type="button"
            onClick={handleDemoPin}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Ghim đúng vị trí (chế độ demo)
          </button>
        </div>
      </form>

      <HintBox
        revealedHints={revealedHints}
        hintsUsed={hintsUsed}
        totalHints={station.hints.length}
        onRequestHint={handleHint}
      />
    </section>
  );
}
