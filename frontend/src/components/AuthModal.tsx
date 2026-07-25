import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail, ShieldCheck, X, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Identifiants invalides ou compte révoqué');
      }

      const data = await res.json();
      setAuth(data.user, data.access_token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* CARD PRINCIPALE D'AUTHENTIFICATION */}
      <div className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl shadow-indigo-500/10 transition-all">
        
        {/* BANDEAU SUPÉRIEUR DÉCORATIF */}
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />

        {/* BOUTON FERMER */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800/50 rounded-full transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-8">
          {/* ENTÊTE LOGO INNOVNOW */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 font-black text-white text-2xl shadow-lg shadow-indigo-500/30 mb-4">
              iN
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck size={13} />
              <span>Accès Restreint Enterprise</span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              InnovNow Consulting
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Plateforme décisionnelle d'analyse NLP
            </p>
          </div>

          {/* MESSAGE D'ERREUR */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center animate-shake">
              {error}
            </div>
          )}

          {/* FORMULAIRE DE CONNEXION */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                Email Professionnel
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@innovnow.ma"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* BOUTON ACTION PRINCIPAL */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-indigo-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};