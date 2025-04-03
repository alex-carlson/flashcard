<script>
    import { onMount } from "svelte";

    let username = null;
    let email = null;
    let userData = null;

    async function fetchUserData() {
        const tokenUsername = JSON.parse(
            atob(localStorage.getItem("token").split(".")[1]),
        ).username;
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/user`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }
            const data = await response.json();
            userData = data;
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }

    async function changeUsername() {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/changeUsername`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, email: userData.email }),
                },
            );

            if (!response.ok) {
                throw new Error("Failed to update username");
            }
            const data = await response.json();
            userData = data;
            console.log(userData);
        } catch (error) {
            console.error("Error updating username:", error);
        }
    }

    async function changePassword() {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/changePassword`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ password, email: userData.email }),
                },
            );

            if (!response.ok) {
                throw new Error("Failed to update password");
            }
            const data = await response.json();
            userData = data;
            console.log(userData);
        } catch (error) {
            console.error("Error updating password:", error);
        }
    }

    async function deleteAccount() {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/deleteAccount`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Failed to delete account");
            }
            localStorage.removeItem("token");
            window.location.href = "/";
        } catch (error) {
            console.error("Error deleting account:", error);
        }
    }

    onMount(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            fetchUserData();
        }
        document.title = "Profile";
    });
</script>

<div class="container">
    {#if userData}
        <h1>Account details for {userData.username}</h1>
        <div class="row">
            <div class="col-md-6">
                <h2>Profile</h2>
                <div class="item">
                    <p>Username: {userData.username}</p>
                </div>
                <p>Email: {userData.email}</p>
            </div>
            <!-- <button class="btn btn-primary" on:click={() => {username = prompt("Enter new username"); changeUsername();}}>Change Username</button>
            <button class="btn btn-primary" on:click={() => {password = prompt("Enter new password"); changePassword();}}>Change Password</button>
            <button class="btn btn-primary" on:click={() => {deleteAccount();}}>Delete Account</button> -->
        </div>
    {:else}
        <p>Loading...</p>
    {/if}
</div>
