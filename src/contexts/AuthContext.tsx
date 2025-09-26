import React, { useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthContext } from './AuthContextValue';
import { supabase } from '../services/supabase';
import { AuthService } from '../services/auth';
import { SupabaseDataService } from '../services/SupabaseDataService';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      const result = await AuthService.signUp(email, password);
      
      // Create profile and settings in background (don't block signup flow)
      if (result.user) {
        const username = email.split('@')[0];
        
        // Run in background without blocking
        Promise.resolve().then(async () => {
          try {
            if (result.user) {
              await SupabaseDataService.createProfile(result.user.id, username).catch(err => {
                console.log('Profile creation failed:', err.message);
              });
              
              await SupabaseDataService.getSettings(result.user.id).catch(err => {
                console.log('Settings creation failed:', err.message);
              });
            }
          } catch (error) {
            console.error('Background profile/settings creation failed:', error);
          }
        });
      }
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await AuthService.signIn(email, password);
    } catch (error) {
      throw error;
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

  const clearMessages = () => {
    setMessage('');
    setError('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        message,
        error,
        setMessage,
        setError,
        clearMessages,
        signUp,
        signIn,
        signOut,
        sendPasswordResetEmail,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
