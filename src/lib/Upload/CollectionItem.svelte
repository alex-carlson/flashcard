<script>
	import { createEventDispatcher } from "svelte";
	import { Fa } from "svelte-fa";
	import Cropper from "./Cropper.svelte";
	import Drawing from "./Drawing.svelte";
	import AnswerInput from "../components/AnswerInput.svelte";
	import { Fa } from "svelte-fa";
	import {
		faPenToSquare,
		faTrashCan,
		faFloppyDisk,
		faBan,
		faChevronUp,
		faChevronDown,
	} from "@fortawesome/free-solid-svg-icons";
	import { uploadData, fetchCollectionItemById } from "./uploader.js";
	import { addToast } from "../../stores/toast.js";

	export let itemId = null;
	export let index;
	export let editableItemId;
	export let isReordering;
	export let collection;

	let item = {};

	// when itemId changes, call fetchItemFromServer
	$: if (itemId && itemId !== item.id) {
		fetchItemFromServer(itemId);
	}

	async function fetchItemFromServer(id) {
		try {
			const result = await fetchCollectionItemById(id);
			console.log("Fetched item from server:", result);
			if (result) {
				// Update individual properties instead of replacing item
				item.id = result.id;
				item.image = import.meta.env.VITE_S3_URL + result.prompt;
				item.question = result.prompt;
				item.answer = result.answer;
				item.extra = result.extra;
				item.audio = result.prompt;
				item.thumbnail = import.meta.env.VITE_S3_URL + result.thumbnail;
				item.title = result.title;
				// Add more fields as needed
			}
		} catch (error) {
			console.error("Error fetching item from server:", error);
			addToast({
				type: "error",
				message: "Failed to fetch item from server.",
			});
		}
	}

	let isCropping = false; // Track if cropping is active
	let isDrawing = false; // Track if drawing is active
	const dispatch = createEventDispatcher();

	// Normalize answer data for AnswerInput component when entering edit mode
	function normalizeAnswerData(item) {
		// Handle legacy array-based answers in item.answer
		if (Array.isArray(item.answer)) {
			// Convert legacy array to new format
			if (!item.answers) {
				item.answers = [...item.answer];
			}
			// Set as multi-answer by default unless specifically marked as multiple choice
			if (!item.isMultipleChoice) {
				item.type = "multianswer";
				if (!item.numRequired) {
					item.numRequired = item.answer.length;
				}
			}
			// Keep the first answer as item.answer for compatibility
			item.answer = item.answer[0] || "";
		}

		// Handle items marked as multianswer type but missing answers array
		if (item.type === "multianswer" && !item.answers && item.answer) {
			if (typeof item.answer === "string") {
				// Split string answer into array if it contains separators
				const separatedAnswers = item.answer
					.split(/[,;|]/)
					.map((a) => a.trim())
					.filter((a) => a);
				if (separatedAnswers.length > 1) {
					item.answers = separatedAnswers;
				} else {
					item.answers = [item.answer, ""];
				}
				if (!item.numRequired) {
					item.numRequired = item.answers.length;
				}
			}
		}

		// Handle multiple choice items
		if (item.type === "multiplechoice" || item.isMultipleChoice) {
			item.isMultipleChoice = true;
			item.type = "multiplechoice";
			item.numRequired = 1;

			// Ensure answers array exists
			if (!item.answers) {
				if (item.answer) {
					item.answers = [item.answer, ""];
				} else {
					item.answers = ["", ""];
				}
			}

			// Ensure correctAnswerIndex is set
			if (
				item.correctAnswerIndex === undefined ||
				item.correctAnswerIndex === null
			) {
				item.correctAnswerIndex = 0;
			}
		}

		// Ensure single answer items have proper format
		if (!item.type || item.type === "single") {
			item.type = "single";
			// Clean up multi-answer properties for single answers
			if (!Array.isArray(item.answer) && !item.answers) {
				delete item.answers;
				delete item.isMultipleChoice;
				delete item.numRequired;
				delete item.correctAnswerIndex;
			}
		}

		return item;
	}

	function removeItemHandler() {
		dispatch("removeItem", item.id);
	}

	function reorderItemHandler(prevIndex, newIndex) {
		dispatch("reorderItem", { prevIndex, newIndex });
	}

	function saveEditHandler() {
		editableItemId = null;
		dispatch("saveEdit", item);
	}

	async function addItemMetaData(videoId) {
		try {
			const response = await fetch(
				`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`,
			);
			const data = await response.json();
			if (data.items && data.items.length > 0) {
				const snippet = data.items[0].snippet;
				const updatedItem = {
					...item,
					thumbnail: snippet.thumbnails?.medium?.url || "",
					title: snippet.title || "",
				};
				console.log("Updated item with metadata:", updatedItem);
				dispatch("saveEdit", updatedItem);
			} else {
				console.warn("No video data found for ID:", videoId);
			}
		} catch (err) {
			console.error("Error fetching video data:", err);
		}
	}

	async function uploadChangedImage(file, fileName = null) {
		try {
			if (file && typeof file === "object") {
				const defaultFileName =
					fileName || file.name || "modified-image.jpg";
				file.originalname = defaultFileName;
			}

			const tempItem = {
				...item,
				file: file,
				answer: item.answer,
				category: collection?.category || item.category,
			};

			console.log("Temporary item for upload:", tempItem);

			const result = await uploadData(tempItem, item.id, false);

			if (result && result.length > 0) {
				const updatedItem = result[0].items.find(
					(i) => i.id === item.id,
				);
				if (updatedItem) {
					item.image = updatedItem.image;

					addToast({
						type: "success",
						message: "Image updated successfully!",
					});

					dispatch("updateItem", { id: item.id, image: item.image });
				}
			}
		} catch (error) {
			console.error("Error updating image:", error);
			addToast({
				type: "error",
				message: "Failed to update image. Please try again.",
			});
		}
	}

	async function onCropped(event) {
		console.log("Cropped event received:", event);
		const croppedFile = event.detail;
		const fileExtension = croppedFile.type.split("/")[1] || "png";

		await uploadChangedImage(croppedFile, "cropped-image." + fileExtension);
		isCropping = false;
	}

	async function onSave(event) {
		console.log("Drawing saved:", event);
		const { dataURL } = event.detail;

		const response = await fetch(dataURL);
		const blob = await response.blob();
		const file = new File([blob], "drawing.png", { type: "image/png" });

		await uploadChangedImage(file, "drawing.png");
		isDrawing = false;
	}

	function onCancel() {
		console.log("Drawing cancelled");
		isCropping = false;
		isDrawing = false;
	}

	function isEditable(image) {
		if (!image || typeof image !== "string") return false;

		const stillRasterExtensions = /\.(bmp|png|jpe?g|webp|latest)$/i;
		const animatedExtensions = /\.(gif|apng|svg)$/i;

		try {
			const url = new URL(image);
			const segments = url.pathname.split("/").reverse();

			for (const segment of segments) {
				if (animatedExtensions.test(segment)) return false;
				if (stillRasterExtensions.test(segment)) return true;
			}
		} catch {
			const segments = image
				.split("?")[0]
				.split("#")[0]
				.split("/")
				.reverse();

			for (const segment of segments) {
				if (animatedExtensions.test(segment)) return false;
				if (stillRasterExtensions.test(segment)) return true;
			}
		}

		return false;
	}
