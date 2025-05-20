<script>
  import { profile, user, setUserBio, setUserAvatarUrl } from '$stores/user';
  import { getSession } from '$lib/supabaseClient';
  import { logOut, updateUsername, updateEmail } from '$lib/auth/auth';
  import ProfilePicture from './ProfilePicture.svelte';
  import { get } from 'svelte/store';

  let message = '';
  let file = null;
  let userId = null;
  $: userId = get(user)?.id ?? null;

  async function getAuthHeaders() {
    const { data: sessionData, error: sessionError } = await getSession();
    if (sessionError || !sessionData?.session) {
        throw new Error('User session not found');
    }
    return {
        Authorization: `Bearer ${sessionData.session.access_token}`,
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
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to JPG'));
          }
        }, 'image/jpeg', 0.92);
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
      formData.append('uuid', $profile.id);
      formData.append('folder', $profile.id);
      formData.append('bucket', 'profilepictures')
      formData.append('fileName', `avatar.jpg`);
      const response = await fetch(`${import.meta.env.VITE_API_URL}${'/users/uploadAvatar'}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (response.ok) {
        $profile.picture = URL.createObjectURL(file);
        await setUserAvatarUrl(userId, URL.createObjectURL(file));
        message = 'Profile picture updated successfully!';
      } else {
        message = 'Failed to update profile picture.';
      }
    }
  }

  async function updateBio() {
    const bio = $profile.bio;
    if(!userId) {
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

</script>

{#if $profile}
  <ProfilePicture userId={$profile.id} size=150 />
  <details class="accountSettings padding">
    <summary>Account Settings</summary>
    <!-- upload profile picture -->
    <div class="profile-picture">
      <input
        type="file"
        accept="image/*"
        bind:files={file}
        multiple={false}
      />
      <button on:click={() => uploadProfilePicture(file)}>Upload Profile Picture</button>
    </div>
      <div class="text-field">
        <label>
          <strong>Email:</strong>
          <input type="email" bind:value={$profile.email} />
        </label>
        <button on:click={() => updateEmail($profile.email)}>Update Email</button>
      </div>
      <div class="text-field">
        <label>
          <strong>Display Name:</strong>
          <input type="text" bind:value={$profile.username} />
        </label>
        <button on:click={() => updateUsername($profile.username)}>Update Name</button>
      </div>
      <div class="text-field">
        <label>
          <strong>Bio:</strong>
          <textarea bind:value={$profile.bio} />
        </label>
        <button on:click={() => updateBio()}>Update Bio</button>
      </div>
      <p>{message}</p>
      <button class="warning" on:click={() => { logOut(); window.location.href = '/'; }}>Log Out</button>
      <button class="danger" on:click={logOut}>Delete Account</button>
  </details>
{:else}
  <p>Loading profile...</p>
{/if}
