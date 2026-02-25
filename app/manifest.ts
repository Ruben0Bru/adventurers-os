// app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aventureros OS',
    short_name: 'Avent OS',
    description: 'Motor de Ejecución Offline para Consejeros',
    start_url: '/',
    display: 'standalone', // Arquitectura vital: Elimina la barra de búsqueda de Chrome/Safari. La app se verá nativa.
    background_color: '#0f172a', // bg-slate-900: Pantalla de carga mientras levanta el motor
    theme_color: '#f59e0b', // text-amber-500: Color de la barra de estado de Android
    orientation: 'portrait', // Bloqueamos la vista en vertical, un consejero no da la clase con el celular de lado
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}