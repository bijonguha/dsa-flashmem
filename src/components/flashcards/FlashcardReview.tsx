import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lightbulb,
  BookOpen,
  Send,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { Flashcard, SRSRating, ReviewSession, AppSettings, EvaluationResult } from '../../types'; // Add EvaluationResult
import { SupabaseDataService } from '../../services/SupabaseDataService';
import { SRSService } from '../../services/srs';
import { OpenAIService } from '../../services/openai';
import { GeminiService } from '../../services/gemini';
import Timer from '../common/Timer';
import VoiceRecorder from '../common/VoiceRecorder';

interface FlashcardReviewProps {
  flashcards: Flashcard[];
  onComplete: () => void;
  settings: AppSettings;
  onShowSolution: (flashcard: Flashcard) => void;
  userId: string; // Added userId prop
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({
  flashcards,
  onComplete,
  settings,
  onShowSolution,
  userId, // Destructure userId from props
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null); // Use EvaluationResult
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [inputMethod, setInputMethod] = useState<'voice' | 'typing'>('typing');
  const [timeSpent, setTimeSpent] = useState(0);
  const [selectedRating, setSelectedRating] = useState<SRSRating | null>(null);

  const currentCard = flashcards[currentIndex];
  const isLastCard = currentIndex === flashcards.length - 1;

  useEffect(() => {
    setSessionStartTime(new Date());
    setTimeSpent(0);
  }, [currentIndex]);

  const resetCardState = useCallback(() => {
    setUserAnswer('');
    setShowHint(false);
    setEvaluation(null);
    setIsEvaluating(false);
    setSelectedRating(null);
    setInputMethod(settings.input_preference === 'both' ? 'typing' : settings.input_preference);
  }, [settings.input_preference]);

  const handleNext = useCallback(() => {
    if (isLastCard) {
      onComplete();
    } else {
      setCurrentIndex((prev) => prev + 1);
      resetCardState();
    }
  }, [isLastCard, onComplete, resetCardState]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      resetCardState();
    }
  }, [currentIndex, resetCardState]);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    setUserAnswer((prev) => (prev ? `${prev}\n${transcript}`.trim() : transcript)); // Append final transcript
    setInputMethod('voice');
  }, []);

  const handleEvaluate = useCallback(async () => {
    if (!currentCard || !userAnswer.trim()) return;

    setIsEvaluating(true);

    try {
      console.log('Evaluating with API key:', settings.openai_api_key ? 'Present' : 'Missing');
      console.log('API key length:', settings.openai_api_key?.length || 0);
      if (settings.openai_api_key || settings.gemini_api_key) {
        let result;
        if (settings.gemini_api_key) {
          // Try Google Gemini first
          try {
            result = await GeminiService.evaluateAnswer(
              currentCard,
              userAnswer,
              settings.gemini_api_key,
            );
          } catch (geminiError) {
            // Fallback to OpenAI if Gemini fails
            if (settings.openai_api_key) {
              console.log('Gemini evaluation failed, falling back to OpenAI:', geminiError);
              result = await OpenAIService.evaluateAnswer(
                currentCard,
                userAnswer,
                settings.openai_api_key,
              );
            } else {
              throw geminiError;
            }
          }
        } else {
          // Use OpenAI only
          if (settings.openai_api_key) {
            result = await OpenAIService.evaluateAnswer(
              currentCard,
              userAnswer,
              settings.openai_api_key,
            );
          } else {
            throw new Error('OpenAI API key is required for evaluation');
          }
        }
        setEvaluation(result);
      } else {
        // Simple evaluation without AI
        const missingPoints = currentCard.expected_points.filter(
          (point) => !userAnswer.toLowerCase().includes(point.toLowerCase().split(' ')[0]),
        );

        setEvaluation({
          score: Math.max(0, 100 - missingPoints.length * 20),
          feedback:
            missingPoints.length === 0
              ? 'Good coverage of the key concepts!'
              : `Consider addressing: ${missingPoints.join(', ')}`,
          missing_points: missingPoints,
        });
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      setEvaluation({
        score: 0,
        feedback: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        missing_points: currentCard.expected_points,
      });
    } finally {
      setIsEvaluating(false);
    }
  }, [currentCard, userAnswer, settings.openai_api_key]);

  const handleSelfRating = useCallback(
    async (rating: SRSRating) => {
      if (!currentCard) return;

      // Set the selected rating for visual feedback
      setSelectedRating(rating);

      const endTime = new Date();
      const sessionTime = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);

      // Create session record
      const session: ReviewSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        flashcard_id: currentCard.id,
        user_id: userId, // Set user_id for the session
        start_time: sessionStartTime,
        end_time: endTime,
        user_answer: userAnswer,
        ai_evaluation: evaluation || {
          score: rating === 'again' ? 0 : rating === 'hard' ? 50 : rating === 'good' ? 75 : 100,
          feedback: 'Self-rated without AI evaluation',
          missing_points: [],
        },
        self_rating: rating,
        input_method: inputMethod,
        time_taken: sessionTime,
      };

      try {
        // Save session
        await SupabaseDataService.addSession(session); // Pass userId embedded in session

        // Update SRS progress
        await SRSService.updateProgress(currentCard.id, rating, sessionTime, userId); // Pass userId

        // Auto-advance if enabled
        if (settings.auto_advance) {
          setTimeout(handleNext, 1500);
        }
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    },
    [
      currentCard,
      sessionStartTime,
      userAnswer,
      evaluation,
      inputMethod,
      settings.auto_advance,
      handleNext,
      userId,
    ],
  ); // Add userId to dependencies

  const handleTimeUp = useCallback(() => {
    if (!evaluation && userAnswer.trim()) {
      handleEvaluate();
    }
  }, [evaluation, userAnswer, handleEvaluate]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 bg-green-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'Hard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRatingButtonStyles = (rating: SRSRating) => {
    const isSelected = selectedRating === rating;
    
    switch (rating) {
      case 'again':
        return isSelected 
          ? 'bg-red-200 text-red-900 border-2 border-red-400' 
          : 'bg-red-100 hover:bg-red-200 text-red-800';
      case 'hard':
        return isSelected 
          ? 'bg-orange-200 text-orange-900 border-2 border-orange-400' 
          : 'bg-orange-100 hover:bg-orange-200 text-orange-800';
      case 'good':
        return isSelected 
          ? 'bg-green-200 text-green-900 border-2 border-green-400' 
          : 'bg-green-100 hover:bg-green-200 text-green-800';
      case 'easy':
        return isSelected 
          ? 'bg-blue-200 text-blue-900 border-2 border-blue-400' 
          : 'bg-blue-100 hover:bg-blue-200 text-blue-800';
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
    }
  };

  if (!currentCard) {
    return <div className="text-center py-8">No flashcards available</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Card {currentIndex + 1} of {flashcards.length}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentCard.difficulty)}`}
              >
                {currentCard.difficulty}
              </span>
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {currentCard.topic}
              </span>
            </div>

            <Timer
              key={currentIndex} // Force reset when card changes
              duration={settings.timer_duration}
              onTimeUp={handleTimeUp}
              onTimeChange={setTimeSpent}
              autoStart={true}
              size="sm"
            />
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">{currentCard.title}</h2>

          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{currentCard.question}</p>
          </div>

          {/* Tags */}
          {currentCard.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {currentCard.tags.map((tag, index) => (
                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hint Section */}
        {currentCard.hint && (
          <div className="px-6 py-4 bg-yellow-50 border-b border-gray-200">
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center space-x-2 text-yellow-700 hover:text-yellow-800 transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm font-medium">{showHint ? 'Hide Hint' : 'Show Hint'}</span>
              {showHint ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>

            {showHint && (
              <p className="mt-2 text-sm text-yellow-800 italic">💡 {currentCard.hint}</p>
            )}
          </div>
        )}
      </div>

      {/* Answer Input */}
      <div className="bg-white rounded-lg shadow-md mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Your Answer</h3>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setInputMethod('typing')}
              className={`px-3 py-1 text-sm rounded ${
                inputMethod === 'typing'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Type
            </button>
            <button
              onClick={() => setInputMethod('voice')}
              className={`px-3 py-1 text-sm rounded ${
                inputMethod === 'voice'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Voice
            </button>
          </div>
        </div>

        {inputMethod === 'typing' ? (
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900"
            placeholder="Explain your approach, algorithm, and complexity analysis..."
          />
        ) : (
          <VoiceRecorder
            onTranscript={handleVoiceTranscript}
            placeholder="Click the microphone to start speaking..."
            timeout={settings.timer_duration * 1000}
            size="md"
          />
        )}

        {/* Answer Actions */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setUserAnswer('')}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear</span>
          </button>

          <button
            onClick={handleEvaluate}
            disabled={!userAnswer.trim() || isEvaluating}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
          >
            {isEvaluating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{isEvaluating ? 'Evaluating...' : 'Submit Answer'}</span>
          </button>
        </div>
      </div>

      {/* Evaluation Results */}
      {evaluation && (
        <div className="bg-white rounded-lg shadow-md mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">AI Evaluation</h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">{evaluation.score}/100</span>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-blue-800">{evaluation.feedback}</p>
          </div>

          {evaluation.missing_points && evaluation.missing_points.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">Missing Key Points:</h4>
              <ul className="list-disc list-inside text-yellow-700 text-sm">
                {evaluation.missing_points.map((point: string, index: number) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Self-Rating */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-800 mb-3">How difficult was this for you?</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSelfRating('again')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${getRatingButtonStyles('again')}`}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>Again</span>
              </button>
              <button
                onClick={() => handleSelfRating('hard')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${getRatingButtonStyles('hard')}`}
              >
                <span>Hard</span>
              </button>
              <button
                onClick={() => handleSelfRating('good')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${getRatingButtonStyles('good')}`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Good</span>
              </button>
              <button
                onClick={() => handleSelfRating('easy')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${getRatingButtonStyles('easy')}`}
              >
                <span>Easy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => onShowSolution(currentCard)}
            className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>View Solution</span>
          </button>
        </div>

        <button
          onClick={handleNext}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          <span>{isLastCard ? 'Complete' : 'Next'}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Time Tracking */}
      <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
        <Clock className="h-4 w-4 mr-2" />
        <span>
          Time spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};
