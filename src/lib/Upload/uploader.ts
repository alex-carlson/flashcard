import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from '$lib/api/fetchdata';
import { get } from 'svelte/store';
import { user } from '$stores/user';
import { on } from 'svelte/events';

const currentUser = get(user);

// Create new collection
export async function createCollection(category) {
    console.log('Creating collection for category:', category);
    try {
        const data = {
            category,
            author_id: currentUser.public_id,
            author_uuid: currentUser.id,
            author: currentUser.username
        };
        const created = await apiFetch('/collections/createCollection', 'POST', data);
        return created;
    } catch (error) {
        console.error('Error creating collection:', error);
        errorMessage = 'Create failed. Please try again.';
    }
}

// Rename collection
export async function renameCollection() {
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
export async function removeItem(itemId, category) {
    try {
        const result = await apiFetch('/items/remove', 'POST', {
            category,
            itemId
        });
        return result;
    } catch (error) {
        console.error('Error removing item:', error);
        errorMessage = 'Remove failed. Please try again.';
        return [];
    }
}

export async function saveEdit(data) {
    console.log('Saving edit for item:', data);
    try {
        const result = await apiFetch('/items/edit', 'POST', data);
        console.log('Edit result:', result);
        return result;
    } catch (error) {
        console.error('Error editing item:', error);
    }
}

// Reorder items
export async function reorderItems(prevIndex, newIndex, data) {
    console.log('Reordering items:', { prevIndex, newIndex, data });
    try {
        // Make a shallow copy to avoid mutating original array
        const items = [...data.items];
        const [moved] = items.splice(prevIndex, 1);
        items.splice(newIndex, 0, moved);

        const payload = {
            category: data.category,
            items,
            author_id: currentUser.public_id,
        };

        const result = await apiFetch('/items/reorder', 'POST', payload);
        return result;
    } catch (error) {
        console.error('Error reordering items:', error);
        return null;
    }
}

// Delete collection
export async function deleteCollection(collectionId, onSuccess = () => { }) {
    try {
        const uid = currentUser.public_id;
        const collection = collectionId;
        const result = await apiFetch(`/collections/${uid}/${collection}`, 'DELETE');
        onSuccess(result);
    } catch (error) {
        console.error('Error deleting collection:', error);
        errorMessage = 'Delete failed. Please try again.';
    }
}

// show confirm delete popup
export function confirmDelete(id, onSuccess = () => { }) {
    if (confirm('Are you sure you want to delete this collection?')) {
        deleteCollection(id, onSuccess);
    }
}

// Upload data
export async function uploadData(item, uuid = uuidv4(), forceJpg = false) {
    console.log('Uploading data for item:', item);
    // If file is a URL (string), call /upload-url
    if (typeof item.file === 'string') {
        console.log('Detected URL upload:', item.file);
        try {
            const data = {
                uuid,
                url: item.file,
                folder: `${currentUser.username}/${item.category}`,
                forceJpeg: forceJpg,
                author_uuid: currentUser.id,
                author_id: currentUser.uid,
                author: currentUser.username,
                category: item.category,
                answer: item.answer
            };
            console.log('Uploading URL data:', data);
            const result = await apiFetch('/items/upload-url', 'POST', data);
            return result;
        } catch (error) {
            console.error('Error uploading URL data:', error);
            return error;
        }
        return;
    }

    // Otherwise, upload as file
    const formData = new FormData();
    formData.append('uuid', uuid);
    formData.append('file', item.file);
    formData.append('folder', `${currentUser.username}/${item.category}`);
    formData.append('forceJpeg', forceJpg);
    formData.append('answer', item.answer);
    formData.append('category', item.category);
    formData.append('author', currentUser.username);
    formData.append('author_uuid', currentUser.id);
    formData.append('author_id', currentUser.public_id);

    // Log all FormData entries
    for (let [key, value] of formData.entries()) {
        console.log(`formData[${key}] =`, value);
    }

    try {
        const result = await apiFetch('/items/upload', 'POST', formData, true);
        return result;
    } catch (error) {
        return error;
    }
}

export async function uploadAudio(item) {
    const username = currentUser.username;
    const author_id = currentUser.public_id;

    const formData = new FormData();
    formData.append('uuid', uuidv4());
    formData.append('url', item.url);
    formData.append('folder', `${username}/${item.category}`);
    formData.append('answer', item.answer);
    formData.append('category', item.category);
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
        return result;
    } catch (error) {
        console.error('Error uploading audio data:', error);
        return error;
    }
}

export async function uploadQuestion(data) {
    const username = currentUser.username;
    const author_id = currentUser.id;

    console.log(data);

    const d = {
        uuid: uuidv4(),
        question: data.question,
        folder: `${username}/${data.category}`,
        answer: data.answer,
        category: data.category,
        author: username,
        author_id: currentUser.uid,
        author_uuid: currentUser.id
    };

    console.log('Uploading question data:', d);

    try {
        const result = await apiFetch('/items/add-question', 'POST', d);
        return result;
    } catch (error) {
        console.error('Error uploading question data:', error);
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