// components/NavBar.tsx

export default function Navbar({ nombreClase, isOnline }: { nombreClase: string, isOnline: boolean }) {
  return (
    <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center shadow-lg rounded-b-[2rem] z-50 relative">
      <div>
        <h1 className="text-xl font-black tracking-tight">{nombreClase || 'Aventureros OS'}</h1>
        <p className="text-xs text-slate-400 font-medium">Dashboard de Ejecución</p>
      </div>
      
      {/* Indicador Dinámico controlado por la Única Fuente de Verdad (Orquestador) */}
      <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-2 transition-colors duration-300 ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
        {isOnline ? 'Conectado' : 'Modo Offline'}
      </div>
    </div>
  );
}