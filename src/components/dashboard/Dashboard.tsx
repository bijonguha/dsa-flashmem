import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowUp,
} from 'lucide-react';
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
  });
  const [weeklyProgress, setWeeklyProgress] = useState<
    Array<{ date: string; completed: number; accuracy: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const generateWeeklyProgressData = useCallback(async (userId: string) => {
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const sessionsThisDay = await SupabaseDataService.getSessionsInDateRange(date, nextDay, userId);
      const completed = sessionsThisDay.length;

      // Calculate accuracy for the day
      const accuracy =
        sessionsThisDay.length > 0
          ? sessionsThisDay.reduce((sum, s) => sum + s.ai_evaluation.score, 0) /
            (sessionsThisDay.length * 100)
          : 0;

      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed,
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
      const todaySessions = await SupabaseDataService.getSessionsInDateRange(today, tomorrow, user.id);
      
      // Calculate today's review statistics
      const todayReviews = {
        again: todaySessions.filter(s => s.self_rating === 'again').length,
        hard: todaySessions.filter(s => s.self_rating === 'hard').length,
        good: todaySessions.filter(s => s.self_rating === 'good').length,
        easy: todaySessions.filter(s => s.self_rating === 'easy').length,
        total: todaySessions.length,
      };

      // Generate weekly progress data
      const weeklyData = await generateWeeklyProgressData(user.id);

      setStats({
        total_flashcards: allFlashcards.length,
        due_today: studyStats.dueToday,
        completed_today: studyStats.reviewedToday,
        current_streak: studyStats.currentStreak,
        accuracy_rate: Math.round(overallAccuracy * 100) / 100,
        average_session_time: Math.round(avgSessionTime),
        today_reviews: todayReviews,
        topics_progress: topicsProgress,
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

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_flashcards}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Due Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.due_today}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.current_streak}</p>
              <p className="text-xs text-gray-500">days</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Award className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accuracy Rate</p>
              <p className={`text-2xl font-bold ${getAccuracyColor(stats.accuracy_rate)}`}>
                {Math.round(stats.accuracy_rate * 100)}%
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Progress</h2>
          <ProgressChart data={weeklyProgress} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Study Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed Today</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{stats.completed_today}</span>
                {stats.completed_today > 0 && <ArrowUp className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg. Session Time</span>
              <span className="font-medium">{formatSessionTime(stats.average_session_time)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Review Efficiency</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{Math.round(stats.accuracy_rate * 100)}%</span>
                {stats.accuracy_rate >= 0.75 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>

            {/* Today's Review Distribution */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Today's Reviews</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{stats.today_reviews.again}</div>
                  <div className="text-xs text-gray-500">Again</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{stats.today_reviews.hard}</div>
                  <div className="text-xs text-gray-500">Hard</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.today_reviews.good}</div>
                  <div className="text-xs text-gray-500">Good</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.today_reviews.easy}</div>
                  <div className="text-xs text-gray-500">Easy</div>
                </div>
              </div>
              <div className="mt-2 text-center text-sm text-gray-500">
                Total: {stats.today_reviews.total} reviews
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Progress */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Topic Mastery</h2>
        {Object.keys(stats.topics_progress).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.topics_progress).map(([topic, progress]) => (
              <div key={topic} className="border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800">{topic}</h3>
                  <span className="text-sm text-gray-500">
                    {progress.mastered}/{progress.total}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getTopicProgressPercentage(topic)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>{getTopicProgressPercentage(topic)}% mastered</span>
                  <span>{Math.round(progress.accuracy * 100)}% accuracy</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No study data available yet.</p>
            <p className="text-sm">Start reviewing flashcards to see your progress here!</p>
          </div>
        )}
      </div>
    </div>
  );
};
