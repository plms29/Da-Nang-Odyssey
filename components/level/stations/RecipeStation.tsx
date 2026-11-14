"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { GlowButton } from "@/components/fx/GlowButton";
import { checkRecipe } from "@/lib/activities/scoring";
import { haptic } from "@/lib/haptics";
import type { RecipeStation as RecipeStationType, StationResult } from "@/lib/types";
import { deterministicShuffle } from "../shuffle";
import { useAttempt } from "../useAttempt";
import { HintBox } from "../HintBox";

export interface RecipeStationProps {
  station: RecipeStationType;
  onDone: (result: StationResult) => void;
}

interface IngredientItem {
  id: string;
  label: string;
  color: string;
}

type PendingFocus =
  | { type: "bowl-remove"; id: string }
  | { type: "bowl-move"; id: string; direction: "up" | "down" }
  | { type: "shelf"; id: string }
  | { type: "check" };

const WRONG_FEEDBACK =
  "Tô mì chưa đúng nguyên liệu hoặc thứ tự, hãy kiểm tra lại nhé.";

const LAYER_COLORS = [
  "#6E8B5E",
  "#E3B448",
  "#C96B42",
  "#D99A4E",
  "#EAD5B7",
  "#8FA67A",
  "#B85C38",
  "#D8C3A5",
] as const;

