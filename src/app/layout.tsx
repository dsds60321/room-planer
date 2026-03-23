import type { Metadata } from "next";

import { AppProviders } from "@/components/layout/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Room Planner",
  description: "실측 입력 기반 방 단위 도면 편집 및 평면도 결과 생성기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
