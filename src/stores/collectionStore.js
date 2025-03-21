import { writable } from "svelte/store";

// Store to hold the selected collection
export const selectedCollection = writable(null);