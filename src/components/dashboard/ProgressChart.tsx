import React from 'react';

interface ProgressChartProps {
  data: Array<{
    date: string;
    completed: number;
    correct: number;
    incorrect: number;
    accuracy: number;
  }>;
}

/**
 * ProgressChart
 * - cleaner dual-bar visualization: completed (blue) and accuracy (accent ring)
 * - accessible colors and labels
 * - compact legend and summary
 */
export const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  const maxCompleted = Math.max(...data.map((d) => d.completed), 1);
  const avgAccuracy =
    data.length > 0 ? data.reduce((sum, d) => sum + d.accuracy, 0) / data.length : 0;

  const getHeight = (value: number, max: number) => {
    return Math.max((value / max) * 100, 6); // min 6% for visibility
  };

  return (
    <div className="space-y-4">
      {/* Chart area */}
      <div
        className="card p-4 rounded-md bg-blueGray-50"
        role="img"
        aria-label="Weekly progress chart showing completed cards and accuracy"
      >
        <div className="relative h-48 flex items-end gap-3">
          {/* subtle grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-full flex flex-col justify-between">
              {[4, 3, 2, 1, 0].map((line) => (
                <div
                  key={line}
                  className="border-t border-white/60"
                  style={{ transform: 'translateY(0.5px)' }}
                />
              ))}
            </div>
          </div>

          {data.map((item, idx) => {
            // Use real correct/incorrect data from self-ratings
            const { correct, incorrect } = item;
            // If no activity, show empty (no min-height)
            const totalBarHeight = item.completed > 0 ? getHeight(item.completed, maxCompleted) : 0;
            const correctHeightPercent =
              item.completed > 0 ? (correct / item.completed) * totalBarHeight : 0;
            const incorrectHeightPercent =
              item.completed > 0 ? (incorrect / item.completed) * totalBarHeight : 0;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                {/* Stacked bar: incorrect (bottom) + correct (top) */}
                <div
                  className="relative w-full max-w-[36px] bg-blueGray-100 rounded-md overflow-hidden"
                  title={`${item.date}: ${item.completed} cards reviewed — ${correct} good/easy, ${incorrect} again/hard`}
                  aria-hidden
                >
                  {item.completed === 0 ? (
                    // empty state when no activity
                    <div className="h-8 flex items-center justify-center text-xs text-gray-400">
                      {/* empty */}
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: `${incorrectHeightPercent}%`,
                        }}
                        className="bg-danger-500 transition-all duration-250"
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: `${incorrectHeightPercent}%`,
                          left: 0,
                          right: 0,
                          height: `${correctHeightPercent}%`,
                        }}
                        className="bg-success-500 rounded-t-md transition-all duration-250"
                      />
                    </>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-600 font-medium">{item.date}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-success-500 rounded" aria-hidden />
            <div className="text-gray-700">Good/Easy</div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-danger-500 rounded" aria-hidden />
            <div className="text-gray-700">Again/Hard</div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary-600">
              {data.reduce((s, d) => s + d.completed, 0)}
            </div>
            <div className="text-xs muted">Total this week</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-semibold text-success-600">
              {Math.round(avgAccuracy * 100)}%
            </div>
            <div className="text-xs muted">Avg accuracy</div>
          </div>
        </div>
      </div>

      {/* Daily breakdown (compact) */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Daily breakdown</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.map((d, i) => {
            // Use real correct/incorrect data from self-ratings
            const { correct, incorrect } = d;

            return (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-white rounded-md shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-600 w-12">{d.date}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 bg-success-500 rounded-full" aria-hidden />
                      {correct} good/easy
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <span className="w-3 h-3 bg-danger-500 rounded-full" aria-hidden />
                      {incorrect} again/hard
                    </span>
                  </div>
                </div>

                <div className="text-xs">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      d.accuracy >= 0.8
                        ? 'bg-success-100 text-success-600'
                        : d.accuracy >= 0.6
                          ? 'bg-warning-100 text-warning-600'
                          : 'bg-danger-100 text-danger-600'
                    }`}
                  >
                    {Math.round(d.accuracy * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
