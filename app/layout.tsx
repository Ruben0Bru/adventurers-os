// app/layout.tsx (Si usas App Router)
import Navbar from '@/components/NavBar';
import './globals.css'; // Asegúrate de que Tailwind esté importado aquí

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* Prevenimos el zoom en doble tap (touch-action) para evitar 
        comportamientos erráticos al presionar botones rápidamente.
      */}
      <body className="bg-slate-50 text-slate-900 antialiased touch-manipulation min-h-screen">
        <Navbar />
        {/* El contenedor principal restringe el ancho máximo en tablets/desktop 
          para no perder la ergonomía móvil (max-w-md mx-auto).
        */}
        <main className="pt-20 pb-6 px-4 max-w-md mx-auto h-full min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}