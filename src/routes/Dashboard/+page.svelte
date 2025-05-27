<script lang="ts">
  import AccountSettings from "$lib/AccountSettings.svelte";
  import { user } from "$stores/user";
  import { onMount } from "svelte";

  let currentUser = null;

  // Subscribe to user store
  const unsubscribe = user.subscribe((value) => {
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
      <h2>Logged in as {currentUser.email}</h2>
    </div>

    <AccountSettings />

    <div class="padding">
      <button on:click={() => (window.location.hash = "/upload")}>
        Your Quizzems
      </button>
    </div>
  {:else}
    <p>Loading user data...</p>
  {/if}
</div>
