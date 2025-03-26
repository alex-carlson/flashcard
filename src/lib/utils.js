// slugify
export const slugify = (text) => {
    // replace spaces with -, conver to lowercase, and remove non-alphanumeric characters
    text = text.replace(/ /g, '-').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
    return text;
};

export const sanitize = (text) => {
    // remove all non-alphanumeric characters
    text = text.replace(/[^a-zA-Z0-9]/g, '');
    return text;
};

function getDistance(touches) {
    const [touch1, touch2] = touches;
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

export function scrollZoom(img, event) {
    const delta = event.deltaY;
    img.scale += delta * -0.01; // Increase or decrease the scale
}

export function handleTouchStart(event, img) {
    if (event.touches.length === 2) {
        img.startDistance = getDistance(event.touches);
    }
}

export function handleTouchMove(event, img) {
    if (event.touches.length === 2) {
        const newDistance = getDistance(event.touches);
        const scaleChange = newDistance / img.startDistance;
        img.scale *= scaleChange; // Update the scale only for the touched image
        img.startDistance = newDistance;
    }
}