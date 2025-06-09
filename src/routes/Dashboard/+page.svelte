<script lang="ts">
  import AccountSettings from "$lib/AccountSettings.svelte";
  import { user, logOutUser } from "$stores/user";
  import { getUserQuizScores, getCollectionMetadataFromId } from "$lib/utils";
  import { onMount } from "svelte";

  let scores = [];

  async function getQuizScores() {
    // get quizzescompleted by the user
    if ($user) {
      const data = await getUserQuizScores($user.id);
      // For each score, resolve the collection name
      scores = await Promise.all(
        data.map(async (score) => {
          const metadata = await getCollectionMetadataFromId(score.quiz_id);
          console.log("Metadata for quiz:", metadata);
          return {
            ...score,
            collectionName: metadata.category,
            author_id: metadata.author_id,
          };
        }),
      );
      // Sort scores by percentage, highest to lowest
      scores.sort((a, b) => b.percentage - a.percentage);
      console.log("Scores:", scores);
    }
  }

  onMount(() => {
    document.title = "User Dashboard";
    getQuizScores();
  });
</script>

<div class="container white">
  {#if $user}
    <div class="padding">
      <h2>Logged in as {$user.displayName || $user.email}</h2>
    </div>

    <AccountSettings />
    <div class="padding">
      <h3>Scores</h3>
      <ul>
        {#each scores as score}
          <li>
            <a href="#/{score.author_id}/{score.collectionName}">
              <strong>{score.collectionName}</strong></a
            >
            - {score.percentage}%
          </li>
        {/each}
      </ul>
    </div>

    <div class="padding">
      <button on:click={() => (window.location.hash = "/upload")}>
        Your Quizzems
      </button>
      <button class="warning" on:click={logOutUser}> Log out </button>
    </div>
  {:else}
    <p>Loading user data...</p>
  {/if}
</div>
