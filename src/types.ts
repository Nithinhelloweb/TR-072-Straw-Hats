export type LegalCategory = 
  | 'wage_theft'
  | 'unsafe_conditions'
  | 'harassment'
  | 'forced_labor'
  | 'child_labor'
  | 'discrimination'
  | 'other';

export interface LegalResponse {
  category: LegalCategory;
  legal_summary: string;
  laws: string[];
  complaint_letter: string;
  complaint_letter_local?: string;
  complaint_letter_english?: string;
  chat_response: string;
  chat_response_local?: string;
  chat_response_english?: string;
}

export interface UserContext {
  state: string;
  industry: string;
  employment_type: string;
  user_language: string;
  provider: 'gemini' | 'ollama' | 'ollama-1b' | 'groq';
  original_input: string;
  translated_input: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  legalData?: LegalResponse;
  timestamp: number;
}
