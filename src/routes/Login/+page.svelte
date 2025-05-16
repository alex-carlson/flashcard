<script>
  import { user } from '../../stores/user';
  import { push } from 'svelte-spa-router';
  import { signInWithEmail } from '$lib/auth/login';
  import { signUpWithEmail } from '$lib/auth/signup';

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

    if (isLogin) {
      try {
        const { session, user: loggedInUser } = await signInWithEmail(email, password);
        user.set(loggedInUser); // optional if you're managing your own store
      } catch (error) {
        errorMsg = error.message;
      }

    } else {
      const { data, error } = await signUpWithEmail(email, password, displayName);
      if (error) {
        errorMsg = error.message;
        return;
      }
      response = data;
      if (response) {
        const { user: newUser } = response;
        user.set(newUser); // optional if you're managing your own store
      }
    }

    const { error } = response;
    if (error) {
      errorMsg = error.message;
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
