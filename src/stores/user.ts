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
