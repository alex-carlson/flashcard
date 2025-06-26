import { writable } from 'svelte/store';
import { supabase } from '$lib/api/supabaseClient';
import { fetchUser } from '$lib/api/user';

export const user = writable(null);

// Internal helper to merge profile data with session user
async function fetchUserProfile(sessionUser, token = null) {
  if (!sessionUser) {
    console.error('No session user provided');
    return null;
  }

  const userWithProfile = await fetchUser(sessionUser.id);

  if (!userWithProfile) {
    console.error('No user profile found for session user:', sessionUser.id);
    return null;
  }

  return {
    ...sessionUser,
    bio: userWithProfile.bio || '',
    username: userWithProfile.username || '',
    token,
    id: userWithProfile.id || sessionUser.id,
    public_id: userWithProfile.public_id || sessionUser.public_id,
  };
}

// Listen for Supabase auth state changes
supabase.auth.onAuthStateChange(async (_event, session) => {
  console.log('Auth state changed:', _event);
  const sessionUser = session?.user ?? null;
  const token = session?.access_token ?? null;

  if (!sessionUser) {
    user.set(null);
    return;
  }

  const userWithProfile = await fetchUserProfile(sessionUser, token);
  user.set(userWithProfile);
});

// Log out and clear the store
export async function logOutUser() {
  try {
    // Always clear the user store immediately
    user.set(null);

    // Always remove 'user' and Supabase-related keys from storage
    const clearAuthStorage = () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');

        Object.keys(localStorage).forEach((key) => {
          if (key.toLowerCase().includes('supabase') || key.toLowerCase().includes('auth')) {
            localStorage.removeItem(key);
          }
        });

        Object.keys(sessionStorage).forEach((key) => {
          if (key.toLowerCase().includes('supabase') || key.toLowerCase().includes('auth')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    };

    // Try to sign out if there's a session
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during sign out:', error.message);
      }
    } else {
      console.warn('No Supabase session found — skipping signOut');
    }

    // Clear auth-related storage regardless
    clearAuthStorage();
  } catch (err) {
    console.error('Exception during logOutUser:', err);
  }
}

// Profile update helpers
export async function setUserBio(userId, bio) {
  if (!userId) {
    console.error('No userId provided');
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ bio })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating bio:', error.message);
    return null;
  }

  return data;
}

export async function setUserDisplayName(userId, displayName) {
  if (!userId) {
    console.error('No userId provided');
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ username: displayName })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating username:', error.message);
    return null;
  }

  return data;
}
