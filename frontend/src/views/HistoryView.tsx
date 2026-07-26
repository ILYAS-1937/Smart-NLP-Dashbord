import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { 
  Search, Filter, Calendar, Sparkles, Clock, ShieldCheck, 
  FileDown, RefreshCw, BarChart3, SlidersHorizontal, ArrowUpDown, MessageSquare 
} from 'lucide-react';

interface HistoryItem {
  id: number;
  text_content: string;
  sentiment: string;
  confidence_score: number;
  summary?: string;
  created_at: string;
}

export default function HistoryView() {
  const { token, isAuthenticated, openAuthModal } = useAuthStore();
  const { setCurrentText, analyzeText } = useAppStore();

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // État des Filtres Multi-Critères (Pilier 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Fonction de récupération avec filtrage backend
  const fetchFilteredHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (selectedSentiment !== 'ALL') params.append('sentiment', selectedSentiment);
      if (minConfidence > 0) params.append('min_confidence', (minConfidence / 100).toString());
      if (searchQuery.trim()) params.append('search_query', searchQuery.trim());

      const res = await fetch(`http://localhost:8000/api/history/filter?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erreur de chargement de l'historique.");

      const data = await res.json();
      setHistoryItems(data);
    } catch (err) {
      console.error("Erreur Filtrage B.I. :", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated, selectedSentiment, minConfidence, searchQuery]);

  useEffect(() => {
    fetchFilteredHistory();
  }, [fetchFilteredHistory]);

  // Tri local par date
  const sortedHistory = [...historyItems].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Exportation PDF directe depuis l'historique
  const handleExportPDF = async (item: HistoryItem) => {
    setDownloadingId(item.id);
    try {
      const res = await fetch('http://localhost:8000/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: item.text_content,
          sentiment: item.sentiment,
          confidence: item.confidence_score,
          summary: item.summary || item.text_content,
          entities: [],
          execution_time_ms: 15.0,
        }),
      });

      if (!res.ok) throw new Error("Échec du téléchargement.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `InnovNow_Audit_Historique_${item.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Impossible de générer le rapport PDF pour cet audit.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Recharger le texte dans le Dashboard principal pour ré-analyse
  const handleReloadToDashboard = (text: string) => {
    setCurrentText(text);
    analyzeText(text);
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <ShieldCheck size={48} className="mx-auto text-indigo-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authentification Requise</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          Veuillez vous connecter pour accéder à l'historique d'audit B.I. et utiliser les filtres de recherche multi-critères.
        </p>
        <button
          onClick={openAuthModal}
          className="mt-6 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          Se Connecter à InnovNow
        </button>
      </div>
    );
  }

  // Calculs B.I. sur les éléments affichés
  const totalAudits = sortedHistory.length;
  const avgConfidence = totalAudits > 0 
    ? Math.round((sortedHistory.reduce((acc, curr) => acc + curr.confidence_score, 0) / totalAudits) * 100) 
    : 0;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Banner de Titre B.I. */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md border border-indigo-400/20 mb-3">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Business Intelligence Engine</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Historique des Audits & Exploration
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Filtrez, explorez et ré-exportez vos analyses textuelles enregistrées en base de données.
            </p>
          </div>

          {/* KPIs Synthétiques B.I. */}
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md px-5 py-3 border border-white/10 text-center">
              <span className="block text-2xl font-black text-white">{totalAudits}</span>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Audits Filtrés</span>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md px-5 py-3 border border-white/10 text-center">
              <span className="block text-2xl font-black text-emerald-400">{avgConfidence}%</span>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Confiance Moyenne</span>
            </div>
          </div>
        </div>
      </div>

      {/* PANNEAU DE FILTRAGE MULTI-CRITÈRES (PILIER 3) */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>Filtres de Recherche Multi-Critères</span>
          </h3>

          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSentiment('ALL');
              setMinConfidence(0);
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Réinitialiser les filtres</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* 1. Moteur de Recherche Textuel */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Mots-Clés dans le Corpus
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: Paris, Novatech..."
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* 2. Filtre Sentiment */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Sentiment Dominant
            </label>
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="ALL">Tous les Sentiments</option>
              <option value="POSITIVE">Positif uniquement</option>
              <option value="NEGATIVE">Négatif uniquement</option>
              <option value="NEUTRAL">Neutre uniquement</option>
            </select>
          </div>

          {/* 3. Slider Score de Confiance Minimal */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Confiance Min.
              </label>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{minConfidence}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
            />
          </div>

          {/* 4. Ordre Chronologique */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Tri Chronologique
            </label>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <span>{sortOrder === 'desc' ? 'Plus récents en premier' : 'Plus anciens en premier'}</span>
              <ArrowUpDown size={14} className="text-indigo-500" />
            </button>
          </div>

        </div>
      </div>

      {/* GRILLE DES RÉSULTATS D'HISTORIQUE */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
          <p className="text-xs font-medium">Filtrage des données en cours...</p>
        </div>
      ) : sortedHistory.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {sortedHistory.map((item) => {
            const isPos = item.sentiment === 'POSITIVE';
            const isNeg = item.sentiment === 'NEGATIVE';
            const badgeBg = isPos ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            isNeg ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300' :
                            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300';

            const formattedDate = new Date(item.created_at).toLocaleDateString('fr-FR', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return (
              <div 
                key={item.id}
                className="group relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${badgeBg}`}>
                      {item.sentiment} ({Math.round(item.confidence_score * 100)}%)
                    </span>

                    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock size={13} />
                      <span>{formattedDate}</span>
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed line-clamp-2">
                    "{item.summary || item.text_content}"
                  </p>
                </div>

                {/* Actions sur la carte */}
                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleReloadToDashboard(item.text_content)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                    title="Charger dans le Dashboard principal"
                  >
                    <MessageSquare size={14} />
                    <span>Ré-analyser</span>
                  </button>

                  <button
                    onClick={() => handleExportPDF(item)}
                    disabled={downloadingId === item.id}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {downloadingId === item.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <FileDown size={14} />
                    )}
                    <span>PDF Exécutif</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <BarChart3 size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Aucun résultat trouvé</h3>
          <p className="text-xs text-slate-400 mt-1">Essayez d'assouplir vos critères de recherche ou d'effacer les filtres.</p>
        </div>
      )}

    </div>
  );
}