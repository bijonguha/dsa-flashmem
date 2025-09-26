
import React, { useMemo, useState } from 'react';

interface WeeklyProgressData {
  date: string;
  completed: number;
  correct: number;
  incorrect: number;
  accuracy: number;
}

interface WeeklyProgressProps {
  data: WeeklyProgressData[];
  onDayClick?: (day: WeeklyProgressData) => void;
  showDetails?: boolean;
  weeklyGoal?: number;
  className?: string;
}

// Helper to determine the color intensity based on activity and accuracy
const getActivityColor = (completed: number, accuracy: number) => {
  if (completed === 0) return 'bg-gray-200 dark:bg-gray-700';
  // Prioritize accuracy for color coding
  if (accuracy < 0.5) return 'bg-amber-300 dark:bg-amber-700';
  if (completed >= 4) return 'bg-emerald-600 dark:bg-emerald-500';
  return 'bg-emerald-400 dark:bg-emerald-600';
};

// Helper to calculate the current study streak
const calculateStreak = (data: WeeklyProgressData[]) => {
  let streak = 0;
  // Calculate streak from the most recent days
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].completed > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

// Helper to calculate trend (improving/stable/declining)
const calculateTrend = (data: WeeklyProgressData[]) => {
  if (data.length < 2) return 'stable';
  const mid = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, mid);
  const secondHalf = data.slice(mid);

  const firstAvg = firstHalf.reduce((sum, d) => sum + d.accuracy, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.accuracy, 0) / secondHalf.length;

  if (secondAvg - firstAvg > 0.05) return 'improving';
  if (firstAvg - secondAvg > 0.05) return 'declining';
  return 'stable';
};

// Small inline sparkline component
const Sparkline: React.FC<{ data: number[]; className?: string }> = ({ data, className = '' }) => {
  if (!data.length) return null;

  const width = 60;
  const height = 20;
  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * (height - 4)}`)
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`opacity-75 ${className}`}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-600 dark:text-emerald-400"
      />
    </svg>
  );
};

export const WeeklyProgress: React.FC<WeeklyProgressProps> = ({
  data,
  onDayClick,
  showDetails = false,
  weeklyGoal = 5,
  className = '',
}) => {
  const [selectedDay, setSelectedDay] = useState<WeeklyProgressData | null>(null);

  // Process data - show latest 7 days
  const days = useMemo(() => data.slice(-7), [data]);

  const streak = useMemo(() => calculateStreak(days), [days]);
  const trend = useMemo(() => calculateTrend(days), [days]);

  // Generate smart insight message
  const insight = useMemo(() => {
    if (streak >= weeklyGoal) return `🎉 Amazing! You've hit your ${weeklyGoal}-day weekly goal!`;
    if (trend === 'improving') return '📈 Accuracy improving this week — keep it up!';
    if (trend === 'declining') return '📉 Focus on harder cards to improve accuracy.';
    if (streak > 0) return `🔥 ${streak}-day streak! ${weeklyGoal - streak} more days to reach your goal.`;
    return '💪 Start studying today to build momentum!';
  }, [streak, weeklyGoal, trend]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, day: WeeklyProgressData) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDayClick(day);
    } else if (event.key === 'Escape' && selectedDay) {
      setSelectedDay(null);
    }
  };

  const handleDayClick = (day: WeeklyProgressData) => {
    setSelectedDay(selectedDay?.date === day.date ? null : day);
    onDayClick?.(day);
  };

  return (
    <section
      className={`w-full max-w-full ${className}`}
      aria-label="Weekly study progress"
    >
      {/* Header with streak and insight */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Weekly Progress
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1" aria-live="polite">
            {insight}
          </p>
        </div>

        {/* Streak badge - hidden on mobile, shown on larger screens */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Streak
          </span>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded-md text-sm font-semibold">
            {streak}d
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex items-center gap-2">
        {/* 7-day contribution grid */}
        <div className="flex gap-1.5 flex-1" role="list" aria-label="Daily activity grid">
          {days.map((day, index) => {
            const color = getActivityColor(day.completed, day.accuracy);
            const studied = day.completed > 0;

            return (
              <button
                key={`${day.date}-${index}`}
                role="listitem"
                onClick={() => handleDayClick(day)}
                onKeyDown={(e) => handleKeyDown(e, day)}
                aria-expanded={selectedDay?.date === day.date}
                aria-label={`${day.date} — ${studied ? 'studied' : 'not studied'}, ${day.completed} cards, accuracy ${Math.round(day.accuracy * 100)}%`}
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center
                  transition-all duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500
                  hover:scale-105 active:scale-95
                  ${color}
                  ${studied ? 'ring-1 ring-black/5 dark:ring-white/10' : 'opacity-70'}
                  relative
                `}
                title={`${day.date} — ${day.completed} reviewed — ${Math.round(day.accuracy * 100)}% accuracy`}
              >
                {/* Activity indicator */}
                {studied && (
                  <span className="text-xs font-medium text-white/90 select-none">
                    {day.completed > 9 ? '9+' : day.completed}
                  </span>
                )}

                {/* Accuracy indicator dot */}
                {studied && day.accuracy < 0.7 && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Mini sparkline - shown on tablet and desktop */}
        <div className="hidden md:flex items-center ml-2">
          <Sparkline data={days.map(d => d.accuracy)} />
        </div>
      </div>

      {/* Detailed view (optional) */}
      {showDetails && selectedDay && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {selectedDay.date} Details
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Cards Reviewed:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {selectedDay.completed}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {Math.round(selectedDay.accuracy * 100)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Correct:</span>
              <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">
                {selectedDay.correct}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Incorrect:</span>
              <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">
                {selectedDay.incorrect}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile streak indicator */}
      <div className="sm:hidden mt-3 flex items-center justify-center">
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-sm font-semibold">
          🔥 {streak} day streak
        </div>
      </div>
    </section>
  );
};
