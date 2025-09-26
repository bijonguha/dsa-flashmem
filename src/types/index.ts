// Core flashcard data structure
export interface Flashcard {
  id: string;
  user_id?: string; // Added for Supabase integration
  topic: string;
  title: string;
  question: string;
  hint?: string;
  expected_points: string[];
  solution: {
    prerequisites?: string[];
    youtube_url?: string;
    approaches: {
      name: string;
      code: string;
      time_complexity: string;
      space_complexity: string;
      explanation?: string;
    }[];
  };
  neetcode_url?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

// User progress tracking
export interface UserProgress {
  flashcard_id: string;
  user_id?: string; // Added for Supabase integration
  next_review_date: Date;
  interval_days: number;
  ease_factor: number;
  total_reviews: number;
  correct_streak: number;
  last_review_date: Date;
  average_response_time: number;
}

// Session data for review sessions
export interface ReviewSession {
  id: string;
  flashcard_id: string;
  user_id?: string; // Added for Supabase integration
  start_time: Date;
  end_time: Date;
  user_answer: string;
  ai_evaluation: {
    score: number;
    feedback: string;
    missing_points: string[];
  };
  self_rating: 'again' | 'hard' | 'good' | 'easy';
  input_method: 'voice' | 'typing';
  time_taken: number;
}

// Application settings
export interface AppSettings {
  user_id: string; // user_id is the primary key
  openai_api_key?: string;
  timer_duration: number; // in seconds
  input_preference: 'voice' | 'typing' | 'both';
  auto_advance: boolean;
  show_hints: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// Analytics event tracking
export interface AnalyticsEvent {
  event_type:
    | 'session_start'
    | 'voice_used'
    | 'ai_evaluated'
    | 'solution_viewed'
    | 'flashcard_completed';
  timestamp: Date;
  metadata: Record<string, unknown>;
  user_id?: string; // Added for Supabase integration
}

// SRS algorithm types
export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface SRSCard {
  flashcard_id: string;
  due_date: Date;
  interval: number;
  ease_factor: number;
  reviews: number;
  lapses: number;
}

// Voice recognition types
export interface VoiceRecognitionState {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error?: string;
}

// API response types
export interface EvaluationResult {
  score: number;
  feedback: string;
  missing_points: string[];
  suggestions?: string[];
}

export interface OpenAIEvaluationResponse extends EvaluationResult {
  suggestions?: string[];
}

// Import/Export types
export interface ImportResult {
  success: boolean;
  imported_count: number;
  errors: string[];
  flashcards: Flashcard[];
}

// Dashboard statistics
export interface DashboardStats {
  total_flashcards: number;
  due_today: number;
  completed_today: number;
  current_streak: number;
  accuracy_rate: number;
  average_session_time: number;
  topics_progress: Record<
    string,
    {
      total: number;
      mastered: number;
      accuracy: number;
    }
  >;
}
