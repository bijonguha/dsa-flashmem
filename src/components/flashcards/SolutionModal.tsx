import React, { useState } from 'react';
import { X, Copy, ExternalLink, Clock, Zap, CheckCircle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Flashcard } from '../../types';

interface SolutionModalProps {
  flashcard: Flashcard;
  isOpen: boolean;
  onClose: () => void;
}

export const SolutionModal: React.FC<SolutionModalProps> = ({ flashcard, isOpen, onClose }) => {
  const [selectedApproach, setSelectedApproach] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = async (code: string, approachName: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(approachName);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentApproach = flashcard.solution.approaches[selectedApproach];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{flashcard.title}</h2>
            <p className="text-sm text-gray-600 mt-1">Complete Solution & Analysis</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* Left Sidebar - Approach Selection */}
          <div className="lg:w-1/4 border-r border-gray-200 p-4 bg-gray-50">
            <h3 className="font-medium text-gray-800 mb-4">Solution Approaches</h3>
            
            <div className="space-y-2">
              {flashcard.solution.approaches.map((approach, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedApproach(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedApproach === index
                      ? 'bg-blue-100 border-2 border-blue-500 text-blue-800'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm">{approach.name}</div>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {approach.time_complexity}
                    </span>
                    <span className="flex items-center">
                      <Zap className="h-3 w-3 mr-1" />
                      {approach.space_complexity}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Prerequisites */}
            {flashcard.solution.prerequisites && flashcard.solution.prerequisites.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-800 mb-3">Prerequisites</h4>
                <div className="space-y-2">
                  {flashcard.solution.prerequisites.map((prereq, index) => (
                    <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded border">
                      {prereq}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            <div className="mt-6 space-y-2">
              {flashcard.neetcode_url && (
                <button
                  onClick={() => openExternalLink(flashcard.neetcode_url!)}
                  className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-md text-sm transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>NeetCode</span>
                </button>
              )}
              
              {flashcard.solution.youtube_url && (
                <button
                  onClick={() => openExternalLink(flashcard.solution.youtube_url!)}
                  className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-md text-sm transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>YouTube</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {currentApproach.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    Time: {currentApproach.time_complexity}
                  </span>
                  <span className="flex items-center text-gray-600">
                    <Zap className="h-4 w-4 mr-1" />
                    Space: {currentApproach.space_complexity}
                  </span>
                </div>
              </div>

              {/* Explanation */}
              {currentApproach.explanation && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                  <h4 className="font-medium text-blue-800 mb-2">Approach Explanation</h4>
                  <p className="text-blue-700 text-sm leading-relaxed whitespace-pre-line">
                    {currentApproach.explanation}
                  </p>
                </div>
              )}

              {/* Code Section */}
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">Implementation</h4>
                  <button
                    onClick={() => handleCopyCode(currentApproach.code, currentApproach.name)}
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    {copiedCode === currentApproach.name ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <SyntaxHighlighter
                    language="python"
                    style={tomorrow}
                    className="rounded-lg text-sm"
                    showLineNumbers
                    wrapLines
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    {currentApproach.code}
                  </SyntaxHighlighter>
                </div>
              </div>

              {/* Complexity Analysis */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Complexity Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-700">Time Complexity</span>
                    </div>
                    <span className="text-lg font-mono text-blue-600">
                      {currentApproach.time_complexity}
                    </span>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-gray-700">Space Complexity</span>
                    </div>
                    <span className="text-lg font-mono text-green-600">
                      {currentApproach.space_complexity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Points Review */}
              <div className="mt-6 bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-3">Key Concepts to Remember</h4>
                <ul className="space-y-2">
                  {flashcard.expected_points.map((point, index) => (
                    <li key={index} className="flex items-start space-x-2 text-yellow-700">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};