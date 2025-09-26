import Dexie, { Table } from 'dexie';
import { Flashcard, UserProgress, ReviewSession, AppSettings, AnalyticsEvent } from '../types';

class DSAFlashMemDB extends Dexie {
  flashcards!: Table<Flashcard>;
  progress!: Table<UserProgress>;
  sessions!: Table<ReviewSession>;
  settings!: Table<AppSettings>;
  analytics!: Table<AnalyticsEvent>;

  constructor() {
    super('DSAFlashMemDB');

    this.version(1).stores({
      flashcards: 'id, user_id, topic, difficulty, *tags',
      progress: 'flashcard_id, user_id, next_review_date, last_review_date',
      sessions: 'id, user_id, flashcard_id, start_time, end_time',
      settings: 'user_id',
      analytics: '++id, user_id, event_type, timestamp',
    });
  }
}

export const db = new DSAFlashMemDB();

// Database service class with methods for all operations
export class DatabaseService {
  // Flashcard operations
  // Flashcard operations
  static async addFlashcard(flashcard: Flashcard, userId: string): Promise<void> {
    await db.flashcards.add({ ...flashcard, user_id: userId });
  }

  static async addFlashcards(flashcards: Flashcard[], userId: string): Promise<void> {
    const flashcardsWithUserId = flashcards.map((card) => ({ ...card, user_id: userId }));
    await db.flashcards.bulkAdd(flashcardsWithUserId);
  }

  static async getFlashcard(id: string, userId: string): Promise<Flashcard | undefined> {
    return await db.flashcards.where({ id, user_id: userId }).first();
  }

  static async getAllFlashcards(userId: string): Promise<Flashcard[]> {
    return await db.flashcards.where('user_id').equals(userId).toArray();
  }

  static async getFlashcardsByTopic(topic: string, userId: string): Promise<Flashcard[]> {
    return await db.flashcards.where({ topic, user_id: userId }).toArray();
  }

  static async getFlashcardsByDifficulty(
    difficulty: 'Easy' | 'Medium' | 'Hard',
    userId: string,
  ): Promise<Flashcard[]> {
    return await db.flashcards.where({ difficulty, user_id: userId }).toArray();
  }

  static async updateFlashcard(
    id: string,
    userId: string,
    updates: Partial<Flashcard>,
  ): Promise<void> {
    await db.flashcards.where({ id, user_id: userId }).modify(updates);
  }

  static async deleteFlashcard(id: string, userId: string): Promise<void> {
    await db.flashcards.where({ id, user_id: userId }).delete();
  }

  // Progress operations
  static async getProgress(
    flashcard_id: string,
    userId: string,
  ): Promise<UserProgress | undefined> {
    return await db.progress.where({ flashcard_id, user_id: userId }).first();
  }

  static async updateProgress(progress: UserProgress, userId: string): Promise<void> {
    await db.progress.put({ ...progress, user_id: userId });
  }

  static async getAllProgress(userId: string): Promise<UserProgress[]> {
    return await db.progress.where('user_id').equals(userId).toArray();
  }

  static async getDueCards(userId: string): Promise<UserProgress[]> {
    const now = new Date();
    return await db.progress
      .where('user_id')
      .equals(userId)
      .and((p) => p.next_review_date <= now)
      .toArray();
  }

  // Session operations
  static async addSession(session: ReviewSession, userId: string): Promise<void> {
    await db.sessions.add({ ...session, user_id: userId });
  }

  static async getSessionsForFlashcard(
    flashcard_id: string,
    userId: string,
  ): Promise<ReviewSession[]> {
    return await db.sessions.where({ flashcard_id, user_id: userId }).toArray();
  }

  static async getRecentSessions(userId: string, limit: number = 10): Promise<ReviewSession[]> {
    // Dexie's orderBy is on the Table, not directly on a Collection after a where clause.
    // We can sort after fetching or use sortBy on the collection.
    return await db.sessions
      .where('user_id')
      .equals(userId)
      .reverse()
      .sortBy('start_time')
      .then((arr) => arr.slice(0, limit));
  }

  static async getSessionsInDateRange(
    startDate: Date,
    endDate: Date,
    userId: string,
  ): Promise<ReviewSession[]> {
    return await db.sessions
      .where('user_id')
      .equals(userId)
      .and((s) => s.start_time >= startDate && s.start_time < endDate)
      .toArray();
  }

  // Settings operations
  static async getSettings(userId: string): Promise<AppSettings> {
    const settings = await db.settings.where('user_id').equals(userId).first();
    if (!settings) {
      const defaultSettings: AppSettings = {
        user_id: userId,
        timer_duration: 300, // 5 minutes
        input_preference: 'both',
        auto_advance: false,
        show_hints: true,
        theme: 'auto',
      };
      await db.settings.add(defaultSettings);
      return defaultSettings;
    }
    return settings;
  }

