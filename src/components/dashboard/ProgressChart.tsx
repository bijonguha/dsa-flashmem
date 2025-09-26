import React from 'react';

interface ProgressChartProps {
  data: Array<{
    date: string;
    completed: number;
    accuracy: number;
  }>;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  const maxCompleted = Math.max(...data.map((d) => d.completed), 1);
  const maxAccuracy = 1; // Accuracy is between 0 and 1

  const getBarHeight = (value: number, max: number) => {
    return Math.max((value / max) * 100, 2); // Minimum 2% height for visibility
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'bg-green-500';
    if (accuracy >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="flex items-end justify-between h-40 bg-gray-50 rounded-lg p-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center space-y-1 flex-1">
            {/* Accuracy Bar */}
            <div className="relative w-6 bg-gray-200 rounded-full">
              <div
                className={`${getAccuracyColor(item.accuracy)} rounded-full transition-all duration-300`}
                style={{
                  height: `${getBarHeight(item.accuracy, maxAccuracy)}%`,
                  minHeight: '4px',
                }}
                title={`Accuracy: ${Math.round(item.accuracy * 100)}%`}
              />
            </div>

            {/* Completed Cards Bar */}
            <div className="relative w-8 bg-gray-200 rounded-t-lg">
              <div
                className="bg-blue-500 rounded-t-lg transition-all duration-300"
                style={{
                  height: `${getBarHeight(item.completed, maxCompleted)}%`,
                  minHeight: '4px',
                }}
                title={`Completed: ${item.completed} cards`}
              />
            </div>

            {/* Date Label */}
            <span className="text-xs text-gray-600 font-medium">{item.date}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-700">Cards Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-2 bg-green-500 rounded"></div>
          <span className="text-gray-700">Accuracy</span>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            {data.reduce((sum, item) => sum + item.completed, 0)}
          </div>
          <div className="text-xs text-gray-600">Total Cards This Week</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {Math.round((data.reduce((sum, item) => sum + item.accuracy, 0) / data.length) * 100)}%
          </div>
          <div className="text-xs text-gray-600">Average Accuracy</div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Daily Breakdown</h4>
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-gray-600 w-12">{item.date}</span>
            <div className="flex items-center space-x-4 flex-1 ml-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{item.completed} cards</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 ${getAccuracyColor(item.accuracy)} rounded-full`}></div>
                <span>{Math.round(item.accuracy * 100)}% accuracy</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
