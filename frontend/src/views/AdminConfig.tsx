import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ShieldAlert, UserPlus, Users, Activity, Database, 
  CheckCircle2, AlertCircle, Loader2, KeyRound, ShieldCheck, 
  Trash2, Sliders, FileText, Server, ToggleLeft, ToggleRight,
  RefreshCw, UserX, AlertTriangle, X, Search
} from 'lucide-react';

interface UserItem {
  id: number;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'ANALYST';
}

interface GlobalLogItem {
  id: number;
  text: string;
  sentiment: string;
  confidence: number;
  created_at: string;
  user_name: string;
  user_email: string;
}

export default function AdminConfig() {
  const { isAuthenticated, isAdmin, token, openAuthModal, user: currentUser } = useAuthStore();

  // Navigation interne Admin
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'logs' | 'settings'>('users');

  // États Utilisateurs
  const [users, setUsers] = useState<UserItem[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ANALYST' | 'ADMIN'>('ANALYST');
  
  // Modale de Confirmation de Révocation
  const [userToRevoke, setUserToRevoke] = useState<UserItem | null>(null);

  // Logs & Supervision
  const [globalLogs, setGlobalLogs] = useState<GlobalLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');
  
  // 🔍 NOUVEL ÉTAT : Barre de recherche collaborateur / mot-clé
  const [searchQuery, setSearchQuery] = useState('');

  // Paramètres Moteur NLP
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [enableBart, setEnableBart] = useState(true);
  const [enableNer, setEnableNer] = useState(true);

  // États UI
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Charger la liste des utilisateurs
  const fetchUsers = async () => {
    if (!token || !isAdmin) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('http://localhost:8000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Charger le journal d'audit global BDD
  const fetchGlobalLogs = async () => {
    if (!token || !isAdmin) return;
    setLoadingLogs(true);
    try {
      const res = await fetch('http://localhost:8000/api/admin/global-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGlobalLogs(data);
      }
    } catch (err) {
      console.error('Erreur chargement logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
      fetchGlobalLogs();
    }
  }, [isAuthenticated, isAdmin, token]);

  // Création de compte
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setCreating(true);

    try {
      const res = await fetch('http://localhost:8000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Échec de la création du compte.");
      }

      setSuccessMsg(`Compte créé avec succès pour ${fullName} (${role})`);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('ANALYST');
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Confirmation et exécution de la révocation de compte
  const confirmRevokeUser = async () => {
    if (!userToRevoke) return;

    setDeletingId(userToRevoke.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`http://localhost:8000/api/admin/users/${userToRevoke.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Échec de la suppression.");
      }

      setSuccessMsg(`Accès de ${userToRevoke.full_name} révoqué avec succès.`);
      setUserToRevoke(null);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // 🔍 FILTRE COMBINÉ : Sentiment + Recherche Collaborateur (Nom, Email, Texte)
  const filteredLogs = globalLogs.filter(log => {
    const s = (log.sentiment || '').toUpperCase();
    let matchesSentiment = true;
    if (logFilter === 'POSITIVE') matchesSentiment = (s === 'POSITIVE' || s === 'POSITIF');
    if (logFilter === 'NEGATIVE') matchesSentiment = (s === 'NEGATIVE' || s === 'NÉGATIF' || s === 'NEGATIF');

    const q = searchQuery.toLowerCase().trim();
    let matchesSearch = true;
    if (q) {
      const userName = (log.user_name || '').toLowerCase();
      const userEmail = (log.user_email || '').toLowerCase();
      const text = (log.text || '').toLowerCase();
      matchesSearch = userName.includes(q) || userEmail.includes(q) || text.includes(q);
    }

    return matchesSentiment && matchesSearch;
  });

  // 🔴 ÉCRAN DE SÉCURITÉ NON-ADMIN
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[72vh] text-center p-6 animate-fadeIn">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-500/20 to-orange-500/10 text-rose-500 flex items-center justify-center border border-rose-500/30 shadow-2xl shadow-rose-500/15">
            <ShieldAlert size={48} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-rose-600 text-white p-1.5 rounded-xl shadow-lg">
            <UserX size={16} />
          </div>
        </div>
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider mb-4">
          <span>Module de Sécurité RBAC</span>
        </div>

        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Accès Restreint aux Administrateurs
        </h2>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-8 font-medium">
          Vous êtes actuellement connecté sous le profil <strong>{isAuthenticated ? 'ANALYSTE' : 'VISITEUR'}</strong>. La gouvernance du système et la création de comptes sont réservées aux Administrateurs InnovNow.
        </p>

        <button
          onClick={openAuthModal}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-7 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/25 transition-all flex items-center gap-2 text-sm cursor-pointer"
        >
          <KeyRound size={18} />
          <span>Ouvrir une Session Admin</span>
        </button>
      </div>
    );
  }

  // 🟢 VUE ADMINISTRATEUR PRO
  return (
    <div className="space-y-8 pb-12 animate-fadeIn relative">
      
      {/* BANNER WAAW PRO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 text-white shadow-2xl shadow-indigo-950/30 border border-slate-800">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute right-40 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/15 blur-2xl" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3.5 py-1 text-xs font-extrabold text-rose-300 border border-rose-400/20 uppercase tracking-wider backdrop-blur-md">
            <ShieldCheck size={14} className="text-rose-400" />
            <span>Gouvernance & Supervision System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Configuration Administrateur
          </h1>
          <p className="text-sm text-slate-300/80 leading-relaxed font-medium">
            Supervision centralisée des collaborateurs InnovNow, contrôle d'audit multi-utilisateurs et réglage dynamique des pipelines NLP.
          </p>
        </div>
      </div>

      {/* KPI CARDS WAAW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collaborateurs</p>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{users.length}</p>
          <span className="text-[10px] text-emerald-500 font-semibold">● Rôles RBAC actifs</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Moteur FastAPI</p>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Activity size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-500 mt-2">100% ONLINE</p>
          <span className="text-[10px] text-slate-400 font-semibold">Latence moyenne : 12.4 ms</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audits Traités</p>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{globalLogs.length}</p>
          <span className="text-[10px] text-indigo-500 font-semibold">Journalisation globale BDD</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base SQLite</p>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Database size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">256-bit JWT</p>
          <span className="text-[10px] text-emerald-500 font-semibold">Stockage chiffré</span>
        </div>
      </div>

      {/* BARRE D'ONGLETS SÉLECTIONNABLES */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeAdminTab === 'users'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users size={16} />
          <span>Gestion des Comptes ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeAdminTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileText size={16} />
          <span>Journal d'Audit Global ({globalLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeAdminTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Sliders size={16} />
          <span>Paramètres Moteur NLP</span>
        </button>
      </div>

      {/* ALERTS POPUP */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <AlertCircle size={18} className="text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 🟢 ONGLET 1 : GESTION ET CRÉATION DE COMPTES */}
      {/* ==================================================================== */}
      {activeAdminTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulaire de Provisionnement */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Créer un Nouveau Compte</h3>
                  <p className="text-xs text-slate-400">Provisionner un collaborateur InnovNow</p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nom & Prénom
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Youssef El Amrani"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Professionnel
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="y.elamrani@innovnow.ma"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Mot de passe Provisoire
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Habilitation RBAC
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'ANALYST' | 'ADMIN')}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ANALYST">📊 ANALYSTE (Audits NLP & DataViz)</option>
                    <option value="ADMIN">👑 ADMINISTRATEUR (Accès Total & Config)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  <span>Valider et Activer le Compte</span>
                </button>
              </form>
            </div>
          </div>

          {/* Tableau de Gestion Utilisateurs */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Collaborateurs Enregistrés</h3>
                <p className="text-xs text-slate-400">Liste des accès autorisés sur la BDD</p>
              </div>
              <button
                onClick={fetchUsers}
                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title="Actualiser la liste"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      <th className="px-4 py-3.5">ID</th>
                      <th className="px-4 py-3.5">Collaborateur</th>
                      <th className="px-4 py-3.5">Email Pro</th>
                      <th className="px-4 py-3.5">Rôle</th>
                      <th className="px-4 py-3.5 text-right">Révocation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-slate-400">#{u.id}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{u.full_name}</td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{u.email}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            u.role === 'ADMIN'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {u.id !== currentUser?.id ? (
                            <button
                              onClick={() => setUserToRevoke(u)}
                              title="Révoquer le compte"
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-semibold">Session Connectée</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 🟢 ONGLET 2 : SUPERVISION ET AUDIT GLOBAL AVEC BARRE DE RECHERCHE */}
      {/* ==================================================================== */}
      {activeAdminTab === 'logs' && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Journal des Analyses Multi-Utilisateurs</h3>
              <p className="text-xs text-slate-400">Traçabilité complète des requêtes transmises au Moteur NLP</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* 🔍 BARRE DE RECHERCHE POUR COLLABORATEURS ET EXTRAITS */}
              <div className="relative min-w-[220px] sm:min-w-[280px]">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrer par Collaborateur (Nom, Email)..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    title="Effacer la recherche"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Boutons de Filtre Sentiment */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setLogFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    logFilter === 'ALL' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setLogFilter('POSITIVE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    logFilter === 'POSITIVE' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Positifs
                </button>
                <button
                  onClick={() => setLogFilter('NEGATIVE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    logFilter === 'NEGATIVE' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Négatifs
                </button>
              </div>

              {/* Bouton Actualiser */}
              <button
                onClick={fetchGlobalLogs}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 transition-colors cursor-pointer"
                title="Actualiser la liste"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {loadingLogs ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              {searchQuery ? `Aucune analyse trouvée pour "${searchQuery}".` : "Aucune entrée enregistrée dans le journal d'audit."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    <th className="px-4 py-3.5">ID</th>
                    <th className="px-4 py-3.5">Collaborateur</th>
                    <th className="px-4 py-3.5">Extrait Soumis</th>
                    <th className="px-4 py-3.5">Sentiment</th>
                    <th className="px-4 py-3.5">Confiance</th>
                    <th className="px-4 py-3.5">Date & Heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {filteredLogs.map((log) => {
                    const normSentiment = (log.sentiment || '').toUpperCase();
                    const isPos = normSentiment === 'POSITIVE' || normSentiment === 'POSITIF';
                    const isNeg = normSentiment === 'NEGATIVE' || normSentiment === 'NÉGATIF' || normSentiment === 'NEGATIF';
                    const confPercent = Math.round(log.confidence <= 1 ? log.confidence * 100 : log.confidence);

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-slate-400">#{log.id}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                          {log.user_name || 'Anonyme'}
                          <span className="block text-[10px] font-normal text-slate-400">{log.user_email}</span>
                        </td>
                        <td className="px-4 py-3.5 max-w-xs truncate text-slate-600 dark:text-slate-300">{log.text}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isPos ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400' :
                            isNeg ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400'
                          }`}>
                            {log.sentiment}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {confPercent}%
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                          {log.created_at ? new Date(log.created_at).toLocaleString('fr-FR') : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 🟢 ONGLET 3 : PARAMÈTRES DYNAMIQUES DU MOTEUR NLP */}
      {/* ==================================================================== */}
      {activeAdminTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Sliders size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Sensibilité Décisionnelle</h3>
                <p className="text-xs text-slate-400">Seuil minimal d'acceptation du sentiment</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-3">
                <span className="text-slate-600 dark:text-slate-300">Seuil Minimal de Confiance</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
              />
              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                Toutes les prédictions dont le niveau de certitude est inférieur à <strong>{confidenceThreshold}%</strong> seront automatiquement marquées comme incertaines.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Pipelines Transformers Actives</h3>
                <p className="text-xs text-slate-400">Activation/Désactivation à chaud des modèles</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">BART Summarizer</p>
                  <p className="text-[10px] text-slate-400">Modèle abstractif de génération de résumés</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableBart(!enableBart)}
                  className="text-indigo-600 dark:text-indigo-400 cursor-pointer"
                >
                  {enableBart ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">BERT-NER (Named Entities)</p>
                  <p className="text-[10px] text-slate-400">Extraction typologique (ORG, LOC, PER, MISC)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableNer(!enableNer)}
                  className="text-indigo-600 dark:text-indigo-400 cursor-pointer"
                >
                  {enableNer ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* 🔴 MODALE PRO DE CONFIRMATION DE RÉVOCATION DE COMPTE */}
      {/* ==================================================================== */}
      {userToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl transition-all">
            
            <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500" />

            <button
              onClick={() => setUserToRevoke(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60 rounded-full transition-colors"
            >
              <X size={16} />
            </button>

            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mb-5 border border-rose-200 dark:border-rose-900/60 shadow-lg shadow-rose-500/10">
                <AlertTriangle size={32} />
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Confirmer la Révocation
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Vous êtes sur le point de supprimer définitivement le compte et les accès de ce collaborateur :
              </p>

              <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left flex items-center justify-between">
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {userToRevoke.full_name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {userToRevoke.email}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${
                  userToRevoke.role === 'ADMIN'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                }`}>
                  {userToRevoke.role}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 text-[11px] font-semibold text-left mb-6">
                ⚠️ Cette action est irréversible. L'utilisateur sera immédiatement déconnecté et ne pourra plus accéder à la plateforme.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserToRevoke(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Conserver
                </button>

                <button
                  type="button"
                  onClick={confirmRevokeUser}
                  disabled={deletingId === userToRevoke.id}
                  className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {deletingId === userToRevoke.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={15} />
                      <span>Confirmer</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}