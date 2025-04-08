<script>
    import Search from "../../lib/Search.svelte";
    import Latest from "../../lib/Latest.svelte";
    let token = localStorage.getItem("token");
    let isLoggedIn = !!token;

    document.title = "Home";
</script>

<div class="container white">
    <h1>Pick a category</h1>
    <Search />

    <h2>Latest Quizzems</h2>
    <p>Check out the latest quizzems created by our community!</p>
    <Latest />

    {#if isLoggedIn}
        <h1>Or <a href="#/upload">create a new one</a>!</h1>
    {:else}
        <h1>Or <a href="#/login">log in</a> to create one!</h1>
    {/if}
</div>
