<script>
	import { createEventDispatcher } from "svelte";
	import LazyLoadImage from "./LazyLoadImage.svelte";
	import Options from "./Options.svelte";
	import ProfilePicture from "./ProfilePicture.svelte";
	import YoutubeAudioPlayer from "$lib/YoutubeAudioPlayer.svelte";
	import { areStringsClose } from "$lib/api/utils";
	import Fa from "svelte-fa";
	import { faFlag } from "@fortawesome/free-solid-svg-icons";

	export let item;
	export let i = 0;
	export let cards = [];
	export let currentMode = "FLASH_CARDS";
	export let shuffleTrigger = 0;
	export let onCardLoad = () => {};
	export let toggleReveal = () => {};
	export let updateCards = () => {};

	const dispatch = createEventDispatcher();

	function handleInput(e) {
		clearTimeout(item._debounceTimeout);
		item._debounceTimeout = setTimeout(() => {
			if (areStringsClose(item.userAnswer, item.answer, 0.9)) {
				item.revealed = true;
				item.userAnswer = item.answer;
				e.target.value = item.answer;
				e.target.disabled = true;
				e.target.style.display = "none";
				e.target.style.backgroundColor = "#d4edda";

				dispatch("correctAnswer", { index: i });

				const inputs = document.querySelectorAll(".flashcards input");
				for (let j = i + 1; j < inputs.length; j++) {
					if (!inputs[j].disabled) {
						inputs[j].scrollIntoView({
							behavior: "smooth",
							block: "end",
							inline: "nearest",
						});
						setTimeout(() => {
							inputs[j].focus({ preventScroll: true });
						}, 80);
						break;
					}
				}
			}
		}, 100);
	}
</script>

