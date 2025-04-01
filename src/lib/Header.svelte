<script>
    // import Search from "./Search.svelte";
    import { link, location } from "svelte-spa-router";
    import { onMount } from "svelte";
    import { jwtDecode } from "jwt-decode"; // Use named import
    let token = localStorage.getItem("token");
    let isLoggedIn = !!token;

    const isActive = (path) => ($location === path ? "active" : "");

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
        <img src="/logo.png" alt="Logo" />
        <nav>
            <ul>
                <li><a href="#/" use:link class={isActive("/")}>Home</a></li>
                {#if isLoggedIn}
                    <li>
                        <a href="#/upload" use:link class={isActive("/upload")}
                            >Manage</a
                        >
                    </li>
                    <!-- <li><a href="#/profile" use:link>Profile</a></li> -->
                    <li><a on:click={logout}>Log Out</a></li>
                {:else}
                    <li>
                        <a href="#/login" use:link class={isActive("/login")}
                            >Login</a
                        >
                    </li>
                    <li>
                        <a href="#/signup" use:link class={isActive("/signup")}
                            >Sign Up</a
                        >
                    </li>
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
        width: 100%;
    }

    nav ul {
        display: flex;
        list-style: none;
        align-items: center;
        justify-content: center;
        padding-left: 0;
        margin-bottom: 5px;
    }

    nav ul li {
        height: 60px;
    }

    nav ul li a {
        text-decoration: none;
        border-radius: 0;
    }

    nav ul li a.active,
    nav ul li a.active:hover {
        background: #d7c117;
        border-bottom: solid 5px #d7c117;
    }

    nav ul li a:hover {
        /* text-decoration: underline; */
        background: transparent;
        border-bottom: solid 5px #d7c117;
    }

    nav ul li a:visited {
        color: black;
    }

    nav ul li a,
    nav ul li button {
        color: black;
        font-weight: 500;
        height: 50px;
        box-sizing: border-box;
    }

    nav ul li button {
        background-color: #d7c117;
        color: black;
        border: none;
        cursor: pointer;
    }
</style>
