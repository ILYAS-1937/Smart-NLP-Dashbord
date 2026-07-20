import { useAppStore } from '../store/useAppStore';
import { Send, Sparkles, Clock, CheckCircle2, AlertCircle, FileText, Tag, Loader2 } from 'lucide-react';

export default function MainDashboard() {
  const { currentText, setCurrentText, analyzeText, isAnalyzing, analysisResult } = useAppStore();

  const handleAnalyze = () => {
    if (currentText.trim()) {
      analyzeText(currentText);
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-5 dark:border-slate-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analyse Textuelle en Temps Réel
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Soumettez vos textes bruts pour calculer le score de sentiment, générer un résumé automatique et extraire les entités nommées.
        </p>
      </div>

      {/* Zone de saisie du texte */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
            Texte à analyser :
          </label>
          <span className="text-xs text-slate-400">
            {currentText.length} caractères
          </span>
        </div>

        <textarea
          rows={4}
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="Ex: This NLP engine works remarkably well. Ilyas Tarzi is testing the system performance today in Casablanca..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !currentText.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Traitement NLP en cours...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Lancer l'Analyse</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Zone des résultats dynamique */}
      {analysisResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Grille des KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sentiment */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Sentiment Dominant</span>
                <Sparkles size={16} className="text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${
                  analysisResult.sentiment.label === 'Positif' ? 'text-emerald-600 dark:text-emerald-400' :
                  analysisResult.sentiment.label === 'Négatif' ? 'text-rose-600 dark:text-rose-400' :
                  'text-amber-600 dark:text-amber-400'
                }`}>
                  {analysisResult.sentiment.label}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  ({analysisResult.sentiment.score}%)
                </span>
              </div>
            </div>

            {/* Entités Détectées */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Entités Identifiées (NER)</span>
                <Tag size={16} className="text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {analysisResult.entities.length} <span className="text-sm font-normal text-slate-400">entité(s)</span>
              </div>
            </div>

            {/* Temps d'exécution */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Temps de Réponse Backend</span>
                <Clock size={16} className="text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {analysisResult.execution_time_ms} <span className="text-sm font-normal text-slate-400">ms</span>
              </div>
            </div>
          </div>

          {/* Cartes de détails (Résumé & Entités) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carte Résumé */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Résumé Automatique (BART)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {analysisResult.summary}
              </p>
            </div>

            {/* Carte Entités Nommées */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-indigo-500" />
                Entités Nommées Extraites (BERT-NER)
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.entities.length === 0 ? (
                  <p className="text-xs text-slate-400">Aucune entité détectée dans le texte.</p>
                ) : (
                  analysisResult.entities.map((entity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40"
                    >
                      <span>{entity.word}</span>
                      <span className="rounded bg-indigo-200 dark:bg-indigo-800 px-1 py-0.2 text-[10px] uppercase font-bold text-indigo-800 dark:text-indigo-100">
                        {entity.entity_group}
                      </span>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}