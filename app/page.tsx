import Link from "next/link";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowLink } from "@/components/fx/GlowButton";
import { KineticText } from "@/components/fx/KineticText";
import { MotionPermissionButton } from "@/components/fx/MotionPermissionButton";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { TiltCard } from "@/components/fx/TiltCard";
import { EntryCard, RevealItem } from "@/components/shell/EntryCard";
import { getSceneKit } from "@/lib/scene";

export default function HomePage() {
  return (
    <main className="space-y-6 pb-4">
      <section className="relative -mx-4 -mt-5 flex h-[min(68dvh,560px)] flex-col justify-end overflow-hidden rounded-b-[2rem]">
        <SceneBackdrop kit={getSceneKit("home")} />
        <MotionPermissionButton className="absolute top-4 right-4 z-20" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-sand via-sand/90 to-transparent"
        />
        <div className="relative z-10 p-5">
          <p className="text-xs font-semibold tracking-wider text-terracotta uppercase">
            Di sản &amp; Trải nghiệm
          </p>
          <KineticText
            as="h1"
            shimmer
            className="mt-1 text-4xl leading-[1.05] font-bold tracking-tight text-ink sm:text-5xl"
          >
            Hành trình văn hóa Đà Nẵng
          </KineticText>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Nghe, làm, thể hiện và đến tận nơi
          </p>
          <GlowLink
            href="/kham-pha"
            className="mt-5 min-h-11 px-6 text-base font-semibold"
          >
            Bắt đầu khám phá
          </GlowLink>
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
          <TiltCard className="rounded-lg">
            <GlassPanel tone="light" className="relative overflow-hidden rounded-lg">
              <Link
                href="/ho-chieu"
                className="group flex items-center justify-between gap-3 rounded-lg p-4 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-terracotta"
              >
                <div className="flex min-w-0 items-center gap-3">
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
                  <p className="min-w-0 text-sm font-semibold text-ink group-hover:text-terracotta">
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
            </GlassPanel>
          </TiltCard>
        </RevealItem>
      </section>
    </main>
  );
}
