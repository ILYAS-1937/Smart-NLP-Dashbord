import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EntityResult {
  word: string;
  entity_group: string;
  score: number;
}

export interface SentimentResult {
  label: 'Positif' | 'Neutre' | 'Négatif';
  score: number;
}

export interface AnalysisResult {
  sentiment: SentimentResult;
  summary: string;
  entities: EntityResult[];
  execution_time_ms: number;
}

export interface HistoryItem {
  id: string;
  date: string;
  type: 'Texte Brut' | 'Fichier';
  source: string;
  sentiment: 'Positif' | 'Neutre' | 'Négatif';
  score: number;
}

interface AppState {
  activeTab: string;
  darkMode: boolean;
  setActiveTab: (tab: string) => void;
  toggleDarkMode: () => void;

  currentText: string;
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  setCurrentText: (text: string) => void;
  
  analyzeText: (text: string) => Promise<void>;

  history: HistoryItem[];
  deleteHistoryItem: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeTab: 'dashboard',
      darkMode: false,
      currentText: '',
      isAnalyzing: false,
      analysisResult: null,

      history: [
        { id: '1', date: '20/07/2026 14:22', type: 'Texte Brut', source: 'Avis client sur le nouveau parcours d\'achat...', sentiment: 'Positif', score: 88 },
      ],

      setActiveTab: (tab) => set({ activeTab: tab }),

      toggleDarkMode: () =>
        set((state) => {
          const newMode = !state.darkMode;
          if (newMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: newMode };
        }),

      setCurrentText: (text) => set({ currentText: text }),

      // 🚀 Action Asynchrone : Appel direct à FastAPI
      analyzeText: async (text: string) => {
        if (!text.trim()) return;

        set({ isAnalyzing: true });

        try {
          const response = await fetch('http://127.0.0.1:8000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });

          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }

          const data: AnalysisResult = await response.json();

          // Mise à jour des résultats
          set({ analysisResult: data, isAnalyzing: false });

          // Ajout automatique à l'historique Persistant
          const newHistoryItem: HistoryItem = {
            id: Date.now().toString(),
            date: new Date().toLocaleString('fr-FR'),
            type: 'Texte Brut',
            source: text.length > 50 ? text.substring(0, 50) + '...' : text,
            sentiment: data.sentiment.label,
            score: Math.round(data.sentiment.score),
          };

          set((state) => ({
            history: [newHistoryItem, ...state.history],
          }));

        } catch (error) {
          console.error("Erreur lors de l'analyse NLP :", error);
          set({ isAnalyzing: false });
          alert("Impossible de contacter le serveur NLP FastAPI. Vérifiez qu'Uvicorn tourne sur le port 8000.");
        }
      },

      deleteHistoryItem: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'smart-nlp-storage',
      partialize: (state) => ({ history: state.history, darkMode: state.darkMode }),
    }
  )
);