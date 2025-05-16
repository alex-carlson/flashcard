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
    <div class="text-field">
      <input type="email" bind:value={newEmail} />
      <button on:click={updateEmail}>Update Email</button>
    </div>
    <div class="text-field">
      <label>
        <strong>Display Name:</strong>
        <input type="text" bind:value={displayName} />
      </label>
      <button on:click={updateDisplayName}>Update Name</button>
    </div>
    <p>{message}</p>
    <button class="warning" on:click={logOut}>Log Out</button>
</div>