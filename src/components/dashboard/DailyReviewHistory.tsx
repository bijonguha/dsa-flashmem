import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface DailyReviewData {
  date: string;
  flashcards: {
    id: string;
    question: string;
    self_rating: 'again' | 'hard' | 'good' | 'easy';
    time_taken: number;
  }[];
}

interface DailyReviewHistoryProps {
  dailyHistory: Record<string, DailyReviewData>;
  className?: string;
}

// Helper component for rating distribution visualization
const RatingDistribution: React.FC<{ flashcards: DailyReviewData['flashcards'] }> = ({ flashcards }) => {
  const ratingCounts = useMemo(() => {
    const counts = { again: 0, hard: 0, good: 0, easy: 0 };
    flashcards.forEach(card => {
      counts[card.self_rating]++;
    });
    return counts;
  }, [flashcards]);

  const ratingColors = {
    again: 'bg-red-500',
    hard: 'bg-amber-500',
    good: 'bg-blue-500',
    easy: 'bg-emerald-500'
  };

  const ratingLabels = {
    again: 'Again',
    hard: 'Hard',
    good: 'Good',
    easy: 'Easy'
  };

  const nonZeroRatings = Object.entries(ratingCounts).filter(([, count]) => count > 0);

  if (nonZeroRatings.length === 0) return null;

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
      {nonZeroRatings.map(([rating, count]) => (
        <div key={rating} className="flex items-center gap-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ratingColors[rating as keyof typeof ratingColors]}`} />
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{count}</span>
          <span className="text-xs text-gray-500 dark:text-gray-500 hidden sm:inline whitespace-nowrap">
            {ratingLabels[rating as keyof typeof ratingLabels]}
          </span>
        </div>
      ))}
    </div>
  );
};


// Main component
export const DailyReviewHistory: React.FC<DailyReviewHistoryProps> = ({
  dailyHistory,
  className = ''
}) => {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const sortedDays = useMemo(() => {
    return Object.entries(dailyHistory)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());
  }, [dailyHistory]);

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };


  if (sortedDays.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">No review history available yet.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Complete some flashcards to see your daily review history here!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Daily Review History
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {sortedDays.length} day{sortedDays.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3">
        {sortedDays.map(([date, dayData]) => {
          const isExpanded = expandedDays.has(date);

          return (
            <div
              key={date}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Day Header */}
              <button
                onClick={() => toggleDay(date)}
                className="w-full px-3 sm:px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-expanded={isExpanded}
                aria-controls={`day-content-${date}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {dayData.flashcards.length} reviews
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <RatingDistribution flashcards={dayData.flashcards} />
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </button>

              {/* Day Content */}
              <div
                id={`day-content-${date}`}
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 pb-4">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {dayData.flashcards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {card.question}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              card.self_rating === 'easy'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : card.self_rating === 'good'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : card.self_rating === 'hard'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                            aria-label={`Rating: ${card.self_rating}`}
                          >
                            {card.self_rating}
                          </span>

                          <div className="text-xs text-gray-500 dark:text-gray-400 min-w-[2.5rem] text-right font-mono">
                            {Math.floor(card.time_taken / 60)}:{(card.time_taken % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};