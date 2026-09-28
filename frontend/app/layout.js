import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Sistema de Control de Animales — UNAS',
  description: 'Facultad de Zootecnia — control de crianza multigranja',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
