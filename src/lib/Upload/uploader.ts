import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from '$lib/api/fetchdata';
import { get } from 'svelte/store';
import { user } from '$stores/user';
import { on } from 'svelte/events';
import { addToast } from '$stores/toast';

// Helper function to safely get current user
function getCurrentUser() {
    const usr = get(user);
    if (!usr?.public_id) {
        throw new Error('User not authenticated');
    }
    return usr;
}

// Create new collection
export async function createCollection(category) {
    const usr = getCurrentUser();
    try {
        const data = {
            category,
            author_id: usr.public_id,
            author_uuid: usr.id,
            author: usr.username
        };
        const created = await apiFetch('/collections/createCollection', 'POST', data);
        return created;
    } catch (error) {
        console.error('Error creating collection:', error);
        throw new Error('Create failed. Please try again.');
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
        throw new Error('Remove failed. Please try again.');
    }
}

export async function saveEdit(data) {
    console.log('Saving edit for item:', data);
    try {
        const result = await apiFetch('/items/edit', 'POST', data);
        console.log('Edit result:', result);
        addToast({
            message: 'Item edited successfully!',
            type: 'success',
            duration: 3000
        });
        return result;
    } catch (error) {
        console.error('Error editing item:', error);
    }
}

// Reorder items
export async function reorderItems(prevIndex, newIndex, data) {
    console.log('Reordering items:', { prevIndex, newIndex, data });
    try {
        const currentUser = getCurrentUser();
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

export async function shuffleItems(data: { category: string; items: any[] }) {
    try {
        console.log('Shuffling items:', data);
        const currentUser = getCurrentUser();
        const items = [...data.items];
        const shuffledItems = items.sort(() => Math.random() - 0.5);
        console.log('Shuffling items:', { original: items, shuffled: shuffledItems });
        const payload = {
            category: data.category,
            items: shuffledItems,
            author_id: currentUser.public_id,
        };

        const result = await apiFetch('/items/reorder', 'POST', payload);
        addToast({
            message: 'Items shuffled successfully!',
            type: 'success',
            duration: 3000
        });
        return result;
    } catch (error) {
        console.error('Error shuffling items:', error);
        addToast({
            message: 'Failed to shuffle items. Please try again.',
            type: 'error',
            duration: 3000
        });
        return null;
    }
}

// Delete collection
export async function deleteCollection(collectionId, onSuccess = () => { }) {
    try {
        const currentUser = getCurrentUser();
        const uid = currentUser.public_id;
        const collection = collectionId;
        const result = await apiFetch(`/collections/${uid}/${collection}`, 'DELETE');
        onSuccess(result);
    } catch (error) {
        console.error('Error deleting collection:', error);
        throw new Error('Delete failed. Please try again.');
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
    const usr = getCurrentUser();

    // If file is a URL (string), call /upload-url
    if (typeof item.file === 'string') {
        console.log('Detected URL upload:', item.file);
        try {
            const data = {
                uuid,
                url: item.file,
                folder: `${usr.username}/${item.category}`,
                forceJpeg: forceJpg,
                author_uuid: usr.id,
                author_id: usr.uid,
                author: usr.username,
                category: item.category,
                answer: item.answer,
                extra: item.extra || null,
                type: item.type
            };
            const result = await apiFetch('/items/upload-url', 'POST', data);
            return result;
        } catch (error) {
            console.error('Error uploading URL data:', error);
            return error;
        }
    }

    // Otherwise, upload as file
    const formData = new FormData();
    formData.append('uuid', uuid);
    formData.append('file', item.file);
    formData.append('folder', `${usr.username}/${item.category}`);
    formData.append('forceJpeg', forceJpg.toString());
    formData.append('answer', item.answer);
    formData.append('category', item.category);
    formData.append('author', usr.username);
    formData.append('author_uuid', usr.id);
    formData.append('author_id', usr.public_id);
    if (item.type) {
        formData.append('type', item.type);
    }

    // Log all FormData entries
    for (const [key, value] of formData.entries()) {
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
    const usr = getCurrentUser();
    const username = usr.username;
    const author_id = usr.public_id;

    // need to send id, audio, title, answer, and thumbnail.
    // "id": "311bd357-b69a-4def-891e-75416b7babd9",
    // "audio": "jfL8Vu9PfW8",
    // "title": "Charli xcx - Sympathy is a knife featuring ariana grande (official audio)",
    // "answer": "Charli xcx",
    // "thumbnail": "https://img.youtube.com/vi/jfL8Vu9PfW8/default.jpg"

    const formData = new FormData();
    const uuid = item.uuid || uuidv4(); // Use provided uuid or generate a new one
    formData.append('folder', `${username}/${item.category}`);
    formData.append('author', username);
    formData.append('author_id', author_id);
    formData.append('category', item.category);
    formData.append('type', 'audio');
    formData.append('id', uuid);
    formData.append('audio', item.videoId);
    formData.append('title', item.title);
    formData.append('answer', item.title);
    formData.append('thumbnail', item.thumbnail);
    formData.append('url', item.videoId);

    console.log('Uploading audio data:', formData);

    try {
        const result = await apiFetch('/items/add-audio', 'POST', formData, true);
        return result;
    } catch (error) {
        console.error('Error uploading audio data:', error);
        return error;
    }
}

export async function uploadQuestion(data) {
    const usr = getCurrentUser();
    const username = usr.username;

    console.log("Upload question, data is:", data);

    const d: any = {
        uuid: uuidv4(),
        question: data.question,
        folder: `${username}/${data.category}`,
        answer: data.answer ?? data.answers,
        category: data.category,
        author: username,
        author_id: usr.uid,
        author_uuid: usr.id,
        type: data.type,
    };

    if (data.numRequired != null) {
        d.numRequired = data.numRequired;
    }

    console.log('Uploading question data:', d);

    try {
        const result = await apiFetch('/items/add-question', 'POST', d);
        return result;
    } catch (error) {
        console.error('Error uploading question data:', error);
    }
}

export async function uploadThumbnail(data, category) {
    const usr = getCurrentUser();
    const formData = new FormData();
    formData.append('author', usr.username);
    formData.append('author_uuid', usr.id);
    formData.append('author_id', usr.public_id);
    // Sanitize category to allow only alphanumeric, dash, and underscore
    const safeCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    formData.append('uuid', 'thumbnails/' + safeCategory + '/thumbnail');
    formData.append('file', data);
    formData.append('forceJpeg', 'true');
    formData.append('category', category);
    formData.append('folder', `/thumbnails/${category}`);

    // log form data
    for (const [key, value] of formData.entries()) {
        console.log(`formData[${key}] =`, value);
    }

    try {
        const result = await apiFetch('/items/add-thumbnail', 'POST', formData, true);
        addToast({
            message: 'Thumbnail uploaded successfully!',
            type: 'success',
            duration: 3000
        });
        return result;
    } catch (error) {
        console.error('Error uploading thumbnail:', error);
    }
}