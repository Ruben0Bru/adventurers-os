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
        <main className="pt-20 pb-6 px-4 max-w-md mx-auto h-full min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}