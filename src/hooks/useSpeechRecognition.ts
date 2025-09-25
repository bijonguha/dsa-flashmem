import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { VoiceRecognitionState } from '../types';

// Constants for better maintainability
const DEFAULT_LANGUAGE = 'en-US';
const RECOGNITION_TIMEOUT = 30000; // 30 seconds default timeout

interface UseSpeechRecognitionProps {
  onResult?: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export const useSpeechRecognition = ({
  onResult,
  onError,
  continuous = false,
  interimResults = true
}: UseSpeechRecognitionProps = {}) => {
  const [state, setState] = useState<VoiceRecognitionState>(() => ({
    isListening: false,
    transcript: '',
    confidence: 0,
    error: undefined
  }));

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  // Memoized callback refs for better performance
  const stableCallbacks = useMemo(() => ({
    onResult: onResult || (() => {}),
    onError: onError || (() => {})
  }), [onResult, onError]);

  // Cleanup function to properly dispose of resources
  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (error) {
        // Ignore errors during cleanup
      }
      recognitionRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Check if speech recognition is supported in the current environment
  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    
    // Check for HTTPS requirement
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      console.warn('Speech recognition requires HTTPS or localhost');
      return false;
    }
    
    // Check for API support
    const hasAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (!hasAPI) {
      console.warn('Speech recognition API not supported in this browser');
      return false;
    }
    
