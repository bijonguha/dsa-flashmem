import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Upload } from 'lucide-react';
import { useAppData } from '../../hooks/useAppData';

export const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const { stats, flashcardCount, startReview } = useAppData();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Welcome to DSA FlashMem
        </h2>
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
};