{#if !item.hidden}
	<div
		class="card {item.revealed ? 'revealed' : ''} {item.incorrect
			? 'incorrect'
			: ''}"
		data-card-index={i}
		role="button"
		tabindex="-1"
		on:keydown={(e) =>
			currentMode === "FLASH_CARDS" &&
			e.key === "Enter" &&
			toggleReveal(i)}
		on:click={() => currentMode === "FLASH_CARDS" && toggleReveal(i)}
	>
		<pre>{JSON.stringify(item, null, 2)}</pre>
		{#if item.type === "audio"}
			<YoutubeAudioPlayer id={item.id} videoId={item.audio} />
			{#if item.revealed}
				<div class="audio-revealed">
					<a
						href={`https://www.youtube.com/watch?v=${item.audio}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<img
							src={`${item.thumbnail}`}
							alt="YouTube thumbnail"
							class="youtube-thumbnail"
						/>
					</a>
					<div class="youtube-title">
						{item.title}
					</div>
				</div>
			{/if}
		{:else if item.type === "image" || item.image || item.imageUrl}
			<LazyLoadImage
				imageUrl={`${import.meta.env.VITE_S3_URL}${item.prompt}`}
				on:load={() => onCardLoad(i)}
				on:error={() => {
					item.hidden = true;
					updateCards();
				}}
			/>
		{:else if item.question}
			<h2 class="p-3">{item.question || "Loading"}</h2>
		{/if}

		{#if currentMode === "TRUE_FALSE"}
			<Options
				{cards}
				currentCardIndex={i}
				numberOfOptions="2"
				{shuffleTrigger}
			/>
		{:else if currentMode === "MULTIPLE_CHOICE"}
			<Options
				{cards}
				currentCardIndex={i}
				numberOfOptions="4"
				{shuffleTrigger}
			/>
		{:else if currentMode === "FILL_IN_THE_BLANK"}
			{#if item.answerer}
				<ProfilePicture
					userId={item.answerer}
					size={32}
					class="answerer"
				/>
			{/if}
			<span
				class={item.revealed ? "revealed" : "hidden"}
				style="transform: scale(1);"
			>
				{item.answer}
			</span>
			<input
				type="text"
				placeholder="Type your answer here..."
				bind:value={item.userAnswer}
				on:input={handleInput}
			/>
		{:else}
			<span
				class={item.revealed ? "revealed" : "hidden"}
				style="transform: scale(1);"
			>
				{item.answer}
			</span>
		{/if}

		<div class="answerbox mt-2">
			{#if currentMode === "TRUE_FALSE"}
				<Options
					{cards}
					currentCardIndex={i}
					numberOfOptions="2"
					{shuffleTrigger}
					on:correctAnswer
				/>
			{:else if currentMode === "MULTIPLE_CHOICE"}
				<Options
					{cards}
					currentCardIndex={i}
					numberOfOptions="4"
					{shuffleTrigger}
					on:correctAnswer
				/>
			{:else if currentMode === "FILL_IN_THE_BLANK"}
				{#if item.answerer}
					<ProfilePicture
						userId={item.answerer}
						size={32}
						class="answerer"
					/>
				{/if}
				<span
					class={`answer ${item.revealed ? "revealed" : "hidden"}`}
					style="transform: scale(1);"
				>
					{#if item.revealed}
						{#if item.type === "multiplechoice"}
							{item.answers[item.correctAnswerIndex || 0]}
						{:else if item.type === "multianswer"}
							{userAnswers.filter((a) => a?.trim()).join(", ") ||
								"No answers provided"}
						{:else}
							{Array.isArray(item.answer)
								? item.answer[0]
								: item.answer}
						{/if}
					{:else}
						{item.answer}
					{/if}
				</span>
				{#if item.extra && item.revealed}
					<span class="extra">{item.extra}</span>
				{/if}
				<div class="input-container">
					{#if !item.revealed && !isPartyMode}
						<button
							class="give-up-btn small"
							on:click|stopPropagation={handleGiveUp}
							tabindex="-1"
						>
							<Fa icon={faFlag} />
						</button>
					{/if}
					{#if item.type === "multiplechoice"}
						<!-- Multiple Choice - Radio buttons -->
						<div class="multiple-choice-inputs">
							{#each item.answers || [] as choice, idx}
								<button
									type="button"
									class="choice-option
									{userAnswers[0] == idx ? 'selected' : ''}
									{isLockedIn && idx === item.correctAnswerIndex ? 'correct' : ''}
									{isLockedIn && userAnswers[0] == idx && idx !== item.correctAnswerIndex
										? 'incorrect'
										: ''}"
									on:click={() => {
										if (!isLockedIn) {
											userAnswers[0] = idx;
											isLockedIn = true;
											item.revealed = true;
											handleInput(0, {
												target: { value: idx },
											});
										}
									}}
									disabled={isLockedIn}
								>
									<span class="choice-text">{choice}</span>
								</button>
							{/each}
						</div>
					{:else if item.type === "multianswer"}
						<!-- Multi-Answer - Multiple text inputs -->
						<div class="multi-answer-inputs">
							{#each Array(item.numRequired || item.answer.length) as _, idx}
								<div class="input-row">
									<input
										type="text"
										class={getInputClass(idx)}
										placeholder={`Answer ${idx + 1}`}
										value={userAnswers[idx] || ""}
										on:input={(e) => handleInput(idx, e)}
										disabled={isLockedIn}
									/>
								</div>
							{/each}
						</div>
					{:else}
						<!-- Single Answer - Single text input -->
						<input
							type="text"
							class={getInputClass(0)}
							placeholder="Enter your answer"
							value={userAnswers[0] || ""}
							on:input={(e) => handleInput(0, e)}
						/>
					{/if}
				</div>
			{:else}
				<span
					class={`answer black ${item.revealed ? "revealed" : "hidden"}`}
					style="transform: scale(1);"
				>
					{Array.isArray(item.answer)
						? item.answer[0]
						: item.answer || "Loading"}
				</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* .answer-box.correct {
		border-color: #28a745;
		background-color: #d4edda;
	}

	.answer-box.incorrect {
		border-color: #dc3545;
		background-color: #f8d7da;
	} */

	.validation-status {
		display: inline-block;
		margin-left: 10px;
		font-weight: bold;
	}

	.validation-status.correct {
		color: #28a745;
	}

	.validation-status.incorrect {
		color: #dc3545;
	}

	input:disabled {
		background-color: #e9ecef;
		opacity: 1;
		cursor: not-allowed;
	}

	.multi-answer-inputs {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.multiple-choice-inputs {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.choice-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 0.375rem;
		cursor: pointer;
		transition:
			background-color 0.2s,
			border-color 0.2s;
	}

	.choice-option:hover {
		background-color: #f8f9fa;
		border-color: #adb5bd;
	}

	.choice-option.selected {
		background-color: #e3f2fd;
		border-color: #2196f3;
	}

	.choice-option.correct {
		background-color: #d4edda;
		border-color: #28a745;
		color: #155724;
	}

	.choice-option.incorrect {
		background-color: #f8d7da;
		border-color: #dc3545;
		color: #721c24;
	}

	.choice-option input[type="radio"] {
		margin: 0;
		cursor: pointer;
	}

	.choice-text {
		flex: 1;
		cursor: pointer;
		user-select: none;
	}

	.input-row {
		display: block;
		width: 100%;
	}

	.input-row input {
		width: 100%;
		display: block;
	}
</style>