    return true;
  }, []);

  // Initialize speech recognition with proper error handling and cleanup
  useEffect(() => {
    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Speech recognition is not supported in this browser or requires HTTPS' }));
      return;
    }

    // Prevent multiple initializations only if recognition is already created
    if (isInitializedRef.current && recognitionRef.current) {
      return;
    }

    try {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configure recognition settings
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = DEFAULT_LANGUAGE;
      recognition.maxAlternatives = 1;
      // Set grammars if available (optional for better recognition)
      if ((window as any).webkitSpeechGrammarList) {
        recognition.grammars = new (window as any).webkitSpeechGrammarList();
      }

      recognition.onstart = () => {
        setState(prev => ({ 
          ...prev, 
          isListening: true, 
          error: undefined,
          transcript: '',
          confidence: 0
        }));
      };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      try {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        // Process all results from the current event
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i] as SpeechRecognitionResult;
          const alternative = result[0];
          
          if (!alternative) continue;
          
          const { transcript, confidence } = alternative;

          if (result.isFinal) {
            finalTranscript += transcript;
            maxConfidence = Math.max(maxConfidence, confidence || 0);
          } else if (interimResults) {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        const currentConfidence = finalTranscript ? maxConfidence : 0;

        // Batch state updates
        setState(prev => ({
          ...prev,
          transcript: currentTranscript,
          confidence: currentConfidence,
          error: undefined // Clear any previous errors
        }));

        // Only call onResult for final transcripts
        if (finalTranscript.trim()) {
          stableCallbacks.onResult(finalTranscript.trim(), maxConfidence);
        }
      } catch (error) {
        console.error('Error processing speech recognition result:', error);
        stableCallbacks.onError('Failed to process speech recognition result');
      }
    };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Handle language-not-supported gracefully
        if (event.error === 'language-not-supported') {
          console.warn('Language not supported, continuing with browser default');
          return;
        }
        
        const errorMessage = getErrorMessage(event.error);
        setState(prev => ({ 
          ...prev, 
          isListening: false, 
          error: errorMessage 
        }));
        stableCallbacks.onError(errorMessage);
      };

      recognitionRef.current = recognition;
      isInitializedRef.current = true;

    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize speech recognition' 
      }));
      stableCallbacks.onError('Failed to initialize speech recognition');
    }

    return cleanup;
  }, [continuous, interimResults, isSupported, stableCallbacks, cleanup]);

  const startListening = useCallback((timeout: number = RECOGNITION_TIMEOUT) => {
    if (!isSupported) {
      const errorMsg = 'Speech recognition not available. Please use HTTPS or localhost.';
      setState(prev => ({ ...prev, error: errorMsg }));
      stableCallbacks.onError(errorMsg);
      return;
    }

    // Try to initialize if not already done
    if (!recognitionRef.current) {
      try {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        const recognition = new SpeechRecognition();

        // Configure recognition settings
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = DEFAULT_LANGUAGE;
        recognition.maxAlternatives = 1;
        if ((window as any).webkitSpeechGrammarList) {
          recognition.grammars = new (window as any).webkitSpeechGrammarList();
        }

        recognition.onstart = () => {
          setState(prev => ({ 
            ...prev, 
            isListening: true, 
            error: undefined,
            transcript: '',
            confidence: 0
          }));
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          try {
            let finalTranscript = '';
            let interimTranscript = '';
            let maxConfidence = 0;

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i] as SpeechRecognitionResult;
              const alternative = result[0];
              
              if (!alternative) continue;
              
              const { transcript, confidence } = alternative;

              if (result.isFinal) {
                finalTranscript += transcript;
                maxConfidence = Math.max(maxConfidence, confidence || 0);
              } else if (interimResults) {
                interimTranscript += transcript;
              }
            }

            const currentTranscript = finalTranscript || interimTranscript;
            const currentConfidence = finalTranscript ? maxConfidence : 0;

            setState(prev => ({
              ...prev,
              transcript: currentTranscript,
              confidence: currentConfidence,
              error: undefined
            }));

            if (finalTranscript.trim()) {
              stableCallbacks.onResult(finalTranscript.trim(), maxConfidence);
            }
          } catch (error) {
            console.error('Error processing speech recognition result:', error);
            stableCallbacks.onError('Failed to process speech recognition result');
          }
        };

        recognition.onend = () => {
          setState(prev => ({ ...prev, isListening: false }));
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'language-not-supported') {
            console.warn('Language not supported, continuing with browser default');
            return;
          }
          
          const errorMessage = getErrorMessage(event.error);
          setState(prev => ({ 
            ...prev, 
            isListening: false, 
            error: errorMessage 
          }));
          stableCallbacks.onError(errorMessage);
        };

        recognitionRef.current = recognition;
        isInitializedRef.current = true;
      } catch (error) {
        const errorMsg = 'Failed to initialize speech recognition';
        console.error(errorMsg, error);
        setState(prev => ({ ...prev, error: errorMsg }));
        stableCallbacks.onError(errorMsg);
        return;
      }
    }

    // Prevent starting if already listening
    if (state.isListening) {
      console.warn('Speech recognition is already listening');
      return;
    }

    try {
      recognitionRef.current.start();
      
      // Set timeout for auto-stop
      if (timeout > 0) {
        timeoutRef.current = window.setTimeout(() => {
          stopListening();
        }, timeout);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start recording';
      console.error('Speech recognition start error:', error);
      setState(prev => ({ ...prev, error: errorMsg, isListening: false }));
      stableCallbacks.onError(errorMsg);
    }
  }, [isSupported, state.isListening, stableCallbacks]);

  const stopListening = useCallback(() => {
    try {
      if (recognitionRef.current && state.isListening) {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
    
    // Always clear timeout regardless of recognition state
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [state.isListening]);

  const resetTranscript = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      transcript: '', 
      confidence: 0, 
      error: undefined 
    }));
  }, []);

  const abortListening = useCallback(() => {
    cleanup();
    setState(prev => ({ 
      ...prev, 
      isListening: false,
      error: undefined 
    }));
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
    abortListening,
    isSupported
  };
};

// Helper function to get user-friendly error messages
function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'audio-capture':
      return 'Microphone not accessible. Please check permissions.';
    case 'not-allowed':
      return 'Microphone permission denied. Please enable microphone access.';
    case 'network':
      return 'Network error occurred during speech recognition.';
    case 'service-not-allowed':
      return 'Speech recognition service not allowed.';
    case 'aborted':
      return 'Speech recognition aborted.';
    case 'language-not-supported':
      return 'Speech recognition language not supported. Using browser default.';
    default:
      return `Speech recognition error: ${error}`;
  }
}