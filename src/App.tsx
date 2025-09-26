import { useState, useEffect, useCallback, useMemo, Suspense, lazy, ReactNode } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  Settings as SettingsIcon,
  BarChart3,
  Play,
  Loader2,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { Flashcard, AppSettings, ImportResult } from './types';
import { SupabaseDataService } from './services/SupabaseDataService';
import { SRSService } from './services/srs';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './components/auth/LandingPage';
import { AuthForm } from './components/auth/AuthForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';

// Lazy load components for better performance
const FlashcardImport = lazy(() =>
  import('./components/flashcards/FlashcardImport').then((m) => ({ default: m.FlashcardImport })),
);
const FlashcardForm = lazy(() =>
  import('./components/flashcards/FlashcardForm').then((m) => ({ default: m.FlashcardForm })),
);
const FlashcardReview = lazy(() =>
  import('./components/flashcards/FlashcardReview').then((m) => ({ default: m.FlashcardReview })),
);
const SolutionModal = lazy(() =>
  import('./components/flashcards/SolutionModal').then((m) => ({ default: m.SolutionModal })),
);
const Dashboard = lazy(() =>
  import('./components/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const Settings = lazy(() =>
  import('./components/settings/Settings').then((m) => ({ default: m.Settings })),
);

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-3">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!user) {
    // Redirect unauthenticated users to the landing page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { user, signOut, loading: authLoading } = useAuth();
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
  });
  const [stats, setStats] = useState({
    dueToday: 0,
    reviewedToday: 0,
    totalCards: 0,
    currentStreak: 0,
  });
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  // Define helper functions first
  const loadDueCardsHelper = useCallback(async () => {
    if (!user) return; // Only load if user is authenticated
    try {
      const dueProgress = await SRSService.getDueCards(user.id); // Pass user.id

      const dueCardsPromises = dueProgress.map(
        (progress) => SupabaseDataService.getFlashcard(progress.flashcard_id, user.id), // Pass user.id
      );

      const dueCardsResults = await Promise.all(dueCardsPromises);
      const dueCardsList = dueCardsResults.filter((card): card is Flashcard => card !== null);

      setDueCards(dueCardsList);
    } catch (error) {
      console.error('Failed to load due cards:', error);
    }
  }, [user]);

  const loadStatsHelper = useCallback(async () => {
    if (!user) return; // Only load if user is authenticated
    try {
      const studyStats = await SRSService.getStudyStats(user.id); // Pass user.id
      setStats({
        dueToday: studyStats.dueToday,
        reviewedToday: studyStats.reviewedToday,
        totalCards: studyStats.totalCards,
        currentStreak: studyStats.currentStreak,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [user]);

  const loadInitialData = useCallback(async () => {
    if (!user) return; // Only load if user is authenticated
    try {
      const [savedSettings, allCards] = await Promise.all([
        SupabaseDataService.getSettings(user.id), // Pass user.id
        SupabaseDataService.getAllFlashcards(user.id), // Pass user.id
      ]);

      setSettings(savedSettings);
      setFlashcardCount(allCards.length);

      await Promise.all([loadDueCardsHelper(), loadStatsHelper()]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, [user, loadDueCardsHelper, loadStatsHelper]);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user, loadInitialData]);

  const handleImportComplete = useCallback(
    async (result: ImportResult) => {
      if (!user) return; // Ensure user is not null
      if (result.success && result.imported_count > 0) {
        try {
          await Promise.all(
            result.flashcards.map((card) => SRSService.initializeProgress(card.id, user.id)),
          );

          await loadInitialData();

          setTimeout(() => {
            navigate('/home');
          }, 2000);
        } catch (error) {
          console.error('Failed to complete import:', error);
        }
      }
    },
    [loadInitialData, navigate, user],
  ); // Add user to dependencies

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
    await loadDueCardsHelper();
    if (dueCards.length > 0) {
      navigate('/review');
    }
  }, [loadDueCardsHelper, dueCards.length, navigate]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  const navigation = useMemo(
    () => (
      <nav className="bg-white shadow-md border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">DSA FlashMem</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/home')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/home'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Home
              </button>

              <button
                onClick={() => navigate('/create-flashcard')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/create-flashcard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create</span>
              </button>

              <button
                onClick={() => navigate('/import')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/import'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => navigate('/settings')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Settings</span>
              </button>

              {user && (
                <button
                  onClick={handleSignOut}
                  disabled={authLoading}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-500 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    ),
    [navigate, user, authLoading, handleSignOut],
  );

  const renderHomeView = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to DSA FlashMem</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Master data structures and algorithms through AI-powered flashcards with spaced
          repetition, voice interaction, and comprehensive solution analysis.
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
              : 'No cards due for review today'}
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
          <p className="text-green-100 mb-4">Add new flashcards from JSON or CSV files</p>
          <button
            onClick={() => navigate('/import')}
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
            You don't have any flashcards yet. Import some flashcards to begin your DSA preparation
            journey.
          </p>
          <button
            onClick={() => navigate('/import')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Import Your First Cards
          </button>
        </div>
      )}
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {navigation}
        <main className="py-8">
          <ErrorBoundary fallback={<LoadingSpinner message="Loading component..." />}>
            <Routes>
              <Route
                path="/"
                element={
                  user ? (
                    <Navigate to="/home" />
                  ) : (
                    <LandingPage
                      onSignInClick={() => navigate('/login')}
                      onSignUpClick={() => navigate('/signup')}
                    />
                  )
                }
              />
              <Route
                path="/signup"
                element={
                  <AuthForm
                    type="signUp"
                    onSwitchType={() => navigate('/login')}
                    onSuccess={() => navigate('/home')}
                    onForgotPasswordClick={() => navigate('/forgot-password')}
                  />
                }
              />
              <Route
                path="/login"
                element={
                  <AuthForm
                    type="signIn"
                    onSwitchType={() => navigate('/signup')}
                    onSuccess={() => navigate('/home')}
                    onForgotPasswordClick={() => navigate('/forgot-password')}
                  />
                }
              />
              <Route
                path="/forgot-password"
                element={<ForgotPasswordForm onBackToSignIn={() => navigate('/login')} />}
              />
              <Route
                path="/reset-password"
                element={<ResetPasswordForm onPasswordResetSuccess={() => navigate('/login')} />}
              />

              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner message="Loading home..." />}>
                      {renderHomeView()}
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-flashcard"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner message="Loading form..." />}>
                      <FlashcardForm />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/import"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner message="Loading import..." />}>
                      <FlashcardImport onImportComplete={handleImportComplete} />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/review"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner message="Loading review..." />}>
                      {dueCards.length > 0 ? (
                        <FlashcardReview
                          flashcards={dueCards}
                          onComplete={handleReviewComplete}
                          settings={settings}
                          onShowSolution={handleShowSolution}
                          userId={user!.id} // Pass user.id (assert non-null as it's in ProtectedRoute)
                        />
                      ) : (
                        <div className="max-w-2xl mx-auto p-6 text-center">
                          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Cards Due</h2>
                          <p className="text-gray-600">
                            You're all caught up! Come back later for more review.
                          </p>
                          <button
                            onClick={() => navigate('/home')}
                            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                          >
                            Back to Home
                          </button>
                        </div>
                      )}
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
                      <Dashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner message="Loading settings..." />}>
                      <Settings
                        settings={settings}
                        onSettingsChange={setSettings}
                        onResetComplete={handleResetComplete}
                      />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Fallback for unknown routes */}
              <Route path="*" element={<Navigate to={user ? '/home' : '/'} />} />
            </Routes>
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
