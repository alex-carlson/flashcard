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

<div class="navContainer">
    {#if isMobile}
        <!-- hamburger toggle -->
        <button
            on:click={toggleMenu}
            class={"hamburger " + (isMenuOpen ? "open" : "closed")}
            aria-label="Menu"
        >
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
        </button>
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
    .hamburger {
        background: transparent;
    }

    .hamburger .bar {
        display: block;
        width: 30px;
        height: 3px;
        margin: 5px auto;
        transition: all 0.3s ease-in-out;
        background-color: #000000;
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
