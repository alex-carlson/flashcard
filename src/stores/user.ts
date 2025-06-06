import { writable } from 'svelte/store';
import { supabase, getSession } from '$lib/supabaseClient';
import { initSocket } from './socket'; // <-- Import socketStore here
import { fetchUser } from '../lib/user'

export const user = writable(null);

async function fetchUserProfile(sessionUser) {
  if (!sessionUser) {
    console.error('No session user provided');
    return Promise.resolve(null);
  }

  const userWithProfile = await fetchUser(sessionUser.id);

  // get bio and username from userWithProfile
  if (!userWithProfile) {
    console.error('No user profile found for session user:', sessionUser.id);
    return null;
  }

  const bio = userWithProfile.bio || '';
  const username = userWithProfile.username || '';

  // Update session user with profile data
  const updatedUser = {
    ...sessionUser,
    bio,
    username
  };

  return updatedUser;

}

// Listen for auth changes and react accordingly
supabase.auth.onAuthStateChange(async (_event, session) => {
  const sessionUser = session?.user ?? null;
  const token = session?.access_token ?? null;
  const userWithProfile = await fetchUserProfile(sessionUser);
  user.set(userWithProfile); // Update user store with new session user

  initSocket(token); // Reinitialize socket connection with new token
});

export async function initUser() {
  console.log('Initializing user session...');
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('Session data:', data);

    if (error) {
      console.error('Error getting initial session:', error.message);
      user.set(null);
      return;
    }

    const sessionUser = data.session?.user ?? null;
    if (!sessionUser) {
      user.set(null);
      return;
    }

    const userWithProfile = await fetchUserProfile(sessionUser);
    user.set(userWithProfile); // Set user store with fetched profile

    const token = data.session?.access_token ?? null;
    initSocket(token); // Reconnect socket with token
  } catch (err) {
    console.error('Exception during initUser:', err);
  }
}

export async function logOutUser() {
  console.log('Logging out user...');
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error during sign out:', error.message);
      return;
    }

    user.set(null);
    console.log('User logged out successfully');
  } catch (err) {
    console.error('Exception during logOutUser:', err);
  }
}

// Export user profile update functions
export async function setUserAvatarUrl(userId: string | null, avatarUrl: string) {
  if (!userId) {
    console.error('No userId provided');
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating avatar_url:', error.message);
    return null;
  }

  return data;
}

export async function setUserBio(userId: string | null, bio: string) {
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

export async function setUserDisplayName(userId: string | null, displayName: string) {
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
