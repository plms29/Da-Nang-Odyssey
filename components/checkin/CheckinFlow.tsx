"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GlassPanel } from "@/components/fx/Glass";
import {
  demoPosition,
  getCurrentPosition,
  getDemoSpotId,
  locateSpot,
} from "@/lib/geo/locate";
import type { Spot } from "@/lib/types";
import { CheckinFeedback } from "./CheckinFeedback";
import { CheckinIntro } from "./CheckinIntro";
import { OnsiteBooth } from "./OnsiteBooth";
import { RemoteModeView } from "./RemoteModeView";

export interface CheckinFlowProps {
  spots: Spot[];
}

type CheckinStep =
  | { kind: "intro" }
  | { kind: "locating" }
  | { kind: "inside"; spot: Spot }
  | { kind: "outside"; spot: Spot; distance_m: number }
  | { kind: "inaccurate"; accuracy_m: number }
  | { kind: "error"; message: string }
  | { kind: "remote" };

function describeGeoError(err: unknown): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "number"
  ) {
    const code = (err as { code: number }).code;
    if (code === 1) {
      return "Bạn chưa cấp quyền vị trí nên chưa thể check-in tại chỗ. Hãy bật quyền vị trí trong trình duyệt để thử lại, hoặc chọn ghé thăm từ xa.";
    }
    if (code === 2) {
      return "Không thể lấy tín hiệu vị trí lúc này. Hãy kiểm tra GPS rồi thử lại, hoặc chọn ghé thăm từ xa.";
    }
    if (code === 3) {
      return "Hết thời gian chờ xác định vị trí. Hãy ra chỗ thoáng hơn rồi thử lại, hoặc chọn ghé thăm từ xa.";
    }
  }
  return "Thiết bị hoặc trình duyệt chưa hỗ trợ định vị. Bạn vẫn có thể ghé thăm từ xa.";
}

export function CheckinFlow({ spots }: CheckinFlowProps) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<CheckinStep>({ kind: "intro" });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prevStepKindRef = useRef<CheckinStep["kind"]>(step.kind);
  const requestIdRef = useRef(0);

  const demoSpotId = getDemoSpotId(searchParams.toString());
  const demoSpot = demoSpotId
    ? spots.find((spot) => spot.id === demoSpotId) ?? null
    : null;

  const requestedSpotId = searchParams.get("spot")?.trim() || null;
  const requestedSpot = requestedSpotId
    ? spots.find((spot) => spot.id === requestedSpotId) ?? null
    : null;

  useEffect(() => {
    if (prevStepKindRef.current === step.kind) {
      return;
    }
    prevStepKindRef.current = step.kind;
    headingRef.current?.focus();
  }, [step.kind]);

  async function handleLocate() {
    const requestId = ++requestIdRef.current;
    setStep({ kind: "locating" });

    try {
      // CK-06: keep transient coordinates strictly local and pass only to locateSpot.
      const pos = demoSpot
        ? demoPosition(demoSpot)
        : await getCurrentPosition();

      if (requestId !== requestIdRef.current) return;

      const candidates = demoSpot
        ? [demoSpot, ...spots.filter((spot) => spot.id !== demoSpot.id)]
        : spots;

      const result = locateSpot(candidates, pos);
      if (!result) {
        setStep({
          kind: "error",
          message:
            "Hiện chưa có điểm tham quan nào để kiểm tra vị trí. Bạn có thể ghé thăm từ xa.",
        });
        return;
      }

      if (result.status === "inside") {
        setStep({ kind: "inside", spot: result.spot });
      } else if (result.status === "outside") {
        setStep({
          kind: "outside",
          spot: result.spot,
          distance_m: result.distance_m,
        });
      } else {
        setStep({ kind: "inaccurate", accuracy_m: result.accuracy_m });
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setStep({ kind: "error", message: describeGeoError(err) });
    }
  }

  function handleOpenRemote() {
    requestIdRef.current += 1;
    setStep({ kind: "remote" });
  }

  function handleResetToIntro() {
    requestIdRef.current += 1;
    setStep({ kind: "intro" });
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {demoSpot && (
        <GlassPanel
          tone="light"
          role="status"
          className="inline-flex items-center gap-2 rounded-full! border border-gold/70 bg-gold/25! px-4 py-2 text-sm font-semibold text-ink shadow-[0_0_16px_rgba(201,154,46,0.25)]!"
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full bg-gold"
          />
          <span>Chế độ demo: giả lập đang đứng tại {demoSpot.name}</span>
        </GlassPanel>
      )}

      {step.kind === "intro" && (
        <CheckinIntro
          requestedSpot={requestedSpot}
          headingRef={headingRef}
          onLocate={handleLocate}
          onRemote={handleOpenRemote}
        />
      )}

      {(step.kind === "locating" ||
        step.kind === "outside" ||
        step.kind === "inaccurate" ||
        step.kind === "error") && (
        <CheckinFeedback
          state={step}
          headingRef={headingRef}
          onRetry={handleLocate}
          onRemote={handleOpenRemote}
        />
      )}

      {step.kind === "inside" && (
        <OnsiteBooth
          key={step.spot.id}
          spot={step.spot}
          headingRef={headingRef}
          onReset={handleResetToIntro}
        />
      )}

      {step.kind === "remote" && (
        <RemoteModeView
          spots={spots}
          headingRef={headingRef}
          onBack={handleResetToIntro}
        />
      )}
    </div>
  );
}
