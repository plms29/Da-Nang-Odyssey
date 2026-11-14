"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from "motion/react";
import { GlowButton } from "@/components/fx/GlowButton";
import { useSpeech } from "@/components/tour/useSpeech";
import { checkRetell } from "@/lib/activities/scoring";
import { haptic } from "@/lib/haptics";
import { splitSentences } from "@/lib/tour/subtitles";
import type {
  JudgeResult,
  RetellBlank,
  RetellStation as RetellStationData,
} from "@/lib/types";
import { deterministicShuffle } from "../shuffle";

export interface RetellStationProps {
  station: RetellStationData;
  onDone: (judge: JudgeResult) => void;
}

type Step = "learn" | "fill" | "read";

type TemplatePart =
  | { type: "text"; text: string }
  | { type: "blank"; id: string };

const STEP_LABELS: { id: Step; label: string }[] = [
  { id: "learn", label: "Học" },
  { id: "fill", label: "Kể" },
  { id: "read", label: "Đọc" },
];

function toImgSrc(path: string): string {
  if (!path) return "";
  if (
    path.startsWith("/") ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  return `/${path}`;
}

function parseTemplate(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  const pattern = /\{\{([^}]+)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        text: template.slice(lastIndex, match.index),
      });
    }
    parts.push({ type: "blank", id: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < template.length) {
    parts.push({ type: "text", text: template.slice(lastIndex) });
  }

  return parts;
}

