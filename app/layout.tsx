// app/layout.tsx
import './globals.css';
import { Metadata, Viewport } from 'next';  

export const metadata: Metadata = {
  // ... (tus metadatos iguales)
  title: "Aventureros OS",
  description: "Dashboard de ejecución offline para Guías Mayores",
  manifest: "/manifest.json", 
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aventureros OS",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc", // Cambiamos a slate-900 para que la barra de arriba coincida con tu Navbar
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  viewportFit: "cover", // LA DIRECTIVA MAESTRA: Expande el lienzo detrás de las barras nativas de Android/iOS
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Anclamos el html al 100% estricto
    <html lang="es" className="bg-slate-50 w-full h-full">
      <head>
        {/* TRAMPA NATIVA PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.deferredPWA = null;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.deferredPWA = e;
              });
            `,
          }}
        />
      </head>
      {/* overscroll-none evita el efecto rebote que a veces muestra fondo negro al scrollear */}
      <body className="bg-slate-50 text-slate-900 antialiased touch-manipulation min-h-[100dvh] w-full flex flex-col m-0 p-0 overscroll-none">
        <main className="flex-1 w-full flex flex-col overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}