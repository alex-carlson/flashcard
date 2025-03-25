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