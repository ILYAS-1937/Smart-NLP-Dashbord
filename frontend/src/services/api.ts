import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = 'http://localhost:8000/api';

export const apiService = {
  /**
   * Envoie un texte pour analyse NLP (Sauvegarde automatique en BDD si connecté)
   */
  async analyzeText(text: string, minLength = 30, maxLength = 130) {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, min_length: minLength, max_length: maxLength }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Erreur lors de l'analyse textuelle");
    }

    return await response.json();
  },

  /**
   * Récupère l'historique personnel de l'utilisateur connecté
   */
  async getUserHistory() {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("Utilisateur non authentifié");

    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Impossible de récupérer l'historique");
    }

    return await response.json();
  },
};