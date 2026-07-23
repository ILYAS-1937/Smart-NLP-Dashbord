import { useAppStore } from './store/useAppStore';
import { LayoutDashboard, FileText, History, Settings, Sun, Moon } from 'lucide-react';
import MainDashboard from './views/MainDashboard';
import BatchAnalysis from './views/BatchAnalysis';
import HistoryView from './views/HistoryView';
import AdminConfig from './views/AdminConfig';

export default function App() {
  const { activeTab, setActiveTab, darkMode, toggleDarkMode } = useAppStore();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files', label: 'Analyse de Fichiers', icon: FileText },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'admin', label: 'Configuration Admin', icon: Settings },
  ];

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-slate-950 ${darkMode ? 'dark' : ''}`}>
      
      {/* BARRE LATÉRALE */}
      <div className="flex h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white p-4 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
              iN
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">innovNow</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Consulting Platform</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800/60">
          <button
            onClick={toggleDarkMode}
            className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span>{darkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
            </div>
            <div className={`h-5 w-9 rounded-full bg-slate-200 p-0.5 transition-colors dark:bg-indigo-600 flex items-center ${darkMode ? 'justify-end' : 'justify-start'}`}>
              <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
            </div>
          </button>

          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold">
              IT
            </div>
            <div className="overflow-hidden">
              <h4 className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">Ilyas Tarzi</h4>
              <p className="truncate text-[10px] text-slate-400">Élève Ingénieur</p>
            </div>
          </div>
        </div>
      </div>

      {/* ZONE DE CONTENU DYNAMIQUE */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-7xl">
          {activeTab === 'dashboard' && <MainDashboard />}
          {activeTab === 'files' && <BatchAnalysis />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'admin' && <AdminConfig />}
        </div>
      </main>

    </div>
  );
}