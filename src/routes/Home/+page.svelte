<script>
    import Search from "../../lib/Search.svelte";
    let token = localStorage.getItem("token");
    let isLoggedIn = !!token;

    document.title = "Home";
</script>

<div class="container">
    <h1>Pick a category</h1>
    <Search />
    <!-- if logged in -->
    {#if isLoggedIn}
        <h1>Or <a href="#/upload">create a new one</a>!</h1>
    {:else}
        <h1>Or <a href="#/login">log in</a> to create one!</h1>
    {/if}
</div>
