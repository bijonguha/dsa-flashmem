import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Clock, Target, Award, Calendar } from 'lucide-react';
import { SupabaseDataService } from '../../services/SupabaseDataService';
import { SRSService } from '../../services/srs';
import { DashboardStats } from '../../types';
import { ProgressChart } from './ProgressChart';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth

export const Dashboard: React.FC = () => {
  const { user } = useAuth(); // Get user from AuthContext
  const [stats, setStats] = useState<DashboardStats>({
    total_flashcards: 0,
    due_today: 0,
    completed_today: 0,
    current_streak: 0,
    accuracy_rate: 0,
    average_session_time: 0,
    today_reviews: {
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
      total: 0,
    },
    topics_progress: {},
    daily_review_history: {},
  });
  const [weeklyProgress, setWeeklyProgress] = useState<
    Array<{ date: string; completed: number; correct: number; incorrect: number; accuracy: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const generateWeeklyProgressData = useCallback(async (userId: string) => {
    const data = [];
    const today = new Date();
    // Set to start of day in local timezone
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const sessionsThisDay = await SupabaseDataService.getSessionsInDateRange(
        date,
        nextDay,
        userId,
      );
      const completed = sessionsThisDay.length;

      // Count based on self-ratings (most accurate approach)
      const correctSessions = sessionsThisDay.filter(
        (s) => s.self_rating === 'good' || s.self_rating === 'easy',
      ).length;
      const incorrectSessions = sessionsThisDay.filter(
        (s) => s.self_rating === 'again' || s.self_rating === 'hard',
      ).length;

      // Calculate accuracy based on self-ratings
      const accuracy = completed > 0 ? correctSessions / completed : 0;

      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed,
        correct: correctSessions,
        incorrect: incorrectSessions,
        accuracy: Math.round(accuracy * 100) / 100,
      });
    }

    return data;
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);

      // Load basic stats
      const studyStats = await SRSService.getStudyStats(user.id);
      const allFlashcards = await SupabaseDataService.getAllFlashcards(user.id);
      const allProgress = await SupabaseDataService.getAllProgress(user.id);

      // Calculate topic progress
      const topicsProgress: Record<string, { total: number; mastered: number; accuracy: number }> =
        {};

      for (const card of allFlashcards) {
        if (!topicsProgress[card.topic]) {
          topicsProgress[card.topic] = { total: 0, mastered: 0, accuracy: 0 };
        }
        topicsProgress[card.topic].total++;

        const progress = allProgress.find((p) => p.flashcard_id === card.id);
        if (progress) {
          // Consider mastered if reviewed 3+ times with ease factor >= 2.0
          if (progress.total_reviews >= 3 && progress.ease_factor >= 2.0) {
            topicsProgress[card.topic].mastered++;
          }
          // Calculate topic accuracy
          if (progress.total_reviews > 0) {
            topicsProgress[card.topic].accuracy += progress.correct_streak / progress.total_reviews;
          }
        }
      }

      // Average accuracy per topic
      Object.keys(topicsProgress).forEach((topic) => {
        const cardsInTopic = allFlashcards.filter((c) => c.topic === topic).length;
        if (cardsInTopic > 0) {
          topicsProgress[topic].accuracy = topicsProgress[topic].accuracy / cardsInTopic;
        }
      });

      // Calculate overall accuracy
      const totalAccuracy = allProgress.reduce((sum, p) => {
        return sum + (p.total_reviews > 0 ? p.correct_streak / p.total_reviews : 0);
      }, 0);
      const overallAccuracy = allProgress.length > 0 ? totalAccuracy / allProgress.length : 0;

      // Calculate average session time
      const recentSessions = await SupabaseDataService.getRecentSessions(user.id, 50);
      const avgSessionTime =
        recentSessions.length > 0
          ? recentSessions.reduce((sum, s) => sum + s.time_taken, 0) / recentSessions.length
          : 0;

      // Get today's sessions for detailed review statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todaySessions = await SupabaseDataService.getSessionsInDateRange(
        today,
        tomorrow,
        user.id,
      );

      // Calculate today's review statistics
      const todayReviews = {
        again: todaySessions.filter((s) => s.self_rating === 'again').length,
        hard: todaySessions.filter((s) => s.self_rating === 'hard').length,
        good: todaySessions.filter((s) => s.self_rating === 'good').length,
        easy: todaySessions.filter((s) => s.self_rating === 'easy').length,
        total: todaySessions.length,
      };

      // Generate weekly progress data
      const weeklyData = await generateWeeklyProgressData(user.id);

      // Fetch all sessions and flashcards for daily review history
      const allSessions = await SupabaseDataService.getAllSessions(user.id);
      const flashcardMap = new Map(allFlashcards.map((card) => [card.id, card]));

      // Build an intermediate map that stores the latest session per flashcard per day (includes timestamp)
      const dailyReviewHistoryMap: Record<
        string,
        {
          date: string;
          flashcards: {
            id: string;
            question: string;
            self_rating: 'again' | 'hard' | 'good' | 'easy';
            time_taken: number;
            timestamp: number;
          }[];
        }
      > = {};

      allSessions.forEach((session) => {
        const timestamp = new Date(session.start_time).getTime();
        const sessionDate = new Date(session.start_time).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        if (!dailyReviewHistoryMap[sessionDate]) {
          dailyReviewHistoryMap[sessionDate] = { date: sessionDate, flashcards: [] };
        }

        const flashcard = flashcardMap.get(session.flashcard_id);
        if (!flashcard) return;

        const existingIndex = dailyReviewHistoryMap[sessionDate].flashcards.findIndex(
          (f) => f.id === session.flashcard_id,
        );

        const entry = {
          id: flashcard.id,
          question: flashcard.question,
          self_rating: session.self_rating,
          time_taken: session.time_taken,
          timestamp,
        };

        if (existingIndex === -1) {
          dailyReviewHistoryMap[sessionDate].flashcards.push(entry);
        } else {
          // Keep the latest session for the flashcard (by timestamp)
          if (dailyReviewHistoryMap[sessionDate].flashcards[existingIndex].timestamp < timestamp) {
            dailyReviewHistoryMap[sessionDate].flashcards[existingIndex] = entry;
          }
        }
      });

      // Convert to the DashboardStats type by stripping internal timestamps
      const dailyReviewHistory: DashboardStats['daily_review_history'] = {};
      Object.keys(dailyReviewHistoryMap).forEach((dateKey) => {
        dailyReviewHistory[dateKey] = {
          date: dailyReviewHistoryMap[dateKey].date,
          flashcards: dailyReviewHistoryMap[dateKey].flashcards.map((f) => ({
            id: f.id,
            question: f.question,
            self_rating: f.self_rating,
            time_taken: f.time_taken,
          })),
        };
      });

      setStats({
        total_flashcards: allFlashcards.length,
        due_today: studyStats.dueToday,
        completed_today: studyStats.reviewedToday,
        current_streak: studyStats.currentStreak,
        accuracy_rate: Math.round(overallAccuracy * 100) / 100,
        average_session_time: Math.round(avgSessionTime),
        today_reviews: todayReviews,
        topics_progress: topicsProgress,
        daily_review_history: dailyReviewHistory,
      });

      setWeeklyProgress(weeklyData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, generateWeeklyProgressData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getTopicProgressPercentage = (topic: string) => {
    const progress = stats.topics_progress[topic];
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.mastered / progress.total) * 100);
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'text-green-600';
    if (accuracy >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatSessionTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Color for accuracy gauge (hex) derived from accuracy value
  const accuracyHex =
    stats && typeof stats.accuracy_rate === 'number'
      ? stats.accuracy_rate >= 0.8
        ? '#10b981'
        : stats.accuracy_rate >= 0.6
          ? '#f59e0b'
          : '#ef4444'
      : '#3b82f6';

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* KPI skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 w-3/4">
                  <div className="h-4 w-32 skeleton rounded"></div>
                  <div className="h-6 w-20 skeleton rounded"></div>
                </div>
                <div className="h-10 w-10 skeleton rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + stats skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 h-56">
            <div className="h-full skeleton rounded"></div>
          </div>
          <div className="card p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-40 skeleton rounded" />
                <div className="h-4 w-12 skeleton rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Topics skeleton */}
        <div className="card p-6">
          <div className="h-4 w-48 skeleton rounded mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 skeleton rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={loadDashboardData}
          className="inline-flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md shadow-sm focus:shadow-focus transition-transform duration-250"
          aria-label="Refresh dashboard data"
        >
          <TrendingUp className="h-5 w-5" aria-hidden />
          <span>Refresh</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium muted">Total Cards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_flashcards}</p>
            </div>
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-50">
              <BarChart3 className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="mt-3 muted text-xs">All flashcards in your collection</div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium muted">Due Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.due_today}</p>
            </div>
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-warning-100">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
          </div>
          <div className="mt-3 muted text-xs">Cards scheduled for review today</div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium muted">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.current_streak}</p>
              <div className="text-xs muted">days</div>
            </div>
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-success-50">
              <Award className="h-5 w-5 text-success-600" />
            </div>
          </div>
          <div className="mt-3 muted text-xs">Keep the streak going!</div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium muted">Accuracy Rate</p>
              <p className={`text-2xl font-bold ${getAccuracyColor(stats.accuracy_rate)}`}>
                {Math.round(stats.accuracy_rate * 100)}%
              </p>
            </div>
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-50">
              <Target className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="mt-3 muted text-xs">Average correctness across reviews</div>
        </div>
      </div>

      {/* Progress Chart and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Progress</h2>
          <div>
            <ProgressChart data={weeklyProgress} />
          </div>
        </div>

        <div className="card p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Study Stats</h2>

          {/* Review Efficiency - Featured prominently */}
          <div className="flex items-center justify-center space-x-6 py-4">
            <div className="w-24 h-24 flex items-center justify-center">
              {/* Circular gauge */}
              <svg width="96" height="96" viewBox="0 0 36 36" aria-hidden>
                <path
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#eef2f6"
                  strokeWidth="2.5"
                />
                <path
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831"
                  fill="none"
                  stroke={accuracyHex}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: `${Math.max(0, Math.min(1, stats.accuracy_rate)) * 100}, 100`,
                    transform: 'rotate(-90deg)',
                    transformOrigin: '18px 18px',
                  }}
                />
                <text
                  x="50%"
                  y="52%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  style={{ fontSize: '10px', fill: '#1f2937', fontWeight: 700 }}
                >
                  {Math.round(stats.accuracy_rate * 100)}%
                </text>
              </svg>
            </div>

            <div className="text-center">
              <div className="text-sm muted mb-1">Review Efficiency</div>
              <div className={`text-3xl font-bold ${getAccuracyColor(stats.accuracy_rate)} mb-1`}>
                {Math.round(stats.accuracy_rate * 100)}%
              </div>
              <div className="text-xs muted max-w-40">Average correctness across all reviews</div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg text-center">
              <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
                Today
              </div>
              <div className="text-2xl font-bold text-blue-700 mb-1">{stats.completed_today}</div>
              <div className="text-xs text-blue-600">completed</div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg text-center">
              <div className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-1">
                Due
              </div>
              <div className="text-2xl font-bold text-purple-700 mb-1">{stats.due_today}</div>
              <div className="text-xs text-purple-600">cards</div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg text-center">
              <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">
                Streak
              </div>
              <div className="text-2xl font-bold text-green-700 mb-1">{stats.current_streak}</div>
              <div className="text-xs text-green-600">days</div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg text-center">
              <div className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">
                Avg Session
              </div>
              <div className="text-2xl font-bold text-orange-700 mb-1">
                {Math.floor(stats.average_session_time / 60)}m
              </div>
              <div className="text-xs text-orange-600">per session</div>
            </div>
          </div>

          {/* Today's Review Distribution */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Today's Review Performance</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-red-700">
                  {stats.today_reviews.again}
                </span>
                <span className="text-sm text-red-600">Again</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-orange-50 border border-orange-200">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm font-medium text-orange-700">
                  {stats.today_reviews.hard}
                </span>
                <span className="text-sm text-orange-600">Hard</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-blue-700">
                  {stats.today_reviews.good}
                </span>
                <span className="text-sm text-blue-600">Good</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-700">
                  {stats.today_reviews.easy}
                </span>
                <span className="text-sm text-green-600">Easy</span>
              </div>
            </div>
            {stats.today_reviews.total > 0 && (
              <div className="text-sm text-gray-500">
                Total: {stats.today_reviews.total} reviews completed today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topic Progress */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Topic Mastery</h2>
        {Object.keys(stats.topics_progress).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.topics_progress).map(([topic, progress]) => {
              const percent = getTopicProgressPercentage(topic);
              const radius = 18;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference * (1 - percent / 100);
              return (
                <div
                  key={topic}
                  className="flex items-center gap-4 p-3 bg-white rounded-md shadow-sm hover:shadow card"
                >
                  {/* SVG ring */}
                  <div className="flex-shrink-0">
                    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="#eef2f6"
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="#3b82f6"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 24 24)"
                      />
                      <text
                        x="50%"
                        y="50%"
                        dominantBaseline="middle"
                        textAnchor="middle"
                        className="text-xs font-semibold"
                        style={{ fontSize: 10, fill: '#1f2937' }}
                      >
                        {percent}%
                      </text>
                    </svg>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800">{topic}</h3>
                      <span className="text-sm muted">
                        {progress.mastered}/{progress.total}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                      <div>{percent}% mastered</div>
                      <div className="text-xs text-gray-500">
                        {Math.round(progress.accuracy * 100)}% accuracy
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No study data available yet.</p>
            <p className="text-sm">Start reviewing flashcards to see your progress here!</p>
          </div>
        )}
      </div>

      {/* Daily Review History */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Review History</h2>
        {Object.keys(stats.daily_review_history).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(stats.daily_review_history)
              .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()) // Sort by date descending
              .map(([date, dailyData]) => (
                <details key={date} className="bg-white rounded-md shadow-sm" role="group">
                  <summary className="flex items-center justify-between px-4 py-3 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-800">{dailyData.date}</h3>
                      <div className="text-sm muted">{dailyData.flashcards.length} reviews</div>
                    </div>
                    <div className="text-xs muted">Expand</div>
                  </summary>

                  <div className="px-4 pb-3">
                    <ul className="divide-y">
                      {dailyData.flashcards.map((card) => (
                        <li key={card.id} className="flex items-center justify-between py-2">
                          <div className="text-sm text-gray-700">{card.question}</div>
                          <div className="ml-4 flex items-center gap-2">
                            <span
                              className={`pill ${
                                card.self_rating === 'easy'
                                  ? 'bg-success-100 text-success-600'
                                  : card.self_rating === 'good'
                                    ? 'bg-primary-100 text-primary-600'
                                    : card.self_rating === 'hard'
                                      ? 'bg-warning-100 text-warning-600'
                                      : 'bg-danger-100 text-danger-600'
                              }`}
                              aria-label={`Rating ${card.self_rating}`}
                            >
                              {card.self_rating}
                            </span>
                            <div className="text-xs muted">
                              {formatSessionTime(card.time_taken)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No review history available yet.</p>
            <p className="text-sm">
              Complete some flashcards to see your daily review history here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
