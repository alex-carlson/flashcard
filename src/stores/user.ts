// src/lib/stores/user.ts
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';

export const user = writable(null);
export const profile = writable(null);

// Internal helper to load profile from Supabase
async function fetchProfile(userId) {
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

let lastFetchedUserId: string | null = null;

async function updateProfile(userId: string | null) {
  if (!userId) {
    profile.set(null);
    return;
  }
  if (userId === lastFetchedUserId) return;
  lastFetchedUserId = userId;
  const data = await fetchProfile(userId);
  profile.set(data);
}

// Initialize user and profile on app start
supabase.auth.getSession().then(({ data }) => {
  const sessionUser = data.session?.user ?? null;
  user.set(sessionUser);
  updateProfile(sessionUser?.id ?? null);
});

// Listen to auth state changes and update user/profile
supabase.auth.onAuthStateChange((_event, session) => {
  const sessionUser = session?.user ?? null;
  user.set(sessionUser);
  updateProfile(sessionUser?.id ?? null);
});
