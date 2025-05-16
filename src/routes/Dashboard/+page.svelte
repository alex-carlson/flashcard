<script>
    import AccountSettings from '../../lib/AccountSettings.svelte';
    import AccountRecents from '../../lib/AccountRecents.svelte';
    import { user } from '$stores/user';

    import { onMount } from 'svelte';

    onMount(() => {
        // Fetch user data or perform any necessary setup
        console.log('User data:', user);
    });
    document.title = "User Dashboard"
</script>

<div class="container white padding">
    <h2>Welcome, {$user.user_metadata?.display_name}!</h2>
    <AccountSettings />
    <!-- button to upload -->
     <div class="form padding">
        <a href="#/upload">Create or Edit your Quizzems</a>
     </div>
</div>
