import React, { Suspense, lazy, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { Navigation } from './components/common/Navigation';
import { HomeView } from './components/views/HomeView';
import { useAppData } from './hooks/useAppData';
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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { user, signOut } = useAuth();
  const {
    dueCards,
    settings,
    selectedCard,
    showSolution,
    setSettings,
    handleImportComplete,
    handleReviewComplete,
    handleResetComplete,
    handleShowSolution,
    closeSolutionModal,
  } = useAppData();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navigation onSignOut={signOut} />
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
                      onSignInClick={() => window.location.href = '/login'}
                      onSignUpClick={() => window.location.href = '/signup'}
                    />
                  )
                }
              />
              <Route
                path="/signup"
                element={
                  <AuthForm
                    type="signUp"
                    onSwitchType={() => window.location.href = '/login'}
                    onSuccess={() => window.location.href = '/home'}
                    onForgotPasswordClick={() => window.location.href = '/forgot-password'}
                  />
                }
              />
              <Route
                path="/login"
                element={
                  <AuthForm
                    type="signIn"
                    onSwitchType={() => window.location.href = '/signup'}
                    onSuccess={() => window.location.href = '/home'}
                    onForgotPasswordClick={() => window.location.href = '/forgot-password'}
                  />
                }
              />
              <Route
                path="/forgot-password"
                element={<ForgotPasswordForm onBackToSignIn={() => window.location.href = '/login'} />}
              />
              <Route
                path="/reset-password"
                element={<ResetPasswordForm onPasswordResetSuccess={() => window.location.href = '/login'} />}
              />

              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner message="Loading home..." />}>
                      <HomeView />
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
                          userId={user!.id}
                        />
                      ) : (
                        <div className="max-w-2xl mx-auto p-6 text-center">
                          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Cards Due</h2>
                          <p className="text-gray-600">
                            You're all caught up! Come back later for more review.
                          </p>
                          <button
                            onClick={() => window.location.href = '/home'}
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

              <Route path="*" element={<Navigate to={user ? '/home' : '/'} />} />
            </Routes>
          </ErrorBoundary>
        </main>

        {showSolution && selectedCard && (
          <Suspense fallback={<LoadingSpinner message="Loading solution..." />}>
            <SolutionModal
              flashcard={selectedCard}
              isOpen={showSolution}
              onClose={closeSolutionModal}
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
