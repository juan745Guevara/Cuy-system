import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/breedings', destination: '/empadres', permanent: true },
      { source: '/births', destination: '/partos', permanent: true },
      { source: '/weanings', destination: '/destetes', permanent: true },
      { source: '/mortality', destination: '/mortalidad', permanent: true },
      { source: '/weighings', destination: '/pesajes', permanent: true },
      { source: '/alerts', destination: '/alertas', permanent: true },
      { source: '/alertas-config', destination: '/alertas/plazos', permanent: true },
      { source: '/animals', destination: '/animales', permanent: true },
      { source: '/breeding-females', destination: '/reproductoras', permanent: true },
      { source: '/breeding-males', destination: '/reproductores', permanent: true },
      { source: '/movements', destination: '/movimientos', permanent: true },
      { source: '/cages', destination: '/jaulas', permanent: true },
      { source: '/inventory', destination: '/inventario', permanent: true },
      { source: '/sales', destination: '/ventas', permanent: true },
      { source: '/farms-panel', destination: '/granjas-panel', permanent: true },
      { source: '/users', destination: '/usuarios', permanent: true },
      { source: '/catalogs', destination: '/catalogos', permanent: true },
      { source: '/audit', destination: '/auditoria', permanent: true },
      { source: '/farms', destination: '/granjas', permanent: true },
    ];
  },
};

export default nextConfig;
