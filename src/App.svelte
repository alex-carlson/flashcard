<script>
  import Router from "svelte-spa-router";
  import Header from "./lib/Header.svelte";
  import Footer from "./lib/Footer.svelte";
  import Home from "./routes/Home/+page.svelte";
  import Login from "./routes/Login/+page.svelte";
  import Dashboard from "./routes/Dashboard/+page.svelte";
  import UploadForm from "./routes/Upload/+page.svelte";
  import FlashCards from "./routes/[collectionId]/+page.svelte";
  import Author from "./routes/[author_id]/+page.svelte";
  import NotFound from "./routes/NotFound/+page.svelte";
  import Explore from "./routes/Explore/+page.svelte";
  import About from "./routes/About/+page.svelte";

  const routes = {
    "/": Home,
    "/about": About,
    "/login": Login,
    "/upload": UploadForm,
    "/dashboard": Dashboard,
    "/explore": Explore,
    "/:author_id/:category": FlashCards,
    "/:author_id": Author,
    "*": NotFound,
  };
</script>

<Header></Header>
<main>
  <Router {routes}></Router>
</main>
<Footer></Footer>
