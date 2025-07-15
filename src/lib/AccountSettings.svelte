<script>
	import { user, setUserBio } from '$stores/user';
	import { getSession } from '$lib/api/supabaseClient';
	import { updateUsername, updateEmail } from '$lib/api/auth';
	import { toggleCache, CACHE_ENABLED } from '$stores/data';
	import { get } from 'svelte/store';

	let message = '';
	let file = null;
	let userId = null;
	let cacheEnabled = CACHE_ENABLED;
	$: userId = get(user)?.id ?? null;

	async function getAuthHeaders() {
		const { data: sessionData, error: sessionError } = await getSession();
		if (sessionError || !sessionData?.session) {
			throw new Error('User session not found');
		}
		return {
			Authorization: `Bearer ${sessionData.session.access_token}`
		};
	}

	async function convertImageToJPG(file) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const reader = new FileReader();

			reader.onload = (e) => {
				img.src = e.target.result;
			};

			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;

				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0);

				// Convert to JPEG Blob (quality 0.92 is default for good compression vs. quality)
				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error('Failed to convert image to JPG'));
						}
					},
					'image/jpeg',
					0.92
				);
			};

			img.onerror = (err) => reject(err);
			reader.onerror = (err) => reject(err);

			reader.readAsDataURL(file);
		});
	}

	async function uploadProfilePicture(file) {
		const headers = await getAuthHeaders();
		if (file) {
			console.log('File selected:', file);
			const jpgBlob = await convertImageToJPG(file[0]);

			const formData = new FormData();
			formData.append('file', jpgBlob, 'avatar.jpg');
			formData.append('uuid', $user.id);
			formData.append('folder', $user.id);
			formData.append('bucket', 'profilepictures');
			formData.append('fileName', `avatar.jpg`);
			const response = await fetch(`${import.meta.env.VITE_API_URL}${'/users/uploadAvatar'}`, {
				method: 'POST',
				headers,
				body: formData
			});
		}
	}
	async function updateBio() {
		const bio = $user.bio;
		if (!userId) {
			message = 'User ID not found';
			return;
		}

		const updated = await setUserBio(userId, bio);
		if (updated) {
			message = 'Bio updated successfully!';
		} else {
			message = 'Failed to update bio.';
		}
	}

	function handleCacheToggle() {
		cacheEnabled = toggleCache(cacheEnabled);
		message = `Cache ${cacheEnabled ? 'enabled' : 'disabled'}`;
	}
</script>

{#if $user}
	<div class="form">
		<div class="profile-picture white padding">
			<label for="profile-picture-input"><strong>Update Profile Picture</strong></label>
			<input
				id="profile-picture-input"
				type="file"
				accept="image/*"
				bind:files={file}
				multiple={false}
			/>
			<button on:click={() => uploadProfilePicture(file)}>Upload Profile Picture</button>
		</div>
		<div class="text-field padding">
			<label>
				<strong>Email:</strong>
				<input type="email" bind:value={$user.email} />
			</label>
			<button on:click={() => updateEmail($user.email)}>Update Email</button>
		</div>
		<div class="text-field padding">
			<label>
				<strong>Display Name:</strong>
				<input type="text" bind:value={$user.username} />
			</label>
			<button on:click={() => updateUsername($user.username)}>Update Name</button>
		</div>
		<div class="text-field padding">
			<label>
				<strong>Bio:</strong>
				<textarea bind:value={$user.bio}></textarea>
			</label>
			<button on:click={() => updateBio()}>Update Bio</button>
		</div>
		<div class="toggle-field padding">
			<label>
				<strong>Cache Settings:</strong>
				<div class="toggle-container">
					<input
						type="checkbox"
						id="cache-toggle"
						bind:checked={cacheEnabled}
						on:change={handleCacheToggle}
					/>
					<label for="cache-toggle" class="toggle-label">
						{cacheEnabled ? 'Cache Enabled' : 'Cache Disabled'}
					</label>
				</div>
			</label>
			<p class="cache-description">
				{cacheEnabled
					? 'Data is cached for better performance. Disable to always fetch fresh data.'
					: 'Cache is disabled. All data will be fetched fresh on each request.'}
			</p>
		</div>
		<p>{message}</p>
	</div>
{:else}
	<p>Loading profile...</p>
{/if}

<style>
	.toggle-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.toggle-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	#cache-toggle {
		appearance: none;
		width: 48px;
		height: 24px;
		background: #ccc;
		border-radius: 12px;
		position: relative;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	#cache-toggle:checked {
		background: #4caf50;
	}

	#cache-toggle::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		transition: transform 0.3s ease;
	}

	#cache-toggle:checked::before {
		transform: translateX(24px);
	}

	.toggle-label {
		font-weight: 500;
		color: #333;
		cursor: pointer;
	}

	.cache-description {
		font-size: 0.875rem;
		color: #666;
		margin: 0;
		font-style: italic;
	}
</style>
