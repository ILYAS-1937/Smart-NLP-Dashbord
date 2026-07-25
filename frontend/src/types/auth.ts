export type UserRole = 'ADMIN' | 'ANALYST';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AnalysisHistoryItem {
  id: number;
  text_content: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence_score: number;
  summary?: string;
  created_at: string;
}