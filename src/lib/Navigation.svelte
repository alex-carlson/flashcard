<script>
    import { onMount, onDestroy } from "svelte";
    import { link, location } from "svelte-spa-router";
    import { user } from "$stores/user";
    import UserNav from "./UserNav.svelte";

    let isActive = (path) => ($location === path ? "active" : "");

    // Active link helper
    $: $location, (isActive = (path) => ($location === path ? "active" : ""));

    // Navigation links
    $: navLinks = [
        // { href: "#/", label: "Home", path: "/" },
        { href: "#/about", label: "About", path: "/about" },
        { href: "#/explore", label: "Explore", path: "/explore" },
        { href: "#/party", label: "Party", path: "/party" },
    ];
</script>

<div class="navContainer">
    <nav>
        <ul>
            {#each navLinks as { href, label, path }}
                <li>
                    <a {href} use:link class={isActive(path)}>{label}</a>
                </li>
            {/each}
            {#if $user}
                <UserNav />
            {:else}
                <li>
                    <a href="#/login" use:link class={isActive("/login")}
                        >Login</a
                    >
                </li>
            {/if}
        </ul>
    </nav>
</div>
