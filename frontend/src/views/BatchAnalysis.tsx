import { useState, ChangeEvent } from 'react';
import { UploadCloud, FileText, CheckCircle, Loader2, Download, AlertCircle, RefreshCw, Layers, Sparkles, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface BatchItem {
  source_text: string;
  sentiment: 'Positif' | 'Neutre' | 'Négatif';
  score: number;
  summary: string;
  entities_count: number;
}

interface BatchResponse {
  filename: string;
  total_processed: number;
  results: BatchItem[];
}

export default function BatchAnalysis() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [batchData, setBatchData] = useState<BatchResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleProcessBatch = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/analyze-batch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erreur lors du traitement du fichier.");
      }

      const data: BatchResponse = await response.json();
      setBatchData(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Impossible de joindre le serveur backend.");
    } finally {
      setIsUploading(false);
    }
  };

  const exportToCSV = () => {
    if (!batchData) return;
    const headers = "Texte,Sentiment,Score,Entites\n";
    const rows = batchData.results
      .map(r => `"${r.source_text.replace(/"/g, '""')}",${r.sentiment},${r.score}%,${r.entities_count}`)
      .join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_nlp_${batchData.filename}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calcul des données pour le Donut Chart du Fichier
  const positiveCount = batchData?.results.filter(r => r.sentiment === 'Positif').length || 0;
  const negativeCount = batchData?.results.filter(r => r.sentiment === 'Négatif').length || 0;
  const neutralCount = batchData?.results.filter(r => r.sentiment === 'Neutre').length || 0;

  const chartData = [
    { name: 'Positif', value: positiveCount || 1 },
    { name: 'Négatif', value: negativeCount || 1 },
    { name: 'Neutre', value: neutralCount || 0 },
  ];

  const CHART_COLORS = ['#10B981', '#F43F5E', '#F59E0B'];

  return (
    <div className="space-y-8 pb-12">
      {/* Banner WAAW */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/20">
            <Layers size={14} className="text-indigo-400" />
            <span>Traitement par Lot Haute Vélocité</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Analyse de Fichiers en Masse</h1>
          <p className="text-xs text-indigo-200/80 leading-relaxed">
            Téléversez vos fichiers CSV ou TXT. Le moteur extrait automatiquement les sentiments et entités sur l'ensemble de votre corpus de données.
          </p>
        </div>
      </div>

      {/* Zone de Drag & Drop */}
      <div className="group relative rounded-3xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/40 bg-white/60 dark:bg-slate-900/60 p-8 text-center backdrop-blur-xl transition-all hover:border-indigo-500 dark:hover:border-indigo-400">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 shadow-md">
          <UploadCloud size={32} />
        </div>
        
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer text-sm font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            <span>Parcourir vos fichiers</span>
            <input id="file-upload" type="file" accept=".csv,.txt" className="sr-only" onChange={handleFileChange} />
          </label>
          <span className="text-sm text-slate-500"> ou glissez-déposez le document ici</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Formats acceptés : CSV, TXT (Encodage UTF-8)</p>

        {selectedFile && (
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 px-5 py-2.5 border border-indigo-200/50 dark:border-indigo-800/50">
            <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedFile.name}</span>
            <span className="text-[10px] font-semibold text-indigo-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-rose-500">
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleProcessBatch}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Exécution de l'Audit par Lot...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Lancer le Traitement Multi-Lignes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Graphique + Tableau des Résultats */}
      {batchData && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visualisation Synthétique Recharts */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <PieIcon size={16} className="text-indigo-500" />
                  Profil Global du Fichier
                </h3>
                <Sparkles size={14} className="text-indigo-400" />
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-4 text-[11px] font-semibold">
                <span className="text-emerald-500">{positiveCount} Positif(s)</span>
                <span className="text-rose-500">{negativeCount} Négatif(s)</span>
                <span className="text-amber-500">{neutralCount} Neutre(s)</span>
              </div>
            </div>

            {/* Tableau Résultat WAAW */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-emerald-500" size={18} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {batchData.filename} — {batchData.total_processed} lignes analysées
                  </h3>
                </div>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/40">
                      <th className="px-4 py-3">Extrait</th>
                      <th className="px-4 py-3">Sentiment</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Entités</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {batchData.results.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 max-w-xs truncate font-medium text-slate-900 dark:text-white">{item.source_text}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.sentiment === 'Positif' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' :
                            item.sentiment === 'Négatif' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' :
                            'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}>
                            {item.sentiment}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{item.score}%</td>
                        <td className="px-4 py-3 text-slate-400">{item.entities_count} détectée(s)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}