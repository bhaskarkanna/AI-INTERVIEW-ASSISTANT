export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFileName?: string;
  resumeText?: string;
  interviewStatus: 'not_started' | 'in_progress' | 'completed';
  currentQuestionIndex: number;
  questions: Question[];
  answers: Answer[];
  finalScore?: number;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in seconds
  category: string;
  expectedAnswer?: string;
}

export interface Answer {
  questionId: string;
  text: string;
  timeSpent: number; // in seconds
  score?: number;
  submittedAt: string;
}

export interface InterviewState {
  isInterviewActive: boolean;
  currentQuestion?: Question;
  timeRemaining: number;
  isPaused: boolean;
}

export interface UIState {
  activeTab: 'interviewee' | 'interviewer';
  isLoading: boolean;
  error?: string;
  showWelcomeBackModal: boolean;
}

export interface AppState {
  candidates: Candidate[];
  interview: InterviewState;
  ui: UIState;
}