</script>

<li class={isReordering ? "item reorder" : "item"} draggable={isReordering}>
	{#if editableItemId === item.id && item.id != null}
		<div class="editing">
			{#if item.question != null}
				<input
					id="editedQuestion"
					type="text"
					bind:value={item.question}
					placeholder="Enter a question"
				/>
			{:else if item.audio != null}
				<input
					id="editedAudio"
					type="text"
					bind:value={item.audio}
					placeholder="Enter an audio URL"
				/>
			{:else}
				<img src={item.image} alt="To crop" class="border" />
				{#if !isCropping && !isDrawing}
					<div class="actions my-3">
						{#if isEditable(item.image)}
							<button
								class="btn btn-secondary"
								on:click={() => (isCropping = true)}
								>Crop</button
							>
							<button
								class="btn btn-secondary"
								on:click={() => (isDrawing = true)}>Edit</button
							>
						{/if}
					</div>
				{:else if isCropping}
					<Cropper
						src={item.image}
						on:cropped={onCropped}
						on:cancel={onCancel}
					/>
				{:else if isDrawing}
					<Drawing
						src={item.image}
						on:save={onSave}
						on:cancel={onCancel}
					/>
				{/if}
			{/if}
			<textarea
				bind:value={item.supplemental}
				placeholder="Supplemental Question Text"
			></textarea>

			<!-- Use AnswerInput component for consistent answer editing -->
			<AnswerInput
				bind:item
				idPrefix="collection-item-{item.id}"
				label="Answer:"
			/>
			<input
				id="editedExtra"
				type="text"
				bind:value={item.extra}
				placeholder="Enter extra info"
			/>
			<div class="vertical">
				<button class="success" on:click={saveEditHandler}
					><Fa icon={faFloppyDisk} /></button
				>
				<button class="danger" on:click={(editableItemId = null)}
					><Fa icon={faBan} /></button
				>
			</div>
		</div>
	{:else}
		{#if item.type == "question"}
			<span class="question">{item.question}</span>
		{:else if item.type == "audio"}
			<div class="audio">
				{#if item.thumbnail}
					<img src={item.thumbnail} alt={item.answer} />
					<p>{item.title || item.answer}</p>
				{:else}
					<button on:click={() => addItemMetaData(item.audio)}>
						<Fa icon={faPenToSquare} />Update Data</button
					>
				{/if}
			</div>
		{:else}
			<img class="preview" src={item.file || item.image} alt="Preview" />
		{/if}
		<div class="answer-field vertical">
			{#if item.isMultipleChoice && item.answers}
				<span class="answer-type-label">Multiple Choice:</span>
				{#each item.answers as answer, index}
					<span
						class="answer-option {item.correctAnswerIndex === index
							? 'correct-answer'
							: ''}"
					>
						{item.correctAnswerIndex === index ? "✓" : "•"}
						{answer}
					</span>
				{/each}
			{:else if item.type === "multianswer" && item.answers}
				<span class="answer-type-label"
					>Multi-Answer ({item.numRequired || item.answers.length} required):</span
				>
				{#each item.answers as answer}
					<span class="answer-option">• {answer}</span>
				{/each}
			{:else if Array.isArray(item.answer)}
				<span class="answer-type-label">Multiple Answers:</span>
				{#each item.answer as answer}
					<span class="answer-option">• {answer}</span>
				{/each}
			{:else}
				<span>{item.answer}</span>
			{/if}
			<span>{item.extra}</span>
		</div>
		{#if isReordering}
			<div class="reorder">
				<button on:click={() => reorderItemHandler(index, index - 1)}>
					<Fa icon={faChevronUp} />
				</button>
				<button on:click={() => reorderItemHandler(index, index + 1)}>
					<Fa icon={faChevronDown} />
				</button>
			</div>
		{:else}
			<div class="vertical">
				<button
					class="edit secondary"
					on:click={() => {
						// Normalize answer data before entering edit mode
						normalizeAnswerData(item);
						editableItemId = item.id;
					}}
				>
					<Fa icon={faPenToSquare} />
				</button>
				<button
					class="remove danger"
					on:click={() => removeItemHandler(item.id)}
				>
					<Fa icon={faTrashCan} />
				</button>
			</div>
		{/if}
	{/if}
</li>

<style>
	.answer-type-label {
		font-weight: 600;
		color: #495057;
		margin-bottom: 0.25rem;
	}

	.answer-option {
		display: block;
		padding: 0.125rem 0;
		color: #495057;
	}

	.correct-answer {
		font-weight: 600;
		color: #28a745;
	}
</style>
