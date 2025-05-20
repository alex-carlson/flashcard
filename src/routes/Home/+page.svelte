<script>
    import Search from "../../lib/Search.svelte";
    import Latest from "../../lib/Latest.svelte";

    document.title = "Home";
</script>

<div class="container white">
    <div class="padding">
        <Search />
        <h2>Latest Quizzems</h2>
    </div>
    <Latest />
    <div class="padding">
        <a href="/#/explore">See More...</a>
    </div>
</div>