  static async updateSettings(userId: string, updates: Partial<AppSettings>): Promise<void> {
    const existingSettings = await this.getSettings(userId); // Fetch existing settings
    const updatedSettings: AppSettings = {
      ...existingSettings,
      ...updates,
      user_id: userId, // Ensure id is always set
    };
    await db.settings.put(updatedSettings);
  }

  // Analytics operations
  static async trackEvent(event: AnalyticsEvent, userId: string): Promise<void> {
    await db.analytics.add({ ...event, user_id: userId }); // Assuming AnalyticsEvent also gets user_id
  }

  static async getAnalytics(userId: string, eventType?: string): Promise<AnalyticsEvent[]> {
    let collection = db.analytics.where('user_id').equals(userId);
    if (eventType) {
      collection = collection.and((e) => e.event_type === eventType);
    }
    return await collection.toArray();
  }

  // Utility operations
  static async clearAllData(userId: string): Promise<void> {
    await db.flashcards.where('user_id').equals(userId).delete();
    await db.progress.where('user_id').equals(userId).delete();
    await db.sessions.where('user_id').equals(userId).delete();
    await db.settings.where('user_id').equals(userId).delete();
    await db.analytics.where('user_id').equals(userId).delete();
  }

  // Export/Import for a specific user
  static async exportData(userId: string): Promise<{
    flashcards: Flashcard[];
    progress: UserProgress[];
    sessions: ReviewSession[];
    settings: AppSettings[];
  }> {
    return {
      flashcards: await this.getAllFlashcards(userId),
      progress: await this.getAllProgress(userId),
      sessions: await this.getRecentSessions(userId, 99999), // Get all sessions for export
      settings: [await this.getSettings(userId)],
    };
  }

  static async importData(
    data: {
      flashcards?: Flashcard[];
      progress?: UserProgress[];
      sessions?: ReviewSession[]; // Allow importing sessions
      settings?: AppSettings[]; // Allow importing settings
    },
    userId: string,
  ): Promise<void> {
    if (data.flashcards) {
      const flashcardsWithUserId = data.flashcards.map((card) => ({ ...card, user_id: userId }));
      await db.flashcards.bulkPut(flashcardsWithUserId);
    }
    if (data.progress) {
      const progressWithUserId = data.progress.map((p) => ({ ...p, user_id: userId }));
      await db.progress.bulkPut(progressWithUserId);
    }
    if (data.sessions) {
      const sessionsWithUserId = data.sessions.map((s) => ({ ...s, user_id: userId }));
      await db.sessions.bulkPut(sessionsWithUserId);
    }
    if (data.settings && data.settings.length > 0) {
      await db.settings.put({ ...data.settings[0], user_id: userId });
    }
  }

  // Statistics helpers (needs userId)
  static async getStatistics(userId: string) {
    const flashcards = await this.getAllFlashcards(userId);
    const progress = await this.getAllProgress(userId);
    const dueCards = await this.getDueCards(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessionsToday = await this.getSessionsInDateRange(today, tomorrow, userId);

    return {
      total_flashcards: flashcards.length,
      due_today: dueCards.length,
      completed_today: sessionsToday.length,
      topics: [...new Set(flashcards.map((f) => f.topic))],
      average_accuracy:
        progress.length > 0
          ? progress.reduce((acc, p) => acc + p.correct_streak / Math.max(p.total_reviews, 1), 0) /
            progress.length
          : 0,
    };
  }

  // --- Migration Operations ---
  static async hasLocalData(): Promise<boolean> {
    const flashcardCount = await db.flashcards.count();
    const progressCount = await db.progress.count();
    const sessionCount = await db.sessions.count();
    return flashcardCount > 0 || progressCount > 0 || sessionCount > 0;
  }

  static async exportAllLocalData(): Promise<{
    flashcards: Flashcard[];
    progress: UserProgress[];
    sessions: ReviewSession[];
    settings: AppSettings[];
  }> {
    return {
      flashcards: await db.flashcards.toArray(),
      progress: await db.progress.toArray(),
      sessions: await db.sessions.toArray(),
      settings: await db.settings.toArray(),
    };
  }

  static async clearAllLocalData(): Promise<void> {
    await db.flashcards.clear();
    await db.progress.clear();
    await db.sessions.clear();
    await db.analytics.clear();
    // Note: Settings are not cleared here as they might be default app settings
    // and not user-specific in the local context.
  }
}
