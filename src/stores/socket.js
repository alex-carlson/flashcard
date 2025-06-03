// src/lib/stores/socket.js
import { io } from 'socket.io-client';
import { writable, get } from 'svelte/store';
import { user } from './user.js'; // adjust path if needed

const session = get(user);

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
    auth: {
        token: session?.access_token,
    },
    autoConnect: false, // connect explicitly later
});

export const socketStore = writable(socket);
