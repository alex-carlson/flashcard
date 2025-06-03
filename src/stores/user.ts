import { writable } from 'svelte/store';
import { supabase, getSession } from '$lib/supabaseClient';
import { initSocket } from './socket'; // <-- Import socketStore here

export const user = writable(null);

// Listen for auth changes and react accordingly
supabase.auth.onAuthStateChange(async (_event, session) => {
  const sessionUser = session?.user ?? null;
  user.set(sessionUser);

  console.log('Auth state changed:', {
    event: _event,
    session,
    user: sessionUser
  });

  const token = session?.access_token ?? null;

  initSocket(token); // Reinitialize socket connection with new token
});

export async function initUser() {
  console.log('Initializing user session...');
  try {
    const { data, error } = await getSession();

    if (error) {
      console.error('Error getting initial session:', error.message);
      user.set(null);
      return;
    }

    console.log('Initial session data:', data);

    const sessionUser = data.session?.user ?? null;
    user.set(sessionUser);
    console.log('Initial user session:', sessionUser);

    const token = data.session?.access_token ?? null;

    initSocket(token); // Initialize socket connection with token
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
