// src/lib/stores/user.ts
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { socketStore } from './socket';

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
}

// Update socket auth and connect
function authenticateSocket(token: string | null) {
  socketStore.update(socket => {
    if (token) {
      socket.auth.token = token;
      if (!socket.connected) socket.connect();
    } else {
      socket.disconnect();
    }
    return socket;
  });
}

// Listen for auth changes and react accordingly
supabase.auth.onAuthStateChange(async (event, session) => {
  const sessionUser = session?.user ?? null;
  user.set(sessionUser);

  if (sessionUser) {
    await updateProfile(sessionUser.id);
    const token = session.access_token;
    authenticateSocket(token);
  } else {
    profile.set(null);
    authenticateSocket(null);
  }
});

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

  console.log('Setting bio:', bio);

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

// Initial load
(async () => {
  const { data } = await supabase.auth.getSession();
  const sessionUser = data.session?.user ?? null;
  user.set(sessionUser);

  if (sessionUser) {
    await updateProfile(sessionUser.id);
    authenticateSocket(data.session?.access_token ?? null);
  }
})();