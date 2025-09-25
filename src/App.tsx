import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { BookOpen, Upload, Settings as SettingsIcon, BarChart3, Play, Loader2 } from 'lucide-react';
import { Flashcard, AppSettings, ImportResult } from './types';
import { DatabaseService } from './services/indexedDB';
import { SRSService } from './services/srs';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy load components for better performance
const FlashcardImport = lazy(() => import('./components/flashcards/FlashcardImport').then(m => ({ default: m.FlashcardImport })));
const FlashcardReview = lazy(() => import('./components/flashcards/FlashcardReview').then(m => ({ default: m.FlashcardReview })));
const SolutionModal = lazy(() => import('./components/flashcards/SolutionModal').then(m => ({ default: m.SolutionModal })));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Settings = lazy(() => import('./components/settings/Settings').then(m => ({ default: m.Settings })));

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-3">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  </div>
);

type AppView = 'home' | 'import' | 'review' | 'settings' | 'dashboard';

// Get initial view from URL hash or localStorage
const getInitialView = (): AppView => {
  // First, try to get from URL hash
  const hash = window.location.hash.replace('#', '') as AppView;
  const validViews: AppView[] = ['home', 'import', 'review', 'settings', 'dashboard'];
  
  if (validViews.includes(hash)) {
    return hash;
  }
  
  // Fallback to localStorage
  const saved = localStorage.getItem('dsa-flashmem-currentView') as AppView;
  if (saved && validViews.includes(saved)) {
    return saved;
  }
  
  return 'home';
};

