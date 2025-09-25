import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';

// Constants for better maintainability
const TIMER_INTERVAL_MS = 1000;
const CIRCLE_RADIUS_PERCENTAGE = 45;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS_PERCENTAGE;

interface TimerProps {
  duration: number; // in seconds
  onTimeUp?: () => void;
  onTimeChange?: (remainingTime: number) => void;
  autoStart?: boolean;
  showControls?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Timer: React.FC<TimerProps> = ({
  duration,
  onTimeUp,
  onTimeChange,
  autoStart = false,
  showControls = true,
  size = 'md'
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  
  // Use refs to avoid stale closures in intervals
  const onTimeUpRef = useRef(onTimeUp);
  const onTimeChangeRef = useRef(onTimeChange);
  
  // Keep refs current
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
    onTimeChangeRef.current = onTimeChange;
  }, [onTimeUp, onTimeChange]);

  // Reset timer when duration or autoStart changes
  useEffect(() => {
    setTimeRemaining(duration);
    setIsRunning(autoStart);
    setIsPaused(false);
  }, [duration, autoStart]);

  // Main timer logic with improved performance
  useEffect(() => {
    let interval: number | undefined;

    if (isRunning && timeRemaining > 0) {
      interval = window.setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - 1);
          
          if (newTime === 0) {
            setIsRunning(false);
            // Use ref to avoid stale closure
            onTimeUpRef.current?.();
          }
          
          return newTime;
        });
      }, TIMER_INTERVAL_MS);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeRemaining]); // Removed onTimeUp dependency to avoid stale closures

  // Separate effect to call onTimeChange without causing render issues
  useEffect(() => {
    onTimeChangeRef.current?.(timeRemaining);
  }, [timeRemaining]); // Use ref to avoid dependency on onTimeChange

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  const reset = useCallback(() => {
    setTimeRemaining(duration);
    setIsRunning(false);
    setIsPaused(false);
  }, [duration]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Memoized calculations for better performance
  const progressPercentage = useMemo((): number => {
    return duration > 0 ? ((duration - timeRemaining) / duration) * 100 : 0;
  }, [duration, timeRemaining]);

  const colorClass = useMemo((): string => {
    if (duration === 0) return 'text-gray-600';
    const percentage = (timeRemaining / duration) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 25) return 'text-yellow-600';
    return 'text-red-600';
  }, [timeRemaining, duration]);

  const progressColorClass = useMemo((): string => {
    if (duration === 0) return 'stroke-gray-500';
    const percentage = (timeRemaining / duration) * 100;
    if (percentage > 50) return 'stroke-green-500';
    if (percentage > 25) return 'stroke-yellow-500';
    return 'stroke-red-500';
  }, [timeRemaining, duration]);

  // Memoize size classes to avoid recreation on every render
  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-16 h-16',
          text: 'text-xs',
          button: 'p-1',
          icon: 'h-3 w-3'
        };
      case 'lg':
        return {
          container: 'w-32 h-32',
          text: 'text-xl font-bold',
          button: 'p-3',
          icon: 'h-6 w-6'
        };
      default:
        return {
          container: 'w-24 h-24',
          text: 'text-sm font-medium',
          button: 'p-2',
          icon: 'h-4 w-4'
        };
    }
  }, [size]);

  return (
    <div className="flex items-center space-x-4">
      {/* Circular Progress Timer */}
      <div className="relative">
        <svg className={`transform -rotate-90 ${sizeClasses.container}`}>
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            className={progressColorClass}
            strokeDasharray={`${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`}
            strokeDashoffset={`${CIRCLE_CIRCUMFERENCE * (1 - progressPercentage / 100)}`}
            style={{
              transition: 'stroke-dashoffset 1s linear'
            }}
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${sizeClasses.text} ${colorClass} text-center leading-tight`}>
            {size === 'sm' ? (
              <Clock className="h-4 w-4 mx-auto" />
            ) : (
              <div>
                <div>{formatTime(timeRemaining)}</div>
                {size === 'lg' && (
                  <div className="text-xs font-normal text-gray-500">
                    {timeRemaining === 0 ? 'Time up!' : 'remaining'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex space-x-2">
          {!isRunning && !isPaused ? (
            <button
              onClick={start}
              className={`${sizeClasses.button} bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
              title="Start"
            >
              <Play className={sizeClasses.icon} />
            </button>
          ) : (
            <button
              onClick={pause}
              className={`${sizeClasses.button} bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2`}
              title="Pause"
            >
              <Pause className={sizeClasses.icon} />
            </button>
          )}
          
          <button
            onClick={reset}
            className={`${sizeClasses.button} bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}
            title="Reset"
          >
            <Square className={sizeClasses.icon} />
          </button>
        </div>
      )}

      {/* Status indicator */}
      {timeRemaining === 0 && (
        <div className="flex items-center space-x-1 text-red-600 animate-pulse">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Time's up!</span>
        </div>
      )}
    </div>
  );
};

export default Timer;