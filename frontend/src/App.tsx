import { Sparkles } from 'lucide-react'

if (document == null) {
  // Safe layout verification
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center text-white">
      <div className="mb-6 rounded-full bg-indigo-500/10 p-4 text-indigo-400 animate-pulse">
        <Sparkles size={48} />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
        Smart NLP Dashboard
      </h1>
      <p className="mt-3 text-lg text-slate-400 max-w-md">
        Environnement Frontend <span className="text-indigo-400 font-semibold">Vite + React + Tailwind</span> initialisé avec succès pour innovNow Consulting.
      </p>
      <div className="mt-8 flex gap-4">
        <span className="rounded-md bg-slate-800 px-4 py-2 text-xs font-mono text-slate-300 border border-slate-700">
          Branch: feature/ui-ux-design
        </span>
        <span className="rounded-md bg-indigo-600/20 px-4 py-2 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
          Port: 3000
        </span>
      </div>
    </div>
  )
}