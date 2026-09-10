<script>
	import Fa from 'svelte-fa';
	import {
		faEyeSlash,
		faEye,
		faExpand,
		faCompress,
		faPencil,
		faTableColumns
	} from '@fortawesome/free-solid-svg-icons';

	import { quiz } from '$store/quiz.js';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';

	$: cards = $quiz.cards || [];
	$: columns = $quiz.columns ?? 1;
	$: isFullscreen = $quiz.isFullscreen;
	$: showEditButton = $quiz.canEditCollection;
	$: areAnyCardsRevealed = cards.some((card) => card?.revealed);

	function toggleRevealAll() {
		quiz.setCards(
			cards.map((card) => ({
				...card,
				revealed: !areAnyCardsRevealed
			}))
		);
	}

	function editCollection() {
		goto(`/upload?collectionId=${get(quiz).collectionId}`);
	}

	function goFullscreen() {
		if (columns > 1) quiz.setColumns(1);

		quiz.setFullscreen(true);

		const container = document.querySelector('.container');
		container?.requestFullscreen?.() ||
			container?.webkitRequestFullscreen?.() ||
			container?.msRequestFullscreen?.();
	}

	function exitFullscreen() {
		quiz.setFullscreen(false);

		quiz.setCards(cards.map((card) => ({ ...card, scale: 1 })));

		document.exitFullscreen?.() ||
			document.webkitExitFullscreen?.() ||
			document.msExitFullscreen?.();
	}

	function toggleFullscreen() {
		isFullscreen ? exitFullscreen() : goFullscreen();
	}
</script>

<div class="toolbar">
	<button
		on:click={toggleRevealAll}
		title={areAnyCardsRevealed ? 'Hide all cards' : 'Reveal all cards'}
	>
		<Fa icon={areAnyCardsRevealed ? faEyeSlash : faEye} />
	</button>
	{#if !isFullscreen}
		<div class="toolbar-select-control" title="Choose card columns">
			<span class="toolbar-select-icon" aria-hidden="true">
				<Fa icon={faTableColumns} />
			</span>
			<select
				class="toolbar-select"
				aria-label="Choose card columns"
				value={columns}
				on:change={(event) => quiz.setColumns(Number(event.currentTarget.value))}
			>
				{#each Array.from({ length: 6 }, (_, index) => index + 1) as value}
					<option value={value}>{value}</option>
				{/each}
			</select>
		</div>
	{/if}
	<button on:click={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
		<Fa icon={isFullscreen ? faCompress : faExpand} />
	</button>
	{#if showEditButton}
		<button on:click={editCollection} title="Edit this quiz">
			<Fa icon={faPencil} />
		</button>
	{/if}
</div>
