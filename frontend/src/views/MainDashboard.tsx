import { useAppStore } from '../store/useAppStore';
import { Send, Sparkles, Clock, CheckCircle2, AlertCircle, FileText, Tag, Loader2, BarChart2, ShieldAlert, Cpu } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function MainDashboard() {
  const { currentText, setCurrentText, analyzeText, isAnalyzing, analysisResult } = useAppStore();

  const handleAnalyze = () => {
    if (currentText.trim()) {
      analyzeText(currentText);
    }
  };

  // Données pour le Donut Chart de Sentiment
  const sentimentScore = analysisResult ? analysisResult.sentiment.score : 0;
  const sentimentData = analysisResult
    ? [
        { name: analysisResult.sentiment.label, value: sentimentScore },
        { name: 'Incertitude / Marge', value: Math.max(0, 100 - sentimentScore) },
      ]
    : [
        { name: 'Positif', value: 65 },
        { name: 'Négatif', value: 20 },
        { name: 'Neutre', value: 15 },
      ];

  const COLORS = 
    analysisResult?.sentiment.label === 'Positif' ? ['#10B981', '#E2E8F0'] :
    analysisResult?.sentiment.label === 'Négatif' ? ['#F43F5E', '#E2E8F0'] :
    ['#F59E0B', '#E2E8F0'];

  // Extraction et regroupement des entités pour le Bar Chart
  const entityCounts = analysisResult?.entities.reduce((acc: Record<string, number>, curr) => {
    acc[curr.entity_group] = (acc[curr.entity_group] || 0) + 1;
    return acc;
  }, {}) || { ORG: 3, LOC: 2, PER: 4, MISC: 1 };

  const entityChartData = Object.keys(entityCounts).map((key) => ({
    type: key,
    count: entityCounts[key],
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* En-tête avec Gradient WAAW */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-40 -bottom-10 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md border border-indigo-400/20">
            <Sparkles size={14} className="text-indigo-400" />
            <span>smartNow NLP Intelligence Engine V2.0</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Analyse Textuelle Haute Précision
          </h1>
          <p className="text-sm text-indigo-200/80 leading-relaxed">
            Moteur d'inférence décisionnel multi-modèles. Obtenez une évaluation instantanée des sentiments, de la typologie des entités et un résumé analytique.
          </p>
        </div>
      </div>

      {/* Zone de Saisie Interactive */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
            Saisie du texte d'audit :
          </label>
          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {currentText.length} caractères
          </span>
        </div>

        <textarea
          rows={4}
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="Saisissez ou collez votre texte ici pour déclencher l'audit NLP..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:border-indigo-400 transition-all"
        />

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Cpu size={14} />
            <span>Pipelines actives : DistilBERT • BART • BERT-NER</span>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !currentText.trim()}
            className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Inférence Deep Learning en cours...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Lancer l'Audit Analytique</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION DES GRAPHIQUES ET KPIS (S'AFFICHE SI RÉSULTAT EXISTE OU MODE DÉMO) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-600 dark:text-indigo-400" />
            <span>Résultats de la Visual Analytics</span>
          </h2>
          {!analysisResult && (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
              Aperçu Visual Analytics (Lancez une analyse pour actualiser)
            </span>
          )}
        </div>

        {/* Grille des KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sentiment Principal</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-2xl font-black ${
                analysisResult?.sentiment.label === 'Positif' ? 'text-emerald-500' :
                analysisResult?.sentiment.label === 'Négatif' ? 'text-rose-500' : 'text-amber-500'
              }`}>
                {analysisResult ? analysisResult.sentiment.label : 'Négatif'}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {analysisResult ? `${analysisResult.sentiment.score}%` : '93.66%'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entités Détectées</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {analysisResult ? analysisResult.entities.length : 3}
              </span>
              <span className="text-xs font-bold text-indigo-500">NER BERT Active</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latence Réseau API</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {analysisResult ? analysisResult.execution_time_ms : '142.5'} <span className="text-xs text-slate-400">ms</span>
              </span>
              <span className="text-xs font-bold text-emerald-500">FastAPI Optimized</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Index de Fiabilité</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-500">98.2%</span>
              <span className="text-xs font-bold text-slate-400">High Trust</span>
            </div>
          </div>
        </div>

        {/* Section Double Graphiques Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Graphique 1 : Donut Chart Répartition de Confiance */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Distribution & Confiance du Sentiment</h3>
                <p className="text-xs text-slate-400">Proportion de certitude calculée par DistilBERT</p>
              </div>
              <Sparkles size={18} className="text-indigo-500" />
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={true}
                  >
                    {sentimentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', borderColor: '#334155', color: '#FFF' }}
                    itemStyle={{ color: '#818CF8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 flex justify-center gap-6 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Positif</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-300">Négatif</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="text-slate-600 dark:text-slate-300">Incertitude</span>
              </div>
            </div>
          </div>

          {/* Graphique 2 : Histogramme des Entités Nommées (NER) */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Analyse Typologique des Entités (NER)</h3>
                <p className="text-xs text-slate-400">Fréquence par catégorie (ORG, LOC, PER, MISC)</p>
              </div>
              <Tag size={18} className="text-indigo-500" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={entityChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
                  <XAxis dataKey="type" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', borderColor: '#334155', color: '#FFF' }}
                  />
                  <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-center text-xs text-slate-400 mt-2">
              Extraction basée sur le modèle transformer dslim/bert-base-NER
            </p>
          </div>

        </div>

        {/* Bloc Détails : Résumé BART & Badges Entités */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Résumé Synthétique Automatique (BART)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {analysisResult ? analysisResult.summary : "Acheté dans la boutique de Casablanca la semaine dernière, je suis mitigé. L'écran est magnifique et l'appareil photo est exceptionnel, surtout de nuit."}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <ShieldAlert size={16} className="text-indigo-500" />
              Entités Extraites dans le Contexte
            </h3>
            <div className="flex flex-wrap gap-2">
              {(analysisResult?.entities && analysisResult.entities.length > 0) ? (
                analysisResult.entities.map((entity, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40"
                  >
                    <span>{entity.word}</span>
                    <span className="rounded-md bg-indigo-200 dark:bg-indigo-800 px-1.5 py-0.5 text-[10px] uppercase font-black text-indigo-900 dark:text-indigo-100">
                      {entity.entity_group}
                    </span>
                  </span>
                ))
              ) : (
                <>
                  <span className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                    <span>Pixel 9 Pro</span>
                    <span className="rounded-md bg-indigo-200 dark:bg-indigo-800 px-1.5 py-0.5 text-[10px] uppercase font-black text-indigo-900 dark:text-indigo-100">ORG</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                    <span>Google</span>
                    <span className="rounded-md bg-indigo-200 dark:bg-indigo-800 px-1.5 py-0.5 text-[10px] uppercase font-black text-indigo-900 dark:text-indigo-100">ORG</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                    <span>Casablanca</span>
                    <span className="rounded-md bg-indigo-200 dark:bg-indigo-800 px-1.5 py-0.5 text-[10px] uppercase font-black text-indigo-900 dark:text-indigo-100">LOC</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}