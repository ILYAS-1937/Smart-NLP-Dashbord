import { useState, useEffect } from 'react';
import { Activity, Server, Cpu, Layers, CheckCircle2, RefreshCw, ShieldCheck, Terminal } from 'lucide-react';

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
      console.error("Erreur métriques Admin", err);
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
      console.error("Erreur lors du switch modèle", err);
    }
  };

  const modelOptions = [
    {
      id: 'DistilBERT / BART / BERT-NER',
      name: 'Standard Production Engine (DistilBERT + BART + BERT)',
      desc: 'Optimisé pour le temps réel et une empreinte mémoire CPU minimale.',
      badge: 'Actif en Démo',
    },
    {
      id: 'RoBERTa / CamemBERT / BART-Fr',
      name: 'French Specialized Engine (CamemBERT + RoBERTa)',
      desc: 'Précision maximale pour les corpus de texte en langue française.',
      badge: 'Haute Précision',
    },
    {
      id: 'LLaMA-3-8B-Instruct',
      name: 'Generative LLM Engine (LLaMA-3 Quantifié)',
      desc: 'Nécessite une accélération GPU CUDA pour le traitement dynamique.',
      badge: 'Pro / GPU',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Banner WAAW */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/20">
            <Server size={14} className="text-indigo-400" />
            <span>Supervision du Système de Production</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Administration & Moteur IA</h1>
          <p className="text-xs text-indigo-200/80 leading-relaxed">
            Consultez les indicateurs clés de performance du serveur FastAPI et gérez la permutation dynamique des modèles Transformer.
          </p>
        </div>
      </div>

      {/* Grid des KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>État Serveur API</span>
            <Server size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <span>{metrics?.server_status || 'Healthy'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Appels API Totaux</span>
            <Activity size={16} className="text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {metrics?.total_requests || 0} <span className="text-xs text-slate-400">requêtes</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Latence Inférence</span>
            <Cpu size={16} className="text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {metrics?.avg_latency_ms || 0} <span className="text-xs text-slate-400">ms</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Charge Mémoire VRAM</span>
            <Layers size={16} className="text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {metrics?.memory_usage_mb || 485} <span className="text-xs text-slate-400">Mo</span>
          </div>
        </div>
      </div>

      {/* Sélecteur de Modèle Néo-Design */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Sélecteur de Moteur NLP en Production
            </h2>
          </div>
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Actualiser Métriques</span>
          </button>
        </div>

        <div className="space-y-3">
          {modelOptions.map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <div
                key={model.id}
                onClick={() => handleModelSwitch(model.id)}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/40 shadow-sm'
                    : 'border-slate-200/80 bg-slate-50/40 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40'
                }`}
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-white text-sm">
                      {model.name}
                    </span>
                    <span className="rounded-md bg-indigo-100 dark:bg-indigo-900/80 px-2 py-0.5 text-[10px] font-black text-indigo-700 dark:text-indigo-300">
                      {model.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {model.desc}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="text-indigo-600 dark:text-indigo-400" size={22} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Live Log */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl text-slate-300">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-3">
          <Terminal size={16} className="text-emerald-400" />
          <span className="text-xs font-mono font-bold text-slate-400">FastAPI Live System Log</span>
        </div>
        <div className="font-mono text-xs space-y-1.5 text-slate-400">
          <p><span className="text-emerald-400">[INFO]</span> Uvicorn server running on http://127.0.0.1:8000</p>
          <p><span className="text-indigo-400">[NLP Engine]</span> Pipelines ready: DistilBERT SST-2 • BART CNN • BERT-NER</p>
          <p><span className="text-emerald-400">[CORS]</span> Allowed origin: http://localhost:5173</p>
        </div>
      </div>
    </div>
  );
}