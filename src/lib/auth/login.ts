// src/lib/auth/login.ts
import { supabase } from '$lib/supabaseClient';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login error:', error.message);
    throw error;
  }

  return data;
}

export async function logOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Log out error:', error.message);
    throw error;
  }
}
