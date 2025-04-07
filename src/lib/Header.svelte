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
        box-sizing: border-box;
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

    /* custom styles for if window width > 800 */
    @media (min-width: 800px) {
        header {
            flex-direction: row;
        }
        header > * {
            width: 100%;
            display: inline-block;
        }
        header a {
            margin: 0 auto;
        }
        header a img {
            width: 100%;
            margin: 0;
            max-width: 500px;
        }
    }
</style>
