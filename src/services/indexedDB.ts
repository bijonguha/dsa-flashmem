import Dexie, { Table } from 'dexie';
import { 
  Flashcard, 
  UserProgress, 
  ReviewSession, 
  AppSettings, 
  AnalyticsEvent 
} from '../types';

class DSAFlashMemDB extends Dexie {
  flashcards!: Table<Flashcard>;
  progress!: Table<UserProgress>;
  sessions!: Table<ReviewSession>;
  settings!: Table<AppSettings>;
  analytics!: Table<AnalyticsEvent>;

  constructor() {
    super('DSAFlashMemDB');
    
    this.version(1).stores({
      flashcards: 'id, topic, difficulty, *tags',
      progress: 'flashcard_id, next_review_date, last_review_date',
      sessions: 'id, flashcard_id, start_time, end_time',
      settings: '++id',
      analytics: '++id, event_type, timestamp'
    });
  }
}

export const db = new DSAFlashMemDB();

// Database service class with methods for all operations
export class DatabaseService {
  // Flashcard operations
  static async addFlashcard(flashcard: Flashcard): Promise<void> {
    await db.flashcards.add(flashcard);
  }

  static async addFlashcards(flashcards: Flashcard[]): Promise<void> {
    await db.flashcards.bulkAdd(flashcards);
  }

  static async getFlashcard(id: string): Promise<Flashcard | undefined> {
    return await db.flashcards.get(id);
  }

  static async getAllFlashcards(): Promise<Flashcard[]> {
    return await db.flashcards.toArray();
  }

  static async getFlashcardsByTopic(topic: string): Promise<Flashcard[]> {
    return await db.flashcards.where('topic').equals(topic).toArray();
  }

  static async getFlashcardsByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<Flashcard[]> {
    return await db.flashcards.where('difficulty').equals(difficulty).toArray();
  }

  static async updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<void> {
    await db.flashcards.update(id, updates);
  }

  static async deleteFlashcard(id: string): Promise<void> {
    await db.flashcards.delete(id);
  }

  // Progress operations
  static async getProgress(flashcard_id: string): Promise<UserProgress | undefined> {
    return await db.progress.get(flashcard_id);
  }

  static async updateProgress(progress: UserProgress): Promise<void> {
    await db.progress.put(progress);
  }

  static async getAllProgress(): Promise<UserProgress[]> {
    return await db.progress.toArray();
  }

  static async getDueCards(): Promise<UserProgress[]> {
    const now = new Date();
    return await db.progress.where('next_review_date').belowOrEqual(now).toArray();
  }

  // Session operations
  static async addSession(session: ReviewSession): Promise<void> {
    await db.sessions.add(session);
  }

  static async getSessionsForFlashcard(flashcard_id: string): Promise<ReviewSession[]> {
    return await db.sessions.where('flashcard_id').equals(flashcard_id).toArray();
  }

  static async getRecentSessions(limit: number = 10): Promise<ReviewSession[]> {
    return await db.sessions.orderBy('start_time').reverse().limit(limit).toArray();
  }

  static async getSessionsInDateRange(startDate: Date, endDate: Date): Promise<ReviewSession[]> {
    return await db.sessions
      .where('start_time')
      .between(startDate, endDate)
      .toArray();
  }

  // Settings operations
  static async getSettings(): Promise<AppSettings> {
    const settings = await db.settings.toArray();
    if (settings.length === 0) {
      const defaultSettings: AppSettings = {
        timer_duration: 300, // 5 minutes
        input_preference: 'both',
        auto_advance: false,
        show_hints: true,
        theme: 'auto'
      };
      await db.settings.add(defaultSettings);
      return defaultSettings;
    }
    return settings[0];
  }

  static async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    const settings = await db.settings.toArray();
    if (settings.length === 0) {
      await db.settings.add(updates as AppSettings);
    } else {
      await db.settings.update(1, updates);
    }
  }

  // Analytics operations
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    await db.analytics.add(event);
  }

  static async getAnalytics(eventType?: string): Promise<AnalyticsEvent[]> {
    if (eventType) {
      return await db.analytics.where('event_type').equals(eventType).toArray();
    }
    return await db.analytics.toArray();
  }

  // Utility operations
  static async clearAllData(): Promise<void> {
    await db.delete();
    await db.open();
  }

  static async exportData(): Promise<{
    flashcards: Flashcard[];
    progress: UserProgress[];
    sessions: ReviewSession[];
    settings: AppSettings[];
  }> {
    return {
      flashcards: await this.getAllFlashcards(),
      progress: await this.getAllProgress(),
      sessions: await db.sessions.toArray(),
      settings: [await this.getSettings()]
    };
  }

  static async importData(data: {
    flashcards?: Flashcard[];
    progress?: UserProgress[];
  }): Promise<void> {
    if (data.flashcards) {
      await db.flashcards.bulkPut(data.flashcards);
    }
    if (data.progress) {
      await db.progress.bulkPut(data.progress);
    }
  }

  // Statistics helpers
  static async getStatistics() {
    const flashcards = await this.getAllFlashcards();
    const progress = await this.getAllProgress();
    const dueCards = await this.getDueCards();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessionsToday = await this.getSessionsInDateRange(today, tomorrow);

    return {
      total_flashcards: flashcards.length,
      due_today: dueCards.length,
      completed_today: sessionsToday.length,
      topics: [...new Set(flashcards.map(f => f.topic))],
      average_accuracy: progress.length > 0 ? 
        progress.reduce((acc, p) => acc + (p.correct_streak / Math.max(p.total_reviews, 1)), 0) / progress.length : 0
    };
  }
}