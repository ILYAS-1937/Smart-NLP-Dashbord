import { useState, useEffect } from 'react';
import { Activity, Server, Cpu, Layers, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';

interface AdminMetrics {
  server_status: string;
  total_requests: number;
  avg_latency_ms: number;
  active_model: string;
  memory_usage_mb: number;
}

export default function AdminConfig() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedModel, setSelectedModel] = useState<string>('DistilBERT / BART / BERT-NER');

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin/metrics');
      if (res.ok) {
        const data: AdminMetrics = await res.json();
        setMetrics(data);
        setSelectedModel(data.active_model);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des métriques Admin", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleModelSwitch = async (modelName: string) => {
    setSelectedModel(modelName);
    try {
      await fetch(`http://127.0.0.1:8000/api/admin/switch-model?model_name=${encodeURIComponent(modelName)}`, {
        method: 'POST'
      });
      fetchMetrics();
    } catch (err) {
      console.error("Erreur lors du changement de modèle", err);
    }
  };

  const modelOptions = [
    {
      id: 'DistilBERT / BART / BERT-NER',
      name: 'Standard Lightweight (DistilBERT + BART + BERT)',
      desc: 'Optimisé pour la rapidité et une consommation mémoire faible sur CPU.',
      badge: 'Recommandé',
    },
    {
      id: 'RoBERTa / CamemBERT / BART-Fr',
      name: 'Multilingue & Français (RoBERTa + CamemBERT)',
      desc: 'Précision maximale pour les textes rédigés en langue française.',
      badge: 'Haute Précision',
    },
    {
      id: 'LLaMA-3-8B-Instruct',
      name: 'Grand Modèle Génératif (LLaMA-3 / Quantifié)',
      desc: 'Nécessite une accélération GPU dédiée pour le traitement temps réel.',
      badge: 'Expérimental',
    },
  ];

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Configuration & Administration Système
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Supervisez les performances de l'API FastAPI et choisissez le modèle NLP actif.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Grille des KPIs Système */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>État de l'API</span>
            <Server size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{metrics?.server_status || 'En ligne'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Requêtes Traitées</span>
            <Activity size={16} className="text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {metrics?.total_requests || 0} <span className="text-xs font-normal text-slate-400">appels</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Latence Moyenne</span>
            <Cpu size={16} className="text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {metrics?.avg_latency_ms || 0} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Empreinte RAM</span>
            <Layers size={16} className="text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {metrics?.memory_usage_mb || 485} <span className="text-xs font-normal text-slate-400">Mo</span>
          </div>
        </div>
      </div>

      {/* Choix du Modèle NLP Actif */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={20} />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Moteur NLP Actif en Production
          </h2>
        </div>

        <div className="space-y-3">
          {modelOptions.map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <div
                key={model.id}
                onClick={() => handleModelSwitch(model.id)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30'
                    : 'border-slate-200 bg-slate-50/30 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-white text-sm">
                      {model.name}
                    </span>
                    <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {model.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {model.desc}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="text-indigo-600 dark:text-indigo-400" size={20} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}