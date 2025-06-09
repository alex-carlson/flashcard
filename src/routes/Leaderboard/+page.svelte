<script>
    import { onMount } from "svelte";
    import { fetchUsers } from "$lib/user";

    let users = [];

    function getGPA(quizzes_completed) {
        if (!quizzes_completed || quizzes_completed.length === 0) return 0;
        const totalGPA = quizzes_completed.reduce((acc, quiz) => {
            return acc + percentageToGPA(quiz.percentage || 0);
        }, 0);
        const gpa = totalGPA / quizzes_completed.length;
        return gpa.toFixed(2);
    }

    function getPercentage(quizzes_completed) {
        if (!quizzes_completed || quizzes_completed.length === 0) return 0;
        const totalPercentage = quizzes_completed.reduce((acc, quiz) => {
            return acc + (quiz.percentage || 0);
        }, 0);
        const percentage = totalPercentage / quizzes_completed.length;
        return percentage.toFixed(2);
    }

    function percentageToGPA(score) {
        if (score >= 93) return 4.0;
        if (score >= 90) return 3.7;
        if (score >= 87) return 3.3;
        if (score >= 83) return 3.0;
        if (score >= 80) return 2.7;
        if (score >= 77) return 2.3;
        if (score >= 73) return 2.0;
        if (score >= 70) return 1.7;
        if (score >= 67) return 1.3;
        if (score >= 65) return 1.0;
        return 0.0;
    }

    onMount(async () => {
        try {
            users = await fetchUsers();
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    });
</script>

<div class="white container padding">
    <h1>User Leaderboard</h1>
    <div class="table-responsive">
        <table
            class="table table-striped table-bordered align-middle w-100"
            style="table-layout: fixed;"
        >
            <thead class="table-light">
                <tr>
                    <th scope="col" style="width: 10%;">Rank</th>
                    <th scope="col" style="width: 40%;">Username</th>
                    <th scope="col" style="width: 25%;">Quizzes Completed</th>
                    <th scope="col" style="width: 25%;">GPA</th>
                </tr>
            </thead>
            <tbody>
                {#each [...users]
                    .filter((user) => user.quizzes_completed != null)
                    .sort((a, b) => b.quizzes_completed.length - a.quizzes_completed.length) as user, i}
                    <tr
                        class={i % 2 === 0
                            ? "even-row padded-row"
                            : "odd-row padded-row"}
                    >
                        <td>{i + 1}</td>
                        <td>
                            <a href={`#/${user.id}`}>
                                <strong>{user.username}</strong>
                            </a>
                        </td>
                        <td>{user.quizzes_completed.length}</td>
                        <td
                            >{getGPA(user.quizzes_completed)} ({getPercentage(
                                user.quizzes_completed,
                            )}%)</td
                        >
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
    .even-row {
        background-color: rgb(230, 230, 230);
    }
    .odd-row {
        background-color: #ffffff;
    }
</style>
