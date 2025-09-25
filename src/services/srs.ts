import { UserProgress, SRSRating } from '../types';
import { DatabaseService } from './indexedDB';

export class SRSService {
  // Default SRS parameters (modified Anki algorithm)
  private static readonly DEFAULT_EASE_FACTOR = 2.5;
  private static readonly MINIMUM_EASE_FACTOR = 1.3;
  private static readonly INITIAL_INTERVAL = 1;
  private static readonly GRADUATION_INTERVAL = 4;

  /**
   * Calculate the next review date based on user performance
   */
  static calculateNextReview(
    currentProgress: UserProgress | null,
    rating: SRSRating,
    responseTime: number
  ): UserProgress {
    const now = new Date();
    
    // Initialize progress for new cards
    if (!currentProgress) {
      const baseInterval = rating === 'again' ? 0.1 : this.INITIAL_INTERVAL;
      
      return {
        flashcard_id: '', // Will be set by caller
        next_review_date: this.addDays(now, baseInterval),
        interval_days: baseInterval,
        ease_factor: this.DEFAULT_EASE_FACTOR,
        total_reviews: 1,
        correct_streak: rating === 'again' ? 0 : 1,
        last_review_date: now,
        average_response_time: responseTime
      };
    }

    // Update existing progress
    const updatedProgress = { ...currentProgress };
    updatedProgress.total_reviews += 1;
    updatedProgress.last_review_date = now;
    
    // Update average response time (weighted average)
    const weight = Math.min(updatedProgress.total_reviews, 10);
    updatedProgress.average_response_time = 
      (updatedProgress.average_response_time * (weight - 1) + responseTime) / weight;

    // Handle different ratings
    switch (rating) {
      case 'again':
        updatedProgress.correct_streak = 0;
        updatedProgress.interval_days = Math.max(0.1, updatedProgress.interval_days * 0.2);
        updatedProgress.ease_factor = Math.max(
          this.MINIMUM_EASE_FACTOR,
          updatedProgress.ease_factor - 0.2
        );
        break;

      case 'hard':
        updatedProgress.correct_streak = 1;
        updatedProgress.interval_days = Math.max(1, updatedProgress.interval_days * 1.2);
        updatedProgress.ease_factor = Math.max(
          this.MINIMUM_EASE_FACTOR,
          updatedProgress.ease_factor - 0.15
        );
        break;

      case 'good':
        updatedProgress.correct_streak += 1;
        if (updatedProgress.interval_days < this.GRADUATION_INTERVAL) {
          updatedProgress.interval_days = this.GRADUATION_INTERVAL;
        } else {
          updatedProgress.interval_days = Math.round(
            updatedProgress.interval_days * updatedProgress.ease_factor
          );
        }
        break;

      case 'easy':
        updatedProgress.correct_streak += 1;
        updatedProgress.ease_factor += 0.1;
        if (updatedProgress.interval_days < this.GRADUATION_INTERVAL) {
          updatedProgress.interval_days = this.GRADUATION_INTERVAL * 1.5;
        } else {
          updatedProgress.interval_days = Math.round(
            updatedProgress.interval_days * updatedProgress.ease_factor * 1.3
          );
        }
        break;
    }

    // Apply response time adjustment
    const timeAdjustment = this.calculateTimeAdjustment(responseTime, updatedProgress.average_response_time);
    updatedProgress.interval_days = Math.max(0.1, updatedProgress.interval_days * timeAdjustment);

    // Set next review date
    updatedProgress.next_review_date = this.addDays(now, updatedProgress.interval_days);

    return updatedProgress;
  }

