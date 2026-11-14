import Link from "next/link";
import { ThemedHomeBackdrop } from "@/components/fx/AppTheme";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { AccountPanel } from "@/components/passport/AccountPanel";
import { TiltCard } from "@/components/fx/TiltCard";
import { EntryCard } from "@/components/shell/EntryCard";
import { getLevels } from "@/lib/content";
import { getSceneKit, sceneIdForLevel } from "@/lib/scene";

export default function HomePage() {
  const featuredLevels = getLevels().slice(0, 3);

  return (
    <main className="space-y-8 pb-6 lg:space-y-10 lg:pb-12">
      <section className="relative -mx-4 -mt-5 flex h-[min(68dvh,560px)] flex-col justify-end overflow-hidden rounded-b-[2rem] lg:-mx-8 lg:-mt-24 lg:h-[min(78dvh,760px)] lg:rounded-b-[2.5rem]">
        <ThemedHomeBackdrop />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-sand via-sand/85 to-transparent"
        />
        <div className="relative z-10 p-6 sm:p-8 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:px-8 lg:pb-12">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Hành trình Văn hóa Đà Nẵng
          </h1>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ink/85 sm:text-base">
            Khám phá di sản qua bản đồ, thử thách tương tác và câu chuyện tại
            từng điểm đến bên sông Hàn.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/kham-pha" className="fx-glow-btn text-sm sm:text-base">
              <span className="fx-glow-btn__label">Bắt đầu khám phá</span>
            </Link>
            <Link
              href="/tour"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[0.625rem] border border-border bg-surface/85 px-5 py-2.5 text-sm font-semibold text-ink backdrop-blur-md transition-colors hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta sm:text-base"
            >
              Nghe tour 5 phút
            </Link>
          </div>
        </div>
      </section>

      <AccountPanel />

      <section
        aria-label="Lối vào chính"
        className="grid gap-3 lg:grid-cols-3 lg:gap-5"
      >
        <EntryCard
          href="/kham-pha"
          title="Khám phá"
          description="3 hành trình tương tác theo từng điểm di sản: tìm vị trí, giải thử thách và chia sẻ cảm nhận."
          accent="terracotta"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          }
        />

        <EntryCard
          href="/tour"
          title="Tour 5 phút"
          description="Lộ trình kể chuyện nhanh trên bản đồ sông Hàn, phù hợp khi bạn có ít thời gian."
          accent="river"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <EntryCard
          href="/photobooth"
          title="Check-in"
          description="Ghi lại khoảnh khắc tại điểm tham quan và lưu dấu đã đến vào hộ chiếu."
          accent="gold"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          }
        />
      </section>

      <section aria-labelledby="featured-destinations-heading">
        <div className="mb-3 flex items-baseline justify-between gap-4 lg:mb-4">
          <h2
            id="featured-destinations-heading"
            className="text-lg font-semibold tracking-tight text-ink lg:text-xl"
          >
            Các điểm đến nổi bật
          </h2>
          <Link
            href="/kham-pha"
            className="text-sm font-medium text-terracotta transition-opacity hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Xem tất cả
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:gap-5">
          {featuredLevels.map((level) => {
            const kit = getSceneKit(sceneIdForLevel(level));

            return (
              <TiltCard key={level.id} max={6} className="h-full">
                <Link
                  href={`/kham-pha/${level.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface/90 backdrop-blur-md transition-colors hover:border-ink/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                >
                  <div className="relative h-[140px] overflow-hidden rounded-t-xl bg-sand lg:h-56">
                    <SceneBackdrop
                      kit={kit}
                      intensity="calm"
                      className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                    <span className="absolute top-2.5 left-2.5 z-10 rounded-full border border-white/20 bg-black/55 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                      Màn {level.order}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="text-base font-semibold text-ink transition-colors group-hover:text-terracotta">
                        {level.title}
                      </h3>
                      {kit.subtitle && (
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {kit.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </TiltCard>
            );
          })}
        </div>
      </section>

      <section aria-label="Hộ chiếu văn hóa">
        <Link
          href="/ho-chieu"
          className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/90 p-4 backdrop-blur-md transition-colors hover:border-ink/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta lg:px-6 lg:py-5"
        >
          <div className="flex min-w-0 items-center gap-3.5 lg:gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink transition-colors group-hover:text-terracotta lg:text-base">
                Hộ chiếu văn hóa
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted lg:text-sm">
                Lưu trữ dấu hoàn thành màn, điểm đã nghe tour và những nơi đã
                ghé thăm.
              </p>
            </div>
          </div>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </section>
    </main>
  );
}
