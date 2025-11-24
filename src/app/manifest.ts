import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Poupp Finanças',
    short_name: 'Poupp',
    description: 'Gestão financeira inteligente para famílias.',
    start_url: '/dashboard',
    display: 'standalone', // Remove a barra de navegação do browser
    background_color: '#09090b',
    theme_color: '#09090b',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      // Idealmente você deve adicionar icon-192.png e icon-512.png na pasta public
    ],
  };
}