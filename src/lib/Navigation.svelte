<script>
    import { onMount, onDestroy } from "svelte";
    import { link, location } from "svelte-spa-router";
    import { user } from "$stores/user";

    let isActive = (path) => ($location === path ? "active" : "");

    // Active link helper
    $: $location, (isActive = (path) => ($location === path ? "active" : ""));

    // Navigation links
    $: navLinks = [
        { href: "#/", label: "Home", path: "/" },
        { href: "#/about", label: "About", path: "/about" },
        { href: "#/explore", label: "Explore", path: "/explore" },
        { href: "#/party", label: "Party", path: "/party" },
        $user
            ? { href: "#/dashboard", label: "Dashboard", path: "/dashboard" }
            : { href: "#/login", label: "Login", path: "/login" },
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
        </ul>
    </nav>
</div>
