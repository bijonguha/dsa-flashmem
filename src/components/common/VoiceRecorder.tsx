import React, { useState, useCallback, useEffect, useRef, useMemo, useTransition } from 'react';
import { Mic, Square, Volume2, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

// Constants for better maintainability
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_COOLDOWN_MS = 2000;
const DEFAULT_TIMEOUT_MS = 30000;

type RecordingState = 'idle' | 'starting' | 'recording' | 'stopping' | 'error';

interface VoiceRecorderProps {
  onTranscript: (transcript: string, confidence: number) => void;
  onInterim?: (transcript: string) => void;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  timeout?: number; // Auto-stop after timeout (ms)
  placeholder?: string;
  showTranscript?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  onInterim,
  onStart,
  onStop,
  onError,
  disabled = false,
  timeout = DEFAULT_TIMEOUT_MS,
  placeholder = 'Click to start speaking...',
  showTranscript = true,
  size = 'md'
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [restartCount, setRestartCount] = useState(0);
  const restartTimeoutRef = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Derived state for backward compatibility
  const isRecording = recordingState === 'recording' || recordingState === 'starting';
  
  // Memoized callbacks to prevent unnecessary re-renders
  const stableCallbacks = useMemo(() => ({
    onResult: (finalTranscript: string, finalConfidence: number) => {
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript, finalConfidence);
        setRecordingState('idle');
        setRestartCount(0); // Reset restart count on successful completion
      }
    },
    onError: (errorMessage: string) => {
      console.error('Voice recognition error:', errorMessage);
      onError?.(errorMessage);
      setRecordingState('error');
      
      // Reset restart count on certain errors
      if (errorMessage.includes('not-allowed') || errorMessage.includes('audio-capture')) {
        setRestartCount(0);
      }
    }
  }), [onTranscript, onError]);

  const {
    isListening,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition({
    onResult: stableCallbacks.onResult,
    onError: stableCallbacks.onError,
    continuous: true,
    interimResults: true
  });

  const handleStartRecording = useCallback(() => {
    if (!isSupported) {
      const errorMsg = 'Speech recognition is not supported. Please use HTTPS or localhost and ensure your browser supports the Web Speech API.';
      onError?.(errorMsg);
      setRecordingState('error');
      return;
    }

    // Prevent starting if already in progress or if we've exceeded restart attempts
    if (recordingState !== 'idle' || restartCount >= MAX_RESTART_ATTEMPTS) {
      console.warn(`Cannot start recording: state=${recordingState}, restartCount=${restartCount}`);
      return;
    }

    startTransition(() => {
      try {
        setRecordingState('starting');
        onStart?.();
        startListening(timeout);
        setRecordingState('recording');
      } catch (error) {
        console.error('Failed to start recording:', error);
        setRecordingState('error');
        onError?.('Failed to start voice recording');
      }
    });
  }, [isSupported, recordingState, restartCount, resetTranscript, onStart, startListening, timeout, onError]);

  const handleStopRecording = useCallback(() => {
    if (recordingState === 'idle') {
      return;
    }
    
    startTransition(() => {
      try {
        setRecordingState('stopping');
        stopListening();
        onStop?.();
        
        // Clear any pending restart timeouts
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        
        setRecordingState('idle');
        setRestartCount(0);
      } catch (error) {
        console.error('Failed to stop recording:', error);
        setRecordingState('error');
      }
    });
  }, [recordingState, stopListening, onStop]);

  // Call onInterim when transcript changes during recording with debouncing
  useEffect(() => {
    if (isListening && transcript && onInterim) {
      const timeoutId = setTimeout(() => {
        onInterim(transcript);
      }, 100); // Small debounce to avoid excessive calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [transcript, isListening, onInterim]);

  // Improved auto-restart logic with proper limits and cooldown
  useEffect(() => {
    // Only auto-restart if:
    // 1. We're supposed to be recording
    // 2. Recognition stopped unexpectedly
    // 3. We haven't exceeded max restart attempts
    // 4. Speech recognition is supported
    if (recordingState === 'recording' && !isListening && isSupported && !error && restartCount < MAX_RESTART_ATTEMPTS) {
      console.log(`Auto-restarting speech recognition (attempt ${restartCount + 1}/${MAX_RESTART_ATTEMPTS})`);
      
      restartTimeoutRef.current = window.setTimeout(() => {
        setRestartCount(prev => prev + 1);
        try {
          startListening(timeout);
        } catch (error) {
          console.error('Auto-restart failed:', error);
          setRecordingState('error');
          stableCallbacks.onError('Failed to restart voice recognition');
        }
      }, RESTART_COOLDOWN_MS);
      
      return () => {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
      };
    }
  }, [recordingState, isListening, isSupported, restartCount, startListening, timeout, stableCallbacks]);

  const getButtonSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-2 w-10 h-10';
      case 'lg':
        return 'p-4 w-16 h-16';
      default:
        return 'p-3 w-12 h-12';
    }
  };

  const getIconSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      default:
        return 'h-6 w-6';
    }
  };

  const getTextSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="flex flex-col space-y-2 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className={getIconSizeClasses()} aria-hidden="true" />
          <span className={`${getTextSizeClass()} font-medium`}>
            Voice recording not available
          </span>
        </div>
        <div className="text-sm text-red-700 space-y-1">
          <p>Speech recognition requires:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>HTTPS connection or localhost</li>
            <li>Modern browser with Web Speech API support</li>
            <li>Microphone permissions enabled</li>
          </ul>
          <p className="mt-2">
            <strong>Current status:</strong> {window.location.protocol === 'https:' ? 'HTTPS ✓' : 'HTTPS ✗'} | 
            {window.location.hostname === 'localhost' ? ' Localhost ✓' : ' Localhost ✗'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Recording Controls */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={disabled || isPending || recordingState === 'starting' || recordingState === 'stopping'}
            className={`
              ${getButtonSizeClasses()}
              rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isRecording
                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 animate-pulse'
                : recordingState === 'error'
                ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500'
                : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
              }
              ${disabled || recordingState === 'starting' || recordingState === 'stopping' 
                ? 'opacity-50 cursor-not-allowed' 
                : 'text-white shadow-lg hover:shadow-xl'
              }
            `}
            title={isRecording ? 'Stop voice recording' : 'Start voice recording'}
            aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
            aria-pressed={isRecording}
            aria-describedby="recording-status"
          >
            {isRecording ? (
              <Square className={`${getIconSizeClasses()} fill-current`} />
            ) : (
              <Mic className={getIconSizeClasses()} />
            )}
          </button>

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
          )}
        </div>

        {/* Status Text */}
        <div className="flex-1" id="recording-status">
          {isRecording && (
            <div className="flex items-center space-x-2 text-red-600" role="status" aria-live="polite">
              <Volume2 className="h-4 w-4 animate-pulse" aria-hidden="true" />
              <span className={`${getTextSizeClass()} font-medium`}>
                Recording... Speak now
                {restartCount > 0 && ` (Retry ${restartCount}/${MAX_RESTART_ATTEMPTS})`}
              </span>
            </div>
          )}
          
          {recordingState === 'error' && (
            <div className="flex items-center space-x-2 text-orange-600" role="alert">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <span className={`${getTextSizeClass()} font-medium`}>
                Recording error - Click to retry
              </span>
            </div>
          )}
          
          {recordingState === 'idle' && !transcript && !error && (
            <span className={`${getTextSizeClass()} text-gray-500`}>
              {placeholder}
            </span>
          )}
        </div>
      </div>

      {/* Live Transcript */}
      {showTranscript && (transcript || error) && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          {error ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
              {!isSupported && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Refresh Page
                  </button>
                  <span className="text-xs text-gray-500">
                    Try refreshing if this is a connection issue
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {isListening ? 'Listening...' : 'Transcript'}
                </span>
                {confidence > 0 && (
                  <span className="text-xs text-gray-500">
                    Confidence: {Math.round(confidence * 100)}%
                  </span>
                )}
              </div>
              
              <div className={`${getTextSizeClass()} text-gray-800 leading-relaxed`}>
                {transcript || (
                  <span className="text-gray-400 italic">
                    {isListening ? 'Listening for speech...' : 'No speech detected'}
                  </span>
                )}
              </div>

              {/* Real-time indicator */}
              {isListening && transcript && (
                <div className="flex items-center mt-2 text-blue-600">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-xs ml-2">Processing...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Browser Support Note */}
      <div className="text-xs text-gray-500">
        <p>
          💡 For best results, speak clearly and ensure your microphone is enabled.
          {timeout && ` Recording will auto-stop after ${Math.round(timeout / 1000)} seconds.`}
        </p>
      </div>
    </div>
  );
};

export default VoiceRecorder;