<script>
    document.title = "Profile";
</script>

<div class="container">
    {#if userData}
        <div class="container white">
            <h1>Account details for {userData.username}</h1>
            
        </div>
    {:else}
        <p>Loading...</p>
    {/if}
</div>
