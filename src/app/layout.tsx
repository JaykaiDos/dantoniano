/**
 * Root Layout — aplica fuentes, ThemeProvider y estructura global.
 */
import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display, Roboto_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dantoniano — Reacciones de Anime',
  description: 'Las reacciones de Dantoniano. Reacciones de anime organizadas por temporada. Encontrá tus series favoritas y reviví los momentos épicos.',
  applicationName: 'xdantonioxd21',
  authors: [{ name: 'xdantonioxd21' }],
  creator: 'xdantonioxd21',
  publisher: 'xdantonioxd21',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Dantoniano — Reacciones de Anime',
    description: 'Reacciones de anime organizadas por temporada.',
    siteName: 'Dantoniano',
    url: 'https://dantoniano.vercel.app',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: 'https://dantoniano.vercel.app/og-image.jpg', // URL ABSOLUTA obligatoria
        width: 1200,
        height: 630,
        alt: 'Dantoniano — Reacciones de Anime',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dantoniano — Reacciones de Anime',
    description: 'Reacciones de anime organizadas por temporada.',
    creator: '@xdantonioxd21',
    images: ['https://dantoniano.vercel.app/og-image.jpg'], // URL ABSOLUTA
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/*
          Script inline para leer preferencia de tema ANTES del primer paint — evita flash.
          "Claro" ya no es un tema fijo: se resuelve a la estación activa según el mes
          (misma convención que getSeasonByMonth en hooks/useTheme.ts):
            Invierno -> Ene/Feb/Mar · Primavera -> Abr/May/Jun
            Verano   -> Jul/Ago/Sep · Otoño     -> Oct/Nov/Dic
          "Oscuro" (data-theme="dark") no cambia.
        */}
        <Script
          id="vh-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vh-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=t==='dark'||(t===null&&d);if(isDark){document.documentElement.setAttribute('data-theme','dark');}else{var m=new Date().getMonth();var s=m<=2?'winter':m<=5?'spring':m<=8?'summer':'autumn';document.documentElement.setAttribute('data-theme',s);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${playfair.variable} ${robotoMono.variable}`}>
        {children}
        <Analytics /> {/* ← Vercel Analytics: registra visitas en producción */}
      </body>
    </html>
  );
}