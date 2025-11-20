// Fetch a single collection item by ID
export async function fetchCollectionItemById(itemId) {
    try {
        const result = await apiFetch(`/items/${itemId}`, 'GET');
        // If the API returns an array, return the first item
        if (Array.isArray(result)) {
            return result[0];
        }
        return result;
    } catch (error) {
        console.error('Error fetching collection item by ID:', error);
        throw new Error('Failed to fetch item.');
    }
}
import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from '$lib/api/fetchdata';
import { get } from 'svelte/store';
import { user } from '$stores/user';
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
        console.log('Removing item:', { itemId, category });
        const result = await apiFetch('/items/remove', 'POST', {
            category,
            itemId,
            // get current user from store
            author_id: getCurrentUser().public_id
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

// Unified upload function for all content types
export async function uploadContent(item, options = {}) {
    const usr = getCurrentUser();

    // Handle options with proper fallbacks
    const uuid = (options as any).uuid || uuidv4();
    const forceJpg = (options as any).forceJpg || false;
    const endpoint = (options as any).endpoint || null;

    console.log('uploadContent called with item:', item);
    console.log('uploadContent options:', options);

    // Common data structure for all uploads
    const commonData = {
        uuid,
        folder: `${(usr as any).username}/${item.category}`,
        author: (usr as any).username,
        author_uuid: (usr as any).id,
        author_id: (usr as any).public_id,
        category: item.category,
        answer: item.answer || '',
        answers: item.answers ? JSON.stringify(item.answers) : null,
        isMultipleChoice: item.isMultipleChoice || false,
        correctAnswerIndex: item.correctAnswerIndex,
        numRequired: item.numRequired,
        question: item.question || '',
        supplemental_text: item.supplemental_text || '',
        extra: item.extra || '',
        type: item.type || '',
        // Add image-related fields
        image: item.image || null,
        src: item.src || null
    };

    console.log('commonData prepared:', commonData);
    console.log('Upload decision logic:');
    console.log('- item.file:', !!item.file, typeof item.file);
    console.log('- item.src:', !!item.src, item.src);
    console.log('- item.videoId:', !!item.videoId);
    console.log('- item.question:', !!item.question);

    // Handle file uploads (images)
    if (item.file || item.src) {
        if (typeof item.file === 'string' || (item.src && !item.src.startsWith('blob:'))) {
            // URL upload (either from item.file as string or item.src as regular URL)
            const imageUrl = typeof item.file === 'string' ? item.file : item.src;
            const data = {
                ...commonData,
                url: imageUrl,
                forceJpeg: forceJpg,
                src: item.src
            };
            const result = await apiFetch('/items/upload-url', 'POST', data);
            console.log('URL upload result:', result);
            return result;
        } else if (item.src && item.src.startsWith('blob:')) {
            // Blob URL upload - convert blob to file
            try {
                const response = await fetch(item.src);
                const blob = await response.blob();

                // Create a File object from the blob
                const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });

                const formData = new FormData();
                formData.append('file', file);
                formData.append('forceJpeg', forceJpg.toString());

                // Add all common data to FormData, handling arrays properly
                Object.entries(commonData).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        // Answers are already JSON stringified in commonData, just append as string
                        formData.append(key, value.toString());
                    }
                });

                console.log('Uploading blob as file:', file);
                const result = await apiFetch('/items/upload', 'POST', formData, true);
                console.log('Blob upload result:', result);
                return result;
            } catch (error) {
                console.error('Error converting blob to file:', error);
                throw new Error('Failed to process image data');
            }
        } else {
            // File upload
            const formData = new FormData();
            formData.append('file', item.file);
            formData.append('forceJpeg', forceJpg.toString());

            // Add src if it exists (for image previews)
            if (item.src) {
                formData.append('src', item.src);
            }

            // Add all common data to FormData, handling arrays properly
            Object.entries(commonData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    // Answers are already JSON stringified in commonData, just append as string
                    formData.append(key, value.toString());
                }
            });

            const result = await apiFetch('/items/upload', 'POST', formData, true);
            console.log('File upload result:', result);
            return result;
        }
    }

    // Handle audio uploads
    if (item.videoId) {
        const formData = new FormData();
        formData.append('id', uuid);
        formData.append('audio', item.videoId);
        formData.append('title', item.title);
        formData.append('thumbnail', item.thumbnail);
        formData.append('url', item.videoId);
        formData.append('type', 'audio');

        // Add all common data to FormData
        Object.entries(commonData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value.toString());
            }
        });

        return await apiFetch('/items/add-audio', 'POST', formData, true);
    }

    // Handle question-only uploads (no image or audio)
    if (item.question && !item.file && !item.src && !item.videoId) {
        return await apiFetch('/items/add-question', 'POST', commonData);
    }

    // Handle thumbnail uploads
    if (endpoint === 'thumbnail') {
        const formData = new FormData();
        const safeCategory = item.category.replace(/[^a-zA-Z0-9-_]/g, '');
        formData.append('uuid', `thumbnails/${safeCategory}/thumbnail`);
        formData.append('file', item.file);
        formData.append('forceJpeg', 'true');
        formData.append('folder', `/thumbnails/${item.category}`);

        // Add common data
        Object.entries(commonData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && !['uuid', 'folder'].includes(key)) {
                formData.append(key, value.toString());
            }
        });

        const result = await apiFetch('/items/add-thumbnail', 'POST', formData, true);
        console.log('Thumbnail upload result:', result);
        addToast({
            message: 'Thumbnail uploaded successfully!',
            type: 'success',
            duration: 3000
        });
        return result;
    }

    throw new Error('Invalid upload type - no file, videoId, question, or thumbnail specified');
}
// Legacy wrapper for uploadData - now uses unified function
export async function uploadData(item, uuid = uuidv4(), forceJpg = false) {
    try {
        return await uploadContent(item, { uuid, forceJpg });
    } catch (error) {
        console.error('Error uploading data:', error);
        return error;
    }
}

// Legacy wrapper for uploadAudio - now uses unified function
export async function uploadAudio(item) {
    try {
        console.log('Uploading audio data:', item);
        return await uploadContent(item);
    } catch (error) {
        console.error('Error uploading audio data:', error);
        return error;
    }
}

// Legacy wrapper for uploadQuestion - now uses unified function
export async function uploadQuestion(data) {
    try {
        console.log('Uploading question data:', data);
        return await uploadContent(data);
    } catch (error) {
        console.error('Error uploading question data:', error);
        return error;
    }
}

// Legacy wrapper for uploadThumbnail - now uses unified function
export async function uploadThumbnail(data, category) {
    try {
        const item = {
            file: data,
            category: category
        };
        return await uploadContent(item, { endpoint: 'thumbnail' });
    } catch (error) {
        console.error('Error uploading thumbnail:', error);
        return error;
    }
}