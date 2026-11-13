import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/shell/BottomNav";

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
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-sand pb-24 shadow-sm">
          <div className="flex-1 px-4 pt-5">{children}</div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
