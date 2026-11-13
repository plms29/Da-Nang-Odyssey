"use client";

import { type JSX, useEffect, useState } from "react";
import {
  enableDeviceTilt,
  useNeedsMotionPermission,
} from "@/components/fx/useTilt";

export interface MotionPermissionButtonProps {
  className?: string;
}

interface DeviceOrientationEventWithPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

const TILT_GRANTED_KEY = "tilt-granted";

function getOrientationPermissionCtor(): DeviceOrientationEventWithPermission | null {
  if (typeof DeviceOrientationEvent === "undefined") return null;
  const ctor = DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;
  return typeof ctor.requestPermission === "function" ? ctor : null;
}

/**
 * iOS-only button that requests DeviceOrientation permission and enables device tilt when granted.
 */
export function MotionPermissionButton({
  className,
}: MotionPermissionButtonProps): JSX.Element | null {
  const needsPermission = useNeedsMotionPermission();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!getOrientationPermissionCtor()) return;

    let granted = false;
    try {
      granted = window.localStorage.getItem(TILT_GRANTED_KEY) === "1";
    } catch {
      granted = false;
    }

    if (!granted) {
      setHidden(false);
    }
  }, []);

  useEffect(() => {
    if (needsPermission && getOrientationPermissionCtor()) {
      setHidden(false);
    }
  }, [needsPermission]);

  if (hidden) return null;

  const handleClick = async (): Promise<void> => {
    const ctor = getOrientationPermissionCtor();
    if (!ctor || typeof ctor.requestPermission !== "function") {
      setHidden(true);
      return;
    }

    try {
      const res = await ctor.requestPermission();
      if (res === "granted") {
        try {
          window.localStorage.setItem(TILT_GRANTED_KEY, "1");
        } catch {
          // Ignore storage errors (e.g. private mode restrictions)
        }
        enableDeviceTilt();
      } else {
        setHidden(true);
      }
    } catch {
      setHidden(true);
    } finally {
      setHidden(true);
    }
  };

  const baseClasses =
    "inline-flex h-11 min-h-11 min-w-11 items-center gap-2 rounded-full bg-sand/80 px-4 text-sm font-medium text-ink shadow-sm backdrop-blur";
  const classes = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <button type="button" onClick={handleClick} className={classes}>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 shrink-0"
      >
        <rect
          x="7"
          y="4"
          width="10"
          height="16"
          rx="2"
          transform="rotate(-12 12 12)"
        />
        <path d="M4.5 9.5a8.5 8.5 0 0 0 0 5" />
        <path d="M19.5 9.5a8.5 8.5 0 0 1 0 5" />
      </svg>
      <span>Bật hiệu ứng nghiêng</span>
    </button>
  );
}
