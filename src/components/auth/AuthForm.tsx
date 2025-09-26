import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthFormProps {
  type: 'signIn' | 'signUp';
  onSuccess?: () => void;
  onSwitchType: () => void;
  onForgotPasswordClick: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  type,
  onSuccess,
  onSwitchType,
  onForgotPasswordClick,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { message, error, setMessage, setError, clearMessages, signUp, signIn, loading } = useAuth();

  // Cleanup timeout on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
    };
  }, [messageTimeout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple rapid submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    clearMessages();

    try {
      if (type === 'signUp') {
        const result = await signUp(email, password);
        setMessage('Sign up successful! Please check your email to confirm your account');
        setEmail('');
        setPassword('');

        // Clear any existing timeout
        if (messageTimeout) {
          clearTimeout(messageTimeout);
          setMessageTimeout(null);
        }

        // Clear success message after 10 seconds to give user time to read it
        const timeout = setTimeout(() => {
          setMessage('');
          setMessageTimeout(null);
        }, 10000);
        setMessageTimeout(timeout);
      } else {
        await signIn(email, password);
        onSuccess?.(); // Call onSuccess if provided
      }
    } catch (err: unknown) {
      console.error('Error in signup/signin:', err);
      // Handle Supabase auth errors more specifically
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = (err as Error).message;
        // Provide more user-friendly error messages for common Supabase errors
        if (errorMessage.includes('User already registered') || errorMessage.includes('already exists')) {
          setError('User already registered. Please sign in instead.');
        } else if (errorMessage.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (errorMessage.includes('Signup request timed out')) {
          setError('Signup request timed out. Please check your internet connection and try again.');
        } else if (errorMessage.includes('Signup failed')) {
          setError(errorMessage);
        } else {
          setError(errorMessage || 'An unexpected error occurred.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {type === 'signIn' ? 'Log In' : 'Sign Up'}
      </h2>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {message && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
            placeholder="••••••••"
          />
        </div>

        {type === 'signIn' && (
          <div className="text-sm text-right">
            <button
              type="button"
              onClick={onForgotPasswordClick}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : type === 'signIn' ? (
            'Log In'
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {type === 'signIn' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={onSwitchType}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {type === 'signIn' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
