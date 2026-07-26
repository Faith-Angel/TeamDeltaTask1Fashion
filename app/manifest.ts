import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ndolostitch',
    short_name: 'ndolostitch',
    description: "Cameroon's fashion platform",
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF5',
    theme_color: '#558B2F',
    orientation: 'portrait',
    categories: ['fashion', 'shopping', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
