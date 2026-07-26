import React, { useState } from 'react';
import { Cloud, Sparkles, Search, ArrowUpDown, Tag } from 'lucide-react';

export interface WordItem {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: WordItem[];
  onWordClick?: (word: string) => void;
  title?: string;
  subtitle?: string;
}

export const WordCloud: React.FC<WordCloudProps> = ({
  words,
  onWordClick,
  title = "Nuage de Mots-Clés B.I. (WordCloud)",
  subtitle = "Extraction dynamique des termes les plus pertinents du corpus"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'frequency' | 'alphabetical'>('frequency');

  if (!words || words.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-8 text-center dark:border-slate-800/80 dark:bg-slate-900/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mb-3">
          <Cloud size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Aucun mot-clé disponible</h3>
        <p className="text-xs text-slate-400 mt-1">Lancez une analyse ou ajustez vos filtres pour générer le nuage de mots.</p>
      </div>
    );
  }

  // Calcul des valeurs min et max pour l'interpolation de taille
  const maxVal = Math.max(...words.map(w => w.value), 1);
  const minVal = Math.min(...words.map(w => w.value), 1);

  // Filtrage et Tri
  const filteredWords = words
    .filter(w => w.text.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.text.localeCompare(b.text);
      }
      return b.value - a.value;
    });

  // Calcul dynamique de style pour chaque mot
  const getWordStyle = (val: number) => {
    // Échelle normalisée de 0 à 1
    const normalized = maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal);

    // Taille de texte
    let fontSizeClass = 'text-xs font-medium';
    if (normalized > 0.8) fontSizeClass = 'text-2xl sm:text-3xl font-black tracking-tight';
    else if (normalized > 0.6) fontSizeClass = 'text-xl sm:text-2xl font-black';
    else if (normalized > 0.4) fontSizeClass = 'text-lg font-bold';
    else if (normalized > 0.2) fontSizeClass = 'text-sm font-semibold';

    // Dégradé et couleur selon poids
    let colorClass = 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300';
    let bgHoverClass = 'hover:bg-slate-100 dark:hover:bg-slate-800/60';

    if (normalized > 0.7) {
      colorClass = 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent';
      bgHoverClass = 'hover:bg-indigo-50/80 dark:hover:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/40';
    } else if (normalized > 0.4) {
      colorClass = 'text-indigo-600 dark:text-indigo-400';
      bgHoverClass = 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30';
    } else if (normalized > 0.2) {
      colorClass = 'text-violet-600 dark:text-violet-400';
    }

    return { fontSizeClass, colorClass, bgHoverClass };
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80 flex flex-col justify-between transition-all">
      
      {/* En-Tête du Composant */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Cloud size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        </div>

        {/* Commandes de Recherche & Tri */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Chercher un mot..."
              className="w-36 sm:w-44 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setSortBy(sortBy === 'frequency' ? 'alphabetical' : 'frequency')}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Changer l'ordre d'affichage"
          >
            <ArrowUpDown size={13} />
            <span className="hidden sm:inline">{sortBy === 'frequency' ? 'Fréquence' : 'A-Z'}</span>
          </button>
        </div>
      </div>

      {/* Nuage Interactif */}
      <div className="min-h-[200px] flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        {filteredWords.length > 0 ? (
          filteredWords.map((item, idx) => {
            const { fontSizeClass, colorClass, bgHoverClass } = getWordStyle(item.value);
            return (
              <button
                key={`${item.text}-${idx}`}
                onClick={() => onWordClick && onWordClick(item.text)}
                className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${bgHoverClass} hover:scale-105 active:scale-95`}
              >
                <span className={`${fontSizeClass} ${colorClass}`}>
                  {item.text}
                </span>
                
                {/* Badge du nombre d'occurrences */}
                <span className="rounded-full bg-slate-200/70 dark:bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 opacity-80 group-hover:opacity-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {item.value}
                </span>
              </button>
            );
          })
        ) : (
          <p className="text-xs font-semibold text-slate-400 py-8">
            Aucun terme ne correspond à "{searchTerm}"
          </p>
        )}
      </div>

      {/* Pied de Carte KPI WordCloud */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-indigo-500" />
          <span>{words.length} termes uniques extraits</span>
        </span>
        <span className="flex items-center gap-1">
          <Tag size={13} className="text-emerald-500" />
          <span>Filtrage Stopwords Actif</span>
        </span>
      </div>

    </div>
  );
};