import { useState } from 'react';
import { BarChart3, MessageSquare, Zap, Play, HelpCircle } from 'lucide-react';

export default function MainDashboard() {
  const [text, setText] = useState('');
  const maxLength = 5000;

  // KPIs factices pour le design initial (SaaS style)
  const kpis = [
    { id: 1, label: 'Total Analyses', value: '1,248', detail: '+12% ce mois', icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400' },
    { id: 2, label: 'Sentiment Global', value: '78% Positif', detail: 'Tendance stable', icon: BarChart3, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { id: 3, label: 'Vitesse de l\'IA', value: '142 ms', detail: 'Modèle optimisé', icon: Zap, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-5 dark:border-slate-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analyseur de Texte Intelligent
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Soumettez vos textes en temps réel pour obtenir une analyse de sentiment complète et un résumé automatique.
        </p>
      </div>

      {/* Rangée des KPIs (Cartes de Métriques) */}
      <div className="grid gap-5 sm:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</span>
                <div className={`rounded-xl p-2.5 ${kpi.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{kpi.value}</h3>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{kpi.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Principale : Zone de Saisie de Texte */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Saisie de texte brut</h3>
            <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help transition-colors">
              <HelpCircle size={14} />
            </div>
          </div>
          <span className={`text-xs font-medium ${text.length > maxLength * 0.9 ? 'text-rose-500' : 'text-slate-400'}`}>
            {text.length} / {maxLength} caractères
          </span>
        </div>
        
        <div className="p-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Collez ou saisissez votre texte textuel volumineux ici (avis clients, rapports, commentaires...)"
            maxLength={maxLength}
            className="h-64 w-full resize-none border-0 bg-transparent p-0 text-slate-700 placeholder-slate-400 focus:ring-0 dark:text-slate-300 dark:placeholder-slate-500 text-sm leading-relaxed"
          />
          
          <div className="mt-4 flex justify-end border-t border-slate-50 pt-4 dark:border-slate-800/40">
            <button
              disabled={text.trim().length === 0}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 ${
                text.trim().length === 0
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/10 active:scale-[0.98]'
              }`}
            >
              <Play size={16} fill="currentColor" />
              <span>Lancer l'Analyse Intelligente</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}