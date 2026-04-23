import { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6" style={{ backgroundColor: "#f8fafc" }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-200 pb-4 gap-4">
        <div>
          <Link to="/">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>
              </div>
              Kalkulator Pakan Ayam KUB
            </h1>
          </Link>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mt-1 md:mt-0">Balitbangtan • Formulasi Non-Pabrikan</p>
        </div>
        <div className="flex gap-3">
          <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm">Versi MVP 1.0</span>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Stateless Mode</span>
        </div>
      </header>
      
      <main className="min-h-[calc(100vh-200px)]">
        {children}
      </main>

      <footer className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-slate-400 text-[11px] font-medium gap-4">
        <p>© 2024 Balai Penelitian Ternak - Badan Litbang Pertanian</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-600 transition-colors">Panduan Juknis</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Standar Nutrisi</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Tentang KUB</a>
        </div>
      </footer>
    </div>
  );
}
