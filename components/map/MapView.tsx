"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/types";
import { loadMaps } from "./loadMaps";

export interface MapViewProps {
  center: LatLng;
  zoom?: number;
  pin: LatLng | null;
  onPick(p: LatLng): void;
  label?: string;
  apiKey?: string;
  onError?: () => void;
}

export function MapView({
  center,
  zoom = 13,
  pin,
  onPick,
  apiKey,
  onError,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapsApiRef = useRef<typeof google.maps | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const initialCenterRef = useRef<LatLng>(center);
  const initialZoomRef = useRef<number>(zoom);
  const onPickRef = useRef(onPick);
  const onErrorRef = useRef(onError);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    onPickRef.current = onPick;
    onErrorRef.current = onError;
  }, [onPick, onError]);

  useEffect(() => {
    let cancelled = false;
    let clickListener: google.maps.MapsEventListener | null = null;
    const resolvedKey =
      apiKey ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

    setStatus("loading");

    loadMaps(resolvedKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsApiRef.current = maps;

        const map = new maps.Map(containerRef.current, {
          center: initialCenterRef.current,
          zoom: initialZoomRef.current,
          gestureHandling: "greedy",
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        mapRef.current = map;

        clickListener = map.addListener(
          "click",
          (event: google.maps.MapMouseEvent) => {
            const rawLatLng = event?.latLng;
            if (!rawLatLng) return;
            const lat =
              typeof rawLatLng.lat === "function"
                ? rawLatLng.lat()
                : (rawLatLng.lat as unknown as number);
            const lng =
              typeof rawLatLng.lng === "function"
                ? rawLatLng.lng()
                : (rawLatLng.lng as unknown as number);
            if (typeof lat === "number" && typeof lng === "number") {
              onPickRef.current({ lat, lng });
            }
          },
        );

        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        onErrorRef.current?.();
      });

    return () => {
      cancelled = true;
      if (clickListener) {
        clickListener.remove();
        clickListener = null;
      }
      if (mapRef.current && mapsApiRef.current?.event?.clearInstanceListeners) {
        mapsApiRef.current.event.clearInstanceListeners(mapRef.current);
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !mapsApiRef.current) return;

    if (!pin) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new mapsApiRef.current.Marker({
        position: pin,
        map: mapRef.current,
      });
    } else {
      markerRef.current.setPosition(pin);
    }
  }, [pin, status]);

  if (status === "error") {
    return (
      <p role="alert" className="text-sm font-medium text-terracotta">
        Không tải được bản đồ
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        role="application"
        aria-label="Bản đồ Đà Nẵng, chạm để đặt ghim"
        className="h-72 w-full rounded-lg border border-ink/15 bg-sand/40"
      />
      {status === "loading" && (
        <p role="status" className="text-xs text-muted">
          Đang tải bản đồ…
        </p>
      )}
    </div>
  );
}
