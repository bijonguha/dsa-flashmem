import { createContext } from 'react';
import { User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  message: string;
  error: string;
  setMessage: (message: string) => void;
  setError: (error: string) => void;
  clearMessages: () => void;
  signUp: (email: string, password: string) => Promise<{ user: User | null; session: any }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
