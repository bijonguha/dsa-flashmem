import React, { useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthContext } from './AuthContextValue';
import { supabase } from '../services/supabase';
import { AuthService } from '../services/auth';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      await AuthService.signUp(email, password);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await AuthService.signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    setLoading(true);
    try {
      await AuthService.sendPasswordResetEmail(email);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    setLoading(true);
    try {
      await AuthService.updatePassword(newPassword);
    } finally {
      setLoading(false);
    }
  };

  // Helper for error/message state within AuthProvider
  const [error] = useState('');
  const [message] = useState('');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        sendPasswordResetEmail,
        updatePassword,
      }}
    >
      {children}
      {error && (
        <div className="fixed bottom-4 left-4 bg-red-500 text-white p-3 rounded shadow-lg">
          {error}
        </div>
      )}
      {message && (
        <div className="fixed bottom-4 left-4 bg-green-500 text-white p-3 rounded shadow-lg">
          {message}
        </div>
      )}
    </AuthContext.Provider>
  );
};
