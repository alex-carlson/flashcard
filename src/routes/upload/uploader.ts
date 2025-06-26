import { v4 as uuidv4 } from 'uuid';
import { getSession } from '$lib/api/supabaseClient';
import { apiFetch } from '$lib/api/fetchData';
import { get } from 'svelte/store';
import { user } from '$stores/user';

const currentUser = get(user);

// Create new collection
async function createCollection() {
    try {
        const username = currentUser.username;
        const data = {
            category: tempCategory,
            author_id: currentUser.uid,
            author_uuid: currentUser.id,
            author: username
        };
        console.log('Creating collection with data:', data);
        const created = await apiFetch('/collections/createCollection', 'POST', data);
        collections = [...collections, created];
        category = tempCategory;
    } catch (error) {
        console.error('Error creating collection:', error);
        errorMessage = 'Create failed. Please try again.';
    }
}

// Rename collection
async function renameCollection() {
    try {
        await apiFetch('/collections/renameCollection', 'POST', {
            oldCategory: category,
            newCategory: tempCategory
        });
        category = tempCategory;
    } catch (error) {
        console.error('Error renaming collection:', error);
        errorMessage = 'Rename failed. Please try again.';
    }
}

// Remove item
async function removeItem(itemId) {
    try {
        await apiFetch('/items/remove', 'POST', {
            category,
            itemId
        });
        items = items.filter((item) => item.id !== itemId);
    } catch (error) {
        console.error('Error removing item:', error);
        errorMessage = 'Remove failed. Please try again.';
    }
}

async function saveEdit(item) {
    console.log('Saving edit for item:', item);
    try {
        await apiFetch('/items/edit', 'POST', {
            collection: category,
            id: item.id,
            author_id: currentUser.uid,
            answer: item.answer
        });
        editableItemId = null;
    } catch (error) {
        console.error('Error editing item:', error);
        errorMessage = 'Edit failed. Please try again.';
        // clear error message after 10 seconds
        setTimeout(() => {
            errorMessage = ''; // Clear the error message after 10 seconds
        }, 10000);
    }
}

// Reorder items
async function reorderItems() {
    try {
        const itemAnswers = items.map((item) => item.answer);
        await apiFetch('/items/reorder', 'POST', { category, itemAnswers });
        isReordering = false;
    } catch (error) {
        console.error('Error reordering items:', error);
        errorMessage = 'Reorder failed. Please try again.';
    }
}

// Delete collection
async function deleteCollection() {
    try {
        const username = currentUser.username;
        const data = {
            collection: category,
            author_id: currentUser.id,
            username: username
        };
        console.log('Deleting collection:', data);
        await apiFetch(`/collections/${username}/${category}`, 'DELETE', data);
        collections = collections.filter((c) => c.category !== category);
        document.location.reload();
    } catch (error) {
        console.error('Error deleting collection:', error);
        errorMessage = 'Delete failed. Please try again.';
    }
}

// show confirm delete popup
function confirmDelete() {
    if (confirm('Are you sure you want to delete this collection?')) {
        deleteCollection();
    }
}

// Upload data
async function uploadData(uuid = uuidv4(), forceJpg = false) {
    // If file is a URL (string), call /upload-url
    if (typeof localItem.file === 'string') {
        console.log('Detected URL upload:', localItem.file);
        try {
            const data = {
                uuid,
                url: localItem.file,
                folder: `${currentUser.username}/${category}`,
                forceJpeg: forceJpg,
                author_uuid: currentUser.id,
                author_id: currentUser.uid,
                author: currentUser.username,
                category,
                answer: localItem.answer
            };
            console.log('Uploading URL data:', data);
            const result = await apiFetch('/items/upload-url', 'POST', data);
            showSuccessMessage('Upload successful!');
            const preview = document.querySelector('.preview');
            if (preview) preview.src = null;

            localItem.answer = '';
            document.getElementById('answer').value = '';
            items = result[0]?.items || [];
            localItem.file = null;
            if (preview) preview.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error uploading URL data:', error);
            showErrorMessage('Upload failed. Please try again.');
        }
        return;
    }

    // Otherwise, upload as file
    const formData = new FormData();
    formData.append('uuid', uuid);
    formData.append('file', localItem.file);
    formData.append('folder', `${currentUser.username}/${category}`);
    formData.append('forceJpeg', forceJpg);
    formData.append('answer', localItem.answer);
    formData.append('category', category);
    formData.append('author', currentUser.username);
    formData.append('author_uuid', currentUser.id);
    formData.append('author_id', currentUser.uid);

    // Log all FormData entries
    for (let [key, value] of formData.entries()) {
        console.log(`formData[${key}] =`, value);
    }

    try {
        const result = await apiFetch('/items/upload', 'POST', formData, true);
        showSuccessMessage('Upload successful!');
        const preview = document.querySelector('.preview');
        if (preview) preview.src = null;

        localItem.answer = '';
        document.getElementById('answer').value = '';
        items = result[0]?.items || [];
        localItem.file = null;
        if (preview) preview.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error uploading data:', error);
        showErrorMessage('Upload failed. Please try again.');
    }
}

async function uploadAudio(answer, url) {
    const username = currentUser.username;
    const author_id = currentUser.id;

    const formData = new FormData();
    formData.append('uuid', uuidv4());
    formData.append('url', url);
    formData.append('folder', `${username}/${category}`);
    formData.append('answer', answer);
    formData.append('category', category);
    formData.append('author', username);
    formData.append('author_id', author_id);
    formData.append('type', 'audio');
    console.log('Uploading audio data:', {
        uuid: formData.get('uuid'),
        url: formData.get('url'),
        folder: formData.get('folder'),
        answer: formData.get('answer'),
        category: formData.get('category')
    });

    try {
        const result = await apiFetch('/items/add-audio', 'POST', formData, true);
        showSuccessMessage('Audio upload successful!');
        items = result[0]?.items || [];
    } catch (error) {
        console.error('Error uploading audio data:', error);
        showErrorMessage('Audio upload failed. Please try again.');
    }
}

async function uploadQuestion() {
    const username = currentUser.username;
    const author_id = currentUser.id;

    const data = {
        uuid: uuidv4(),
        question: localItem.question,
        folder: `${username}/${category}`,
        answer: localItem.answer,
        category,
        author: username,
        author_id: currentUser.uid,
        author_uuid: currentUser.id
    };

    console.log('Uploading question data:', data);

    try {
        const result = await apiFetch('/items/add-question', 'POST', data);
        showSuccessMessage('Question upload successful!');
        items = result[0]?.items || [];
        localItem.question = '';
        localItem.answer = '';
    } catch (error) {
        console.error('Error uploading question data:', error);
        showErrorMessage('Question upload failed. Please try again.');
    }
}

export async function uploadThumbnail(data, category) {
    const formData = new FormData();
    formData.append('uuid', 'thumbnail');
    formData.append('file', data);
    formData.append('folder', `${currentUser.username}/${category}`);
    formData.append('forceJpeg', true);

    // log form data
    for (let [key, value] of formData.entries()) {
        console.log(`formData[${key}] =`, value);
    }

    try {
        const result = await apiFetch('/items/add-thumbnail', 'POST', formData, true);
        console.log('Thumbnail upload result:', result);
    } catch (error) {
        console.error('Error uploading thumbnail:', error);
    }
}