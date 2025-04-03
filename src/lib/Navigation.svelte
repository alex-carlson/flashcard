<script>
    import { onMount, onDestroy } from "svelte";
    import { link, location } from "svelte-spa-router";
    let token = localStorage.getItem("token");
    let isLoggedIn = !!token;
    let isMenuOpen = false;
    let isMobile = window.innerWidth < 600;

    const isActive = (path) => ($location === path ? "active" : "");

    onMount(() => {
        if (token) {
            try {
                isLoggedIn = true;
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem("token");
                isLoggedIn = false;
            }
        }

        window.addEventListener("resize", updateIsMobile);
    });

    onDestroy(() => {
        window.removeEventListener("resize", updateIsMobile);
    });

    function logout() {
        localStorage.removeItem("token");
        isLoggedIn = false;
        // go to home page
        window.location.href = "#/";
    }

    // toggle menu
    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
    }

    // update isMobile on resize
    function updateIsMobile() {
        isMobile = window.innerWidth < 600;
    }
</script>

{#if isMobile}
    <button
        on:click={toggleMenu}
        class={"hamburger " + (isMenuOpen ? "open" : "closed")}
        aria-label="Menu"
    >
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
    </button>
{/if}
<div class="navContainer">
    {#if isMobile}
        {#if isMenuOpen}
            <nav class="mobileNav">
                <ul>
                    <li>
                        <a href="#/" use:link class={isActive("/")}>Home</a>
                    </li>
                    {#if isLoggedIn}
                        <li>
                            <a
                                href="#/upload"
                                use:link
                                class={isActive("/upload")}>Manage</a
                            >
                        </li>
                        <li>
                            <a
                                on:click={logout}
                                on:keydown={(e) =>
                                    e.key === "Enter" && logout()}
                                class={isActive("/logout")}
                                tabindex="0"
                                href="#/logout"
                                role="button">Log Out</a
                            >
                        </li>
                    {:else}
                        <li>
                            <a
                                href="#/login"
                                use:link
                                class={isActive("/login")}>Login</a
                            >
                        </li>
                        <li>
                            <a
                                href="#/signup"
                                use:link
                                class={isActive("/signup")}>Sign Up</a
                            >
                        </li>
                    {/if}
                </ul>
            </nav>
        {/if}
    {:else}
        <nav>
            <ul>
                <li><a href="#/" use:link class={isActive("/")}>Home</a></li>
                {#if isLoggedIn}
                    <li>
                        <a href="#/upload" use:link class={isActive("/upload")}
                            >Manage</a
                        >
                    </li>
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
    {/if}
</div>

<style>
    .mobileNav {
        position: relative; /* Change from absolute to relative */
        width: 100%;
        height: auto; /* Let it expand based on content */
        background-color: #d7c117;
        z-index: 1000;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 0;
        box-shadow: 0 8px 10px rgba(0, 0, 0, 0.4);
    }

    .mobileNav ul {
        list-style: none;
        padding: 0;
        margin: 0;
        width: 100%;
        text-align: center;
    }

    .mobileNav ul li {
        margin: 15px 0; /* Add spacing between menu items */
    }

    .mobileNav ul li a {
        text-decoration: none;
        font-size: 1.5rem; /* Larger font size for mobile */
        color: #000000;
        font-weight: bold;
        padding: 10px 20px;
        display: inline-block;
        width: 100%; /* Make links span the full width */
        text-align: center;
        border-radius: 5px;
        transition: background-color 0.3s ease;
    }

    .mobileNav ul li a:hover {
        background-color: #f0f0f0; /* Add hover effect */
    }

    .mobileNav ul li a.active {
        background-color: #d7c117; /* Highlight active link */
        color: #6f1d1b;
    }

    .navContainer {
        position: absolute;
        top: 88px;
        left: 0;
        width: 100%;
        z-index: 1100;
    }

    .hamburger {
        background: transparent;
        position: absolute;
        top: 18px;
        right: 5px;
        z-index: 1100;
    }

    .hamburger .bar {
        display: block;
        width: 30px;
        height: 3px;
        margin: 5px auto;
        transition: all 0.3s ease-in-out;
        background-color: #6f1d1b;
        transition: 0.25s ease;
    }

    .hamburger.open .bar:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
    }
    .hamburger.open .bar:nth-child(2) {
        opacity: 0;
    }
    .hamburger.open .bar:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
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

    nav ul li a {
        color: black;
        font-weight: 500;
        height: 50px;
        box-sizing: border-box;
    }
</style>
