"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FacingMode = "user" | "environment";

export interface UseCameraResult {
  stream: MediaStream | null;
  facingMode: FacingMode;
  error: string | null;
  isStarting: boolean;
  startCamera: (targetFacing?: FacingMode) => Promise<boolean>;
  switchCamera: () => Promise<boolean>;
  stopCamera: () => void;
}

function getErrorName(err: unknown): string {
  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name?: unknown }).name;
    if (typeof name === "string") {
      return name;
    }
  }
  return "";
}

function toVietnameseCameraError(err: unknown): string {
  const name = getErrorName(err);
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Bạn đã từ chối quyền camera. Hãy bật lại trong cài đặt trình duyệt.";
  }
  return "Không thể truy cập camera trên thiết bị này. Vui lòng kiểm tra lại thiết bị và thử lại.";
}

export function useCamera(initialFacing: FacingMode = "user"): UseCameraResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>(initialFacing);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const facingModeRef = useRef<FacingMode>(initialFacing);
  const requestIdRef = useRef(0);
  const unmountedRef = useRef(false);

  const stopCamera = useCallback(() => {
    requestIdRef.current += 1;
    const active = streamRef.current;
    if (active) {
      for (const track of active.getTracks()) {
        track.onended = null;
        track.stop();
      }
      streamRef.current = null;
    }
    if (!unmountedRef.current) {
      setStream(null);
      setIsStarting(false);
    }
  }, []);

  const startCamera = useCallback(
    async (targetFacing?: FacingMode): Promise<boolean> => {
      const requestedFacing = targetFacing ?? facingModeRef.current;

      // Always stop old tracks first before requesting a new stream
      stopCamera();

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        setError("Camera cần HTTPS");
        return false;
      }

      const currentRequestId = ++requestIdRef.current;
      setIsStarting(true);
      setError(null);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: requestedFacing,
            width: { ideal: 1080 },
            height: { ideal: 1920 },
          },
          audio: false,
        });

        if (
          unmountedRef.current ||
          currentRequestId !== requestIdRef.current
        ) {
          for (const track of mediaStream.getTracks()) {
            track.onended = null;
            track.stop();
          }
          return false;
        }

        const tracks = mediaStream.getTracks();
        const videoTrack = mediaStream.getVideoTracks?.()[0] ?? tracks[0];
        const actualFacing =
          videoTrack?.getSettings?.()?.facingMode ?? requestedFacing;
        const resolvedFacing: FacingMode =
          actualFacing === "environment" ? "environment" : "user";

        for (const track of tracks) {
          track.onended = () => {
            if (
              unmountedRef.current ||
              streamRef.current !== mediaStream
            ) {
              return;
            }
            streamRef.current = null;
            setStream(null);
            setIsStarting(false);
            setError("Camera đã bị tắt. Hãy mở lại.");
          };
        }

        streamRef.current = mediaStream;
        facingModeRef.current = resolvedFacing;
        setFacingMode(resolvedFacing);
        setStream(mediaStream);
        setIsStarting(false);
        return true;
      } catch (err) {
        if (
          unmountedRef.current ||
          currentRequestId !== requestIdRef.current
        ) {
          return false;
        }
        setIsStarting(false);
        setError(toVietnameseCameraError(err));
        return false;
      }
    },
    [stopCamera],
  );

  const switchCamera = useCallback(async (): Promise<boolean> => {
    const nextFacing: FacingMode =
      facingModeRef.current === "user" ? "environment" : "user";
    return startCamera(nextFacing);
  }, [startCamera]);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      const active = streamRef.current;
      if (active) {
        for (const track of active.getTracks()) {
          track.onended = null;
          track.stop();
        }
        streamRef.current = null;
      }
    };
  }, []);

  return {
    stream,
    facingMode,
    error,
    isStarting,
    startCamera,
    switchCamera,
    stopCamera,
  };
}
