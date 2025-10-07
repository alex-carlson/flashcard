<script>
	export let questionType = 'Image';
</script>

<ul class="nav nav-tabs">
	<li class="nav-item">
		<button
			type="button"
			class="nav-link {questionType === 'Image' ? 'active' : ''}"
			on:click={() => (questionType = 'Image')}>Image</button
		>
	</li>
	<li class="nav-item">
		<button
			type="button"
			class="nav-link {questionType === 'Audio' ? 'active' : ''}"
			on:click={() => (questionType = 'Audio')}>Audio</button
		>
	</li>
	<li class="nav-item">
		<button
			type="button"
			class="nav-link {questionType === 'Question' ? 'active' : ''}"
			on:click={() => (questionType = 'Question')}>Question</button
		>
	</li>
</ul>

<style>
	.nav-tabs {
		border-bottom: 1px solid #dee2e6;
	}

	.nav-link {
		color: #6c757d;
		padding: 12px 24px;
		transition: all 0.2s ease;
		border: none;
		background: none;
		cursor: pointer;
		text-decoration: none;
		display: block;
		width: 100%;
		text-align: center;
        border-radius: 0;
	}

	.nav-link:hover {
		color: #495057;
		background-color: #f8f9fa;
	}

	.nav-link.active {
		color: #007bff;
		background-color: #fff;
		border-bottom: 2px solid #007bff;
		font-weight: 600;
	}
</style>