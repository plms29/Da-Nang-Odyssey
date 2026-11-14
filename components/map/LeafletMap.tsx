"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as L from "leaflet";
import type { LatLng } from "@/lib/types";

export interface MapLandmark {
  name: string;
  lat: number;
  lng: number;
  note: string;
}

export interface LeafletMapProps {
  center: LatLng;
  zoom?: number;
  pin: LatLng | null;
  onPick(p: LatLng): void;
  label?: string;
  landmarks?: MapLandmark[];
  onError?: () => void;
  onCenterChange?: (center: LatLng) => void;
}

const PIN_ICON_HTML =
  '<svg width="28" height="34" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
  '<path d="M14 1C6.82 1 1 6.82 1 14c0 9.1 13 19 13 19s13-9.9 13-19C27 6.82 21.18 1 14 1Z" fill="#A84825" stroke="#F6EFE4" stroke-width="2"/>' +
  '<circle cx="14" cy="14" r="4.5" fill="#C99A2E" stroke="#F6EFE4" stroke-width="1.5"/>' +
  "</svg>";

const LANDMARK_DOT_HTML =
  '<span style="display:flex;width:44px;height:44px;align-items:center;justify-content:center;">' +
  '<span style="width:12px;height:12px;border-radius:9999px;background:#1F4E6B;border:2px solid #F6EFE4;box-shadow:0 1px 3px rgba(31,26,23,0.4);"></span>' +
  "</span>";

export function LeafletMap({
  center,
  zoom = 13,
  pin,
  onPick,
  label = "Bản đồ Đà Nẵng, chạm để đặt ghim",
  landmarks,
  onError,
  onCenterChange,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const landmarkLayerRef = useRef<L.LayerGroup | null>(null);
  const initialCenterRef = useRef<LatLng>(center);
  const initialZoomRef = useRef<number>(zoom);
  const onPickRef = useRef(onPick);
  const onErrorRef = useRef(onError);
  const onCenterChangeRef = useRef(onCenterChange);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    onPickRef.current = onPick;
    onErrorRef.current = onError;
    onCenterChangeRef.current = onCenterChange;
  }, [onPick, onError, onCenterChange]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        // Dynamic import prevents Leaflet from accessing `window` during Next.js SSR.
        const mod = await import("leaflet");
        const leaflet =
          (mod as { default?: typeof L }).default ?? (mod as typeof L);
        if (cancelled || !containerRef.current) return;

        leafletRef.current = leaflet;
        const map = leaflet.map(containerRef.current, {
          center: [initialCenterRef.current.lat, initialCenterRef.current.lng],
          zoom: initialZoomRef.current,
          zoomControl: true,
        });
        mapRef.current = map;

        leaflet
          // tile.openstreetmap.org is unreachable on the demo machine and CARTO now needs a key; OSM France is keyless.
          .tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap France",
            maxZoom: 19,
          })
          .addTo(map);

        landmarkLayerRef.current = leaflet.layerGroup().addTo(map);

        map.on("click", (event: L.LeafletMouseEvent) => {
          onPickRef.current({
            lat: event.latlng.lat,
            lng: event.latlng.lng,
          });
        });

        const notifyCenter = () => {
          const current = map.getCenter();
          onCenterChangeRef.current?.({ lat: current.lat, lng: current.lng });
        };
        map.on("moveend", notifyCenter);
        notifyCenter();

        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
        onErrorRef.current?.();
      }
    }

    initMap();

    return () => {
      cancelled = true;
      pinMarkerRef.current?.remove();
      pinMarkerRef.current = null;
      landmarkLayerRef.current?.clearLayers();
      landmarkLayerRef.current?.remove();
      landmarkLayerRef.current = null;
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !leafletRef.current) return;
    const leaflet = leafletRef.current;
    const map = mapRef.current;

    if (!pin) {
      if (pinMarkerRef.current) {
        pinMarkerRef.current.remove();
        pinMarkerRef.current = null;
      }
      return;
    }

    if (!pinMarkerRef.current) {
      const pinIcon = leaflet.divIcon({
        className: "",
        iconSize: [28, 34],
        iconAnchor: [14, 34],
        html: PIN_ICON_HTML,
      });
      pinMarkerRef.current = leaflet
        .marker([pin.lat, pin.lng], {
          icon: pinIcon,
          interactive: false,
        })
        .addTo(map);
    } else {
      pinMarkerRef.current.setLatLng([pin.lat, pin.lng]);
    }
  }, [pin, status]);

  useEffect(() => {
    if (
      status !== "ready" ||
      !leafletRef.current ||
      !landmarkLayerRef.current
    ) {
      return;
    }
    const leaflet = leafletRef.current;
    const layerGroup = landmarkLayerRef.current;
    layerGroup.clearLayers();

    if (!landmarks || landmarks.length === 0) return;

    landmarks.forEach((lm, index) => {
      const dotIcon = leaflet.divIcon({
        className: "",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        html: LANDMARK_DOT_HTML,
      });

      const marker = leaflet.marker([lm.lat, lm.lng], {
        icon: dotIcon,
        bubblingMouseEvents: false,
        title: lm.name,
        alt: lm.name,
      });

      const popupEl = document.createElement("div");
      const titleEl = document.createElement("div");
      titleEl.textContent = lm.name;
      titleEl.style.fontWeight = "700";
      titleEl.style.fontSize = "12px";
      titleEl.style.lineHeight = "1.35";
      titleEl.style.color = "#1F1A17";
      titleEl.style.marginBottom = "4px";

      const noteEl = document.createElement("div");
      noteEl.textContent = lm.note;
      noteEl.style.fontSize = "12px";
      noteEl.style.lineHeight = "1.45";
      noteEl.style.color = "#5E5148";

      popupEl.append(titleEl, noteEl);
      marker.bindPopup(popupEl, { maxWidth: 220, closeButton: true });

      const labelEl = document.createElement("span");
      labelEl.textContent = lm.name;
      labelEl.style.fontSize = "11px";
      labelEl.style.fontWeight = "600";
      labelEl.style.color = "#1F1A17";

      const direction = index % 2 === 0 ? "right" : "left";
      const offset: [number, number] = index % 2 === 0 ? [10, 0] : [-10, 0];

      marker.bindTooltip(labelEl, {
        permanent: true,
        direction,
        offset,
        interactive: true,
      });

      marker.on("click", (event: L.LeafletMouseEvent) => {
        leaflet.DomEvent.stopPropagation(event);
        marker.openPopup();
      });

      const tooltip = marker.getTooltip();
      if (tooltip) {
        tooltip.on("click", (event: L.LeafletMouseEvent) => {
          leaflet.DomEvent.stopPropagation(event);
          marker.openPopup();
        });
      }

      marker.addTo(layerGroup);
    });
  }, [landmarks, status]);

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
        aria-label={label}
        className="relative z-0 h-72 w-full rounded-lg border border-ink/15 bg-sand/40"
      />
      {status === "loading" && (
        <p role="status" className="text-xs text-muted">
          Đang tải bản đồ…
        </p>
      )}
    </div>
  );
}
