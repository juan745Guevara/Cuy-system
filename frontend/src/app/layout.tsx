import './globals.css';
import Providers from './providers';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Fraunces, Source_Sans_3 } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Sistema de Control de Animales — UNAS',
  description: 'Facultad de Zootecnia — control de crianza multigranja',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${sourceSans.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
