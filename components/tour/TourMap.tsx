"use client";

import { useEffect, useRef, useState } from "react";
import { loadMaps } from "@/components/map/loadMaps";
import type { Spot } from "@/lib/types";

export interface TourMapProps {
  stops: Spot[];
  activeSpotId: string;
}

const DEFAULT_CENTER = { lat: 16.061, lng: 108.224 };

export function TourMap({ stops, activeSpotId }: TourMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapsApiRef = useRef<typeof google.maps | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const activeIndex = stops.findIndex((stop) => stop.id === activeSpotId);
  const initialStop =
    stops.find((stop) => stop.id === activeSpotId) ?? stops[0];
  const initialCenterRef = useRef(initialStop?.checkin ?? DEFAULT_CENTER);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    apiKey ? "loading" : "error",
  );

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    let cancelled = false;
    setStatus("loading");

    loadMaps(apiKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsApiRef.current = maps;

        const center = initialCenterRef.current;
        const map = new maps.Map(containerRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: 15,
          gestureHandling: "greedy",
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        mapRef.current = map;
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
      for (const marker of markersRef.current) {
        marker.setMap(null);
      }
      markersRef.current = [];
      if (mapRef.current && mapsApiRef.current?.event?.clearInstanceListeners) {
        mapsApiRef.current.event.clearInstanceListeners(mapRef.current);
      }
      mapRef.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !mapsApiRef.current) return;

    for (const marker of markersRef.current) {
      marker.setMap(null);
    }
    markersRef.current = stops.map(
      (stop, index) =>
        new mapsApiRef.current!.Marker({
          position: { lat: stop.checkin.lat, lng: stop.checkin.lng },
          map: mapRef.current!,
          title: stop.name,
          label: String(index + 1),
        }),
    );

    return () => {
      for (const marker of markersRef.current) {
        marker.setMap(null);
      }
      markersRef.current = [];
    };
  }, [stops, status]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    const activeStop = stops.find((stop) => stop.id === activeSpotId);
    if (!activeStop) return;

    const map = mapRef.current;
    const center = {
      lat: activeStop.checkin.lat,
      lng: activeStop.checkin.lng,
    };

    const reducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      map.setCenter(center);
      return;
    }

    if (typeof map.moveCamera === "function") {
      map.moveCamera({ center, zoom: 15 });
    } else {
      map.panTo(center);
      map.setZoom(15);
    }
  }, [stops, activeSpotId, status]);

  if (status === "error" || !apiKey) {
    return (
      <section
        aria-label="Bản đồ lộ trình tour"
        className="rounded-lg border border-ink/15 bg-white/80 p-3"
      >
        <ol className="flex items-center gap-2 overflow-x-auto pb-1">
          {stops.map((stop, index) => {
            const isCurrent = stop.id === activeSpotId;
            const isDone = activeIndex !== -1 && index < activeIndex;
            return (
              <li
                key={stop.id}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  isCurrent
                    ? "border-terracotta bg-terracotta text-sand"
                    : isDone
                      ? "border-river/40 bg-river/10 text-river"
                      : "border-ink/15 bg-sand/60 text-muted"
                }`}
              >
                <span>{index + 1}.</span>
                <span>{stop.name}</span>
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  return (
    <section
      aria-label="Bản đồ lộ trình tour"
      className="space-y-1.5 rounded-lg border border-ink/15 bg-white/80 p-2"
    >
      <div
        ref={containerRef}
        className="h-48 w-full rounded-md bg-sand/40"
      />
      {status === "loading" && (
        <p role="status" className="px-1 text-xs text-muted">
          Đang tải bản đồ…
        </p>
      )}
    </section>
  );
}
