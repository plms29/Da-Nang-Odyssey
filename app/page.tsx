import Link from "next/link";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { TextReveal } from "@/components/fx/TextReveal";
import { EntryCard, RevealItem } from "@/components/shell/EntryCard";
import { getSceneKit } from "@/lib/scene";

export default function HomePage() {
  return (
    <main className="space-y-6 pb-4">
      <section className="relative -mx-4 -mt-5 flex h-[55dvh] flex-col justify-end overflow-hidden rounded-b-xl">
        <SceneBackdrop kit={getSceneKit("home")} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-sand via-sand/90 to-transparent"
        />
        <div className="relative p-5">
          <p className="text-xs font-semibold tracking-wider text-terracotta uppercase">
            Di sản &amp; Trải nghiệm
          </p>
          <TextReveal
            mode="blur"
            as="h1"
            className="mt-1 text-3xl font-bold tracking-tight text-ink"
          >
            Hành trình văn hóa Đà Nẵng
          </TextReveal>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Nghe, làm, thể hiện và đến tận nơi
          </p>
        </div>
      </section>

      <section aria-label="Lối vào chính" className="space-y-3">
        <RevealItem delay={0}>
          <EntryCard
            href="/kham-pha"
            title="Khám phá"
            description="chiến dịch 6 màn, mỗi màn ba trạm: tìm, làm, thể hiện"
            accent="terracotta"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
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
        </RevealItem>

        <RevealItem delay={0.08}>
          <EntryCard
            href="/tour"
            title="5 phút"
            description="tour kể chuyện trên bản đồ cho người bận"
            accent="river"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
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
        </RevealItem>

        <RevealItem delay={0.16}>
          <EntryCard
            href="/photobooth"
            title="Check-in"
            description="chụp ảnh tại điểm tham quan, nhận dấu 'đã đến'"
            accent="gold"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
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
        </RevealItem>
      </section>

      <section aria-label="Hộ chiếu văn hóa">
        <RevealItem delay={0.24}>
          <Link
            href="/ho-chieu"
            className="group flex items-center justify-between gap-3 rounded-lg border border-gold/60 bg-white/80 p-4 transition-colors hover:border-gold hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/25 text-ink">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
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
              <p className="text-sm font-semibold text-ink group-hover:text-terracotta">
                Hộ chiếu văn hóa: dấu hoàn thành màn, đã nghe, đã đến
              </p>
            </div>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-terracotta"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </RevealItem>
      </section>
    </main>
  );
}
