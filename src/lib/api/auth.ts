import { supabase } from '$lib/api/supabaseClient';
import { user } from '$stores/user';

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[signInWithEmail] Login error:', error.message);
      throw error;
    }

    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('[signInWithEmail] Error fetching current user:', userError.message);
      throw userError;
    }

    localStorage.setItem('user', JSON.stringify(currentUser));
    user.set(currentUser);
    ensureProfileExists(currentUser.id, currentUser.user_metadata?.username || 'New User');

    return data;
  } catch (err) {
    console.error('[signInWithEmail] Exception caught:', err);
    throw err;
  }
}



export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // redirectTo: `${location.origin}/dashboard`, // optional
    },
  });

  if (error) {
    console.error('Google sign-in error:', error.message);
    throw error;
  }

  // set user and profile stores
  const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Error fetching current user:', userError.message);
    throw userError;
  }
  user.set(currentUser);
  ensureProfileExists(currentUser.id, currentUser.user_metadata?.username || 'New User');

  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  console.log('Signing up with email:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // emailRedirectTo: `${location.origin}/dashboard`, // optional
    },
  });

  if (error) {
    console.error('Sign-up error:', error.message);
    throw error;
  }

  return data;
}

export async function createProfileIfMissing(id: string, username: string) {

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', id)
    .single();

  if (existing) return;

  console.log('Creating new profile for user:', id);

  const { error: insertError } = await supabase
    .from('profiles')
    .insert([{ id, username }]);

  if (insertError) {
    console.error('Failed to create profile:', insertError.message);
    throw insertError;
  }
}

export async function updateEmail(newEmail: string) {
  // Update email in auth
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Error fetching current user:', userError?.message);
    throw userError || new Error('No user found');
  }

  const { error: authError } = await supabase.auth.updateUser({
    email: newEmail,
  });
  if (authError) {
    console.error('Error updating email in auth:', authError.message);
    throw authError;
  }

  // Update email in profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ email: newEmail })
    .eq('id', user.id);

  if (profileError) {
    console.error('Error updating email in profile:', profileError.message);
    throw profileError;
  }

  return true;
}

export async function updateUsername(newUsername: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Error fetching current user:', userError?.message);
    throw userError || new Error('No user found');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: newUsername })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating username:', error.message);
    throw error;
  }
  console.log('Username updated successfully');
  return true;
}

export async function logOut() {
  // Remove session and user data from stores

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Log out error:', error.message);
    throw error;
  }

  user.set(null);

  console.log('Log out successful');
  return true;
}

export async function deleteUser(userId: string) {
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Error deleting user:", error);
    throw error;
  }

  console.log("User deleted successfully");
}

// create profile row if it doesn't exist
export async function ensureProfileExists(userId: string, username: string) {
  try {
    await createProfileIfMissing(userId, username);
    console.log('Profile ensured for user:', userId);
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
    throw error;
  }
}