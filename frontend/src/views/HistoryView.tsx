import { useState } from 'react';
import { Search, SlidersHorizontal, Calendar, Eye, Trash2, Download, ArrowUpDown } from 'lucide-react';

interface HistoryItem {
  id: string;
  date: string;
  type: 'Texte Brut' | 'Fichier';
  source: string;
  sentiment: 'Positif' | 'Neutre' | 'Négatif';
  score: number;
}

export default function HistoryView() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Données fictives représentatives de l'historique LocalStorage
  const [history] = useState<HistoryItem[]>([
    { id: '1', date: '19/07/2026 14:22', type: 'Texte Brut', source: 'Avis client sur le nouveau parcours d\'achat...', sentiment: 'Positif', score: 88 },
    { id: '2', date: '19/07/2026 11:05', type: 'Fichier', source: 'retours_clients_juillet.csv', sentiment: 'Neutre', score: 52 },
    { id: '3', date: '18/07/2026 16:45', type: 'Texte Brut', source: 'Rapport d\'incident technique - Service Logistique...', sentiment: 'Négatif', score: 24 },
  ]);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-5 dark:border-slate-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Historique des Analyses
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Consultez, filtrez et exportez localement les résultats de vos traitements NLP précédents.
        </p>
      </div>

      {/* Barre d'outils : Recherche et Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une analyse ou un fichier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-indigo-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <SlidersHorizontal size={16} />
            <span>Filtres</span>
          </button>
        </div>
      </div>

      {/* Tableau des données */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-400">
                <th className="px-6 py-4 flex items-center gap-1 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">Date <ArrowUpDown size={12} /></th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Source / Extrait</th>
                <th className="px-6 py-4">Sentiment Dominant</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 dark:divide-slate-800/60 dark:text-slate-300">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  {/* Date */}
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{item.date}</span>
                    </div>
                  </td>
                  {/* Type */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      item.type === 'Fichier' 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' 
                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  {/* Source */}
                  <td className="px-6 py-4 max-w-xs truncate font-medium text-slate-900 dark:text-white">
                    {item.source}
                  </td>
                  {/* Sentiment */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.sentiment === 'Positif' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      item.sentiment === 'Négatif' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                      'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        item.sentiment === 'Positif' ? 'bg-emerald-500' :
                        item.sentiment === 'Négatif' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      {item.sentiment} ({item.score}%)
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors" title="Visualiser le rapport">
                        <Eye size={16} />
                      </button>
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors" title="Exporter en PDF/CSV">
                        <Download size={16} />
                      </button>
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition-colors" title="Supprimer de l'historique">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}