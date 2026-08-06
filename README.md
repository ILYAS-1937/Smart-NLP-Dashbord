# 🧠 Smart NLP Dashboard — Analyse Intelligente de Données Textuelles

> **Projet de Stage d'Initiation** — *Conception et développement d’un Dashboard intelligent d'analyse de données textuelles (NLP) pour l'aide à la décision.*  
> **Auteur :** Ilyas Tarzi — *École Nationale des Sciences Appliquées (ENSA) de Berrechid*

---

## 📌 Présentation du Projet

À l'ère du numérique, les entreprises accumulent une quantité massive de données textuelles non structurées (avis clients, retours d'expérience, tickets de support, rapports internes). Analyser manuellement ces données demande un temps considérable.

**Smart NLP Dashboard** est une application web Full-Stack moderne et intuitive conçue pour automatiser ce processus. Grâce à l'intégration de pipelines de Traitement Automatique du Langage NatureL (NLP) et de LLMs, l'application permet de synthétiser l'information, de classifier la valeur émotionnelle des textes et d'offrir des visualisations interactives d'aide à la décision.

---

## ✨ Fonctionnalités Principales

- 🎭 **Analyse de Sentiment Individuelle :** Classification automatique des textes en temps réel (*Positif*, *Neutre*, *Négatif*) avec scores de confiance.
- 📝 **Résumé Automatique :** Génération de synthèses condensées de documents volumineux.
- ⚡ **Traitement par Lot en Temps Réel (Batch Processing) :** Analyse simultanée de multiples fichiers avec suivi de progression via **WebSockets** (`/ws/bulk/`).
- 📊 **Visualisation Interactive (DataViz) :** Nuages de mots (Word Cloud) et graphiques statistiques interactifs des tendances émotionnelles.
- 📜 **Historique & Audit :** Sauvegarde et consultation de l'historique des analyses via une base de données persistante.
- 🔐 **Authentification & Sécurité :** Gestion des accès utilisateurs avec tokens JWT.

---

## 🛠️ Architecture Technique

| Composant | Technologies / Outils Utilisés |
| :--- | :--- |
| **Frontend** | React, TypeScript, Tailwind CSS, Zustand *(Gestion d'état)*, Recharts / Chart.js |
| **Backend** | Python, FastAPI, Uvicorn, SQLAlchemy |
| **IA & NLP** | Hugging Face Transformers (*RoBERTa, BART*), PyTorch, Groq API |
| **Communication** | REST API, WebSockets (Temps réel) |
| **Versionning** | Git, GitHub |

---

## 📁 Structure du Projet

```text
Smart-NLP-Dashbord/
├── backend/                  # Serveur API Python FastAPI & Modèles IA
│   ├── app/
│   │   ├── main.py           # Point d'entrée de l'application FastAPI
│   │   ├── database.py       # Configuration SQLAlchemy / BDD
│   │   ├── models.py         # Modèles de données
│   │   ├── schemas.py        # Schémas Pydantic
│   │   ├── security.py       # Authentification JWT
│   │   └── services/         # Moteur NLP & intégration Groq/Transformers
│   ├── requirements.txt      # Dépendances Python
│   └── .env                  # Variables d'environnement
│
└── frontend/                 # Application Web React TypeScript
    ├── src/
    │   ├── components/       # Composants réutilisables (Header, Sidebar, WordCloud)
    │   ├── views/            # Pages (MainDashboard, BatchAnalysis, HistoryView, RagView)
    │   ├── store/            # Stores Zustand (useAppStore, useAuthStore)
    │   └── services/         # Client d'API (Axios / WebSockets)
    ├── package.json          # Dépendances Node.js
    └── vite.config.ts        # Configuration Vite
