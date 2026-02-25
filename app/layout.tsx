// app/layout.tsx
import './globals.css';
import { Metadata, Viewport } from 'next';  

export const metadata: Metadata = {
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
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className='bg-slate-50'>
      <head>
        {/* TRAMPA NATIVA PARA PWA: Atrapa el evento antes de que React despierte */}
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
      <body className="bg-slate-50 text-slate-900 antialiased touch-manipulation min-h-[100dvh] w-full flex flex-col m-0 p-0">
        <main className="w-full flex-grow min-h-[100dvh] flex flex-col overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}