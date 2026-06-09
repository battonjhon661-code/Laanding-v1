import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import "./prod-page.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
  variable: "--font-mono",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  preload: true,
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vipglass.ru"),
  verification: {
    google: "e4WnUIL3TFRyItiFvehYNoTycpzOuxlc_qKb0bv3sEQ",
  },
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
    <html lang="ru" className={`${inter.variable} ${jetbrainsMono.variable} ${manrope.variable}`}>
      <head>
        <meta name="google-site-verification" content="e4WnUIL3TFRyItiFvehYNoTycpzOuxlc_qKb0bv3sEQ" />
        <link rel="preload" as="image" fetchPriority="high" href="/locations/bedroom.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