export function RetellStation({ station, onDone }: RetellStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const [chipScope, animateChip] = useAnimate();
  const speech = useSpeech();

  const cards = station.cards;
  const hasCards = cards.length > 0;

  const blankById = useMemo(() => {
    const map = new Map<string, RetellBlank>();
    for (const blank of station.blanks) {
      map.set(blank.id, blank);
    }
    return map;
  }, [station.blanks]);

  const templateParts = useMemo(
    () => parseTemplate(station.template),
    [station.template],
  );

  const orderedBlankIds = useMemo(() => {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const part of templateParts) {
      if (part.type === "blank" && blankById.has(part.id) && !seen.has(part.id)) {
        seen.add(part.id);
        ids.push(part.id);
      }
    }
    for (const blank of station.blanks) {
      if (!seen.has(blank.id)) {
        seen.add(blank.id);
        ids.push(blank.id);
      }
    }
    return ids;
  }, [templateParts, blankById, station.blanks]);

  const optionsByBlankId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const blank of station.blanks) {
      const choices = [blank.answer, ...blank.distractors];
      map.set(
        blank.id,
        deterministicShuffle(choices, `${station.id}:${blank.id}`),
      );
    }
    return map;
  }, [station.id, station.blanks]);

  const [step, setStep] = useState<Step>(() =>
    hasCards ? "learn" : orderedBlankIds.length > 0 ? "fill" : "read",
  );
  const [cardIndex, setCardIndex] = useState(0);
  const [hasReachedEndOfCards, setHasReachedEndOfCards] = useState(
    cards.length <= 1,
  );
  const [hasEnteredFill, setHasEnteredFill] = useState(!hasCards);

  const [filled, setFilled] = useState<Record<string, string>>({});
  const [activeBlankId, setActiveBlankId] = useState<string | null>(
    () => orderedBlankIds[0] ?? null,
  );
  const [wrongPicks, setWrongPicks] = useState(0);
  const [triedWrongByBlank, setTriedWrongByBlank] = useState<
    Record<string, string[]>
  >({});
  const [wrongFeedback, setWrongFeedback] = useState<{
    blankId: string;
    explain: string;
  } | null>(null);

  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(
    null,
  );

  const chipGroupRef = useRef<HTMLDivElement>(null);
  const readHeadingRef = useRef<HTMLHeadingElement>(null);
  const prevStepRef = useRef<Step>(step);
  const prevBlankIdRef = useRef<string | null>(activeBlankId);

  useEffect(() => {
    const stepChanged = prevStepRef.current !== step;
    const blankChanged = prevBlankIdRef.current !== activeBlankId;
    prevStepRef.current = step;
    prevBlankIdRef.current = activeBlankId;

    if (step === "read" && stepChanged) {
      readHeadingRef.current?.focus();
      return;
    }

    if (step === "fill" && (stepChanged || blankChanged) && activeBlankId) {
      const groupEl = chipGroupRef.current;
      if (!groupEl) return;
      const firstAvailableChip = groupEl.querySelector<HTMLButtonElement>(
        'button:not([aria-disabled="true"])',
      );
      if (firstAvailableChip) {
        firstAvailableChip.focus();
      } else {
        groupEl.focus();
      }
    }
  }, [step, activeBlankId]);

  const completedText = useMemo(() => {
    return templateParts
      .map((part) => {
        if (part.type === "text") return part.text;
        return filled[part.id] ?? blankById.get(part.id)?.answer ?? "";
      })
      .join("");
  }, [templateParts, filled, blankById]);

  const sentences = useMemo(
    () => splitSentences(completedText),
    [completedText],
  );

  const judgePreview = useMemo(
    () => checkRetell(station, wrongPicks),
    [station, wrongPicks],
  );

  const currentStepIndex = STEP_LABELS.findIndex((item) => item.id === step);
  const activeBlank = activeBlankId ? blankById.get(activeBlankId) ?? null : null;
  const activeChoices = activeBlank
    ? optionsByBlankId.get(activeBlank.id) ?? []
    : [];
  const triedForActive = activeBlank
    ? triedWrongByBlank[activeBlank.id] ?? []
    : [];
  const filledCount = orderedBlankIds.filter((id) => Boolean(filled[id])).length;

  function handlePrevCard() {
    if (cardIndex <= 0) return;
    haptic("tap");
    setCardIndex((prev) => prev - 1);
  }

  function handleNextCard() {
    if (cardIndex >= cards.length - 1) return;
    haptic("tap");
    const nextIdx = cardIndex + 1;
    setCardIndex(nextIdx);
    if (nextIdx === cards.length - 1) {
      setHasReachedEndOfCards(true);
    }
  }

  function handleStartOrReturnFill() {
    haptic("tap");
    setHasEnteredFill(true);
    if (orderedBlankIds.length === 0) {
      setStep("read");
      return;
    }
    setStep("fill");
  }

  function handleSelectBlank(blankId: string) {
    if (filled[blankId]) return;
    haptic("tap");
    setActiveBlankId(blankId);
    setWrongFeedback(null);
  }

  function handlePickChoice(choice: string) {
    if (!activeBlank) return;
    const blankId = activeBlank.id;

    if (choice === activeBlank.answer) {
      haptic("success");
      setWrongFeedback(null);

      const nextFilled = { ...filled, [blankId]: activeBlank.answer };
      setFilled(nextFilled);

      const currentIdx = orderedBlankIds.indexOf(blankId);
      let nextUnfilled: string | null = null;
      for (let offset = 1; offset <= orderedBlankIds.length; offset += 1) {
        const candidate =
          orderedBlankIds[(currentIdx + offset) % orderedBlankIds.length];
        if (!nextFilled[candidate]) {
          nextUnfilled = candidate;
          break;
        }
      }

      setActiveBlankId(nextUnfilled);
      if (nextUnfilled === null) {
        setStep("read");
      }
      return;
    }

    if (triedForActive.includes(choice)) {
      return;
    }

    haptic("error");
    setWrongPicks((prev) => prev + 1);
    setTriedWrongByBlank((prev) => ({
      ...prev,
      [blankId]: [...(prev[blankId] ?? []), choice],
    }));
    setWrongFeedback({
      blankId,
      explain: activeBlank.explain,
    });

    if (!reduced && chipScope.current) {
      animateChip(
        chipScope.current,
        { x: [0, -8, 8, -6, 6, 0] },
        { duration: 0.3 },
      );
    }
  }

  function handleReviewCards() {
    haptic("tap");
    setStep("learn");
  }

  function handleToggleSpeak() {
    if (!speech.supported) return;
    haptic("tap");
    if (speech.speaking) {
      speech.cancel();
      setActiveSentenceIndex(null);
      return;
    }
    setActiveSentenceIndex(0);
    speech.speak(sentences, {
      onSentence: (idx) => {
        setActiveSentenceIndex(idx);
      },
      onEnd: () => {
        setActiveSentenceIndex(null);
      },
    });
  }

  function handleFinish() {
    speech.cancel();
    setActiveSentenceIndex(null);
    haptic("success");
    onDone(checkRetell(station, wrongPicks));
  }

  const currentCard = cards[cardIndex];
  const isLastCard = cardIndex === cards.length - 1;

  return (
    <section className="rounded-lg border border-ink/15 bg-white/80 p-4 transition-shadow hover:shadow-sm motion-reduce:transition-none">
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.prompt}
      </p>

      <nav aria-label="Các bước thực hiện" className="mt-3">
        <ol className="grid grid-cols-3 gap-2">
          {STEP_LABELS.map((item, idx) => {
            const isCurrent = item.id === step;
            const isDone =
              idx < currentStepIndex ||
              (item.id === "learn" && hasEnteredFill && step !== "learn");

            return (
              <li
                key={item.id}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex min-h-10 items-center justify-center rounded-md border px-2 py-1.5 text-center text-xs font-bold transition-colors motion-reduce:transition-none ${
                  isCurrent
                    ? "border-gold bg-gold/25 text-ink ring-1 ring-gold"
                    : isDone
                      ? "border-river/40 bg-river/10 text-river"
                      : "border-ink/15 bg-sand/50 text-muted"
                }`}
              >
                {isDone && !isCurrent && (
                  <span aria-hidden="true" className="mr-1">
                    ✓
                  </span>
                )}
                <span>
                  {idx + 1}. {item.label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === "learn" && currentCard && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Thẻ {cardIndex + 1}/{cards.length}
            </span>
            <div
              className="flex items-center gap-1.5"
              aria-label={`Tiến độ thẻ ${cardIndex + 1} trên ${cards.length}`}
            >
              {cards.map((card, idx) => {
                const isActiveDot = idx === cardIndex;
                return (
                  <span
                    key={`${card.title}-${idx}`}
                    aria-hidden="true"
                    className={`h-2 rounded-full transition-all motion-reduce:transition-none ${
                      isActiveDot
                        ? "w-6 bg-terracotta"
                        : idx < cardIndex || hasReachedEndOfCards
                          ? "w-2 bg-river/60"
                          : "w-2 bg-ink/20"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.article
              key={cardIndex}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 12 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: reduced ? 0.1 : 0.2 }}
              className="space-y-3 rounded-lg border border-gold/45 bg-sand/70 p-4"
            >
              <h3 className="text-base font-bold text-ink">
                {currentCard.title}
              </h3>

              {currentCard.image && (
                <div className="overflow-hidden rounded-md border border-ink/10 bg-white p-2">
                  <Image
                    src={toImgSrc(currentCard.image)}
                    alt={currentCard.title}
                    width={480}
                    height={300}
                    unoptimized
                    className="mx-auto h-auto max-h-52 w-full rounded object-contain"
                  />
                </div>
              )}

              <p className="text-sm leading-relaxed text-ink">
                {currentCard.body}
              </p>
            </motion.article>
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handlePrevCard}
              aria-disabled={cardIndex === 0}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                cardIndex === 0
                  ? "cursor-not-allowed opacity-45"
                  : "hover:bg-sand/60"
              }`}
            >
              Trước
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {hasEnteredFill && !isLastCard && (
                <button
                  type="button"
                  onClick={handleStartOrReturnFill}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-river/30 bg-river/10 px-4 py-2 text-sm font-semibold text-river transition-colors hover:bg-river/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                >
                  Quay lại bài kể
                </button>
              )}

              {!isLastCard ? (
                <GlowButton
                  type="button"
                  onClick={handleNextCard}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                >
                  Tiếp
                </GlowButton>
              ) : (
                <GlowButton
                  type="button"
                  onClick={handleStartOrReturnFill}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                >
                  {hasEnteredFill ? "Quay lại bài kể" : "Bắt đầu kể"}
                </GlowButton>
              )}
            </div>
          </div>
        </div>
      )}

      {step === "fill" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">
              Đã điền {filledCount}/{orderedBlankIds.length} chỗ trống
            </span>
            {hasCards && (
              <button
                type="button"
                onClick={handleReviewCards}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-white px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-sand/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                Xem lại thẻ
              </button>
            )}
          </div>

          <div className="rounded-lg border border-ink/15 bg-sand/60 p-4">
            <p className="text-base leading-[2.4] text-ink">
              {templateParts.map((part, idx) => {
                if (part.type === "text") {
                  return <span key={`t-${idx}`}>{part.text}</span>;
                }

                const blankId = part.id;
                if (!blankById.has(blankId)) {
                  return <span key={`t-unk-${idx}`}>{blankId}</span>;
                }
                const filledValue = filled[blankId];
                const isSelected = activeBlankId === blankId;
                const blankNumber = orderedBlankIds.indexOf(blankId) + 1;

                if (filledValue) {
                  return (
                    <span
                      key={`b-${blankId}-${idx}`}
                      className="mx-1 inline-flex min-h-9 items-center rounded-md border border-river/40 bg-river/10 px-2.5 py-0.5 text-sm font-semibold text-river"
                    >
                      {filledValue}
                    </span>
                  );
                }

                return (
                  <button
                    key={`b-${blankId}-${idx}`}
                    type="button"
                    onClick={() => handleSelectBlank(blankId)}
                    aria-pressed={isSelected}
                    aria-label={
                      isSelected
                        ? `Chỗ trống ${blankNumber}, đang chọn`
                        : `Chỗ trống ${blankNumber}, chạm để chọn`
                    }
                    className={`mx-1 inline-flex min-h-11 min-w-16 items-center justify-center rounded-md border-2 border-dashed px-3 py-1 text-sm font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                      isSelected
                        ? "border-terracotta bg-gold/25 text-ink ring-2 ring-gold"
                        : "border-ink/30 bg-white text-muted hover:border-terracotta"
                    }`}
                  >
                    {isSelected ? "___?" : `(${blankNumber})`}
                  </button>
                );
              })}
            </p>
          </div>

          {activeBlank && (
            <div className="space-y-3 rounded-lg border border-ink/15 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Chọn từ đúng cho ô ({orderedBlankIds.indexOf(activeBlank.id) + 1})
              </p>

              <div ref={chipScope}>
                <div
                  ref={chipGroupRef}
                  tabIndex={-1}
                  className="flex flex-wrap gap-2 focus:outline-none"
                >
                  {activeChoices.map((choice) => {
                    const isTriedWrong = triedForActive.includes(choice);
                    return (
                      <button
                        key={choice}
                        type="button"
                        aria-disabled={isTriedWrong}
                        onClick={() => handlePickChoice(choice)}
                        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                          isTriedWrong
                            ? "cursor-not-allowed border-ink/15 bg-sand/50 text-muted opacity-40"
                            : "border-ink/25 bg-sand/60 text-ink hover:border-terracotta hover:bg-gold/20 active:scale-[0.98] motion-reduce:active:scale-100"
                        }`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                role="status"
                aria-live="polite"
                className={
                  wrongFeedback && wrongFeedback.blankId === activeBlank.id
                    ? "rounded-md border border-terracotta/25 bg-terracotta/10 p-3 text-sm leading-relaxed text-ink"
                    : "sr-only"
                }
              >
                {wrongFeedback && wrongFeedback.blankId === activeBlank.id
                  ? wrongFeedback.explain
                  : ""}
              </div>
            </div>
          )}
        </div>
      )}

      {step === "read" && (
        <div className="mt-4 space-y-4">
          <h3
            ref={readHeadingRef}
            tabIndex={-1}
            className="text-base font-bold text-ink focus:outline-none"
          >
            Bài hoàn chỉnh của bạn
          </h3>

          <div className="rounded-lg border border-gold/50 bg-gold/15 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p
                role="img"
                aria-label={`${judgePreview.stars} trên 3 sao`}
                className="text-xl leading-none tracking-widest text-gold"
              >
                <span aria-hidden="true">
                  {[0, 1, 2].map((i) => (i < judgePreview.stars ? "★" : "☆"))}
                </span>
              </p>
              <span className="text-xs font-medium text-muted">
                {judgePreview.criteria[0]?.evidence}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-ink">
              {judgePreview.praise}
            </p>
          </div>

          <div className="rounded-lg border border-ink/15 bg-sand/60 p-4">
            <p className="text-base leading-relaxed text-ink">
              {sentences.map((sentence, idx) => {
                const isHighlighted = activeSentenceIndex === idx;
                return (
                  <span
                    key={idx}
                    className={`rounded px-1 py-0.5 transition-colors motion-reduce:transition-none ${
                      isHighlighted
                        ? "bg-gold/35 font-semibold text-ink ring-1 ring-gold/60"
                        : ""
                    }`}
                  >
                    {sentence}
                    {idx < sentences.length - 1 ? " " : ""}
                  </span>
                );
              })}
            </p>
          </div>

          <p className="rounded-md border border-river/25 bg-river/10 px-3 py-2.5 text-sm font-medium text-ink">
            Giờ bạn thử đọc to cả bài nhé
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {speech.supported && (
              <button
                type="button"
                onClick={handleToggleSpeak}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-river/40 bg-white px-4 py-2 text-sm font-semibold text-river transition-colors hover:bg-river/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                {speech.speaking ? "Dừng đọc" : "Nghe đọc"}
              </button>
            )}

            <GlowButton
              type="button"
              onClick={handleFinish}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Hoàn thành
            </GlowButton>
          </div>
        </div>
      )}
    </section>
  );
}
