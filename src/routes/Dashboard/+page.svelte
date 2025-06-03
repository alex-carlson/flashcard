<script lang="ts">
  import AccountSettings from "$lib/AccountSettings.svelte";
  import { user, logOutUser } from "$stores/user";
  import { onMount } from "svelte";

  onMount(() => {
    document.title = "User Dashboard";
  });
</script>

<div class="container white">
  {#if $user}
    <div class="padding">
      <h2>Logged in as {$user.displayName || $user.email}</h2>
    </div>

    <AccountSettings />

    <div class="padding">
      <button on:click={() => (window.location.hash = "/upload")}>
        Your Quizzems
      </button>
      <button class="warning" on:click={logOutUser}> Log out </button>
    </div>
  {:else}
    <p>Loading user data...</p>
  {/if}
</div>
