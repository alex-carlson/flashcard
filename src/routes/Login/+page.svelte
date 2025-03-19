<script>
    let username = "";
    let password = "";
    let errorMessage = "";

    const login = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, password }),
                },
            );

            if (!response.ok) {
                throw new Error("Login failed");
            }

            const data = await response.json();
            console.log("Login successful:", data.username);
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);
            errorMessage = "";
            window.location.href = "/"; // Redirect to the upload page
        } catch (error) {
            errorMessage = "Invalid credentials";
        }
    };
</script>

<div>
    <h2>Login</h2>
    <input type="text" bind:value={username} placeholder="Username" />
    <input type="password" bind:value={password} placeholder="Password" />
    <button on:click={login}>Login</button>
    {#if errorMessage}
        <p style="color: red">{errorMessage}</p>
    {/if}
</div>
