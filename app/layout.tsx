import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Manrope, Outfit } from "next/font/google";
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

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["200", "300", "500", "600", "700"],
  display: "swap",
  preload: true,
  variable: "--font-outfit",
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
    <html lang="ru" className={`${inter.variable} ${jetbrainsMono.variable} ${manrope.variable} ${outfit.variable}`}>
      <head>
        <meta name="google-site-verification" content="e4WnUIL3TFRyItiFvehYNoTycpzOuxlc_qKb0bv3sEQ" />
        <link rel="preload" as="image" fetchPriority="high" href="/locations/bedroom.webp" />
        {/* JSON-LD LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "VIPGLASS",
              description: "Интерьерное стекло премиум-качества — зеркала, душевые перегородки, стеклянные ограждения и полки.",
              url: "https://vipglass.ru",
              telephone: "+7 (999) 999-99-99",
              image: "https://vipglass.ru/bedroom.png",
              address: {
                "@type": "PostalAddress",
                addressCountry: "RU",
              },
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
                opens: "09:00",
                closes: "21:00",
              },
              priceRange: "₽₽₽",
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Стеклянные интерьерные изделия",
                itemListElement: [
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: "Зеркала" } },
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: "Душевые перегородки" } },
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: "Стеклянные перегородки" } },
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: "Стеклянные ограждения" } },
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: "Стеклянные полки" } },
                ],
              },
            }),
          }}
        />
        {/* /JSON-LD LocalBusiness */}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}` }} />
        {/* Yandex.Metrika counter */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
          ym(109396212,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
        ` }} />
        <noscript dangerouslySetInnerHTML={{ __html: '<div><img src="https://mc.yandex.ru/watch/109396212" style="position:absolute;left:-9999px;" alt="" /></div>' }} />
        {/* /Yandex.Metrika counter */}
      </head>
      <body>{children}</body>
    </html>
  );
}