  /**
   * Get cards due for review
   */
  static async getDueCards(): Promise<{ flashcard_id: string; priority: number }[]> {
    const dueProgress = await DatabaseService.getDueCards();
    
    return dueProgress
      .map(progress => ({
        flashcard_id: progress.flashcard_id,
        priority: this.calculatePriority(progress)
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get cards due today count
   */
  static async getDueTodayCount(): Promise<number> {
    const dueCards = await this.getDueCards();
    return dueCards.length;
  }

  /**
   * Initialize progress for a new flashcard
   */
  static async initializeProgress(flashcardId: string): Promise<void> {
    const existingProgress = await DatabaseService.getProgress(flashcardId);
    
    if (!existingProgress) {
      const initialProgress: UserProgress = {
        flashcard_id: flashcardId,
        next_review_date: new Date(), // Due immediately
        interval_days: 0,
        ease_factor: this.DEFAULT_EASE_FACTOR,
        total_reviews: 0,
        correct_streak: 0,
        last_review_date: new Date(),
        average_response_time: 0
      };
      
      await DatabaseService.updateProgress(initialProgress);
    }
  }

  /**
   * Update progress after a review session
   */
  static async updateProgress(
    flashcardId: string,
    rating: SRSRating,
    responseTime: number
  ): Promise<UserProgress> {
    const currentProgress = await DatabaseService.getProgress(flashcardId);
    const newProgress = this.calculateNextReview(currentProgress || null, rating, responseTime);
    newProgress.flashcard_id = flashcardId;
    
    await DatabaseService.updateProgress(newProgress);
    return newProgress;
  }

  /**
   * Get study statistics
   */
  static async getStudyStats(): Promise<{
    dueToday: number;
    reviewedToday: number;
    currentStreak: number;
    averageAccuracy: number;
    totalCards: number;
  }> {
    const allProgress = await DatabaseService.getAllProgress();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reviewedToday = allProgress.filter(p => 
      p.last_review_date >= today && p.last_review_date < tomorrow
    ).length;

    const dueToday = (await this.getDueCards()).length;

    // Calculate current streak (consecutive days with reviews)
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    for (let i = 0; i < 365; i++) { // Check up to a year back
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const reviewsThisDay = allProgress.filter(p =>
        p.last_review_date >= dayStart && p.last_review_date < dayEnd
      ).length;
      
      if (reviewsThisDay > 0) {
        currentStreak++;
      } else {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate average accuracy
    const accuracySum = allProgress.reduce((sum, p) => {
      return sum + (p.total_reviews > 0 ? p.correct_streak / p.total_reviews : 0);
    }, 0);
    const averageAccuracy = allProgress.length > 0 ? accuracySum / allProgress.length : 0;

    return {
      dueToday,
      reviewedToday,
      currentStreak,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      totalCards: allProgress.length
    };
  }

  /**
   * Reset a card's progress
   */
  static async resetCardProgress(flashcardId: string): Promise<void> {
    const resetProgress: UserProgress = {
      flashcard_id: flashcardId,
      next_review_date: new Date(),
      interval_days: 0,
      ease_factor: this.DEFAULT_EASE_FACTOR,
      total_reviews: 0,
      correct_streak: 0,
      last_review_date: new Date(),
      average_response_time: 0
    };
    
    await DatabaseService.updateProgress(resetProgress);
  }

  // Helper methods
  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private static calculateTimeAdjustment(currentTime: number, averageTime: number): number {
    if (averageTime === 0) return 1;
    
    const ratio = currentTime / averageTime;
    
    // If significantly faster than average, make interval slightly longer
    if (ratio < 0.5) return 1.1;
    
    // If significantly slower than average, make interval slightly shorter
    if (ratio > 2) return 0.9;
    
    return 1; // No adjustment for normal times
  }

  private static calculatePriority(progress: UserProgress): number {
    const now = new Date();
    const overdueDays = Math.max(0, (now.getTime() - progress.next_review_date.getTime()) / (1000 * 60 * 60 * 24));
    
    // Higher priority for:
    // - Overdue cards
    // - Cards with lower ease factor (struggling cards)
    // - Cards with fewer reviews (newer cards)
    let priority = overdueDays * 10;
    priority += (this.DEFAULT_EASE_FACTOR - progress.ease_factor) * 5;
    priority += Math.max(0, 10 - progress.total_reviews);
    
    return priority;
  }
}