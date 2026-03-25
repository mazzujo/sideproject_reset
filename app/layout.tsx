import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "상체 리셋 — Reset · Nature · New Beginning",
  description: "자연스러운 변화를 위한 상체 리셋 요가 프로그램",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
