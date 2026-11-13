"use client";

import { useCallback, useId, useState, type FormEvent } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { GlowButton } from "@/components/fx/GlowButton";
import { haptic } from "@/lib/haptics";
import type {
  ExpressStation as ExpressStationType,
  JudgeRequest,
  JudgeResult,
} from "@/lib/types";
import { VoiceRecorder } from "../VoiceRecorder";

export interface ExpressStationProps {
  station: ExpressStationType;
  levelId: string;
  onDone: (result: JudgeResult) => void;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Invalid FileReader result"));
        return;
      }
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read audio blob"));
    };
    reader.readAsDataURL(blob);
  });
}

export function ExpressStation({
  station,
  levelId,
  onDone,
}: ExpressStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const [scope, animate] = useAnimate();

  const maxSeconds =
    station.type === "open_text_or_voice" &&
    typeof station.max_seconds === "number" &&
    station.max_seconds > 0
      ? station.max_seconds
      : null;
  const supportsVoice = maxSeconds !== null;

  const [answerMode, setAnswerMode] = useState<"voice" | "text">("voice");
  const [recording, setRecording] = useState<{ blob: Blob; mime: string } | null>(
    null,
  );
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);

  const uniqueId = useId();
  const textareaId = `${station.id}-answer`;
  const modeGroupLabelId = `${station.id}-${uniqueId}-mode-label`;
  const modeRadioName = `${station.id}-${uniqueId}-answer-mode`;

  const isVoiceMode = supportsVoice && answerMode === "voice";
  const canSubmit = isVoiceMode
    ? recording !== null
    : text.trim().length > 0;

  const rubricDescById = new Map(
    station.rubric.map((criterion) => [criterion.id, criterion.desc]),
  );

  const handleRecorded = useCallback(
    (rec: { blob: Blob; mime: string } | null) => {
      setRecording(rec);
      if (rec !== null) {
        setError(null);
      }
    },
    [],
  );

  function triggerShake() {
    if (!reduced && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.3 });
    }
  }

  function handleModeChange(nextMode: "voice" | "text") {
    haptic("tap");
    setAnswerMode(nextMode);
    setError(null);
    if (nextMode === "text") {
      setRecording(null);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isVoiceMode && !recording) {
      return;
    }

    setLoading(true);
    setError(null);

    let payload: JudgeRequest;
    if (isVoiceMode && recording) {
      try {
        const dataBase64 = await blobToBase64(recording.blob);
        payload = {
          level_id: levelId,
          station_id: station.id,
          text: "",
          audio: {
            mime: recording.mime,
            data_base64: dataBase64,
          },
        };
      } catch {
        setError("Không đọc được đoạn ghi âm, thử lại nhé.");
        haptic("error");
        triggerShake();
        setLoading(false);
        return;
      }
    } else {
      payload = {
        level_id: levelId,
        station_id: station.id,
        text,
      };
    }

    try {
      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "Không chấm được bài, thử lại nhé.";
        setError(message);
        haptic("error");
        triggerShake();
        if (response.status === 422 && supportsVoice) {
          setAnswerMode("text");
          setRecording(null);
        }
        return;
      }

      if (!Array.isArray(data?.criteria)) {
        setError("Không chấm được bài, thử lại nhé.");
        haptic("error");
        triggerShake();
        return;
      }

      haptic("success");
      setJudgeResult(data as JudgeResult);
    } catch {
      setError("Lỗi kết nối mạng");
      haptic("error");
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={`rounded-lg border border-ink/15 bg-white/80 p-4 transition-shadow hover:shadow-sm ${
        judgeResult
          ? "ring-2 ring-gold ring-offset-2 shadow-[0_0_16px_rgba(201,154,46,0.35)]"
          : ""
      }`}
    >
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.prompt}
      </p>

      {station.sample && (
        <div className="mt-3 rounded-md border border-gold/50 bg-gold/15 p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-ink">
            Câu mẫu
          </p>
          <p className="mt-1 text-sm text-ink">{station.sample}</p>
        </div>
      )}

      {!judgeResult ? (
        <form ref={scope} onSubmit={handleSubmit} className="mt-4 space-y-3">
          {supportsVoice && (
            <div
              role="radiogroup"
              aria-labelledby={modeGroupLabelId}
              className="space-y-1.5"
            >
              <span
                id={modeGroupLabelId}
                className="block text-sm font-semibold text-ink"
              >
                Cách trả lời
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta ${
                    answerMode === "voice"
                      ? "border-terracotta bg-terracotta/10 text-terracotta ring-2 ring-gold shadow-[0_0_16px_rgba(201,154,46,0.35)]"
                      : "border-ink/20 bg-white text-ink hover:bg-sand/60"
                  } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="radio"
                    name={modeRadioName}
                    value="voice"
                    checked={answerMode === "voice"}
                    disabled={loading}
                    onChange={() => handleModeChange("voice")}
                    className="h-4 w-4 accent-terracotta"
                  />
                  <span>Nói</span>
                </label>
                <label
                  className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta ${
                    answerMode === "text"
                      ? "border-terracotta bg-terracotta/10 text-terracotta ring-2 ring-gold shadow-[0_0_16px_rgba(201,154,46,0.35)]"
                      : "border-ink/20 bg-white text-ink hover:bg-sand/60"
                  } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="radio"
                    name={modeRadioName}
                    value="text"
                    checked={answerMode === "text"}
                    disabled={loading}
                    onChange={() => handleModeChange("text")}
                    className="h-4 w-4 accent-terracotta"
                  />
                  <span>Gõ chữ</span>
                </label>
              </div>
            </div>
          )}

          {isVoiceMode && maxSeconds !== null ? (
            <div className="space-y-2">
              <p className="text-xs text-muted">
                Đoạn ghi âm chỉ được gửi đi để chấm và không lưu lại.
              </p>
              <VoiceRecorder
                maxSeconds={maxSeconds}
                disabled={loading}
                onRecorded={handleRecorded}
              />
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={textareaId}
                    className="block text-sm font-semibold text-ink"
                  >
                    Bài làm của bạn
                  </label>
                  <span className="text-xs text-muted">
                    {text.length}/{station.max_chars}
                  </span>
                </div>
                <textarea
                  id={textareaId}
                  rows={4}
                  maxLength={station.max_chars}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={loading}
                  placeholder="Nhập phần thể hiện của bạn tại đây..."
                  className="mt-1 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:opacity-60"
                />
              </div>

              <p className="text-xs text-muted">
                Bài làm chỉ được gửi đi để chấm và không lưu lại.
              </p>
            </>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-terracotta">
              {error}
            </p>
          )}

          <GlowButton
            type="submit"
            disabled={loading || !canSubmit}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Đang chấm…" : "Nộp bài"}
          </GlowButton>

          <p aria-live="polite" className="sr-only">
            {loading ? "Đang chấm…" : ""}
          </p>
        </form>
      ) : (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          transition={
            reduced
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 380, damping: 24 }
          }
          className="mt-4 space-y-4"
        >
          {judgeResult.transcript && judgeResult.transcript.trim().length > 0 && (
            <p className="rounded-md border border-ink/15 bg-sand/60 p-3 text-sm text-ink">
              <span className="font-semibold text-ink">Bản chép lời: </span>
              {judgeResult.transcript}
            </p>
          )}

          <ul className="space-y-2">
            {judgeResult.criteria.map((criterion) => (
              <li
                key={criterion.id}
                className="rounded-md border border-ink/15 bg-sand/60 p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">
                    {rubricDescById.get(criterion.id) ?? criterion.id}
                  </span>
                  <span className="shrink-0 font-bold text-river">
                    {criterion.score}/3
                  </span>
                </div>
                {criterion.evidence && (
                  <p className="mt-1 text-xs text-muted">{criterion.evidence}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="space-y-2 rounded-md border border-river/25 bg-white p-3 text-sm">
            <p className="text-ink">
              <span className="font-semibold text-river">Nhận xét: </span>
              {judgeResult.praise}
            </p>
            <p className="text-ink">
              <span className="font-semibold text-terracotta">Gợi mở thêm: </span>
              {judgeResult.addition}
            </p>
          </div>

          {judgeResult.graded_by === "fallback" && (
            <p className="text-xs text-muted">
              Bài được chấm bằng đường dự phòng
            </p>
          )}

          <button
            type="button"
            onClick={() => onDone(judgeResult)}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-river px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Tiếp tục
          </button>
        </motion.div>
      )}
    </section>
  );
}
