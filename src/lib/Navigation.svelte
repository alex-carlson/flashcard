<script>
	import { user } from '$stores/user';
	import UserNav from './UserNav.svelte';
	// import fontawesome search icon
	import Fa from 'svelte-fa';
	import { faSearch } from '@fortawesome/free-solid-svg-icons';

	// Navigation links
	const navLinks = [
		// { href: "/", label: "Home", path: "/" },
		{ href: '/about', label: 'About', path: '/about' },
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
			<!-- add a clickable search icon that expands downwards on click -->
			<li>
				<a href="/explore">
					<Fa icon={faSearch} />
				</a>
			</li>
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
