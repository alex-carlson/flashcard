<script>
    import { user } from "$stores/user";
    import ProfilePicture from "./ProfilePicture.svelte";

    // on mount, console log username
    import { onMount } from "svelte";
    onMount(() => {
        if ($user) {
            console.log("User logged in:", $user);
        } else {
            console.log("No user logged in");
        }
    });
</script>

{#if $user}
    <li class="user-tab">
        <a href="#/dashboard" class="user-link">
            <ProfilePicture userId={$user.id} size={30} isRound={true} />
            <span class="user-name">Account</span>
        </a>
    </li>
{/if}
