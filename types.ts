export interface Slide {
  id: string;
  url: string; // Base64 or Blob URL
  name: string;
  file?: File;
  explanation?: string; // Persisted explanation for this slide
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

export type LoadingState = 'idle' | 'analyzing' | 'sending' | 'error';

export type QuizType = 'mcq' | 'subjective';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizConfig {
  type: QuizType;
  difficulty: QuizDifficulty;
}

export interface QuizQuestion {
  id: number;
  type: QuizType;
  question: string;
  // For MCQ
  options?: string[];
  correctAnswer?: number; // Index 0-3
  // For Subjective
  modelAnswer?: string;
  
  explanation: string; // Why it's correct or key concepts
}

export interface QuizData {
  config: QuizConfig;
  questions: QuizQuestion[];
}

export interface WorkspaceData {
  slides: Slide[];
  messages: Message[];
  lastActiveIndex: number;
  timestamp: number;
}