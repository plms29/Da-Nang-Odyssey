"use client";

import { useState, type FormEvent } from "react";
import { checkMapPin } from "@/lib/activities/scoring";
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

const DA_NANG_CENTER: LatLng = { lat: 16.0544, lng: 108.2022 };
const DA_NANG_ZOOM = 13;

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
            onChange={(e) => onLngChange(e.target.value)}
            placeholder="Ví dụ: 108.22"
            className="mt-1 min-h-11 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Ghim
        </button>
      </div>
    </form>
  );
}

export function MapPinStation({ station, onDone }: MapPinStationProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const [pin, setPin] = useState<LatLng | null>(null);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

  const showMap = apiKey.length > 0 && !mapFailed;

  function submitPin(candidate: LatLng) {
    const check = checkMapPin(station, candidate);
    if (check.correct) {
      setFeedback(null);
      onDone(result(true));
      return;
    }
    addWrong();
    const roundedDistance = Math.round(check.distance_m / 10) * 10;
    setFeedback(`Chưa đúng, còn cách khoảng ${roundedDistance} m`);
  }

  function handleConfirmPin() {
    if (!pin) return;
    submitPin(pin);
  }

  function handleMapPick(picked: LatLng) {
    setPin(picked);
    setFeedback(null);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const lat = Number.parseFloat(latInput);
    const lng = Number.parseFloat(lngInput);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
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
    <section className="rounded-lg border border-ink/15 bg-white/80 p-4">
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.clue}
      </p>

      {showMap ? (
        <p className="mt-1 text-xs text-muted">Chạm vào bản đồ để đặt ghim</p>
      ) : mapFailed ? (
        <p role="alert" className="mt-1 text-xs font-medium text-terracotta">
          Không tải được bản đồ, hãy nhập tọa độ bên dưới.
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted">Bản đồ sẽ có ở giai đoạn sau</p>
      )}

      {showMap && (
        <div className="mt-3">
          <MapView
            center={DA_NANG_CENTER}
            zoom={DA_NANG_ZOOM}
            pin={pin}
            onPick={handleMapPick}
            apiKey={apiKey}
            onError={() => setMapFailed(true)}
          />
        </div>
      )}

      {feedback && (
        <p role="status" className="mt-3 text-sm font-medium text-terracotta">
          {feedback}
        </p>
      )}

      {showMap ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmPin}
              disabled={!pin}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50"
            >
              Xác nhận ghim
            </button>
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
