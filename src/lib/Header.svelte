<script>
    import Search from "./Search.svelte";
    import { link } from "svelte-spa-router";
    import { onMount } from "svelte";
    import { jwtDecode } from "jwt-decode"; // Use named import
    import { createEventDispatcher } from "svelte";
    import { selectedCollection } from "../stores/collectionStore";

    const dispatch = createEventDispatcher();
    let token = localStorage.getItem("token");
    let isLoggedIn = !!token;

    onMount(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                isLoggedIn = true;
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem("token");
                isLoggedIn = false;
            }
        }
    });

    function logout() {
        localStorage.removeItem("token");
        isLoggedIn = false;
        // go to home page
        window.location.href = "#/";
    }

    // on collectionSelected, pass up to parent
    function collectionSelected(event) {
        selectedCollection.set(event.detail.collection);
        dispatch("collectionSelected", { collection: event.detail.collection });
    }
</script>

<header>
    <div class="header">
        <h1>Prost Free 🍺 Generator</h1>
        <Search on:collectionSelected={collectionSelected} />
        <nav>
            <ul>
                <li><a href="#/" use:link>Home</a></li>
                {#if isLoggedIn}
                    <li><a href="#/upload" use:link>Upload</a></li>
                    <li><button on:click={logout}>Log Out</button></li>
                {:else}
                    <li><a href="#/login" use:link>Login</a></li>
                    <li><a href="#/signup" use:link>Sign Up</a></li>
                {/if}
            </ul>
        </nav>
    </div>
</header>

<style>
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background-color: #d7c117;
        color: rgb(46, 46, 46);
    }

    nav ul {
        display: flex;
        list-style: none;
        align-items: center;
        justify-content: center;
        padding-left: 0;
    }

    nav ul li a {
        text-decoration: none;
    }

    nav ul li a:hover {
        text-decoration: underline;
    }

    nav ul li a:visited {
        color: black;
    }

    nav ul li a, nav ul li button {
        padding: 0.6em 1.2em;
        margin: 0;
        color: black;
        font-weight: 500;
    }

    nav ul li button {
        background-color: #d7c117;
        color: black;
        border: none;
        cursor: pointer;
    }
</style>
