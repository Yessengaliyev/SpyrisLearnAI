export type Department = 'General' | 'Marks' | 'Flashcards' | 'Quizzes' | 'Plan' | 'Test' | 'Voice' | 'Translator' | 'Timer' | 'Experience' | 'Projects';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: string[]; // base64 images
  image?: string; // single base64 image
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  isArchived: boolean;
  createdAt: number;
  type: 'chat' | 'conspect' | 'flashcards' | 'quiz';
  department: Department;
}

export interface AppState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isSidebarOpen: boolean;
}
