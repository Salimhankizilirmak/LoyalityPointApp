import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Okut Kazan',
    short_name: 'Okut Kazan',
    description: 'Yeni nesil müşteri sadakat ve puan platformu.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a', // neutral-950
    theme_color: '#10b981', // emerald-500
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
    ],
  }
}
