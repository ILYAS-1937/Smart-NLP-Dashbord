import { useState, ChangeEvent } from 'react';
import { UploadCloud, FileText, CheckCircle, Loader2, Download, AlertCircle, RefreshCw } from 'lucide-react';

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
    const headers = "Texte,Sentiment,Score,Entités Détectées\n";
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

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-5 dark:border-slate-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analyse en Masse (Batch Processing)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Importez vos fichiers de données (CSV, TXT) pour lancer un traitement automatique par lot.
        </p>
      </div>

      {/* Zone de Drag & Drop / Upload */}
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <UploadCloud size={28} />
        </div>
        
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            <span>Sélectionnez un fichier</span>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.txt"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
          <span className="text-sm text-slate-500 dark:text-slate-400"> ou glissez-déposez ici</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Formats supportés : CSV, TXT (Jusqu'à 10 Mo)</p>

        {selectedFile && (
          <div className="mt-6 inline-flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2 border border-slate-200 dark:bg-slate-950 dark:border-slate-800">
            <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{selectedFile.name}</span>
            <span className="text-xs text-slate-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleProcessBatch}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Traitement du lot en cours...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Exécuter le traitement par lot</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Affichage des Résultats du Batch */}
      {batchData && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-500" size={20} />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Rapport de traitement : {batchData.filename} ({batchData.total_processed} lignes)
              </h2>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Download size={16} />
              <span>Exporter le Rapport (CSV)</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-400">
                    <th className="px-6 py-4">Texte Brut</th>
                    <th className="px-6 py-4">Sentiment</th>
                    <th className="px-6 py-4">Confiance</th>
                    <th className="px-6 py-4">Entités</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700 dark:divide-slate-800/60 dark:text-slate-300">
                  {batchData.results.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 max-w-md truncate font-medium text-slate-900 dark:text-white">
                        {item.source_text}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.sentiment === 'Positif' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          item.sentiment === 'Négatif' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {item.sentiment}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                        {item.score}%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500 dark:text-slate-400">
                        {item.entities_count} détectée(s)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}