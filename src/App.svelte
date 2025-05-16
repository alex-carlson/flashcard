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
  import Account from "./routes/Account/+page.svelte";
  import Explore from "./routes/Explore/+page.svelte";

  const routes = {
    "/": Home,
    "/login": Login,
    "/upload": UploadForm,
    "/account": Account,
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
