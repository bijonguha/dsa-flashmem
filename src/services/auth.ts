import { supabase } from './supabase';

export class AuthService {
  static async signUp(email: string, password: string) {
    // Create a promise that rejects after a timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Signup request timed out. Please check your internet connection and try again.')), 10000);
    });

    try {
      // Race the Supabase call with the timeout
      const { data, error } = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
        }),
        timeoutPromise
      ]);

      if (error) throw error;
      return data;
    } catch (error) {
      // If it's a timeout error, rethrow it with a more user-friendly message
      if (error instanceof Error && error.message === 'Signup request timed out. Please check your internet connection and try again.') {
        throw error;
      }
      // For other errors, wrap them in a more descriptive error
      throw new Error(`Signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  static async sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password', // Redirect to a specific page for password reset
    });
    if (error) throw error;
  }

  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }
}