export function RecipeStation({ station, onDone }: RecipeStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const [scope, animate] = useAnimate();
  const bowlClipId = useId();

  const [shelfItems] = useState<IngredientItem[]>(() => {
    const combined = [...station.steps, ...station.distractors];
    const shuffled = deterministicShuffle(
      combined,
      station.id,
      (arr) =>
        station.steps.length > 0 &&
        station.steps.every((step, idx) => arr[idx]?.id === step.id),
    );
    return shuffled.map((item, idx) => ({
      id: item.id,
      label: item.label,
      color: LAYER_COLORS[idx % LAYER_COLORS.length],
    }));
  });

  const itemById = useMemo(
    () => new Map(shelfItems.map((item) => [item.id, item])),
    [shelfItems],
  );

  const [bowlIds, setBowlIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");
  const [checked, setChecked] = useState(false);
  const [solvedGlow, setSolvedGlow] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<PendingFocus | null>(null);
  const removeButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const upButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const downButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const shelfButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const checkContainerRef = useRef<HTMLDivElement | null>(null);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

  const bowlIdSet = useMemo(() => new Set(bowlIds), [bowlIds]);
  const shelfAvailable = useMemo(
    () => shelfItems.filter((item) => !bowlIdSet.has(item.id)),
    [shelfItems, bowlIdSet],
  );
  const bowlItems = useMemo(
    () =>
      bowlIds
        .map((id) => itemById.get(id))
        .filter((item): item is IngredientItem => Boolean(item)),
    [bowlIds, itemById],
  );

  useEffect(() => {
    if (!pendingFocus) return;
    if (pendingFocus.type === "bowl-remove") {
      const btn = removeButtonRefs.current.get(pendingFocus.id);
      if (btn && !btn.disabled) {
        btn.focus();
      }
    } else if (pendingFocus.type === "bowl-move") {
      const primary =
        pendingFocus.direction === "up"
          ? upButtonRefs.current.get(pendingFocus.id)
          : downButtonRefs.current.get(pendingFocus.id);
      const fallback =
        pendingFocus.direction === "up"
          ? downButtonRefs.current.get(pendingFocus.id)
          : upButtonRefs.current.get(pendingFocus.id);
      const target = primary && !primary.disabled ? primary : fallback;
      if (target && !target.disabled) {
        target.focus();
      }
    } else if (pendingFocus.type === "shelf") {
      const btn = shelfButtonRefs.current.get(pendingFocus.id);
      if (btn && !btn.disabled) {
        btn.focus();
      }
    } else if (pendingFocus.type === "check") {
      const btn = checkContainerRef.current?.querySelector("button");
      if (btn && !btn.disabled) {
        btn.focus();
      }
    }
    setPendingFocus(null);
  }, [pendingFocus]);

  function handleAdd(id: string) {
    if (checked || bowlIdSet.has(id)) return;
    const item = itemById.get(id);
    if (!item) return;
    const shelfIndex = shelfAvailable.findIndex((entry) => entry.id === id);
    const nextShelf = shelfAvailable.filter((entry) => entry.id !== id);
    const nextShelfItem =
      nextShelf.length > 0
        ? (shelfAvailable[shelfIndex + 1] ?? nextShelf[nextShelf.length - 1])
        : null;

    haptic("tap");
    setFeedback(null);
    setActiveId(id);
    const nextLength = bowlIds.length + 1;
    setBowlIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setAnnouncement(`Đã cho ${item.label} vào tô ở vị trí ${nextLength}.`);
    setPendingFocus(
      nextShelfItem ? { type: "shelf", id: nextShelfItem.id } : { type: "check" },
    );
  }

  function handleRemove(id: string) {
    if (checked) return;
    const item = itemById.get(id);
    if (!item) return;
    const removeIndex = bowlIds.indexOf(id);
    if (removeIndex === -1) return;
    const nextBowlIds = bowlIds.filter((itemId) => itemId !== id);
    const nextBowlSet = new Set(nextBowlIds);
    const nextShelf = shelfItems.filter((entry) => !nextBowlSet.has(entry.id));

    haptic("tap");
    setFeedback(null);
    setActiveId((prev) => (prev === id ? null : prev));
    setBowlIds(nextBowlIds);
    setAnnouncement(`Đã bỏ ${item.label} ra khỏi tô về lại kệ.`);

    if (nextBowlIds.length === 0) {
      const firstShelf = nextShelf[0];
      setPendingFocus(firstShelf ? { type: "shelf", id: firstShelf.id } : null);
    } else {
      const targetId =
        removeIndex < bowlIds.length - 1
          ? bowlIds[removeIndex + 1]
          : bowlIds[removeIndex - 1];
      setPendingFocus({ type: "bowl-remove", id: targetId });
    }
  }

  function handleMove(index: number, delta: -1 | 1) {
    if (checked) return;
    const target = index + delta;
    if (target < 0 || target >= bowlIds.length) return;
    const movedId = bowlIds[index];
    const movedItem = itemById.get(movedId);
    haptic("tap");
    setFeedback(null);
    setActiveId(movedId);
    setBowlIds((prev) => {
      const next = prev.slice();
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
    if (movedItem) {
      setAnnouncement(`Đã chuyển ${movedItem.label} tới vị trí ${target + 1}.`);
    }
    setPendingFocus({
      type: "bowl-move",
      id: movedId,
      direction: delta === -1 ? "up" : "down",
    });
  }

  function handleCheck() {
    if (checked || bowlIds.length === 0) return;
    if (checkRecipe(station, bowlIds)) {
      setFeedback(null);
      setActiveId(null);
      setChecked(true);
      setSolvedGlow(true);
      setAnnouncement("Đúng rồi! Tô mì Quảng đã hoàn thành.");
      haptic("success");
      if (!reduced && scope.current) {
        animate(
          scope.current,
          { y: [0, -4, 0] },
          { duration: 0.3, ease: "easeOut" },
        );
      }
      onDone(result(true));
      return;
    }
    addWrong();
    haptic("error");
    if (!reduced && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.3 });
    }
    setFeedback(WRONG_FEEDBACK);
    setAnnouncement(WRONG_FEEDBACK);
  }

  function handleHint() {
    const hint = nextHint();
    if (hint !== null) {
      setRevealedHints((prev) => [...prev, hint]);
    }
  }

  const maxSlots = Math.max(shelfItems.length, 5);
  const slotHeight = 62 / maxSlots;

  return (
    <section
      className={`rounded-lg border border-ink/15 bg-white/80 p-4 transition-shadow hover:shadow-sm ${
        solvedGlow
          ? "ring-2 ring-gold ring-offset-2 shadow-[0_0_16px_rgba(201,154,46,0.35)]"
          : ""
      }`}
    >
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.instruction}
      </p>
      <p className="mt-1 text-xs text-muted">
        Chọn nguyên liệu trên kệ để cho vào tô. Chạm mục trong tô để bỏ ra, dùng nút Đưa lên / Đưa xuống để đổi thứ tự.
      </p>

      <div ref={scope} className="mt-4 space-y-4">
        <div className="rounded-lg border border-ink/15 bg-sand/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Trong tô ({bowlItems.length})
            </h3>
          </div>

          <div className="mt-2 flex flex-col items-center">
            <svg
              viewBox="0 0 240 128"
              role="img"
              aria-label={
                bowlItems.length === 0
                  ? "Tô mì Quảng đang trống"
                  : `Tô mì Quảng đang có ${bowlItems.length} lớp nguyên liệu`
              }
              className="h-auto w-full max-w-[220px]"
            >
              <defs>
                <clipPath id={bowlClipId}>
                  <path d="M 34 38 C 34 82, 66 104, 120 104 C 174 104, 206 82, 206 38 Z" />
                </clipPath>
              </defs>

              <path
                d="M 88 108 L 82 120 L 158 120 L 152 108 Z"
                fill="#8C3B1E"
              />
              <path
                d="M 26 36 C 26 88, 62 112, 120 112 C 178 112, 214 88, 214 36 Z"
                fill="#A84825"
                stroke="#1F1A17"
                strokeOpacity="0.2"
                strokeWidth="2"
              />
              <path
                d="M 34 38 C 34 82, 66 104, 120 104 C 174 104, 206 82, 206 38 Z"
                fill="#F6EFE4"
              />

              <g clipPath={`url(#${bowlClipId})`}>
                {bowlItems.map((item, idx) => {
                  const yBottom = 104 - idx * slotHeight;
                  const yTop = yBottom - slotHeight;
                  const d = `M 30 ${yTop} Q 75 ${yTop - 3} 120 ${yTop} T 210 ${yTop} L 210 ${yBottom + 2} L 30 ${yBottom + 2} Z`;
                  return (
                    <motion.path
                      key={item.id}
                      d={d}
                      fill={item.color}
                      stroke="#1F1A17"
                      strokeOpacity="0.14"
                      strokeWidth="1"
                      initial={reduced ? false : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        reduced
                          ? { duration: 0.1 }
                          : { type: "spring", stiffness: 360, damping: 28 }
                      }
                    />
                  );
                })}
              </g>

              <ellipse
                cx="120"
                cy="36"
                rx="94"
                ry="11"
                fill="none"
                stroke="#C99A2E"
                strokeWidth="3"
              />
              <ellipse
                cx="120"
                cy="36"
                rx="88"
                ry="8"
                fill="none"
                stroke="#1F1A17"
                strokeOpacity="0.15"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {bowlItems.length === 0 ? (
            <p className="mt-2 rounded-md border border-dashed border-ink/20 bg-white/60 px-3 py-3 text-center text-sm text-muted">
              Tô đang trống — hãy chọn nguyên liệu từ kệ bên dưới.
            </p>
          ) : (
            <ol className="mt-3 space-y-2" aria-label="Danh sách nguyên liệu trong tô">
              {bowlItems.map((item, index) => {
                const isSelected = activeId === item.id;
                return (
                  <li
                    key={item.id}
                    className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 transition-shadow motion-reduce:transition-none ${
                      isSelected
                        ? "border-terracotta bg-white ring-2 ring-gold shadow-[0_0_16px_rgba(201,154,46,0.35)]"
                        : "border-ink/15 bg-white focus-within:border-terracotta focus-within:ring-2 focus-within:ring-gold focus-within:shadow-[0_0_16px_rgba(201,154,46,0.35)]"
                    }`}
                  >
                    <button
                      ref={(el) => {
                        if (el) {
                          removeButtonRefs.current.set(item.id, el);
                        } else {
                          removeButtonRefs.current.delete(item.id);
                        }
                      }}
                      type="button"
                      disabled={checked}
                      onClick={() => handleRemove(item.id)}
                      aria-label={`Bỏ ${item.label} ra khỏi tô, vị trí ${index + 1}`}
                      className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1 text-left text-sm font-medium text-ink transition-colors hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full border border-ink/20"
                        style={{ backgroundColor: item.color }}
                      />
                      <span
                        aria-hidden="true"
                        className="shrink-0 font-bold text-terracotta"
                      >
                        {index + 1}.
                      </span>
                      <span className="min-w-0 flex-1 break-words">
                        {item.label}
                      </span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-xs font-semibold text-muted"
                      >
                        ✕
                      </span>
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        ref={(el) => {
                          if (el) {
                            upButtonRefs.current.set(item.id, el);
                          } else {
                            upButtonRefs.current.delete(item.id);
                          }
                        }}
                        type="button"
                        aria-label={`Đưa lên: ${item.label}`}
                        disabled={checked || index === 0}
                        onClick={() => handleMove(index, -1)}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink/20 bg-sand/50 text-sm font-bold text-ink transition-colors motion-reduce:transition-none hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ▲
                      </button>
                      <button
                        ref={(el) => {
                          if (el) {
                            downButtonRefs.current.set(item.id, el);
                          } else {
                            downButtonRefs.current.delete(item.id);
                          }
                        }}
                        type="button"
                        aria-label={`Đưa xuống: ${item.label}`}
                        disabled={checked || index === bowlItems.length - 1}
                        onClick={() => handleMove(index, 1)}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink/20 bg-sand/50 text-sm font-bold text-ink transition-colors motion-reduce:transition-none hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ▼
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Kệ nguyên liệu ({shelfAvailable.length})
          </h3>
          {shelfAvailable.length === 0 ? (
            <p className="mt-2 rounded-md border border-ink/15 bg-sand/40 px-3 py-2.5 text-sm text-muted">
              Đã cho tất cả nguyên liệu trên kệ vào tô.
            </p>
          ) : (
            <ul
              className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
              aria-label="Kệ nguyên liệu"
            >
              {shelfAvailable.map((item) => (
                <li key={item.id}>
                  <button
                    ref={(el) => {
                      if (el) {
                        shelfButtonRefs.current.set(item.id, el);
                      } else {
                        shelfButtonRefs.current.delete(item.id);
                      }
                    }}
                    type="button"
                    disabled={checked}
                    onClick={() => handleAdd(item.id)}
                    aria-label={`Cho vào tô: ${item.label}`}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-ink/20 bg-sand/60 px-3 py-2 text-left text-sm font-medium text-ink transition-colors motion-reduce:transition-none hover:border-terracotta hover:bg-sand focus-visible:border-terracotta focus-visible:ring-2 focus-visible:ring-gold focus-visible:shadow-[0_0_16px_rgba(201,154,46,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full border border-ink/20"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="break-words">{item.label}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-base font-bold text-terracotta"
                    >
                      +
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {feedback && (
        <p role="status" className="mt-3 text-sm font-medium text-terracotta">
          {feedback}
        </p>
      )}

      <div ref={checkContainerRef} className="mt-4">
        <GlowButton
          type="button"
          disabled={bowlIds.length === 0 || checked}
          onClick={handleCheck}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50"
        >
          Kiểm tra
        </GlowButton>
      </div>

      <HintBox
        revealedHints={revealedHints}
        hintsUsed={hintsUsed}
        totalHints={station.hints.length}
        onRequestHint={handleHint}
      />
    </section>
  );
}
