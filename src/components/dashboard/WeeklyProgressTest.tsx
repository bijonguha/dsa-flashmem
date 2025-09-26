import React from 'react';
import { WeeklyProgress } from './WeeklyProgress';

// Test data for edge cases
const testCases = [
  {
    name: 'No Data',
    data: [],
    description: 'Empty array - should show loading or empty state'
  },
  {
    name: 'All Zeros',
    data: [
      { date: 'Sun', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Mon', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Tue', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Wed', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Thu', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Fri', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Sat', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
    ],
    description: 'All days with zero activity'
  },
  {
    name: 'Single Day Activity',
    data: [
      { date: 'Sun', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Mon', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Tue', completed: 5, correct: 4, incorrect: 1, accuracy: 0.8 },
      { date: 'Wed', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Thu', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Fri', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Sat', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
    ],
    description: 'Single day with activity (Tuesday)'
  },
  {
    name: 'Mixed Activity',
    data: [
      { date: 'Sun', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
      { date: 'Mon', completed: 3, correct: 1, incorrect: 2, accuracy: 0.33 },
      { date: 'Tue', completed: 8, correct: 7, incorrect: 1, accuracy: 0.88 },
      { date: 'Wed', completed: 12, correct: 10, incorrect: 2, accuracy: 0.83 },
      { date: 'Thu', completed: 5, correct: 2, incorrect: 3, accuracy: 0.4 },
      { date: 'Fri', completed: 15, correct: 13, incorrect: 2, accuracy: 0.87 },
      { date: 'Sat', completed: 0, correct: 0, incorrect: 0, accuracy: 0 },
    ],
    description: 'Mixed activity with varying accuracy levels'
  },
  {
    name: 'Perfect Week',
    data: [
      { date: 'Sun', completed: 10, correct: 10, incorrect: 0, accuracy: 1.0 },
      { date: 'Mon', completed: 12, correct: 12, incorrect: 0, accuracy: 1.0 },
      { date: 'Tue', completed: 8, correct: 8, incorrect: 0, accuracy: 1.0 },
      { date: 'Wed', completed: 15, correct: 15, incorrect: 0, accuracy: 1.0 },
      { date: 'Thu', completed: 20, correct: 20, incorrect: 0, accuracy: 1.0 },
      { date: 'Fri', completed: 18, correct: 18, incorrect: 0, accuracy: 1.0 },
      { date: 'Sat', completed: 25, correct: 25, incorrect: 0, accuracy: 1.0 },
    ],
    description: 'Perfect week with 100% accuracy every day'
  },
  {
    name: 'Large Dataset (14 days)',
    data: [
      { date: 'Sun', completed: 5, correct: 4, incorrect: 1, accuracy: 0.8 },
      { date: 'Mon', completed: 8, correct: 6, incorrect: 2, accuracy: 0.75 },
      { date: 'Tue', completed: 12, correct: 9, incorrect: 3, accuracy: 0.75 },
      { date: 'Wed', completed: 15, correct: 12, incorrect: 3, accuracy: 0.8 },
      { date: 'Thu', completed: 10, correct: 7, incorrect: 3, accuracy: 0.7 },
      { date: 'Fri', completed: 18, correct: 15, incorrect: 3, accuracy: 0.83 },
      { date: 'Sat', completed: 22, correct: 18, incorrect: 4, accuracy: 0.82 },
      { date: 'Sun', completed: 6, correct: 5, incorrect: 1, accuracy: 0.83 },
      { date: 'Mon', completed: 9, correct: 7, incorrect: 2, accuracy: 0.78 },
      { date: 'Tue', completed: 14, correct: 11, incorrect: 3, accuracy: 0.79 },
      { date: 'Wed', completed: 16, correct: 13, incorrect: 3, accuracy: 0.81 },
      { date: 'Thu', completed: 11, correct: 8, incorrect: 3, accuracy: 0.73 },
      { date: 'Fri', completed: 19, correct: 16, incorrect: 3, accuracy: 0.84 },
      { date: 'Sat', completed: 24, correct: 20, incorrect: 4, accuracy: 0.83 },
    ],
    description: 'Large dataset with 14 days (should show latest 7)'
  }
];

export const WeeklyProgressTest: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">WeeklyProgress Component Tests</h1>

      {testCases.map((testCase, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{testCase.name}</h2>
          <p className="text-gray-600 mb-4">{testCase.description}</p>

          <WeeklyProgress
            data={testCase.data}
            weeklyGoal={5}
            showDetails={true}
            onDayClick={(day) => console.log('Day clicked:', day)}
            className="mb-4"
          />

          {/* Show raw data for reference */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              View Raw Data
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
              {JSON.stringify(testCase.data, null, 2)}
            </pre>
          </details>
        </div>
      ))}
    </div>
  );
};