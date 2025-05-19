// src/lib/stores/user.ts
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';

export const user = writable(null);
export const profile = writable(null);

// Internal helper to load profile from Supabase
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Profile doesn't exist — create it
      const displayName = 'New User';
      const { error: insertError, data: inserted } = await supabase
        .from('profiles')
        .insert([{ id: userId, username: displayName }])
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create profile:', insertError.message);
        return null;
      }

      return inserted;
    }

    console.error('Error fetching profile:', error.message);
    return null;
  }
  return data;
}


async function updateProfile(userId: string | null) {
  const data = await fetchProfile(userId);
  profile.set(data);
  console.log('Profile updated:', data);
}

// Initialize user and profile on app start
supabase.auth.getSession().then(({ data }) => {
  console.log('Initial session:', data);
  const sessionUser = data.session?.user ?? null;
  user.set(sessionUser);
  updateProfile(sessionUser?.id ?? null);
});