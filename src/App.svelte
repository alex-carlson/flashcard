<script lang="ts">
  import Router from "svelte-spa-router";
  import Header from "./lib/Header.svelte";
  import Footer from "./lib/Footer.svelte";
  import Home from "./routes/Home/+page.svelte";
  import Login from "./routes/Login/+page.svelte";
  import Signup from "./routes/Signup/+page.svelte";
  import UploadForm from "./routes/Upload/+page.svelte";

  const routes = {
    "/": Home,
    "/login": Login,
    "/signup": Signup,
    "/upload": UploadForm,
  };
</script>

<Header />
<Router {routes}></Router>
<Footer />
