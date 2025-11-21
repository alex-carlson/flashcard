<script>
	import { onMount } from 'svelte';
	import { fetchUsers } from '$lib/api/user';

	let users = [];

	function getGPA(quizzes_completed) {
		if (!quizzes_completed || quizzes_completed.length === 0) return 0;
			
		const totalGPA = quizzes_completed.reduce((acc, quiz, index) => {
			// Parse the JSON string if it's a string
			const parsedQuiz = typeof quiz === 'string' ? JSON.parse(quiz) : quiz;
			const percentage = parsedQuiz.percentage || 0;
			const gpaForQuiz = percentageToGPA(percentage);
			return acc + gpaForQuiz;
		}, 0);
		
		const gpa = totalGPA / quizzes_completed.length;
		
		return gpa.toFixed(2);
	}

	function getPercentage(quizzes_completed) {
		if (!quizzes_completed || quizzes_completed.length === 0) return 0;
		const totalPercentage = quizzes_completed.reduce((acc, quiz) => {
			// Parse the JSON string if it's a string
			const parsedQuiz = typeof quiz === 'string' ? JSON.parse(quiz) : quiz;
			return acc + (parsedQuiz.percentage || 0);
		}, 0);
		const percentage = totalPercentage / quizzes_completed.length;
		return percentage.toFixed(2);
	}

	function percentageToGPA(score) {
		let gpa;
		if (score >= 93) gpa = 4.0;
		else if (score >= 90) gpa = 3.7;
		else if (score >= 87) gpa = 3.3;
		else if (score >= 83) gpa = 3.0;
		else if (score >= 80) gpa = 2.7;
		else if (score >= 77) gpa = 2.3;
		else if (score >= 73) gpa = 2.0;
		else if (score >= 70) gpa = 1.7;
		else if (score >= 67) gpa = 1.3;
		else if (score >= 65) gpa = 1.0;
		else gpa = 0.0;
		
		return gpa;
	}

	onMount(async () => {
		try {
			users = await fetchUsers();
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
