<script>
  import Router from "svelte-spa-router";
  import Header from "./lib/Header.svelte";
  import Footer from "./lib/Footer.svelte";
  import Home from "./routes/Home/+page.svelte";
  import Login from "./routes/Login/+page.svelte";
  import Signup from "./routes/Signup/+page.svelte";
  import UploadForm from "./routes/Upload/+page.svelte";
  import FlashCards from "./routes/[collectionId]/+page.svelte";
  import Author from "./routes/[author]/+page.svelte";
  import NotFound from "./routes/NotFound/+page.svelte";
  import Account from "./routes/Account/+page.svelte";
  import PasswordReset from "./routes/PasswordReset/+page.svelte";
  import Explore from "./routes/Explore/+page.svelte";

  const routes = {
    "/": Home,
    "/login": Login,
    "/signup": Signup,
    "/upload": UploadForm,
    "/account": Account,
    "/reset-password": PasswordReset,
    "/explore": Explore,
    "/:author/:category": FlashCards,
    "/:author": Author,
    "*": NotFound,
  };
</script>

<Header></Header>
<main>
  <Router {routes}></Router>
</main>
<Footer></Footer>
