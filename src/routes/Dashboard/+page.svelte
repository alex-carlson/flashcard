<script lang="ts">
  import AccountSettings from '$lib/AccountSettings.svelte';
  import { user } from '$stores/user';
  import { onMount } from 'svelte';

  let currentUser = null;

  // Subscribe to user store
  const unsubscribe = user.subscribe(value => {
    currentUser = value;
  });

  onMount(() => {
    document.title = "User Dashboard";

    // Clean up subscription if needed (optional here)
    return () => unsubscribe();
  });
</script>

<div class="container white">
  {#if currentUser}
  <div class="padding">
      <h2>Welcome, {currentUser.username || currentUser.email}!</h2>
    </div>
  
      <AccountSettings />
  
      <div class="form padding">
        <a href="#/upload">Create or Edit your Quizzems</a>
      </div>
    {:else}
      <p>Loading user data...</p>
    {/if}
</div>
