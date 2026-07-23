import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Search, History as HistoryIcon, Calendar, Eye, Trash2, Download, Sparkles } from 'lucide-react';

export default function HistoryView() {
  const [searchTerm, setSearchTerm] = useState('');
  const { history, deleteHistoryItem } = useAppStore();

  const filteredHistory = history.filter(
    (item) =>
      item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAnalyses = history.length;
  const positiveRatio = Math.round(
    (history.filter((h) => h.sentiment === 'Positif').length / (totalAnalyses || 1)) * 100
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Banner WAAW */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/20">
            <HistoryIcon size={14} className="text-indigo-400" />
            <span>Journal d'Audit Persistant</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Historique des Inférences</h1>
          <p className="text-xs text-indigo-200/80 leading-relaxed">
            Archivez et retrouvez à tout moment l'historique complet de vos analyses textuelles sauvegardées dans votre espace local.
          </p>
        </div>
      </div>

      {/* KPI Rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Analyses Enregistrées</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalAnalyses}</p>
          </div>
          <Sparkles className="text-indigo-500" size={24} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Taux de Positivité</p>
            <p className="text-2xl font-black text-emerald-500 mt-1">{positiveRatio}%</p>
          </div>
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Stockage Local</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">Zustand Sync</p>
          </div>
          <span className="text-xs font-bold text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md">
            Active
          </span>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher dans l'historique d'audit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-all shadow-sm"
        />
      </div>

      {/* Tableau Glassmorphism */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/50">
                <th className="px-6 py-4">Horodatage</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Source / Extrait</th>
                <th className="px-6 py-4">Sentiment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 dark:divide-slate-800 dark:text-slate-300">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                    Aucun enregistrement trouvé dans l'historique.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-500" />
                        <span>{item.date}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate font-bold text-slate-900 dark:text-white">
                      {item.source}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold ${
                        item.sentiment === 'Positif' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' :
                        item.sentiment === 'Négatif' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' :
                        'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}>
                        {item.sentiment} ({item.score}%)
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors">
                          <Eye size={15} />
                        </button>
                        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors">
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}