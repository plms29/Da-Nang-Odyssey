"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/types";
import { LeafletMap, type MapLandmark } from "./LeafletMap";
import { loadMaps } from "./loadMaps";

export type { MapLandmark };

export interface MapViewProps {
  center: LatLng;
  zoom?: number;
  pin: LatLng | null;
  onPick(p: LatLng): void;
  label?: string;
  apiKey?: string;
  onError?: () => void;
  landmarks?: MapLandmark[];
  onCenterChange?: (center: LatLng) => void;
}

export function MapView({
  center,
  zoom = 13,
  pin,
  onPick,
  label = "Bản đồ Đà Nẵng, chạm để đặt ghim",
  apiKey,
  onError,
  landmarks,
  onCenterChange,
}: MapViewProps) {
  const resolvedKey = (
    apiKey ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    ""
  ).trim();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapsApiRef = useRef<typeof google.maps | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const landmarkMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const initialCenterRef = useRef<LatLng>(center);
  const initialZoomRef = useRef<number>(zoom);
  const onPickRef = useRef(onPick);
  const onCenterChangeRef = useRef(onCenterChange);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    resolvedKey ? "loading" : "error",
  );

  useEffect(() => {
    onPickRef.current = onPick;
    onCenterChangeRef.current = onCenterChange;
  }, [onPick, onCenterChange]);

  useEffect(() => {
    if (!resolvedKey) {
      return;
    }

    let cancelled = false;
    let clickListener: google.maps.MapsEventListener | null = null;
    let centerListener: google.maps.MapsEventListener | null = null;

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

        const notifyCenter = () => {
          const current = map.getCenter();
          if (!current) return;
          onCenterChangeRef.current?.({
            lat: current.lat(),
            lng: current.lng(),
          });
        };
        centerListener = map.addListener("center_changed", notifyCenter);
        notifyCenter();

        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
      if (clickListener) {
        clickListener.remove();
        clickListener = null;
      }
      if (centerListener) {
        centerListener.remove();
        centerListener = null;
      }
      for (const lmMarker of landmarkMarkersRef.current) {
        lmMarker.setMap(null);
      }
      landmarkMarkersRef.current = [];
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      if (mapRef.current && mapsApiRef.current?.event?.clearInstanceListeners) {
        mapsApiRef.current.event.clearInstanceListeners(mapRef.current);
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
    };
  }, [resolvedKey]);

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
        clickable: false,
      });
    } else {
      markerRef.current.setPosition(pin);
    }
  }, [pin, status]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !mapsApiRef.current) return;
    const maps = mapsApiRef.current;
    const map = mapRef.current;

    for (const lmMarker of landmarkMarkersRef.current) {
      lmMarker.setMap(null);
    }
    landmarkMarkersRef.current = [];

    if (!landmarks || landmarks.length === 0) return;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new maps.InfoWindow();
    }
    const infoWindow = infoWindowRef.current;

    landmarkMarkersRef.current = landmarks.map((lm) => {
      const marker = new maps.Marker({
        position: { lat: lm.lat, lng: lm.lng },
        map,
        title: lm.name,
        label: {
          text: lm.name,
          color: "#1F1A17",
          fontSize: "11px",
          fontWeight: "600",
        },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#1F4E6B",
          fillOpacity: 1,
          strokeColor: "#F6EFE4",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        const popupEl = document.createElement("div");
        const titleEl = document.createElement("div");
        titleEl.textContent = lm.name;
        titleEl.style.fontWeight = "700";
        titleEl.style.fontSize = "12px";
        titleEl.style.marginBottom = "4px";
        const noteEl = document.createElement("div");
        noteEl.textContent = lm.note;
        noteEl.style.fontSize = "12px";
        popupEl.append(titleEl, noteEl);
        infoWindow.setContent(popupEl);
        infoWindow.open({ anchor: marker, map });
      });

      return marker;
    });

    return () => {
      for (const lmMarker of landmarkMarkersRef.current) {
        lmMarker.setMap(null);
      }
      landmarkMarkersRef.current = [];
    };
  }, [landmarks, status]);

  // Fall back to Leaflet + OpenStreetMap whenever there is no API key or Google Maps fails.
  if (!resolvedKey || status === "error") {
    return (
      <LeafletMap
        center={center}
        zoom={zoom}
        pin={pin}
        onPick={onPick}
        label={label}
        landmarks={landmarks}
        onError={onError}
        onCenterChange={onCenterChange}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        role="application"
        aria-label={label}
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
