<script>
	import { user } from '$stores/user';
	import ProfilePicture from './ProfilePicture.svelte';
</script>

{#if $user}
	<li class="user-tab">
		<a href="/dashboard" class="user-link">
			<ProfilePicture userId={$user.id} size={30} isRound={true} />
		</a>
	</li>
{/if}
