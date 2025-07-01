import { writable } from 'svelte/store';
import { supabase, getSession } from '$lib/api/supabaseClient';
import { fetchUser } from '$lib/api/user';
import { browser } from '$app/environment';

// Define user type
export interface User {
  id: string;
  public_id: string;
  username: string;
  bio?: string;
  email?: string;
  uid?: string;
  token?: string | null;
}

export const user = writable<User | null>(null);

// Internal helper to merge profile data with session user
async function fetchUserProfile(sessionUser: Record<string, unknown>, token: string | null = null): Promise<User | null> {
  if (!sessionUser) {
    console.error('No session user provided');
    return null;
  }

  try {
    const userWithProfile = await fetchUser(sessionUser.id);

    if (!userWithProfile) {
      console.error('No user profile found for session user:', sessionUser.id);
      return null;
    } return {
      ...sessionUser,
      bio: userWithProfile.bio || '',
      username: userWithProfile.username || '',
      token,
      id: userWithProfile.id || sessionUser.id,
      public_id: userWithProfile.public_id || sessionUser.public_id,
      uid: userWithProfile.public_id || sessionUser.public_id, // For backward compatibility
      email: sessionUser.email as string,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Initialize auth state on app load
async function initializeAuth() {
  if (!browser) return;

  try {
    const session = await getSession();
    if (session?.user) {
      const userWithProfile = await fetchUserProfile(session.user as Record<string, unknown>, session.access_token);
      user.set(userWithProfile);
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
    user.set(null);
  }
}

// Initialize on store creation
initializeAuth();

// Helper function to get current user safely (for use in other modules)
export function getCurrentUserFromStore(): User | null {
  let currentUser: User | null = null;
  user.subscribe(value => {
    currentUser = value;
  })();
  return currentUser;
}

// Listen for Supabase auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event);

  if (event === 'SIGNED_OUT' || !session?.user) {
    user.set(null);
    return;
  }
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    const userWithProfile = await fetchUserProfile(session.user as unknown as Record<string, unknown>, session.access_token);
    user.set(userWithProfile);
  }
});

// Log out and clear the store
export async function logOutUser() {
  try {
    // Always clear the user store immediately
    user.set(null);

    // Clear auth-related storage
    const clearAuthStorage = () => {
      if (browser) {
        localStorage.removeItem('user');

        // Clear all Supabase auth keys
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });

        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    };

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error during sign out:', error.message);
    }

    // Clear storage regardless of sign out success
    clearAuthStorage();

    // Redirect to login page
    if (browser) {
      window.location.href = '/login';
    }
  } catch (err) {
    console.error('Exception during logOutUser:', err);
    // Still clear local state even if sign out fails
    user.set(null);
    if (browser) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
}

// Profile update helpers
export async function setUserBio(userId: string, bio: string) {
  if (!userId) {
    console.error('No userId provided');
    return null;
  }

  try {
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

    // Update the current user store if this is the current user
    user.update(currentUser => {
      if (currentUser && currentUser.id === userId) {
        return { ...currentUser, bio };
      }
      return currentUser;
    });

    return data;
  } catch (error) {
    console.error('Error updating bio:', error);
    return null;
  }
}

export async function setUserDisplayName(userId: string, displayName: string) {
  if (!userId) {
    console.error('No userId provided');
    return null;
  }

  try {
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

    // Update the current user store if this is the current user
    user.update(currentUser => {
      if (currentUser && currentUser.id === userId) {
        return { ...currentUser, username: displayName };
      }
      return currentUser;
    });

    return data;
  } catch (error) {
    console.error('Error updating username:', error);
    return null;
  }
}
