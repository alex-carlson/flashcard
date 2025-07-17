<script>
	export let currentMode, modes, onModeChange;
</script>

<select class="mt-3" on:change={onModeChange}>
	{#each Object.keys(modes) as mode}
		<option value={mode}>{modes[mode]}</option>
	{/each}
</select>
