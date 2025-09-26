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
      console.log('Adding flashcard:', flashcard);
      const { data, error } = await supabase.from('flashcards').insert([flashcard]).select();
      if (error) {
        console.error('Error adding flashcard:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      console.log('Successfully added flashcard:', data);
      return data;
    } catch (error) {
      console.error('Flashcard insert failed:', error);
      throw error;
    }
  }

  static async addFlashcards(flashcards: Flashcard[]) {
    try {
      console.log('Adding flashcards:', flashcards.length, 'items');
      const { data, error } = await supabase.from('flashcards').upsert(flashcards, { onConflict: 'id' }).select();
      if (error) {
        console.error('Error adding flashcards:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      console.log('Successfully upserted flashcards:', data?.length, 'items');
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
    return data.map((p: any) => this.parseProgress(p));
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

  // -- Wrapper to get due cards similar to local DatabaseService --
  static async getDueCards(userId: string) {
    const all = await this.getAllProgress(userId);
    const now = new Date();
    return all.filter((p) => p.next_review_date <= now);
  }

  // --- Sessions ---
  static async addSession(session: ReviewSession) {
    const { data, error } = await supabase.from('sessions').insert([session]).select();
    if (error) throw error;
    return data;
  }

  static async getAllSessions(userId: string) {
    const { data, error } = await supabase.from('sessions').select('*').eq('user_id', userId);
    if (error) throw error;
    return data.map((s: any) => this.parseSession(s));
  }

  // Get recent sessions with limit (descending by start_time)
  static async getRecentSessions(userId: string, limit: number = 10) {
    const sessions = await this.getAllSessions(userId);
    return sessions.sort((a, b) => b.start_time.getTime() - a.start_time.getTime()).slice(0, limit);
  }

  // Get sessions in date range
  static async getSessionsInDateRange(startDate: Date, endDate: Date, userId: string) {
    const sessions = await this.getAllSessions(userId);
    return sessions.filter((s) => s.start_time >= startDate && s.start_time < endDate);
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
      
      // If no settings exist, create default settings
      if (!data) {
        console.log('No settings found, creating defaults for user:', userId);
        const defaultSettings: AppSettings = {
          user_id: userId,
          timer_duration: 300,
          input_preference: 'both',
          auto_advance: false,
          show_hints: true,
          theme: 'auto',
        };
        
        // Insert default settings
        const { data: newData, error: insertError } = await supabase
          .from('settings')
          .insert([defaultSettings])
          .select()
          .single();
          
        if (insertError) {
          console.error('Error creating default settings:', insertError);
          throw insertError;
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

  // Support both updateSettings(settings: AppSettings) and updateSettings(userId, updates)
  static async updateSettings(arg1: string | AppSettings, arg2?: Partial<AppSettings>): Promise<AppSettings[]> {
    if (typeof arg1 === 'string') {
      const userId = arg1;
      const updates = arg2 || {};
      const existing = await this.getSettings(userId).catch(() => null);
      const merged: AppSettings = {
        user_id: userId,
        timer_duration: 300,
        input_preference: 'both',
        auto_advance: false,
        show_hints: true,
        theme: 'auto',
        ...(existing || {}),
        ...updates,
      };
      const { data, error } = await supabase
        .from('settings')
        .upsert(merged)
        .select();
      if (error) throw error;
      return data;
    } else {
      const settings = arg1 as AppSettings;
      const { data, error } = await supabase
        .from('settings')
        .upsert(settings)
        .select();
      if (error) throw error;
      return data;
    }
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
  private static parseProgress(p: any): UserProgress {
    return {
      ...p,
      next_review_date: p.next_review_date ? new Date(p.next_review_date) : new Date(),
      last_review_date: p.last_review_date ? new Date(p.last_review_date) : new Date(0),
    } as UserProgress;
  }

  private static parseSession(s: any): ReviewSession {
    return {
      ...s,
      start_time: s.start_time ? new Date(s.start_time) : new Date(),
      end_time: s.end_time ? new Date(s.end_time) : new Date(),
    } as ReviewSession;
  }
}
