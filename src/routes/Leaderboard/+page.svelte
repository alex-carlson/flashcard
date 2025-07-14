<script>
	import { onMount } from 'svelte';
	import { fetchUsers } from '$lib/api/user';

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
			console.log('Fetched users:', users);
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	});
</script>

<div class="leaderboard-container white container py-3">
	<h1 class="mt-3 mb-5">User Leaderboard</h1>
	<div class="leaderboard-grid">
		<div class="leaderboard-header">
			<div>Rank</div>
			<div>Username</div>
			<div>Quizzes Completed</div>
			<div>GPA</div>
		</div>
		{#each [...users]
			.filter((user) => user.quizzes_completed != null)
			.sort((a, b) => b.quizzes_completed.length - a.quizzes_completed.length) as user, i}
			<div class="leaderboard-row {i % 2 === 0 ? 'even-row' : 'odd-row'}">
				<div class="rank">
					{i + 1}
				</div>
				<div>
					<a href={`/author/${user.username_slug}`}>
						<strong>{user.username}</strong>
					</a>
				</div>
				<div>{user.quizzes_completed.length}</div>
				<div>{getGPA(user.quizzes_completed)} ({getPercentage(user.quizzes_completed)}%)</div>
			</div>
		{/each}
	</div>
</div>
