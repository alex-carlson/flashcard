<script>
  import { supabase } from '../../lib/supabaseClient';
  import { user } from '../../stores/user';
  import { push } from 'svelte-spa-router';

  let email = '';
  let password = '';
  let displayName = '';
  let errorMsg = '';
  let isLogin = false;

  document.title = 'Login';

  // Redirect if already logged in
  $: if ($user) {
    push('/dashboard');
  }

  async function handleSubmit() {
    errorMsg = '';

    if (!email || !password || (!isLogin && !displayName)) {
      errorMsg = 'Please fill out all required fields.';
      return;
    }

    let response;

    console.log('isLogin:', isLogin);
    console.log('email:', email);


    if (isLogin) {
      response = await supabase.auth.signInWithPassword({
        email,
        password
      });
    } else {
      response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });
    }

    const { error } = response;
    if (error) {
      errorMsg = error.message;
    }
  }
</script>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 400px;
    margin: auto;
  }
</style>

<div class="container white">
  {#if !$user}
    <h1>{isLogin ? 'Log In' : 'Sign Up'}</h1>
    <form on:submit|preventDefault={handleSubmit}>
      <input type="email" placeholder="Email" bind:value={email} required />
      <input type="password" placeholder="Password" bind:value={password} required />

      {#if !isLogin}
        <input type="text" placeholder="Display Name" bind:value={displayName} required />
      {/if}

      <button type="submit">{isLogin ? 'Log In' : 'Sign Up'}</button>

      <p style="color: red">{errorMsg}</p>

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
