import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Helper centralisé pour générer les en-têtes HTTP avec le token JWT s'il existe
 */
const getAuthHeaders = (): Record<string, string> => {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const apiService = {
  /**
   * Envoie un texte pour analyse NLP (Sauvegarde automatique en BDD si connecté)
   */
  async analyzeText(text: string, minLength = 30, maxLength = 130) {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, min_length: minLength, max_length: maxLength }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Erreur lors de l'analyse textuelle");
    }

    return await response.json();
  },

  /**
   * Récupère l'historique personnel de l'utilisateur connecté
   */
  async getUserHistory() {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Impossible de récupérer l'historique");
    }

    return await response.json();
  },

  /**
   * [ADMIN] Récupère le journal d'audit global (Toutes les analyses BDD)
   */
  async getAdminGlobalLogs() {
    const response = await fetch(`${API_BASE_URL}/admin/global-logs`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Erreur lors de la récupération du journal d'audit");
    }

    return await response.json();
  },
};