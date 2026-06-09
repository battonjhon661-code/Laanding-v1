import type { Metadata } from "next";
import "./globals.css";
import "./prod-page.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vipglass.ru"),
  title: "VIPGLASS — Современные интерьеры",
  description: "Интерьерное стекло премиум-качества для архитектуры, в которой важна каждая деталь.",
  openGraph: {
    title: "VIPGLASS — Современные интерьеры",
    description: "Интерьерное стекло премиум-качества для архитектуры, в которой важна каждая деталь.",
    type: "website",
    locale: "ru_RU",
    siteName: "VIPGLASS",
    images: [
      {
        url: "/bedroom.png",
        width: 1200,
        height: 630,
        alt: "VIPGLASS — стеклянные интерьеры",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VIPGLASS — Современные интерьеры",
    description: "Интерьерное стекло премиум-качества для архитектуры, в которой важна каждая деталь.",
    images: ["/bedroom.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
