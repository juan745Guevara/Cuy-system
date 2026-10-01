import './globals.css';
import Providers from './providers';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sistema de Control de Animales — UNAS',
  description: 'Facultad de Zootecnia — control de crianza multigranja',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
