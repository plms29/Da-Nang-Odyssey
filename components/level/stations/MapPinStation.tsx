"use client";

import { useRef, useState, type FormEvent } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { GlowButton } from "@/components/fx/GlowButton";
import { checkMapPin } from "@/lib/activities/scoring";
import { bearingDeg, directionHint } from "@/lib/geo/direction";
import { haptic } from "@/lib/haptics";
import type {
  LatLng,
  MapPinStation as MapPinStationType,
  StationResult,
} from "@/lib/types";
import { MapView } from "@/components/map/MapView";
import { useAttempt } from "../useAttempt";
import { HintBox } from "../HintBox";

export interface MapPinStationProps {
  station: MapPinStationType;
  onDone: (result: StationResult) => void;
}

const DA_NANG_CENTER: LatLng = { lat: 16.0665, lng: 108.2235 };
const DA_NANG_ZOOM = 14;

interface CoordFormProps {
  latId: string;
  lngId: string;
  latInput: string;
  lngInput: string;
  onLatChange: (value: string) => void;
  onLngChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

function CoordForm({
  latId,
  lngId,
  latInput,
  lngInput,
  onLatChange,
  onLngChange,
  onSubmit,
}: CoordFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
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
            onChange={(e) => onLatChange(e.target.value)}
            placeholder="Ví dụ: 16.06"
            className="mt-1 min-h-11 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink transition-shadow focus:border-terracotta focus:ring-2 focus:ring-gold focus:shadow-[0_0_16px_rgba(201,154,46,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
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
            onChange={(e) => onLngChange(e.target.value)}
            placeholder="Ví dụ: 108.22"
            className="mt-1 min-h-11 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink transition-shadow focus:border-terracotta focus:ring-2 focus:ring-gold focus:shadow-[0_0_16px_rgba(201,154,46,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          />
        </div>
      </div>

      <div>
        <GlowButton
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Ghim
        </GlowButton>
      </div>
    </form>
  );
}

