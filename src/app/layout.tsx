/**
 * Root Layout — aplica fuentes, ThemeProvider y estructura global.
 */
import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'Dantoniano — Reacciones de Anime',
  description: 'Todas las reacciones de anime organizadas por temporada.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Script inline para leer preferencia de tema ANTES del primer paint — evita flash */}
        {/* Detección de tema sin flash — usando template para evitar warning de React */}
<script
  suppressHydrationWarning
  dangerouslySetInnerHTML={{
    __html: `(function(){try{var t=localStorage.getItem('vh-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&d)){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
  }}
/>
      </head>
      <body className={`${dmSans.variable} ${playfair.variable}`}>
        {children}
      </body>
    </html>
  );
}