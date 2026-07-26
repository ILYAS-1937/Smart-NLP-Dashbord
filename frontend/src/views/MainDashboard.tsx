import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { WordCloud } from '../components/WordCloud';
import { 
  Send, Sparkles, FileText, Tag, Loader2, BarChart2, 
  ShieldAlert, Cpu, CheckCircle2, FileDown, FileSpreadsheet, Globe 
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function MainDashboard() {
  const { currentText, setCurrentText, analyzeText, isAnalyzing, analysisResult } = useAppStore();
  const { isAuthenticated, openAuthModal, token } = useAuthStore();
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'csv' | null>(null);

  const handleAnalyze = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (currentText.trim()) {
      analyzeText(currentText);
    }
  };

  // 1. Normalisation du Sentiment
  const rawSentiment = typeof analysisResult?.sentiment === 'string' 
    ? analysisResult.sentiment 
    : (analysisResult?.sentiment as any)?.label || 'NEUTRAL';

  const sentimentLabel = 
    rawSentiment === 'POSITIVE' || rawSentiment === 'Positif' ? 'Positif' :
    rawSentiment === 'NEGATIVE' || rawSentiment === 'Négatif' ? 'Négatif' : 'Neutre';

  const rawConfidence = analysisResult?.confidence !== undefined
    ? (analysisResult.confidence <= 1 ? Math.round(analysisResult.confidence * 100) : Math.round(analysisResult.confidence))
    : 75;

  const sentimentData = [
    { name: sentimentLabel, value: rawConfidence },
    { name: 'Marge / Incertitude', value: Math.max(0, 100 - rawConfidence) },
  ];

  const PRIMARY_COLOR = 
    sentimentLabel === 'Positif' ? '#10B981' :
    sentimentLabel === 'Négatif' ? '#F43F5E' : '#F59E0B';

  const COLORS = [PRIMARY_COLOR, '#334155'];

  // 2. Normalisation NER
  const normalizedEntities = (analysisResult?.entities || []).map((e: any) => ({
    word: e.text || e.word || '',
    group: e.type || e.entity_group || 'MISC'
  }));

  const entityCounts = normalizedEntities.reduce((acc: Record<string, number>, curr) => {
    if (curr.group) {
      acc[curr.group] = (acc[curr.group] || 0) + 1;
    }
    return acc;
  }, {});

  const entityChartData = Object.keys(entityCounts).map((key) => ({
    type: key,
    count: entityCounts[key],
  }));

  // 3. Détection Multilingue & WordCloud (Pilier 3)
  const detectedLanguage = (analysisResult as any)?.language || 'FR';
  const wordCloudData = (analysisResult as any)?.word_cloud || [];

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'EN': return 'Anglais (EN)';
      case 'AR': return 'Arabe (AR)';
      case 'ES': return 'Espagnol (ES)';
      default: return 'Français (FR)';
    }
  };

  // Action d'Exportation PDF/CSV
  const handleExport = async (format: 'pdf' | 'csv') => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!analysisResult) return;

    setDownloadingFormat(format);

    try {
      const endpoint = format === 'pdf' ? '/api/export/pdf' : '/api/export/csv';
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: currentText,
          sentiment: rawSentiment,
          confidence: rawConfidence / 100,
          summary: analysisResult.summary || currentText,
          entities: normalizedEntities.map(e => ({ text: e.word, type: e.group })),
          execution_time_ms: analysisResult.execution_time_ms || 12.4,
        }),
      });

      if (!res.ok) throw new Error(`Échec de l'exportation ${format.toUpperCase()}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `InnovNow_Audit_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Erreur Export:", err);
      alert(`Impossible de générer le fichier ${format.toUpperCase()}.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-40 -bottom-10 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md border border-indigo-400/20">
            <Sparkles size={14} className="text-indigo-400" />
            <span>InnovNow NLP Intelligence Engine V3.0 (B.I. & Multilingue)</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Analyse Textuelle & Visual Analytics B.I.
          </h1>
          <p className="text-sm text-indigo-200/80 leading-relaxed">
            Inférence décisionnelle multi-modèles, détection automatique de la langue, nuage de mots-clés dynamique et cartographie d'entités.
          </p>
        </div>
      </div>

      {/* Zone de Saisie */}
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
          rows={5}
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="Saisissez ou collez votre texte ici pour déclencher l'audit NLP..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:border-indigo-400 transition-all"
        />

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Cpu size={14} />
            <span>Pipelines actives : DistilBERT • BART • BERT-NER • Multilingual Engine</span>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !currentText.trim()}
            className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all cursor-pointer"
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

      {/* Visual Analytics & DataViz B.I. */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-600 dark:text-indigo-400" />
            <span>Tableau de Bord Visual Analytics B.I.</span>
          </h2>

          {analysisResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={downloadingFormat !== null}
                className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {downloadingFormat === 'csv' ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                <span>Exporter CSV</span>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={downloadingFormat !== null}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {downloadingFormat === 'pdf' ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                <span>Rapport PDF Exécutif</span>
              </button>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sentiment Principal</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-2xl font-black ${
                sentimentLabel === 'Positif' ? 'text-emerald-500' :
                sentimentLabel === 'Négatif' ? 'text-rose-500' : 'text-amber-500'
              }`}>
                {sentimentLabel}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {rawConfidence}%
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Langue Détectée</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <Globe size={20} />
                <span>{detectedLanguage}</span>
              </span>
              <span className="text-xs font-bold text-slate-500">{getLanguageLabel(detectedLanguage)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entités Détectées</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {normalizedEntities.length}
              </span>
              <span className="text-xs font-bold text-indigo-500">NER BERT Active</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latence Réseau API</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {analysisResult?.execution_time_ms || 12.4} <span className="text-xs text-slate-400">ms</span>
              </span>
              <span className="text-xs font-bold text-emerald-500">FastAPI B.I.</span>
            </div>
          </div>
        </div>

        {/* WORDCLOUD INTERACTIF (PILIER 3) */}
        {wordCloudData.length > 0 && (
          <WordCloud 
            words={wordCloudData} 
            onWordClick={(word) => {
              console.log("Mot cliqué dans le WordCloud :", word);
            }}
          />
        )}

        {/* Double Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <div className={`h-3 w-3 rounded-full ${
                  sentimentLabel === 'Positif' ? 'bg-emerald-500' :
                  sentimentLabel === 'Négatif' ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                <span className="text-slate-600 dark:text-slate-300">{sentimentLabel} ({rawConfidence}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-600" />
                <span className="text-slate-600 dark:text-slate-300">Incertitude ({Math.max(0, 100 - rawConfidence)}%)</span>
              </div>
            </div>
          </div>

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
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} allowDecimals={false} />
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

        {/* Détails Résumé & Entités */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Résumé Synthétique Automatique (BART)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {analysisResult?.summary || "Aucun résumé disponible."}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <ShieldAlert size={16} className="text-indigo-500" />
              Entités Extraites dans le Contexte
            </h3>
            <div className="flex flex-wrap gap-2">
              {normalizedEntities.length > 0 ? (
                normalizedEntities.map((entity, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40"
                  >
                    <span>{entity.word}</span>
                    <span className="rounded-md bg-indigo-200 dark:bg-indigo-800 px-1.5 py-0.5 text-[10px] uppercase font-black text-indigo-900 dark:text-indigo-100">
                      {entity.group}
                    </span>
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">Aucune entité spécifique détectée.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}