export function MapPinStation({ station, onDone }: MapPinStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const [scope, animate] = useAnimate();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const [pin, setPin] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(DA_NANG_CENTER);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solvedGlow, setSolvedGlow] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const prevWrongDistanceRef = useRef<number | null>(null);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

  const showMap = !mapFailed;
  const compassOrigin = pin ?? mapCenter;
  const compassBearing = bearingDeg(compassOrigin, station.target);
  const compassLabel = directionHint(compassOrigin, station.target);

  function triggerShake() {
    haptic("error");
    if (!reduced && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.3 });
    }
  }

  function submitPin(candidate: LatLng) {
    const check = checkMapPin(station, candidate);
    if (check.correct) {
      prevWrongDistanceRef.current = null;
      setFeedback(null);
      setSolvedGlow(true);
      haptic("success");
      if (!reduced && scope.current) {
        animate(
          scope.current,
          { scale: [1, 1.03, 1] },
          { duration: 0.35, ease: "easeOut" },
        );
      }
      onDone(result(true));
      return;
    }
    addWrong();
    triggerShake();
    const roundedDistance = Math.round(check.distance_m / 10) * 10;
    const prevDistance = prevWrongDistanceRef.current;
    let deltaNote = "";
    if (prevDistance !== null) {
      if (check.distance_m < prevDistance - 1) {
        deltaNote = " — Gần hơn lần trước.";
      } else if (check.distance_m > prevDistance + 1) {
        deltaNote = " — Xa hơn lần trước.";
      }
    }
    prevWrongDistanceRef.current = check.distance_m;
    setFeedback(`Chưa đúng, còn cách khoảng ${roundedDistance} m${deltaNote}`);
  }

  function handleConfirmPin() {
    if (!pin) return;
    submitPin(pin);
  }

  function handleMapPick(picked: LatLng) {
    haptic("tap");
    setPin(picked);
    setFeedback(null);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const lat = Number.parseFloat(latInput);
    const lng = Number.parseFloat(lngInput);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      triggerShake();
      setFeedback("Vui lòng nhập vĩ độ và kinh độ hợp lệ.");
      return;
    }
    const nextPin: LatLng = { lat, lng };
    setPin(nextPin);
    submitPin(nextPin);
  }

  function handleDemoPin() {
    const demoPin: LatLng = {
      lat: station.target.lat,
      lng: station.target.lng,
    };
    setPin(demoPin);
    submitPin(demoPin);
  }

  function handleHint() {
    const hint = nextHint();
    if (hint !== null) {
      setRevealedHints((prev) => [...prev, hint]);
    }
  }

  const latId = `${station.id}-lat`;
  const lngId = `${station.id}-lng`;

  const coordForm = (
    <CoordForm
      latId={latId}
      lngId={lngId}
      latInput={latInput}
      lngInput={lngInput}
      onLatChange={setLatInput}
      onLngChange={setLngInput}
      onSubmit={handleSubmit}
    />
  );

  const demoButton = (
    <button
      type="button"
      onClick={handleDemoPin}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
    >
      Ghim đúng vị trí (chế độ demo)
    </button>
  );

  return (
    <section
      ref={scope}
      className={`rounded-lg border border-ink/15 bg-white/80 p-4 transition-shadow hover:shadow-sm ${
        solvedGlow
          ? "ring-2 ring-gold ring-offset-2 shadow-[0_0_16px_rgba(201,154,46,0.35)]"
          : ""
      }`}
    >
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.clue}
      </p>

      {showMap ? (
        <p className="mt-1 text-xs text-muted">
          {station.landmarks && station.landmarks.length > 0
            ? "Chạm vào bản đồ để đặt ghim · Chạm chấm xanh để xem gợi ý địa danh"
            : "Chạm vào bản đồ để đặt ghim"}
        </p>
      ) : (
        <p role="alert" className="mt-1 text-xs font-medium text-terracotta">
          Không tải được bản đồ, hãy nhập tọa độ bên dưới.
        </p>
      )}

      {showMap && (
        <>
          <motion.div
            animate={reduced ? undefined : { y: pin ? -2 : 0 }}
            transition={
              reduced
                ? { duration: 0.15 }
                : { type: "spring", stiffness: 380, damping: 30 }
            }
            className={`relative mt-3 rounded-lg transition-shadow ${
              pin
                ? "ring-2 ring-gold shadow-[0_0_16px_rgba(201,154,46,0.35)]"
                : ""
            }`}
          >
            <MapView
              center={DA_NANG_CENTER}
              zoom={DA_NANG_ZOOM}
              pin={pin}
              onPick={handleMapPick}
              apiKey={apiKey}
              landmarks={station.landmarks}
              onCenterChange={setMapCenter}
              onError={() => setMapFailed(true)}
            />

            <div className="pointer-events-none absolute top-2 right-2 z-20">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 bg-sand/95 shadow-md">
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 text-[8px] font-bold leading-none text-muted"
                >
                  B
                </span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  style={{ transform: `rotate(${compassBearing}deg)` }}
                  className={
                    reduced ? "" : "transition-transform duration-150 ease-out"
                  }
                >
                  <path
                    d="M12 3L16 14L12 11.5L8 14L12 3Z"
                    fill="#A84825"
                    stroke="#1F1A17"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 21L15 14L12 11.5L9 14L12 21Z"
                    fill="#C99A2E"
                    fillOpacity="0.45"
                    stroke="#1F1A17"
                    strokeWidth="0.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <p
            role="status"
            className="mt-2 flex w-full items-center gap-2 rounded-md bg-sand/60 px-3 py-2 text-sm text-ink"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{ transform: `rotate(${compassBearing}deg)` }}
              className={`shrink-0 ${
                reduced ? "" : "transition-transform duration-150 ease-out"
              }`}
            >
              <path
                d="M12 3L16 14L12 11.5L8 14L12 3Z"
                fill="#A84825"
                stroke="#1F1A17"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              <path
                d="M12 21L15 14L12 11.5L9 14L12 21Z"
                fill="#C99A2E"
                fillOpacity="0.45"
                stroke="#1F1A17"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
            </svg>
            <span>{compassLabel}</span>
          </p>
        </>
      )}

      {feedback && (
        <p role="status" className="mt-3 text-sm font-medium text-terracotta">
          {feedback}
        </p>
      )}

      {showMap ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <GlowButton
              type="button"
              onClick={handleConfirmPin}
              disabled={!pin}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50"
            >
              Xác nhận ghim
            </GlowButton>
            {demoButton}
          </div>

          <details className="mt-4 rounded-md border border-ink/15 bg-sand/40 p-3">
            <summary className="flex min-h-11 cursor-pointer items-center rounded-sm px-2 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta">
              Nhập tọa độ thủ công
            </summary>
            <div className="mt-3">{coordForm}</div>
          </details>
        </>
      ) : (
        <div className="mt-4 space-y-3">
          {coordForm}
          {demoButton}
        </div>
      )}

      <HintBox
        revealedHints={revealedHints}
        hintsUsed={hintsUsed}
        totalHints={station.hints.length}
        onRequestHint={handleHint}
      />
    </section>
  );
}
