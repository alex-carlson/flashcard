// src/lib/auth/signup.ts
import { supabase } from '$lib/supabaseClient';

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  if (!displayName.trim()) {
    throw new Error('Display name is required');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  });

  if (error) {
    console.error('Sign-up error:', error.message);
    throw error;
  }

  return data;
}
