<script>
    let username = "";
    let email = "";
    let password = "";
    let confirmPassword = "";
    let errorMessage = "";
    let successMessage = "";

    const signup = async () => {
        if (password !== confirmPassword) {
            errorMessage = "Passwords do not match";
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/signup`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, email, password }),
                },
            );

            if (!response.ok) {
                throw new Error("Signup failed");
            }

            successMessage = "Account created successfully!";
            errorMessage = "";
            username = "";
            password = "";
            confirmPassword = "";
        } catch (error) {
            errorMessage = "Error creating account";
            successMessage = "";
        }
    };
</script>

<div>
    <h2>Create an Account</h2>
    <input type="text" bind:value={username} placeholder="Username" />
    <input type="email" bind:value={email} placeholder="Email" />
    <input type="password" bind:value={password} placeholder="Password" />
    <input
        type="password"
        bind:value={confirmPassword}
        placeholder="Confirm Password"
    />
    <button on:click={signup}>Sign Up</button>

    {#if errorMessage}
        <p style="color: red">{errorMessage}</p>
    {/if}
    {#if successMessage}
        <p style="color: green">{successMessage}</p>
    {/if}
</div>
