import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AppThemeFrame } from "@/components/fx/AppTheme";
import { BottomNav } from "@/components/shell/BottomNav";
import { ZoomOverlayHost } from "@/components/fx/ZoomNavigate";
import { LoginGate, ProgressSyncBoot } from "@/components/passport/AccountPanel";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hành trình văn hóa Đà Nẵng",
  description: "Nghe, làm, thể hiện và đến tận nơi — khám phá văn hóa Đà Nẵng.",
};

export const viewport: Viewport = {
  themeColor: "#F6EFE4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${beVietnamPro.variable} bg-sand text-ink antialiased`}>
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-sand pb-24 shadow-sm lg:max-w-[1200px] lg:pb-12">
          <AppThemeFrame>
            <div className="flex-1 px-4 pt-5 lg:px-8 lg:pt-24">
              <LoginGate>{children}</LoginGate>
            </div>
            <BottomNav />
          </AppThemeFrame>
        </div>
        <ZoomOverlayHost />
        <ProgressSyncBoot />
      </body>
    </html>
  );
}
