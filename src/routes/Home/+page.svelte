<script>
    import Search from "../../lib/Search.svelte";
    import Latest from "../../lib/Latest.svelte";
    let token = localStorage.getItem("token");
    let isLoggedIn = !!token;

    document.title = "Home";
</script>

<div class="container white">
    <h1>
        Search for a Quizzem or

        {#if isLoggedIn}
            <a href="#/upload">create a new one</a>
        {:else}
            <a href="#/login">log in</a> to create one!
        {/if}
    </h1>
    <Search />

    <h2>Latest Quizzems</h2>
    <p>Check out the latest Quizzems created by our community!</p>
    <Latest />
</div>
