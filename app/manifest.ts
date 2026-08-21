import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Marcel Spahr · Digitale Unternehmenssysteme',
    short_name: 'Marcel Spahr',
    description: 'Website, Prozesse, Daten und KI als ein verbundenes Unternehmenssystem – begleitet von AILA.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    background_color: '#070807',
    theme_color: '#070807',
    lang: 'de-CH',
    orientation: 'any',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Mit AILA sprechen',
        short_name: 'AILA',
        description: 'Ein Anliegen direkt mit AILA einordnen.',
        url: '/?aila=1#journey-contact',
        icons: [{ src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Projekt starten',
        short_name: 'Projektstart',
        description: 'Eine Anfrage an Marcel Spahr vorbereiten.',
        url: '/#journey-contact',
        icons: [{ src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
