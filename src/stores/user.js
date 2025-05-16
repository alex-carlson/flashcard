import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';

export const user = writable(null);

supabase.auth.getSession().then(({ data }) => {
  user.set(data.session?.user ?? null);
});

supabase.auth.onAuthStateChange((_event, session) => {
  user.set(session?.user ?? null);
});

supabase.auth.getUser().then(({ data }) => {
  user.set(data.user);
});