function App() {
  const [currentView, setCurrentView] = useState<AppView>(getInitialView);
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    timer_duration: 300,
    input_preference: 'both',
    auto_advance: false,
    show_hints: true,
    theme: 'auto'
  });
  const [stats, setStats] = useState({
    dueToday: 0,
    reviewedToday: 0,
    totalCards: 0,
    currentStreak: 0
  });
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  // Update URL and localStorage when view changes
  useEffect(() => {
    window.location.hash = currentView;
    localStorage.setItem('dsa-flashmem-currentView', currentView);
  }, [currentView]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as AppView;
      const validViews: AppView[] = ['home', 'import', 'review', 'settings', 'dashboard'];
      
      if (validViews.includes(hash)) {
        setCurrentView(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Define helper functions first
  const loadDueCardsHelper = useCallback(async () => {
    try {
      const dueProgress = await SRSService.getDueCards();
      
      // Load all due cards in parallel for better performance
      const dueCardsPromises = dueProgress.map(progress => 
        DatabaseService.getFlashcard(progress.flashcard_id)
      );
      
      const dueCardsResults = await Promise.all(dueCardsPromises);
      const dueCardsList = dueCardsResults.filter((card): card is Flashcard => card !== null);
      
      setDueCards(dueCardsList);
    } catch (error) {
      console.error('Failed to load due cards:', error);
    }
  }, []);

  const loadStatsHelper = useCallback(async () => {
    try {
      const studyStats = await SRSService.getStudyStats();
      setStats({
        dueToday: studyStats.dueToday,
        reviewedToday: studyStats.reviewedToday,
        totalCards: studyStats.totalCards,
        currentStreak: studyStats.currentStreak
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      // Load all data in parallel for better performance
      const [savedSettings, allCards] = await Promise.all([
        DatabaseService.getSettings(),
        DatabaseService.getAllFlashcards()
      ]);
      
      setSettings(savedSettings);
      setFlashcardCount(allCards.length);

      // Load due cards and stats in parallel
      await Promise.all([
        loadDueCardsHelper(),
        loadStatsHelper()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, [loadDueCardsHelper, loadStatsHelper]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Expose loadDueCards for external use
  const loadDueCards = loadDueCardsHelper;

  // Remove unused loadStats reference since it's only used internally

  const handleImportComplete = useCallback(async (result: ImportResult) => {
    if (result.success && result.imported_count > 0) {
      try {
        // Initialize progress for new cards in parallel
        await Promise.all(
          result.flashcards.map(card => SRSService.initializeProgress(card.id))
        );
        
        // Reload data
        await loadInitialData();
        
        // Show success message and redirect to home
        setTimeout(() => {
          setCurrentView('home');
        }, 2000);
      } catch (error) {
        console.error('Failed to complete import:', error);
      }
    }
  }, [loadInitialData]);

  const handleReviewComplete = useCallback(async () => {
    await loadInitialData();
    setCurrentView('home');
  }, [loadInitialData]);

  const handleShowSolution = useCallback((flashcard: Flashcard) => {
    setSelectedCard(flashcard);
    setShowSolution(true);
  }, []);

  const startReview = useCallback(async () => {
    await loadDueCards();
    if (dueCards.length > 0) {
      setCurrentView('review');
    }
  }, [loadDueCards, dueCards.length]);

  // Memoize navigation to prevent unnecessary re-renders
  const navigation = useMemo(() => (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">DSA FlashMem</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'home'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Home
            </button>
            
            <button
              onClick={() => setCurrentView('import')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'import'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
            
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setCurrentView('settings')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'settings'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <SettingsIcon className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  ), [currentView]);

  const renderHomeView = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Welcome to DSA FlashMem
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Master data structures and algorithms through AI-powered flashcards with spaced repetition,
          voice interaction, and comprehensive solution analysis.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">{stats.dueToday}</div>
          <div className="text-sm text-gray-600">Due Today</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">{stats.reviewedToday}</div>
          <div className="text-sm text-gray-600">Reviewed Today</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">{flashcardCount}</div>
          <div className="text-sm text-gray-600">Total Cards</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-2">{stats.currentStreak}</div>
          <div className="text-sm text-gray-600">Day Streak</div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-xl font-bold mb-3">Start Review Session</h3>
          <p className="text-blue-100 mb-4">
            {stats.dueToday > 0 
              ? `${stats.dueToday} cards are ready for review`
              : 'No cards due for review today'
            }
          </p>
          <button
            onClick={startReview}
            disabled={stats.dueToday === 0}
            className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4" />
            <span>Start Review</span>
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-xl font-bold mb-3">Import Flashcards</h3>
          <p className="text-green-100 mb-4">
            Add new flashcards from JSON or CSV files
          </p>
          <button
            onClick={() => setCurrentView('import')}
            className="flex items-center space-x-2 bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-green-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import Cards</span>
          </button>
        </div>
      </div>

      {flashcardCount === 0 && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Get Started</h3>
          <p className="text-yellow-700 mb-4">
            You don't have any flashcards yet. Import some flashcards to begin your DSA preparation journey.
          </p>
          <button
            onClick={() => setCurrentView('import')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Import Your First Cards
          </button>
        </div>
      )}
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'import':
        return (
          <Suspense fallback={<LoadingSpinner message="Loading import..." />}>
            <FlashcardImport onImportComplete={handleImportComplete} />
          </Suspense>
        );
      
      case 'review':
        return dueCards.length > 0 ? (
          <Suspense fallback={<LoadingSpinner message="Loading review..." />}>
            <FlashcardReview
              flashcards={dueCards}
              onComplete={handleReviewComplete}
              settings={settings}
              onShowSolution={handleShowSolution}
            />
          </Suspense>
        ) : (
          <div className="max-w-2xl mx-auto p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Cards Due</h2>
            <p className="text-gray-600">You're all caught up! Come back later for more review.</p>
            <button
              onClick={() => setCurrentView('home')}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Back to Home
            </button>
          </div>
        );
      
      case 'settings':
        return (
          <Suspense fallback={<LoadingSpinner message="Loading settings..." />}>
            <Settings
              settings={settings}
              onSettingsChange={setSettings}
            />
          </Suspense>
        );
      
      case 'dashboard':
        return (
          <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
            <Dashboard />
          </Suspense>
        );
      
      default:
        return renderHomeView();
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {navigation}
        <main className="py-8">
          <ErrorBoundary fallback={<LoadingSpinner message="Loading component..." />}>
            {renderCurrentView()}
          </ErrorBoundary>
        </main>
        
        {showSolution && selectedCard && (
          <Suspense fallback={<LoadingSpinner message="Loading solution..." />}>
            <SolutionModal
              flashcard={selectedCard}
              isOpen={showSolution}
              onClose={() => setShowSolution(false)}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;