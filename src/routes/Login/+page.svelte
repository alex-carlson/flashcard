<script>
    let username = "";
    let email = "";
    let password = "";
    let errorMessage = "";

    const login = async () => {
        // if username is an email, use it as email
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/users/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, email, password }),
                },
            );

            if (!response.ok) {
                throw new Error("Login failed");
            }

            const data = await response.json();
            console.log("Login successful:", data);
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.user);
            // navigate to home page
            console.log(localStorage.getItem("username"));
            window.location.href = "/";
            errorMessage = "";
        } catch (error) {
            errorMessage = "Invalid credentials";
        }
    };
</script>

<div class="container">
    <h2>Login</h2>
    <input type="text" bind:value={username} placeholder="Username/Email" />
    <input type="password" bind:value={password} placeholder="Password" />
    <button on:click={login}>Login</button>
    {#if errorMessage}
        <p style="color: red">{errorMessage}</p>
    {/if}
</div>
