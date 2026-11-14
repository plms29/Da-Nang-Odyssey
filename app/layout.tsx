import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AppThemeFrame } from "@/components/fx/AppTheme";
import { AppBackground } from "@/components/shell/AppBackground";
import { FortressCutsceneHost } from "@/components/fx/FortressCutscene";
import { BottomNav } from "@/components/shell/BottomNav";
import { ZoomOverlayHost } from "@/components/fx/ZoomNavigate";
import { LoginGate, ProgressSyncBoot } from "@/components/passport/AccountPanel";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hành trình văn hóa Đà Nẵng",
  description: "Nghe, làm, thể hiện và đến tận nơi — khám phá văn hóa Đà Nẵng.",
};

export const viewport: Viewport = {
  themeColor: "#F6EFE4",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("danang-theme")||"light";var d=localStorage.getItem("danang-bg-dim")||"normal";var r=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):(t==="dark"?"dark":"light");document.documentElement.dataset.theme=r;document.documentElement.dataset.bgDim=d==="soft"?"soft":"normal";var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute("content",r==="dark"?"#111214":"#F7F5F0");}}catch(e){document.documentElement.dataset.theme="light";document.documentElement.dataset.bgDim="normal";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${beVietnamPro.variable} text-ink antialiased`}>
        <AppBackground />
        <FortressCutsceneHost />
        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pb-24 lg:max-w-[1200px] lg:pb-12">
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
