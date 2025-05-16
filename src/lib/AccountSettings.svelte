<script>
  import { user } from '$stores/user';
  import { logOut } from '$lib/auth/login';

  let displayName = '';
  let newEmail = '';
  let message = '';

  // Initialize inputs with current user info
  $: if ($user) {
    displayName = $user.user_metadata?.display_name ?? '';
    newEmail = $user.email;
  }

  const updateDisplayName = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    });

    if (error) {
      message = 'Failed to update name: ' + error.message;
    } else {
      const { data, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) {
        message = 'Updated name, but failed to refresh user.';
      } else {
        user.set(data.user);
        message = 'Display name updated!';
      }
    }
  };

  const updateEmail = async () => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      message = 'Failed to update email: ' + error.message;
    } else {
      const { data, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) {
        message = 'Email changed, but failed to refresh user.';
      } else {
        user.set(data.user);
        message = 'Email updated! Please check your inbox to confirm the change.';
      }
    }
  };
</script>

<div class="accountSettings">
    <p><strong>Email:</strong></p>
    <input type="email" bind:value={newEmail} />
    <button on:click={updateEmail}>Update Email</button>
    <label>
    <strong>Display Name:</strong>
    <input type="text" bind:value={displayName} />
    </label>
    <button on:click={updateDisplayName}>Update Name</button>
    <p>{message}</p>
    <button on:click={logOut}>Log Out</button>
</div>

<style>
    .accountSettings {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 400px;
        margin: 2rem auto;
        padding: 1.5rem;
        border: 1px solid red;
    }

    .accountSettings input {
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid #ccc;
    }

    .accountSettings button {
        padding: 0.5rem 1rem;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .accountSettings button:hover {
        background-color: #0056b3;
    }
</style>