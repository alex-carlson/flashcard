<script lang="ts">
  import Router from "svelte-spa-router";
  import Header from "./lib/Header.svelte";
  import Footer from "./lib/Footer.svelte";
  import Home from "./routes/Home/+page.svelte";
  import Login from "./routes/Login/+page.svelte";
  import Signup from "./routes/Signup/+page.svelte";
  import UploadForm from "./routes/Upload/+page.svelte";
  import FlashCards from "./routes/[collectionId]/+page.svelte";
  import NotFound from "./routes/NotFound/+page.svelte";

  const routes = {
    "/": Home,
    "/login": Login,
    "/signup": Signup,
    "/upload": UploadForm,
    "/:author/:category": FlashCards,
    "*": NotFound,
  };
</script>

<Header />
<Router {routes}></Router>
<Footer />
