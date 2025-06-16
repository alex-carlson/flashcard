<script>
	import { user } from '$stores/user';
	import UserNav from './UserNav.svelte';

	// Navigation links
	const navLinks = [
		// { href: "/", label: "Home", path: "/" },
		{ href: '/about', label: 'About', path: '/about' },
		{ href: '/explore', label: 'Explore', path: '/explore' },
		{ href: '/party', label: 'Party', path: '/party' }
	];
</script>

<div class="navContainer">
	<nav>
		<ul>
			{#each navLinks as { href, label, path }}
				<li>
					<a {href}>{label}</a>
				</li>
			{/each}
			{#if $user}
				<UserNav />
			{:else}
				<li>
					<a href="/login">Login</a>
				</li>
			{/if}
		</ul>
	</nav>
</div>
