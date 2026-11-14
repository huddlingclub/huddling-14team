import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://huddling.link";
const TITLE = "허들워킹 · 허들링클럽 2nd Meetup";
const DESCRIPTION = "기수·직무·조·지역 공통점으로 오늘 밋업에 온 사람을 찾고, QR로 바로 친구가 되는 허들링클럽 네트워킹";

// 파비콘(favicon.ico · icon.png · apple-icon.png)과 링크 미리보기(opengraph-image.jpg · twitter-image.jpg)는
// src/app 안의 같은 이름 파일을 Next가 자동으로 <head>에 연결한다
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · 허들워킹" },
  description: DESCRIPTION,
  applicationName: "허들워킹",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "허들워킹",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  appleWebApp: { capable: true, title: "허들워킹", statusBarStyle: "black" },
  formatDetection: { telephone: false, email: false, address: false },
};

// viewportFit: cover — 아이폰 하단 홈 막대 영역(safe-area)을 계산해 하단 탭·버튼이 가려지지 않게 한다
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f0b29",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
