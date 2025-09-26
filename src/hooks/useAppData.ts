import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flashcard, AppSettings, ImportResult } from '../types';
import { SupabaseDataService } from '../services/SupabaseDataService';
import { SRSService } from '../services/srs';
import { useAuth } from './useAuth';

interface StudyStats {
  dueToday: number;
  reviewedToday: number;
  totalCards: number;
  currentStreak: number;
}

export const useAppData = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [flashcardCount, setFlashcardCount] = useState(0);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    user_id: '',
    timer_duration: 300,
    input_preference: 'both',
    auto_advance: false,
    show_hints: true,
    theme: 'auto',
    daily_review_limit: undefined,
    topic_filters: undefined,
  });
  const [stats, setStats] = useState<StudyStats>({
    dueToday: 0,
    reviewedToday: 0,
    totalCards: 0,
    currentStreak: 0,
  });
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const loadDueCards = useCallback(async () => {
    if (!user) return;

    try {
      // Use filtered due cards based on user settings
      const options = {
        limit: settings.daily_review_limit,
        topicFilters: settings.topic_filters && settings.topic_filters.length > 0 
          ? settings.topic_filters 
          : undefined
      };
      
      const dueProgress = await SRSService.getDueCardsFiltered(user.id, options);
      const dueCardsPromises = dueProgress.map((progress) =>
        SupabaseDataService.getFlashcard(progress.flashcard_id, user.id),
      );

      const dueCardsResults = await Promise.all(dueCardsPromises);
      const dueCardsList = dueCardsResults.filter(
        (card): card is Flashcard => card !== null,
      );

      setDueCards(dueCardsList);
    } catch (error) {
      console.error('Failed to load due cards:', error);
    }
  }, [user, settings.daily_review_limit, settings.topic_filters]);

  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      // Use filtered stats based on user settings
      const options = {
        limit: settings.daily_review_limit,
        topicFilters: settings.topic_filters && settings.topic_filters.length > 0 
          ? settings.topic_filters 
          : undefined
      };
      
      const studyStats = await SRSService.getStudyStats(user.id, options);
      setStats({
        dueToday: studyStats.dueToday,
        reviewedToday: studyStats.reviewedToday,
        totalCards: studyStats.totalCards,
        currentStreak: studyStats.currentStreak,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [user, settings.daily_review_limit, settings.topic_filters]);

  const loadInitialData = useCallback(async () => {
    if (!user) return;

    try {
      // Load settings with better error handling
      let savedSettings;
      try {
        savedSettings = await SupabaseDataService.getSettings(user.id);
      } catch (settingsError) {
        console.error('Settings loading failed:', settingsError);
        // Use default settings if loading fails
        savedSettings = {
          user_id: user.id,
          timer_duration: 300,
          input_preference: 'both' as 'voice' | 'typing' | 'both',
          auto_advance: false,
          show_hints: true,
          theme: 'auto' as 'light' | 'dark' | 'auto',
          daily_review_limit: undefined,
          topic_filters: undefined,
        };
      }

      // Load flashcards
      const allCards = await SupabaseDataService.getAllFlashcards(user.id);

      setSettings(savedSettings);
      setFlashcardCount(allCards.length);

      // The useEffect below will trigger loadDueCards and loadStats
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user, loadInitialData]);

  const handleImportComplete = useCallback(
    async (result: ImportResult) => {
      if (!user || !result.success || result.imported_count === 0) return;

      try {
        // Import service already cleared old flashcards and added new ones
        // The cascading deletes already handled progress/sessions cleanup
        
        // Initialize progress for all imported cards (they're already in the database)
        await Promise.all(
          result.flashcards.map((card) =>
            SRSService.initializeProgress(card.id, user.id),
          ),
        );

        await loadInitialData();

        setTimeout(() => {
          navigate('/home');
        }, 2000);
      } catch (error) {
        console.error('Failed to complete import:', error);
      }
    },
    [loadInitialData, navigate, user],
  );

  const handleReviewComplete = useCallback(async () => {
    await loadInitialData();
    navigate('/home');
  }, [loadInitialData, navigate]);

  const handleResetComplete = useCallback(async () => {
    await loadInitialData();
    navigate('/dashboard');
  }, [loadInitialData, navigate]);

  const handleShowSolution = useCallback((flashcard: Flashcard) => {
    setSelectedCard(flashcard);
    setShowSolution(true);
  }, []);

  const startReview = useCallback(async () => {
    await loadDueCards();
    if (dueCards.length > 0) {
      navigate('/review');
    }
  }, [loadDueCards, dueCards.length, navigate]);

  const closeSolutionModal = useCallback(() => {
    setShowSolution(false);
    setSelectedCard(null);
  }, []);

  // Add effect to reload stats when settings change
  useEffect(() => {
    if (user && settings.user_id) {
      // Reload due cards and stats when filtering settings change
      loadDueCards();
      loadStats();
    }
  }, [user, settings.daily_review_limit, settings.topic_filters, loadDueCards, loadStats]);

  return {
    // State
    flashcardCount,
    dueCards,
    settings,
    stats,
    selectedCard,
    showSolution,

    // Actions
    setSettings,
    handleImportComplete,
    handleReviewComplete,
    handleResetComplete,
    handleShowSolution,
    startReview,
    closeSolutionModal,
    loadInitialData,
  };
};