<script>
    import { onMount } from "svelte";

    let username = null;
    let email = null;
    let userData = null;
    let isChangingUsername = false;
    let isChangingPassword = false;
    let newPassword = null;
    let confirmNewPassword = null;
    let newUsername = null;

    async function fetchUserData() {
        const name = localStorage.getItem("username");
        const url = `${import.meta.env.VITE_API_URL}/users/${name}`;
        console.log("Fetching user data from:", url);
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }
            const data = await response.json();
            userData = data.user;
            console.log("User data fetched successfully:", userData);
        } catch (error) {
            console.error("Error fetching user data:", error);
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
    }

    async function changeUsername() {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/users/changeUsername`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        newUsername,
                        email: userData.email,
                        oldUsername: userData.username,
                    }),
                },
            );

            if (!response.ok) {
                throw new Error("Failed to update username");
            }
            const data = await response.json();
            userData = data;
            // update username
            localStorage.setItem("username", newUsername);
            console.log("Username updated successfully:", userData);
        } catch (error) {
            console.error("Error updating username:", error);
        }
    }

    async function changePassword() {
        // make sure newpassword and confirmnewpassword are the same
        if (newPassword !== confirmNewPassword) {
            alert("Passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            alert("Password must be at least 8 characters long");
            return;
        }
        password = newPassword;
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
        <div class="container white">
            <h1>Account details for {userData.username}</h1>
            <div class="item">
                {#if isChangingUsername}
                    <input
                        type="text"
                        bind:value={newUsername}
                        placeholder={userData.username}
                    />
                    <button
                        class="btn btn-primary"
                        on:click={() => {
                            changeUsername();
                            isChangingUsername = false;
                        }}>Change</button
                    >
                    <button
                        class="btn btn-primary"
                        on:click={() => {
                            isChangingUsername = false;
                        }}>Cancel</button
                    >
                {:else}
                    <p>Username: {userData.username}</p>
                {/if}
            </div>
            <div class="item">
                <p>Email: {userData.email}</p>
            </div>
            {#if isChangingPassword}
                <div class="item">
                    <!-- create two password fields and a submit button to change password -->
                    <input
                        type="password"
                        bind:value={newPassword}
                        placeholder="New Password"
                    />
                    <input
                        type="password"
                        bind:value={confirmNewPassword}
                        placeholder="New Password"
                    />
                    <button
                        class="btn btn-primary"
                        on:click={() => {
                            changePassword();
                            isChangingPassword = false;
                        }}>Change</button
                    >
                    <button
                        class="btn btn-primary"
                        on:click={() => {
                            isChangingPassword = false;
                        }}>Cancel</button
                    >
                </div>
            {/if}
            <div class="row">
                <div class="col-md-6"></div>
                <button
                    class="btn btn-primary"
                    on:click={() => {
                        isChangingUsername = true;
                    }}>Change Username</button
                >
                <button
                    class="btn btn-primary"
                    on:click={() => {
                        isChangingPassword = true;
                    }}>Change Password</button
                >
                <button
                    class="btn btn-primary warning"
                    on:click={() => {
                        deleteAccount();
                    }}>Delete Account</button
                >
            </div>
        </div>
    {:else}
        <p>Loading...</p>
    {/if}
</div>
