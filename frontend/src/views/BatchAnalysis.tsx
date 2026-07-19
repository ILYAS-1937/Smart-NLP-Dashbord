import { useState } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, Trash2, Layers, AlertCircle } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: 'csv' | 'xlsx' | 'txt';
  status: 'ready' | 'processing' | 'completed';
}

export default function BatchAnalysis() {
  const [files, setFiles] = useState<UploadedFile[]>([
    // Exemples fictifs pour le rendu visuel initial du Dashboard
    { id: '1', name: 'retours_clients_juillet.csv', size: '142 KB', type: 'csv', status: 'ready' },
    { id: '2', name: 'tickets_support_raw.txt', size: '48 KB', type: 'txt', status: 'ready' },
  ]);

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-5 dark:border-slate-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analyse de Fichiers en Lot
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Importez vos jeux de données textuelles complexes pour lancer un traitement automatique de masse.
        </p>
      </div>

      {/* Zone de Drag & Drop pour l'importation */}
      <div className="group border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-indigo-400 rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-500 dark:group-hover:bg-indigo-950/40 dark:group-hover:text-indigo-400 transition-colors">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Glissez-déposez votre fichier ici, ou <span className="text-indigo-600 dark:text-indigo-400 hover:underline">parcourez</span>
          </h3>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Formats supportés : .CSV, .XLSX, .TXT (Max. 20MB)
          </p>
        </div>
      </div>

      {/* Liste des fichiers importés */}
      {files.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800/60">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">File d'attente des documents</h3>
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl p-2.5 ${file.type === 'txt' ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                    {file.type === 'txt' ? <FileText size={20} /> : <FileSpreadsheet size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{file.size}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Prêt pour l'analyse
                  </span>
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bouton d'action collective */}
          <div className="bg-slate-50 dark:bg-slate-900/60 px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <AlertCircle size={14} />
              <span>Les lignes vides ou mal formatées seront automatiquement ignorées.</span>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-[0.98]">
              <Layers size={16} />
              <span>Exécuter le traitement par lot</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}