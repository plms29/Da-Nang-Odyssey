"use client";

import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { GlowButton } from "@/components/fx/GlowButton";
import { haptic } from "@/lib/haptics";
import type {
  ExpressStation as ExpressStationType,
  JudgeResult,
} from "@/lib/types";

export interface ExpressStationProps {
  station: ExpressStationType;
  levelId: string;
  onDone: (result: JudgeResult) => void;
}

export function ExpressStation({
  station,
  levelId,
  onDone,
}: ExpressStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [solvedGlow, setSolvedGlow] = useState(false);

  const textareaId = `${station.id}-answer`;
  const rubricDescById = new Map(
    station.rubric.map((criterion) => [criterion.id, criterion.desc]),
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level_id: levelId,
          station_id: station.id,
          text,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "Không chấm được bài, thử lại nhé.";
        haptic("error");
        setError(message);
        return;
      }

      if (!Array.isArray(data?.criteria)) {
        haptic("error");
        setError("Không chấm được bài, thử lại nhé.");
        return;
      }

      haptic("success");
      setJudgeResult(data as JudgeResult);
    } catch {
      haptic("error");
      setError("Lỗi kết nối mạng");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={`rounded-lg border border-ink/15 bg-white/80 p-4 transition-shadow hover:shadow-sm ${
        solvedGlow
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
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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

          {error && (
            <p role="alert" className="text-sm font-medium text-terracotta">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <GlowButton
              type="submit"
              disabled={loading || text.trim().length === 0}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Đang chấm…" : "Nộp bài"}
            </GlowButton>

            {loading && (
              <div
                aria-hidden="true"
                className="flex items-center gap-2 text-xs font-medium text-muted"
              >
                <motion.span
                  className="inline-block h-2 w-2 rounded-full bg-gold"
                  animate={
                    reduced ? { opacity: 1 } : { opacity: [0.35, 1, 0.35] }
                  }
                  transition={
                    reduced
                      ? { duration: 0.15 }
                      : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                  }
                />
                <span>Đang chấm…</span>
              </div>
            )}
          </div>

          <p aria-live="polite" className="sr-only">
            {loading ? "Đang chấm…" : ""}
          </p>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          <ul className="space-y-2">
            {judgeResult.criteria.map((criterion, index) => (
              <motion.li
                key={criterion.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={
                  reduced
                    ? { duration: 0.15 }
                    : { duration: 0.25, delay: index * 0.12 }
                }
                className="rounded-md border border-ink/15 bg-sand/60 p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">
                    {rubricDescById.get(criterion.id) ?? criterion.id}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="flex items-center gap-0.5 text-sm leading-none"
                    >
                      {[0, 1, 2].map((starIndex) => {
                        const filled = starIndex < criterion.score;
                        return (
                          <motion.span
                            key={starIndex}
                            initial={
                              reduced
                                ? { opacity: 0 }
                                : { scale: 0, opacity: 0 }
                            }
                            animate={
                              reduced
                                ? { opacity: 1 }
                                : { scale: 1, opacity: 1 }
                            }
                            transition={
                              reduced
                                ? { duration: 0.15 }
                                : {
                                    type: "spring",
                                    stiffness: 380,
                                    damping: 30,
                                    delay: index * 0.12 + starIndex * 0.08,
                                  }
                            }
                            className={filled ? "text-gold" : "text-ink/25"}
                          >
                            {filled ? "★" : "☆"}
                          </motion.span>
                        );
                      })}
                    </span>
                    <span className="shrink-0 font-bold text-river">
                      {criterion.score}/3
                    </span>
                  </div>
                </div>
                {criterion.evidence && (
                  <p className="mt-1 text-xs text-muted">{criterion.evidence}</p>
                )}
              </motion.li>
            ))}
          </ul>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              reduced
                ? { duration: 0.15 }
                : { duration: 0.3, delay: judgeResult.criteria.length * 0.12 }
            }
            className="space-y-2 rounded-md border border-river/25 bg-white p-3 text-sm"
          >
            <p className="text-ink">
              <span className="font-semibold text-river">Nhận xét: </span>
              {judgeResult.praise}
            </p>
            <p className="text-ink">
              <span className="font-semibold text-terracotta">
                Gợi mở thêm:{" "}
              </span>
              {judgeResult.addition}
            </p>
          </motion.div>

          {judgeResult.graded_by === "fallback" && (
            <p className="text-xs text-muted">
              Bài được chấm bằng đường dự phòng
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              haptic("tap");
              setSolvedGlow(true);
              onDone(judgeResult);
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-river px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Tiếp tục
          </button>
        </div>
      )}
    </section>
  );
}
