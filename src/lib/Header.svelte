<script>
    // import Search from "./Search.svelte";
    import { link } from "svelte-spa-router";
    import { onMount } from "svelte";
    import { jwtDecode } from "jwt-decode"; // Use named import
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
</script>

<header>
    <div class="header">
        <img src="/logo.png" alt="Logo">
        <nav>
            <ul>
                <li><a href="#/" use:link>Home</a></li>
                {#if isLoggedIn}
                    <li><a href="#/upload" use:link>Manage</a></li>
                    <!-- <li><a href="#/profile" use:link>Profile</a></li> -->
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

    header img {
        margin-top: 40px;
        max-height: 150px;
        /* grayscale filter */
        filter: grayscale(100%);
    }

    nav ul {
        display: flex;
        list-style: none;
        align-items: center;
        justify-content: center;
        padding-left: 0;
        margin-bottom: 5px;
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
