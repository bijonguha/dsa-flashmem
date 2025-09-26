import { supabase } from './supabase';
import { Flashcard, UserProgress, ReviewSession, AppSettings, AnalyticsEvent } from '../types';

export class SupabaseDataService {
  // --- Profiles ---
  static async createProfile(userId: string, username: string) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id: userId, username }])
      .select();
    if (error) throw error;
    return data;
  }

  static async getProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  }

  // --- Flashcards ---
  static async addFlashcard(flashcard: Flashcard) {
    try {
      const { data, error } = await supabase.from('flashcards').insert([flashcard]).select();
      if (error) {
        console.error('Error adding flashcard:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Flashcard insert failed:', error);
      throw error;
    }
  }

  static async addFlashcards(flashcards: Flashcard[]) {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .upsert(flashcards, { onConflict: 'id' })
        .select();
      if (error) {
        console.error('Error adding flashcards:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Bulk flashcard insert failed:', error);
      throw error;
    }
  }

  static async getFlashcard(id: string, userId: string) {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  static async getAllFlashcards(userId: string) {
    try {
      const { data, error } = await supabase.from('flashcards').select('*').eq('user_id', userId);
      if (error) {
        console.error('Error fetching flashcards:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Flashcards service error:', error);
      return []; // Return empty array on error
    }
  }

  static async updateFlashcard(id: string, userId: string, updates: Partial<Flashcard>) {
    const { data, error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    if (error) throw error;
    return data;
  }

  static async deleteFlashcard(id: string, userId: string) {
    const { error } = await supabase.from('flashcards').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  }

  static async deleteAllFlashcards(userId: string) {
    const { error } = await supabase.from('flashcards').delete().eq('user_id', userId);
    if (error) throw error;
  }

  // --- Progress ---
  static async addProgress(progress: UserProgress) {
    const { data, error } = await supabase.from('progress').insert([progress]).select();
    if (error) throw error;
    return data;
  }

  static async getProgress(flashcard_id: string, userId: string) {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('flashcard_id', flashcard_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async getAllProgress(userId: string) {
    const { data, error } = await supabase.from('progress').select('*').eq('user_id', userId);
    if (error) throw error;
    // Convert date strings to Date objects
    return data.map((p: Record<string, unknown>) => this.parseProgress(p));
  }

  static async updateProgress(progress: UserProgress) {
    const { data, error } = await supabase
      .from('progress')
      .update(progress)
      .eq('flashcard_id', progress.flashcard_id)
      .eq('user_id', progress.user_id)
      .select();
    if (error) throw error;
    return data;
  }

  static async resetAllProgress(userId: string) {
    const { error: progressError } = await supabase.from('progress').delete().eq('user_id', userId);

    if (progressError) throw progressError;

    const { error: sessionsError } = await supabase.from('sessions').delete().eq('user_id', userId);

    if (sessionsError) throw sessionsError;
  }

  // -- Wrapper to get due cards similar to local DatabaseService --
  static async getDueCards(userId: string) {
    const all = await this.getAllProgress(userId);
    const now = new Date();
    return all.filter((p) => p.next_review_date <= now);
  }

  // --- Audit Methods (Admin access to all data) ---
  static async getAllFlashcardsForAudit() {
    const { data, error } = await supabase.from('flashcards').select('*');
    if (error) throw error;
    return data || [];
  }

  static async getAllProgressForAudit() {
    const { data, error } = await supabase.from('progress').select('*');
    if (error) throw error;
    return data || [];
  }

  static async getAllSessionsForAudit() {
    const { data, error } = await supabase.from('sessions').select('*');
    if (error) throw error;
    return data || [];
  }

  // --- Cleanup Methods ---
  static async deleteProgressByFlashcardId(flashcardId: string, userId: string) {
    const { error } = await supabase.from('progress')
      .delete()
      .eq('flashcard_id', flashcardId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  static async deleteSessionById(id: string) {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) throw error;
  }

  static async updateProgressUserIdByFlashcard(flashcardId: string, oldUserId: string, newUserId: string) {
    const { error } = await supabase.from('progress')
      .update({ user_id: newUserId })
      .eq('flashcard_id', flashcardId)
      .eq('user_id', oldUserId);
    if (error) throw error;
  }

  static async updateSessionUserId(sessionId: string, userId: string) {
    const { error } = await supabase.from('sessions').update({ user_id: userId }).eq('id', sessionId);
    if (error) throw error;
  }

  static async deleteProgressWithMissingUserId() {
    const { error } = await supabase.from('progress')
      .delete()
      .or('user_id.is.null,user_id.eq.');
    if (error) throw error;
  }

  static async deleteSessionsWithMissingUserId() {
    const { error } = await supabase.from('sessions')
      .delete()
      .or('user_id.is.null,user_id.eq.');
    if (error) throw error;
  }

  // --- Sessions ---
  static async addSession(session: ReviewSession) {
    const { data, error } = await supabase.from('sessions').insert([session]).select();
    if (error) throw error;
    return data;
  }

  static async getAllSessions(userId: string) {
    const { data, error } = await supabase.from('sessions').select('*').eq('user_id', userId);
    if (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
    return data.map((s: Record<string, unknown>) => this.parseSession(s));
  }

  // Get recent sessions with limit (descending by start_time)
  static async getRecentSessions(userId: string, limit: number = 10) {
    const sessions = await this.getAllSessions(userId);
    return sessions.sort((a, b) => b.start_time.getTime() - a.start_time.getTime()).slice(0, limit);
  }

  // Get sessions in date range
  static async getSessionsInDateRange(startDate: Date, endDate: Date, userId: string) {
    const sessions = await this.getAllSessions(userId);
    const filtered = sessions.filter((s) => s.start_time >= startDate && s.start_time < endDate);
    return filtered;
  }

  // --- Settings ---
  static async getSettings(userId: string): Promise<AppSettings> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows gracefully

      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }

      // If no settings exist, create default settings using upsert
      if (!data) {
        const defaultSettings: AppSettings = {
          user_id: userId,
          timer_duration: 300,
          input_preference: 'both',
          auto_advance: false,
          show_hints: true,
          theme: 'auto',
          daily_review_limit: undefined,
          topic_filters: undefined,
          // openai_api_key: undefined, // Now picked from environment variables
          // gemini_api_key: undefined, // Now picked from environment variables
        };

        // Use upsert to handle potential race conditions
        const { data: newData, error: upsertError } = await supabase
          .from('settings')
          .upsert([defaultSettings], { onConflict: 'user_id' })
          .select()
          .single();

        if (upsertError) {
          console.error('Error upserting default settings:', upsertError);
          throw upsertError;
        }

        return newData;
      }

      return data;
    } catch (error) {
      console.error('Settings service error:', error);
      // Return default settings if all else fails
      return {
        user_id: userId,
        timer_duration: 300,
        input_preference: 'both',
        auto_advance: false,
        show_hints: true,
        theme: 'auto',
      };
    }
  }

  static async updateSettings(userId: string, updates: Partial<AppSettings>): Promise<AppSettings[]> {
    if (!userId) {
      throw new Error("User ID is required to update settings.");
    }

    const existing = await this.getSettings(userId);

    const merged = {
      ...existing,
      ...updates,
    };

    // Ensure undefined becomes null for the database, which Supabase client might not handle automatically.
    if (merged.daily_review_limit === undefined) {
      (merged as any).daily_review_limit = null;
    }
    if (merged.topic_filters === undefined) {
      (merged as any).topic_filters = null;
    }

    const { data, error } = await supabase.from('settings').upsert(merged).select();
    if (error) {
      console.error('Settings upsert error:', error);
      throw error;
    }
    return data;
  }

  // --- Analytics ---
  static async addAnalyticsEvent(event: AnalyticsEvent) {
    const { data, error } = await supabase.from('analytics').insert([event]).select();
    if (error) throw error;
    return data;
  }

  static async getAllAnalyticsEvents(userId: string) {
    const { data, error } = await supabase.from('analytics').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
  }

  // --- Helpers to normalize types returned by Supabase ---
  private static parseProgress(p: Record<string, unknown>): UserProgress {
    return {
      ...p,
      next_review_date: p.next_review_date ? new Date(p.next_review_date as string) : new Date(),
      last_review_date: p.last_review_date ? new Date(p.last_review_date as string) : new Date(0),
    } as UserProgress;
  }

  private static parseSession(s: Record<string, unknown>): ReviewSession {
    const session = {
      ...s,
      start_time: s.start_time ? new Date(s.start_time as string) : new Date(),
      end_time: s.end_time ? new Date(s.end_time as string) : new Date(),
    } as ReviewSession;
    return session;
  }
}
