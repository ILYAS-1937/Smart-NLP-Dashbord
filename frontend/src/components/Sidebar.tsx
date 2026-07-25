import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { AuthModal } from './AuthModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'files', label: 'Analyse de Fichiers', icon: '📄' },
    { id: 'history', label: 'Historique', icon: '📜' },
    { id: 'admin', label: 'Configuration Admin', icon: '⚙️' },
  ];

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between p-4 shadow-sm">
        {/* 1. LOGO EN HAUT */}
        <div>
          <div className="flex items-center space-x-3 px-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-indigo-500/20">
              iN
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-base leading-tight">InnovNow</h1>
              <p className="text-xs text-slate-400">Consulting Platform</p>
            </div>
          </div>

          {/* 2. MENU DE NAVIGATION */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  activeTab === item.id
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 3. PROFIL UTILISATEUR & AUTHENTIFICATION EN BAS À GAUCHE */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          {isAuthenticated && user ? (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    {user.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/40">
                {/* Badge de Rôle */}
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {user.role}
                </span>

                <button
                  onClick={logout}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>🔑</span>
              <span>Connexion Enterprise</span>
            </button>
          )}
        </div>
      </aside>

      {/* Modal d'Authentification */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};