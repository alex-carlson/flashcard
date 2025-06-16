<script>
	import { user } from '$stores/user';
	import UserNav from './UserNav.svelte';
	import { enhance } from '$app/forms';

	// Navigation links
	const navLinks = [
		// { href: "/", label: "Home", path: "/" },
		{ href: '/about', label: 'About', path: '/about' },
		{ href: '/explore', label: 'Explore', path: '/explore' }
		// { href: '/party', label: 'Party', path: '/party' }
	];
</script>

<div class="navContainer">
	<nav>
		<ul>
			{#each navLinks as { href, label, path }}
				<li>
					<a {href} use:enhance>{label}</a>
				</li>
			{/each}
			{#if $user}
				<UserNav />
			{:else}
				<li>
					<a href="/login" use:enhance>Login</a>
				</li>
			{/if}
		</ul>
	</nav>
</div>
