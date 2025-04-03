<script>
    let password = "";
    let confirmPassword = "";
    let errorMessage = "";

    const resetPassword = async () => {
        if (password !== confirmPassword) {
            errorMessage = "Passwords do not match";
            return;
        }

        // get token and email from url "http://localhost:5173/#/reset-password?email=alex@acwd.me&token=gcnuwvwktno"
        const urlParams = new URLSearchParams(window.location.hash.slice(2));
        console.log("urlParams:", urlParams);
        const email = urlParams.get("reset-password?email");
        const token = urlParams.get("token");

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/users/reset-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ password, email, token }),
                },
            );

            if (!response.ok) {
                throw new Error("Failed to reset password");
            }

            const data = await response.json();
            // load login page
            window.location.href = "#/login";
            errorMessage = "";
        } catch (error) {
            errorMessage = "Failed to reset password";
        }
    };
    document.title = "Reset Password";
</script>

<div class="container">
    <form on:submit|preventDefault={resetPassword}>
        <h1>Reset Password</h1>
        {#if errorMessage}
            <p>{errorMessage}</p>
        {/if}
        <!-- type password twice -->
        <input
            type="password"
            placeholder="New Password"
            bind:value={password}
        />
        <input
            type="password"
            placeholder="Confirm Password"
            bind:value={confirmPassword}
        />
        <button type="submit">Reset Password</button>
    </form>
</div>
