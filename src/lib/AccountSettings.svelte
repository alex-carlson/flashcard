<script>
  import { profile } from '$stores/user';
  import { logOut, updateUsername, updateEmail } from '$lib/auth/auth';
  let message = '';
</script>

{#if $profile}
  <details class="accountSettings">
    <summary>Account Settings</summary>
    <div>
      <p><strong>Email:</strong></p>
      <div class="text-field">
        <input type="email" bind:value={$profile.email} />
        <button on:click={() => updateEmail($profile.email)}>Update Email</button>
      </div>
      <div class="text-field">
        <label>
          <strong>Display Name:</strong>
          <input type="text" bind:value={$profile.username} />
        </label>
        <button on:click={() => updateUsername($profile.username)}>Update Name</button>
      </div>
      <p>{message}</p>
      <button class="warning" on:click={() => { logOut(); window.location.href = '/'; }}>Log Out</button>
      <button class="danger" on:click={logOut}>Delete Account</button>
    </div>
  </details>
{:else}
  <p>Loading profile...</p>
{/if}
