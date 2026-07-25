import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();

  return (
    <>
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        {/* Logo & Marque */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/30">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              smartNow <span className="text-indigo-400">NLP Analytics</span>
            </h1>
            <p className="text-xs text-slate-400">Plateforme Décisionnelle Enterprise</p>
          </div>
        </div>

        {/* Espace Utilisateur & Rôles */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user.full_name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>

              {/* Badge de Rôle */}
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider ${
                  isAdmin
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {user.role}
              </span>

              <button
                onClick={logout}
                title="Déconnexion"
                className="text-slate-400 hover:text-red-400 text-sm font-medium transition-colors ml-2"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              Connexion Enterprise
            </button>
          )}
        </div>
      </header>

      {/* Modal de connexion */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};