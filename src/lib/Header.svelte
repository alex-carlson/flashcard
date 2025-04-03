<script>
    import Navigation from "./Navigation.svelte";
</script>

<header>
    <div class="header">
        <a href="/">
            <img src="/logo.png" alt="Logo" />
        </a>
        <Navigation />
    </div>
</header>

<style>
    header {
        /* horizontally align children */
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        padding: 15px;
    }
    header > * {
        width: 100%;
        display: flex;
    }
    header a img {
        width: 100%;
        margin: 5px 0;
    }

    header a {
        padding: 0;
        width: 75%;
        /* vertical center children */
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
