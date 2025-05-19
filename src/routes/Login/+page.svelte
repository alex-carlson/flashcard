<script lang="ts">
  import { onMount } from 'svelte';
  import { profile, user } from '$stores/user';
  import { push } from 'svelte-spa-router';
  import { signInWithEmail, signUpWithEmail, createProfileIfMissing } from '$lib/auth/auth';
  import { supabase } from '$lib/supabaseClient';

  let email = '';
  let password = '';
  let displayName = '';
  let errorMsg = '';
  let isLogin = false;

  document.title = isLogin ? 'Login' : 'Sign Up';

  // 🔁 Check for existing session on mount
  onMount(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (data.session) {
      push('/dashboard');
    }
  });

  async function handleSubmit() {
    errorMsg = '';

    if (!email || !password || (!isLogin && !displayName)) {
      errorMsg = 'Please fill out all required fields.';
      return;
    }

    try {
      if (isLogin) {
        console.log('Logging in...');
        const { session, user: loggedInUser } = await signInWithEmail(email, password);

        if (loggedInUser) {
          // Ensure session token is persisted
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Try to fetch a fresh session just in case
          const { data: refreshedSession } = await supabase.auth.getSession();
          if (!refreshedSession.session) {
            throw new Error('Session not yet available after login');
          }

          // Create profile only if missing
          const displayNameFinal = displayName || loggedInUser.email?.split('@')[0];
          await createProfileIfMissing(loggedInUser.id, displayNameFinal);

          // Redirect AFTER session and profile have been handled
          await push('/dashboard');
        }
      } else {
        const { user: newUser } = await signUpWithEmail(email, password, displayName);
        if (newUser) {
          alert('Please check your email to confirm your account.');
        }
      }
    } catch (error) {
      errorMsg = error.message ?? 'An error occurred. Please try again.';
    }

  }
</script>


<div class="container white padding">
  {#if !$user}
    <h1>{isLogin ? 'Log In' : 'Sign Up'}</h1>
    <form class="form" on:submit|preventDefault={handleSubmit}>
      <input type="email" placeholder="Email" bind:value={email} required />
      <input type="password" placeholder="Password" bind:value={password} required />

      {#if !isLogin}
        <input type="text" placeholder="Display Name" bind:value={displayName} required />
      {/if}

      <button type="submit">{isLogin ? 'Log In' : 'Sign Up'}</button>

      {#if errorMsg}
        <p style="color: red">{errorMsg}</p>
      {/if}

      <p>
        {isLogin
          ? "Don't have an account? "
          : 'Already have an account? '}
        <a href="javascript:void(0)" on:click|preventDefault={() => (isLogin = !isLogin)}>
          {isLogin ? 'Sign up' : 'Log in'}
        </a>
      </p>
    </form>
  {/if}
</div>
